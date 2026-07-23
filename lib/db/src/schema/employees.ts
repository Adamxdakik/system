import { pgTable, serial, text, boolean, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id),
  code: text("code"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  employeeType: text("employee_type").notNull().default("Regular"),
  monthlySalary: numeric("monthly_salary", { precision: 12, scale: 2 }),
  phone: text("phone"),
  active: boolean("active").notNull().default(true),
  hireDate: date("hire_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
