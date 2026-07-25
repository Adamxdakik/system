import fs from "node:fs";

const path = "server/routes.ts";
let source = fs.readFileSync(path, "utf8");

const importLine =
  'import { registerFinalizedFinancialMutationGuards } from "./routes/finalizedFinancialMutationGuards";';
if (!source.includes(importLine)) {
  const anchor =
    'import { VoucherReversalService } from "./services/accounting/voucherReversalService";';
  if (!source.includes(anchor)) throw new Error("VoucherReversalService import anchor not found");
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

const registration = "  registerFinalizedFinancialMutationGuards(app, requireAuth);";
if (!source.includes(registration)) {
  const anchor = `  app.post(\n    "/api/auth/logout",\n    createLogoutHandler((userId) => activeUsers.delete(userId)),\n  );`;
  if (!source.includes(anchor)) throw new Error("Logout route anchor not found");
  source = source.replace(
    anchor,
    `${anchor}\n\n  // Finalized financial records are corrected through reversal, never destructive mutation.\n${registration}`,
  );
}

fs.writeFileSync(path, source);
