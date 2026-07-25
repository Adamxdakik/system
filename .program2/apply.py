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


replace_once(
    "shared/schema.ts",
    '''  voucherId: integer("voucher_id"),
  notes: text("notes"),
  fullyPaid: boolean("fully_paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});''',
    '''  voucherId: integer("voucher_id"),
  notes: text("notes"),
  fullyPaid: boolean("fully_paid").notNull().default(false),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: varchar("cancelled_by", { length: 100 }),
  cancellationVoucherId: integer("cancellation_voucher_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});''',
)

replace_once(
    "shared/schema.ts",
    '''  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    companyId: z.number().min(1, "Company is required"),
    employeeId: z.number().min(1, "Employee is required"),
    advanceDate: z.string().min(1, "Advance date is required"),''',
    '''  .omit({
    id: true,
    createdAt: true,
    cancelledAt: true,
    cancelledBy: true,
    cancellationVoucherId: true,
  })
  .extend({
    companyId: z.number().min(1, "Company is required"),
    employeeId: z.number().min(1, "Employee is required"),
    advanceDate: z.string().min(1, "Advance date is required"),''',
)
