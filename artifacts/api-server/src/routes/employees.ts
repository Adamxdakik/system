import { Router, type IRouter } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireCompany } from "../middlewares/requireAuth";
import { CreateEmployeeBody, UpdateEmployeeBody, UpdateEmployeeParams } from "@workspace/api-zod";

const router: IRouter = Router();

const toNum = (v: unknown) => (v == null ? null : Number(v));

router.get("/employees", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const employees = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.companyId, companyId))
    .orderBy(employeesTable.lastName);
  res.json(employees.map((e) => ({ ...e, monthlySalary: toNum(e.monthlySalary) })));
});

router.post("/employees", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employee] = await db
    .insert(employeesTable)
    .values({ companyId, ...parsed.data })
    .returning();

  res.status(201).json({ ...employee, monthlySalary: toNum(employee.monthlySalary) });
});

router.patch("/employees/:id", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const params = UpdateEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employee] = await db
    .update(employeesTable)
    .set(parsed.data)
    .where(and(eq(employeesTable.id, params.data.id), eq(employeesTable.companyId, companyId)))
    .returning();

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json({ ...employee, monthlySalary: toNum(employee.monthlySalary) });
});

export default router;
