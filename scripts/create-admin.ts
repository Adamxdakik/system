import { db } from "../server/db";
import { users, companies, userCompanyRoles } from "../shared/schema";
import bcrypt from "bcryptjs";
import { writeFileSync, chmodSync } from "fs";
import { resolve } from "path";

// Match the cost factor used by the live login pipeline (server/routes.ts).
const BCRYPT_SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

async function createAdmin() {
  try {
    console.log('Creating initial admin user and company...\n');

    // 1. Create a company
    console.log('Step 1: Creating company...');
    const [company] = await db.insert(companies).values({
      code: 'MAIN',
      name: 'Main Company',
      active: true,
    }).returning();
    console.log(`✅ Company created: ${company.name} (ID: ${company.id})\n`);

    // 2. Create admin user with a salted bcrypt hash so the credential is
    // never stored as plain SHA-256 (which is unsalted, fast, and rainbow-
    // table-vulnerable). Login (server/routes.ts) already uses bcrypt with a
    // legacy SHA-256 fallback, so this is a forward-compatible upgrade.
    console.log('Step 2: Creating admin user...');
    const username = 'admin';
    const password = 'admin'; // Change this after first login!

    const [user] = await db.insert(users).values({
      username,
      password: await hashPassword(password),
      active: true,
    }).returning();
    console.log(`✅ User created: ${user.username} (ID: ${user.id})\n`);

    // 3. Assign admin role to the user for this company
    console.log('Step 3: Assigning Admin role...');
    const [role] = await db.insert(userCompanyRoles).values({
      userId: user.id,
      companyId: company.id,
      role: 'Admin',
    }).returning();
    console.log(`✅ Admin role assigned\n`);

    // Write the initial credentials to a local, gitignored file with 0600
    // permissions instead of printing the secret to stdout (avoids leaking
    // the password into terminal scrollback / CI logs / shared screens).
    const credPath = resolve(process.cwd(), ".admin-credentials.txt");
    const credBody = [
      "MotoTrack — initial admin credentials",
      "Generated: " + new Date().toISOString(),
      "",
      "Username: " + username,
      "Secret:   " + password,
      "",
      "IMPORTANT: change this on first login, then delete this file.",
      "",
    ].join("\n");
    // Set 0600 at write time to avoid a brief world-readable window on POSIX.
    writeFileSync(credPath, credBody, { encoding: "utf8", mode: 0o600 });
    // Belt-and-suspenders: re-chmod in case umask or pre-existing file relaxed it.
    try { chmodSync(credPath, 0o600); } catch { /* non-POSIX FS */ }

    console.log('════════════════════════════════════════');
    console.log('🎉 Setup Complete!');
    console.log('════════════════════════════════════════');
    console.log('\nLogin username: ' + username);
    console.log('Initial credential written (chmod 0600) to:');
    console.log('  ' + credPath);
    console.log('\n⚠️  IMPORTANT: change it on first login, then delete that file.\n');
    console.log('Your company details:');
    console.log(`  Company: ${company.name}`);
    console.log(`  Code: ${company.code}`);
    console.log('════════════════════════════════════════\n');

  } catch (error: any) {
    if (error.message?.includes('duplicate key')) {
      console.error('\n❌ Error: Admin user or company already exists!');
      console.error('   If you need to reset, delete the existing data first.\n');
    } else {
      console.error('\n❌ Error creating admin:', error.message);
    }
    process.exit(1);
  }

  process.exit(0);
}

createAdmin();
