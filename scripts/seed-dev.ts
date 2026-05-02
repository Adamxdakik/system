/**
 * Idempotent dev-seed script.
 *
 * Creates an admin user (if missing), one company, two locations, and two employees
 * so the Payroll moto-rates UI can be exercised end-to-end on the local dev DB.
 *
 * Run with: npm run seed:dev
 *
 * Safe to re-run — every step checks for existence before inserting.
 */

import { db } from "../server/db";
import {
  users,
  companies,
  userCompanyRoles,
  locations,
  employees,
} from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { writeFileSync, chmodSync } from "fs";
import { resolve } from "path";

const BCRYPT_SALT_ROUNDS = 12;

const SEED_USERNAME = "admin";
const SEED_PASSWORD = "admin";

const SEED_COMPANY_CODE = "MAIN";
const SEED_COMPANY_NAME = "Main Company";

const SEED_LOCATIONS = [
  { code: "HQ", name: "Headquarters", city: "Karachi" },
  { code: "BR1", name: "Branch 1", city: "Lahore" },
];

const SEED_EMPLOYEES = [
  {
    code: "EMP001",
    firstName: "Ali",
    lastName: "Hassan",
    joinDate: "2024-01-01",
    department: "Sales",
    monthlySalary: "50000",
  },
  {
    code: "EMP002",
    firstName: "Sana",
    lastName: "Khan",
    joinDate: "2024-02-15",
    department: "Sales",
    monthlySalary: "55000",
  },
];

async function main() {
  console.log("seed-dev: starting (idempotent)\n");

  // 1. Admin user
  let [user] = await db.select().from(users).where(eq(users.username, SEED_USERNAME));
  let createdUser = false;
  if (!user) {
    const hash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_SALT_ROUNDS);
    [user] = await db.insert(users).values({
      username: SEED_USERNAME,
      password: hash,
      active: true,
    }).returning();
    createdUser = true;
    console.log(`  ✓ created user '${SEED_USERNAME}' (${user.id})`);
  } else {
    console.log(`  · user '${SEED_USERNAME}' already exists (${user.id})`);
  }

  // 2. Company
  let [company] = await db.select().from(companies).where(eq(companies.code, SEED_COMPANY_CODE));
  if (!company) {
    [company] = await db.insert(companies).values({
      code: SEED_COMPANY_CODE,
      name: SEED_COMPANY_NAME,
      active: true,
    }).returning();
    console.log(`  ✓ created company '${SEED_COMPANY_NAME}' (id=${company.id})`);
  } else {
    console.log(`  · company '${SEED_COMPANY_NAME}' already exists (id=${company.id})`);
  }

  // 3. Admin role on company
  const existingRoles = await db
    .select()
    .from(userCompanyRoles)
    .where(eq(userCompanyRoles.userId, user.id));
  const hasRole = existingRoles.some((r) => r.companyId === company.id && r.role === "Admin");
  if (!hasRole) {
    await db.insert(userCompanyRoles).values({
      userId: user.id,
      companyId: company.id,
      role: "Admin",
    });
    console.log(`  ✓ assigned Admin role`);
  } else {
    console.log(`  · Admin role already assigned`);
  }

  // 4. Locations
  for (const loc of SEED_LOCATIONS) {
    const [existing] = await db.select().from(locations).where(eq(locations.code, loc.code));
    if (!existing) {
      const [created] = await db.insert(locations).values({
        companyId: company.id,
        code: loc.code,
        name: loc.name,
        city: loc.city,
        active: true,
      }).returning();
      console.log(`  ✓ created location '${loc.name}' (id=${created.id})`);
    } else {
      console.log(`  · location '${loc.name}' already exists (id=${existing.id})`);
    }
  }

  // 5. Employees
  for (const emp of SEED_EMPLOYEES) {
    const [existing] = await db.select().from(employees).where(eq(employees.code, emp.code));
    if (!existing) {
      const [created] = await db.insert(employees).values({
        code: emp.code,
        firstName: emp.firstName,
        lastName: emp.lastName,
        joinDate: emp.joinDate,
        department: emp.department,
        monthlySalary: emp.monthlySalary,
        companyId: company.id,
        employeeType: "Employee",
      } as any).returning();
      console.log(`  ✓ created employee '${emp.firstName} ${emp.lastName}' (id=${created.id})`);
    } else {
      console.log(`  · employee '${emp.firstName} ${emp.lastName}' already exists (id=${existing.id})`);
    }
  }

  // 6. Write credentials file (only if we just created the user, to avoid silently
  //    overwriting a pre-existing credentials file with a stale password).
  if (createdUser) {
    const credPath = resolve(process.cwd(), ".admin-credentials.txt");
    const credBody = [
      "MotoTrack — dev seed credentials",
      "Generated: " + new Date().toISOString(),
      "",
      "Username: " + SEED_USERNAME,
      "Secret:   " + SEED_PASSWORD,
      "",
      "CHANGE THIS PASSWORD AFTER FIRST LOGIN.",
      "",
    ].join("\n");
    writeFileSync(credPath, credBody, { mode: 0o600 });
    chmodSync(credPath, 0o600);
    console.log(`\n  → wrote credentials to ${credPath} (mode 0600)`);
  }

  console.log("\nseed-dev: done");
  process.exit(0);
}

main().catch((err) => {
  console.error("seed-dev: failed", err);
  process.exit(1);
});
