from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    if new in text:
        return
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one patch target in {path}, found {count}")
    file_path.write_text(text.replace(old, new, 1))


def insert_once(path: str, anchor: str, insertion: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    if insertion in text:
        return
    if text.count(anchor) != 1:
        raise RuntimeError(f"Expected one anchor in {path}: {anchor!r}")
    file_path.write_text(text.replace(anchor, f"{anchor}{insertion}", 1))


replace_once(
    "server/services/accounting/salaryAdvanceService.ts",
    'import { and, count, eq } from "drizzle-orm";',
    'import { and, count, desc, eq, isNull } from "drizzle-orm";',
)

insert_once(
    "server/services/accounting/salaryAdvanceService.ts",
    "export class SalaryAdvanceService {\n",
    '''  listActive(companyId: number) {
    return db
      .select()
      .from(salaryAdvances)
      .where(and(eq(salaryAdvances.companyId, companyId), isNull(salaryAdvances.cancelledAt)))
      .orderBy(desc(salaryAdvances.createdAt));
  }

  listActiveForEmployee(companyId: number, employeeId: number) {
    return db
      .select()
      .from(salaryAdvances)
      .where(
        and(
          eq(salaryAdvances.companyId, companyId),
          eq(salaryAdvances.employeeId, employeeId),
          isNull(salaryAdvances.cancelledAt),
        ),
      )
      .orderBy(desc(salaryAdvances.createdAt));
  }

''',
)

insert_once(
    "server/financialCorrectionRoutes.ts",
    'import { OpeningBalanceImportService } from "./services/accounting/openingBalanceImportService";\n',
    'import { SalaryAdvanceService } from "./services/accounting/salaryAdvanceService";\n',
)

insert_once(
    "server/financialCorrectionRoutes.ts",
    "const openingBalanceImportService = new OpeningBalanceImportService();\n",
    "const salaryAdvanceService = new SalaryAdvanceService();\n",
)

routes = '''  app.get("/api/salary-advances", requireAuth, requireNonPOS, async (req: Request, res: Response) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      return res.json(await salaryAdvanceService.listActive(companyId));
    } catch (error) {
      return sendError(res, error);
    }
  });

  app.get(
    "/api/salary-advances/employee/:employeeId",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response) => {
      try {
        const companyId = req.session.currentCompanyId;
        const employeeId = Number(req.params.employeeId);
        if (!companyId) return res.status(400).json({ message: "No company selected" });
        if (!Number.isInteger(employeeId) || employeeId <= 0) {
          return res.status(400).json({ message: "Invalid employee ID" });
        }
        return res.json(await salaryAdvanceService.listActiveForEmployee(companyId, employeeId));
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.post("/api/salary-advances", requireAuth, requireNonPOS, async (req: Request, res: Response) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const employeeId = Number(req.body?.employeeId);
      const cashAccountId = Number(req.body?.cashAccountId ?? req.session.cashAccountId);
      const advanceDate = String(req.body?.advanceDate ?? "");
      const amount = String(req.body?.amount ?? "");
      if (!Number.isInteger(employeeId) || employeeId <= 0 || !advanceDate || !amount) {
        return res.status(400).json({ message: "Employee, advance date and amount are required" });
      }
      if (!Number.isInteger(cashAccountId) || cashAccountId <= 0) {
        return res.status(400).json({ message: "Cash account is required" });
      }
      const identity =
        req.get("idempotency-key") ??
        String(req.body?.idempotencyKey ?? `SALARY_ADVANCE:${bodyHash(req.body)}`);
      const result = await salaryAdvanceService.create({
        companyId,
        employeeId,
        advanceDate,
        amount,
        cashAccountId,
        notes: req.body?.notes == null ? null : String(req.body.notes),
        idempotencyKey: identity,
        createdBy: req.user?.id ?? req.session.userId ?? null,
      });
      return res.status(result.duplicate ? 200 : 201).json(result.advance);
    } catch (error) {
      return sendError(res, error);
    }
  });

  app.delete(
    "/api/salary-advances/:id",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response) => {
      try {
        const companyId = req.session.currentCompanyId;
        const salaryAdvanceId = Number(req.params.id);
        if (!companyId) return res.status(400).json({ message: "No company selected" });
        if (!Number.isInteger(salaryAdvanceId) || salaryAdvanceId <= 0) {
          return res.status(400).json({ message: "Invalid salary advance ID" });
        }
        if (req.session.currentRole !== "Admin" && req.session.currentRole !== "Owner") {
          return res.status(403).json({
            message: "Only Admin and Owner can cancel a salary advance",
            code: "SALARY_ADVANCE_CANCEL_FORBIDDEN",
          });
        }
        const identity =
          req.get("idempotency-key") ??
          String(req.body?.idempotencyKey ?? `CANCEL_SALARY_ADVANCE:${salaryAdvanceId}`);
        const result = await salaryAdvanceService.cancel({
          companyId,
          salaryAdvanceId,
          idempotencyKey: identity,
          createdBy: req.user?.id ?? req.session.userId ?? null,
          reason: req.body?.reason == null ? null : String(req.body.reason),
        });
        return res.status(result.duplicate ? 200 : 201).json({
          message: "Salary advance cancelled successfully",
          ...result,
        });
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

'''
insert_once(
    "server/financialCorrectionRoutes.ts",
    "export function registerFinancialCorrectionRoutes(app: Express): void {\n",
    routes,
)
