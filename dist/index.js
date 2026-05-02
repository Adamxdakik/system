var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  baleProducts: () => baleProducts,
  baleSequences: () => baleSequences,
  baleTransferItems: () => baleTransferItems,
  baleTransfers: () => baleTransfers,
  bales: () => bales,
  bankAccounts: () => bankAccounts,
  companies: () => companies,
  companySettings: () => companySettings,
  containerCharges: () => containerCharges,
  containerOffloads: () => containerOffloads,
  containerSales: () => containerSales,
  containers: () => containers,
  customerBalances: () => customerBalances,
  customers: () => customers,
  dashboardCashAccounts: () => dashboardCashAccounts,
  dashboardPayableAccounts: () => dashboardPayableAccounts,
  draftPosSaleItems: () => draftPosSaleItems,
  draftPosSales: () => draftPosSales,
  employeeGroupMembers: () => employeeGroupMembers,
  employeeGroups: () => employeeGroups,
  employees: () => employees,
  fiscalPeriodClosures: () => fiscalPeriodClosures,
  fixedAssets: () => fixedAssets,
  importLogs: () => importLogs,
  insertBaleProductSchema: () => insertBaleProductSchema,
  insertBaleSchema: () => insertBaleSchema,
  insertBaleTransferItemSchema: () => insertBaleTransferItemSchema,
  insertBaleTransferSchema: () => insertBaleTransferSchema,
  insertBankAccountSchema: () => insertBankAccountSchema,
  insertCompanySchema: () => insertCompanySchema,
  insertCompanySettingsSchema: () => insertCompanySettingsSchema,
  insertContainerChargeSchema: () => insertContainerChargeSchema,
  insertContainerOffloadSchema: () => insertContainerOffloadSchema,
  insertContainerSaleSchema: () => insertContainerSaleSchema,
  insertContainerSchema: () => insertContainerSchema,
  insertCustomerBalanceSchema: () => insertCustomerBalanceSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertDashboardCashAccountSchema: () => insertDashboardCashAccountSchema,
  insertDashboardPayableAccountSchema: () => insertDashboardPayableAccountSchema,
  insertDraftPosSaleItemSchema: () => insertDraftPosSaleItemSchema,
  insertDraftPosSaleSchema: () => insertDraftPosSaleSchema,
  insertEmployeeGroupMemberSchema: () => insertEmployeeGroupMemberSchema,
  insertEmployeeGroupSchema: () => insertEmployeeGroupSchema,
  insertEmployeeSchema: () => insertEmployeeSchema,
  insertFiscalPeriodClosureSchema: () => insertFiscalPeriodClosureSchema,
  insertFixedAssetSchema: () => insertFixedAssetSchema,
  insertImportLogSchema: () => insertImportLogSchema,
  insertInterCompanyTransferSchema: () => insertInterCompanyTransferSchema,
  insertInventorySchema: () => insertInventorySchema,
  insertLedgerAccountSchema: () => insertLedgerAccountSchema,
  insertLocationSchema: () => insertLocationSchema,
  insertMixBatchSchema: () => insertMixBatchSchema,
  insertMixBatchSourceSchema: () => insertMixBatchSourceSchema,
  insertPOLineItemSchema: () => insertPOLineItemSchema,
  insertProductionBaleSchema: () => insertProductionBaleSchema,
  insertPurchaseOrderSchema: () => insertPurchaseOrderSchema,
  insertSalaryAdvanceDeductionSchema: () => insertSalaryAdvanceDeductionSchema,
  insertSalaryAdvanceSchema: () => insertSalaryAdvanceSchema,
  insertSalesItemSchema: () => insertSalesItemSchema,
  insertStockAdjustmentItemSchema: () => insertStockAdjustmentItemSchema,
  insertStockAdjustmentVoucherSchema: () => insertStockAdjustmentVoucherSchema,
  insertStockGroupSchema: () => insertStockGroupSchema,
  insertStockItemCodeAliasSchema: () => insertStockItemCodeAliasSchema,
  insertStockItemLocationPriceSchema: () => insertStockItemLocationPriceSchema,
  insertStockItemSchema: () => insertStockItemSchema,
  insertStockTransferItemSchema: () => insertStockTransferItemSchema,
  insertStockTransferVoucherSchema: () => insertStockTransferVoucherSchema,
  insertSupplierSchema: () => insertSupplierSchema,
  insertUserCompanyRoleSchema: () => insertUserCompanyRoleSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  insertUserSchema: () => insertUserSchema,
  insertVoucherEntrySchema: () => insertVoucherEntrySchema,
  insertVoucherSchema: () => insertVoucherSchema,
  interCompanyTransfers: () => interCompanyTransfers,
  inventory: () => inventory,
  ledgerAccounts: () => ledgerAccounts,
  locations: () => locations,
  mixBatchSources: () => mixBatchSources,
  mixBatches: () => mixBatches,
  offloadRequestSchema: () => offloadRequestSchema,
  poLineItems: () => poLineItems,
  productionBales: () => productionBales,
  purchaseOrders: () => purchaseOrders,
  salaryAdvanceDeductions: () => salaryAdvanceDeductions,
  salaryAdvances: () => salaryAdvances,
  salesItems: () => salesItems,
  stockAdjustmentItems: () => stockAdjustmentItems,
  stockAdjustmentVouchers: () => stockAdjustmentVouchers,
  stockGroups: () => stockGroups,
  stockItemCodeAliases: () => stockItemCodeAliases,
  stockItemLocationPrices: () => stockItemLocationPrices,
  stockItems: () => stockItems,
  stockTransferItems: () => stockTransferItems,
  stockTransferVouchers: () => stockTransferVouchers,
  suppliers: () => suppliers,
  updateLedgerAccountSchema: () => updateLedgerAccountSchema,
  updateStockAdjustmentItemSchema: () => updateStockAdjustmentItemSchema,
  updateStockAdjustmentSchema: () => updateStockAdjustmentSchema,
  updateStockTransferItemSchema: () => updateStockTransferItemSchema,
  updateStockTransferSchema: () => updateStockTransferSchema,
  userCompanyRoles: () => userCompanyRoles,
  userPreferences: () => userPreferences,
  users: () => users,
  voucherEntries: () => voucherEntries,
  vouchers: () => vouchers
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, decimal, date, boolean, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var companies, insertCompanySchema, userCompanyRoles, insertUserCompanyRoleSchema, users, insertUserSchema, locations, insertLocationSchema, ledgerAccounts, insertLedgerAccountSchema, updateLedgerAccountSchema, employees, insertEmployeeSchema, employeeGroups, insertEmployeeGroupSchema, employeeGroupMembers, insertEmployeeGroupMemberSchema, suppliers, insertSupplierSchema, stockGroups, insertStockGroupSchema, stockItems, insertStockItemSchema, stockItemCodeAliases, insertStockItemCodeAliasSchema, bankAccounts, insertBankAccountSchema, fixedAssets, insertFixedAssetSchema, containers, insertContainerSchema, purchaseOrders, insertPurchaseOrderSchema, poLineItems, insertPOLineItemSchema, containerCharges, insertContainerChargeSchema, importLogs, insertImportLogSchema, inventory, insertInventorySchema, containerOffloads, insertContainerOffloadSchema, offloadRequestSchema, vouchers, insertVoucherSchema, voucherEntries, insertVoucherEntrySchema, fiscalPeriodClosures, insertFiscalPeriodClosureSchema, stockTransferVouchers, insertStockTransferVoucherSchema, stockTransferItems, insertStockTransferItemSchema, stockAdjustmentVouchers, insertStockAdjustmentVoucherSchema, stockAdjustmentItems, insertStockAdjustmentItemSchema, updateStockTransferItemSchema, updateStockTransferSchema, updateStockAdjustmentItemSchema, updateStockAdjustmentSchema, salesItems, insertSalesItemSchema, draftPosSales, insertDraftPosSaleSchema, draftPosSaleItems, insertDraftPosSaleItemSchema, customers, insertCustomerSchema, containerSales, insertContainerSaleSchema, interCompanyTransfers, insertInterCompanyTransferSchema, salaryAdvances, insertSalaryAdvanceSchema, salaryAdvanceDeductions, insertSalaryAdvanceDeductionSchema, dashboardCashAccounts, insertDashboardCashAccountSchema, dashboardPayableAccounts, insertDashboardPayableAccountSchema, companySettings, insertCompanySettingsSchema, bales, insertBaleSchema, mixBatches, insertMixBatchSchema, mixBatchSources, insertMixBatchSourceSchema, baleProducts, insertBaleProductSchema, baleSequences, productionBales, insertProductionBaleSchema, baleTransfers, insertBaleTransferSchema, baleTransferItems, insertBaleTransferItemSchema, customerBalances, insertCustomerBalanceSchema, stockItemLocationPrices, insertStockItemLocationPriceSchema, userPreferences, insertUserPreferencesSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    companies = pgTable("companies", {
      id: serial("id").primaryKey(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      name: text("name").notNull(),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertCompanySchema = createInsertSchema(companies).omit({
      id: true,
      createdAt: true
    }).extend({
      code: z.string().min(1, "Code is required"),
      name: z.string().min(1, "Name is required")
    });
    userCompanyRoles = pgTable("user_company_roles", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id").notNull(),
      companyId: integer("company_id").notNull(),
      role: text("role").notNull(),
      assignedLocationId: integer("assigned_location_id"),
      cashAccountId: integer("cash_account_id"),
      posStation: integer("pos_station"),
      canSellNegativeStock: boolean("can_sell_negative_stock").notNull().default(false),
      canEditDaybook: boolean("can_edit_daybook").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertUserCompanyRoleSchema = createInsertSchema(userCompanyRoles).omit({
      id: true,
      createdAt: true
    }).extend({
      userId: z.string().min(1, "User ID is required"),
      companyId: z.number().min(1, "Company ID is required"),
      role: z.enum(["Admin", "Owner", "Manager", "POS1", "POS2", "POS3", "POS4", "POS5", "POS6"])
    });
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true
    }).extend({
      username: z.string().min(1, "Username is required"),
      password: z.string().min(4, "Password must be at least 4 characters")
    });
    locations = pgTable("locations", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      name: text("name").notNull(),
      city: text("city"),
      state: text("state"),
      country: text("country"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertLocationSchema = createInsertSchema(locations).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      code: z.string().optional(),
      name: z.string().min(1, "Name is required"),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional()
    });
    ledgerAccounts = pgTable("ledger_accounts", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      code: varchar("code", { length: 50 }).notNull(),
      name: text("name").notNull(),
      accountType: text("account_type").notNull(),
      subType: text("sub_type"),
      parentId: integer("parent_id"),
      openingBalance: decimal("opening_balance", { precision: 20, scale: 2 }).default("0"),
      openingBalanceSide: text("opening_balance_side"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyCode: uniqueIndex("ledger_accounts_company_code_unique").on(t.companyId, t.code)
    }));
    insertLedgerAccountSchema = createInsertSchema(ledgerAccounts).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      code: z.string().optional(),
      name: z.string().min(1, "Name is required").refine((val) => val.trim().length > 0, "Name cannot be only whitespace"),
      accountType: z.enum(["Asset", "Liability", "Equity", "Income", "Expense", "Bank", "Cash", "Indirect Expense", "Direct Expense", "Government Taxes", "Loans", "Duty Agent", "Transporter Agent", "Accounts Payable", "Profit"]),
      subType: z.string().optional(),
      openingBalance: z.string().optional(),
      openingBalanceSide: z.enum(["Dr", "Cr"]).optional(),
      parentId: z.number().optional()
    });
    updateLedgerAccountSchema = insertLedgerAccountSchema.partial().extend({
      id: z.number().min(1, "Account ID is required")
    }).required({ id: true });
    employees = pgTable("employees", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      firstName: text("first_name").notNull(),
      lastName: text("last_name").notNull(),
      email: text("email"),
      phone: text("phone"),
      joinDate: date("join_date").notNull(),
      department: text("department"),
      employeeType: text("employee_type").notNull().default("Employee"),
      monthlySalary: decimal("monthly_salary", { precision: 15, scale: 2 }).notNull().default("0"),
      openingBalance: decimal("opening_balance", { precision: 15, scale: 2 }).default("0"),
      currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).notNull().default("0"),
      totalDeposits: decimal("total_deposits", { precision: 15, scale: 2 }).notNull().default("0"),
      totalWithdrawals: decimal("total_withdrawals", { precision: 15, scale: 2 }).notNull().default("0"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertEmployeeSchema = createInsertSchema(employees).omit({
      id: true,
      createdAt: true,
      currentBalance: true,
      totalDeposits: true,
      totalWithdrawals: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      code: z.string().optional(),
      firstName: z.string().min(1, "First name is required").refine((val) => val.trim().length > 0, "First name cannot be only whitespace"),
      lastName: z.string().min(1, "Last name is required").refine((val) => val.trim().length > 0, "Last name cannot be only whitespace"),
      email: z.string().email("Invalid email format").optional().or(z.literal("")),
      joinDate: z.string().min(1, "Starting date is required").refine(
        (val) => {
          const regex = /^\d{4}-\d{2}-\d{2}$/;
          if (!regex.test(val)) return false;
          const date2 = new Date(val);
          return !isNaN(date2.getTime()) && val === date2.toISOString().split("T")[0];
        },
        "Date must be a valid date in YYYY-MM-DD format"
      ),
      employeeType: z.enum(["Employee", "Worker"])
    });
    employeeGroups = pgTable("employee_groups", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      name: text("name").notNull(),
      description: text("description"),
      groupType: text("group_type").notNull().default("Employee"),
      // "Employee" or "Worker"
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertEmployeeGroupSchema = createInsertSchema(employeeGroups).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      name: z.string().min(1, "Group name is required").refine((val) => val.trim().length > 0, "Group name cannot be only whitespace"),
      description: z.string().optional(),
      groupType: z.enum(["Employee", "Worker"]).default("Employee")
    });
    employeeGroupMembers = pgTable("employee_group_members", {
      id: serial("id").primaryKey(),
      employeeGroupId: integer("employee_group_id").notNull(),
      employeeId: integer("employee_id").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertEmployeeGroupMemberSchema = createInsertSchema(employeeGroupMembers).omit({
      id: true,
      createdAt: true
    }).extend({
      employeeGroupId: z.number().min(1, "Employee group is required"),
      employeeId: z.number().min(1, "Employee is required")
    });
    suppliers = pgTable("suppliers", {
      id: serial("id").primaryKey(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      legalName: text("legal_name").notNull(),
      email: text("email").notNull(),
      phone: text("phone"),
      address: text("address"),
      taxId: text("tax_id"),
      paymentTerms: text("payment_terms"),
      openingBalance: decimal("opening_balance", { precision: 15, scale: 2 }).default("0"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertSupplierSchema = createInsertSchema(suppliers).omit({
      id: true,
      createdAt: true
    }).extend({
      code: z.string().optional(),
      legalName: z.string().min(1, "Legal name is required"),
      email: z.string().email("Invalid email format").optional().or(z.literal("")),
      phone: z.string().optional(),
      address: z.string().optional(),
      taxId: z.string().optional(),
      paymentTerms: z.string().optional(),
      openingBalance: z.string().optional()
    });
    stockGroups = pgTable("stock_groups", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      code: varchar("code", { length: 50 }).notNull(),
      name: text("name").notNull(),
      parentId: integer("parent_id"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyCode: uniqueIndex("stock_groups_company_code_unique").on(t.companyId, t.code)
    }));
    insertStockGroupSchema = createInsertSchema(stockGroups).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      code: z.string().min(1, "Code is required"),
      name: z.string().min(1, "Name is required")
    });
    stockItems = pgTable("stock_items", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      code: varchar("code", { length: 50 }).notNull(),
      name: text("name").notNull(),
      stockGroupId: integer("stock_group_id"),
      uom: text("uom").notNull(),
      openingQty: decimal("opening_qty", { precision: 15, scale: 3 }).default("0"),
      openingRate: decimal("opening_rate", { precision: 15, scale: 2 }).default("0"),
      openingValue: decimal("opening_value", { precision: 15, scale: 2 }).default("0"),
      reorderLevel: decimal("reorder_level", { precision: 15, scale: 3 }).default("0"),
      sellingPrice: decimal("selling_price", { precision: 15, scale: 2 }).default("0"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyCode: uniqueIndex("stock_items_company_code_unique").on(t.companyId, t.code)
    }));
    insertStockItemSchema = createInsertSchema(stockItems).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      code: z.string().min(1, "Code is required"),
      name: z.string().min(1, "Name is required"),
      uom: z.string().min(1, "Unit of measure is required")
    });
    stockItemCodeAliases = pgTable("stock_item_code_aliases", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      stockItemId: integer("stock_item_id").notNull(),
      aliasCode: varchar("alias_code", { length: 50 }).notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyAlias: uniqueIndex("stock_item_code_aliases_company_alias_unique").on(t.companyId, t.aliasCode)
    }));
    insertStockItemCodeAliasSchema = createInsertSchema(stockItemCodeAliases).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      stockItemId: z.number().min(1, "Stock item is required"),
      aliasCode: z.string().min(1, "Alias code is required"),
      description: z.string().optional()
    });
    bankAccounts = pgTable("bank_accounts", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      name: text("name").notNull(),
      bankName: text("bank_name").notNull(),
      accountNumber: text("account_number").notNull(),
      routingCode: text("routing_code"),
      linkedLedgerId: integer("linked_ledger_id"),
      openingBalance: decimal("opening_balance", { precision: 15, scale: 2 }).default("0"),
      openingBalanceSide: text("opening_balance_side"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      code: z.string().min(1, "Code is required"),
      name: z.string().min(1, "Name is required"),
      bankName: z.string().min(1, "Bank name is required"),
      accountNumber: z.string().min(1, "Account number is required"),
      openingBalanceSide: z.enum(["Dr", "Cr"]).optional()
    });
    fixedAssets = pgTable("fixed_assets", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      name: text("name").notNull(),
      category: text("category").notNull(),
      purchaseDate: date("purchase_date").notNull(),
      purchaseAmount: decimal("purchase_amount", { precision: 15, scale: 2 }).notNull(),
      depreciationMethod: text("depreciation_method").notNull().default("None"),
      usefulLife: integer("useful_life"),
      openingBalance: decimal("opening_balance", { precision: 15, scale: 2 }),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertFixedAssetSchema = createInsertSchema(fixedAssets).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      code: z.string().min(1, "Code is required"),
      name: z.string().min(1, "Name is required"),
      category: z.string().min(1, "Category is required"),
      purchaseDate: z.string().min(1, "Purchase date is required"),
      purchaseAmount: z.string().min(1, "Purchase amount is required"),
      depreciationMethod: z.enum(["None", "StraightLine", "Declining"])
    });
    containers = pgTable("containers", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      containerNumber: varchar("container_number", { length: 100 }).notNull().unique(),
      supplierId: integer("supplier_id").notNull(),
      status: text("status").notNull().default("OTW"),
      importDate: date("import_date").notNull(),
      itemsTotal: decimal("items_total", { precision: 20, scale: 2 }).default("0"),
      chargesTotal: decimal("charges_total", { precision: 20, scale: 2 }).default("0"),
      grandTotal: decimal("grand_total", { precision: 20, scale: 2 }).default("0"),
      itemName: text("item_name"),
      ratePerKg: decimal("rate_per_kg", { precision: 10, scale: 2 }),
      totalKg: decimal("total_kg", { precision: 15, scale: 2 }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertContainerSchema = createInsertSchema(containers).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      containerNumber: z.string().min(1, "Container number is required"),
      supplierId: z.number().min(1, "Supplier is required"),
      importDate: z.string().min(1, "Import date is required")
    });
    purchaseOrders = pgTable("purchase_orders", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      poNumber: varchar("po_number", { length: 100 }).notNull(),
      containerId: integer("container_id").notNull(),
      supplierId: integer("supplier_id").notNull(),
      voucherId: integer("voucher_id"),
      currency: text("currency").notNull().default("USD"),
      itemsTotal: decimal("items_total", { precision: 20, scale: 2 }).default("0"),
      freight: decimal("freight", { precision: 20, scale: 2 }).default("0"),
      otherCharges: decimal("other_charges", { precision: 20, scale: 2 }).default("0"),
      status: text("status").notNull().default("Open"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      poNumber: z.string().min(1, "PO number is required"),
      containerId: z.number().min(1, "Container is required"),
      supplierId: z.number().min(1, "Supplier is required"),
      freight: z.string().optional(),
      otherCharges: z.string().optional()
    });
    poLineItems = pgTable("po_line_items", {
      id: serial("id").primaryKey(),
      poId: integer("po_id").notNull(),
      stockItemId: integer("stock_item_id").notNull(),
      itemName: text("item_name").notNull(),
      quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
      rate: decimal("rate", { precision: 15, scale: 2 }).notNull(),
      lineTotal: decimal("line_total", { precision: 20, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertPOLineItemSchema = createInsertSchema(poLineItems).omit({
      id: true,
      createdAt: true
    }).extend({
      poId: z.number().min(1, "PO is required"),
      stockItemId: z.number().min(1, "Stock item is required"),
      itemName: z.string().min(1, "Item name is required"),
      quantity: z.string().min(1, "Quantity is required"),
      rate: z.string().min(1, "Rate is required"),
      lineTotal: z.string().min(1, "Line total is required")
    });
    containerCharges = pgTable("container_charges", {
      id: serial("id").primaryKey(),
      containerId: integer("container_id").notNull(),
      chargeType: text("charge_type").notNull(),
      amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
      ledgerAccountId: integer("ledger_account_id"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertContainerChargeSchema = createInsertSchema(containerCharges).omit({
      id: true,
      createdAt: true
    }).extend({
      containerId: z.number().min(1, "Container is required"),
      chargeType: z.string().min(1, "Charge type is required"),
      amount: z.string().min(1, "Amount is required")
    });
    importLogs = pgTable("import_logs", {
      id: serial("id").primaryKey(),
      fileName: text("file_name").notNull(),
      fileHash: text("file_hash").notNull().unique(),
      rowCount: integer("row_count").notNull(),
      containerId: integer("container_id"),
      status: text("status").notNull(),
      errorMessage: text("error_message"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertImportLogSchema = createInsertSchema(importLogs).omit({
      id: true,
      createdAt: true
    }).extend({
      fileName: z.string().min(1, "File name is required"),
      fileHash: z.string().min(1, "File hash is required"),
      rowCount: z.number().min(0, "Row count must be non-negative"),
      status: z.enum(["Success", "Failed", "Pending"])
    });
    inventory = pgTable("inventory", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      locationId: integer("location_id").notNull(),
      stockItemId: integer("stock_item_id").notNull(),
      quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull().default("0"),
      averageRate: decimal("average_rate", { precision: 20, scale: 2 }).notNull().default("0"),
      totalValue: decimal("total_value", { precision: 20, scale: 2 }).notNull().default("0"),
      lastUpdated: timestamp("last_updated").notNull().defaultNow()
    });
    insertInventorySchema = createInsertSchema(inventory).omit({
      id: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      locationId: z.number().min(1, "Location is required"),
      stockItemId: z.number().min(1, "Stock item is required"),
      quantity: z.string(),
      averageRate: z.string(),
      totalValue: z.string()
    });
    containerOffloads = pgTable("container_offloads", {
      id: serial("id").primaryKey(),
      containerId: integer("container_id").notNull(),
      locationId: integer("location_id").notNull(),
      duties: decimal("duties", { precision: 20, scale: 2 }).notNull().default("0"),
      officeCharges: decimal("office_charges", { precision: 20, scale: 2 }).notNull().default("0"),
      transferCharges: decimal("transfer_charges", { precision: 20, scale: 2 }).notNull().default("0"),
      transportFees: decimal("transport_fees", { precision: 20, scale: 2 }).notNull().default("0"),
      totalCharges: decimal("total_charges", { precision: 20, scale: 2 }).notNull().default("0"),
      totalBales: decimal("total_bales", { precision: 15, scale: 3 }).notNull(),
      additionalCostPerBale: decimal("additional_cost_per_bale", { precision: 20, scale: 2 }).notNull(),
      offloadedAt: timestamp("offloaded_at").notNull().defaultNow()
    });
    insertContainerOffloadSchema = createInsertSchema(containerOffloads).omit({
      id: true,
      offloadedAt: true,
      totalCharges: true,
      totalBales: true,
      additionalCostPerBale: true
    }).extend({
      containerId: z.number().min(1, "Container is required"),
      locationId: z.number().min(1, "Location is required"),
      duties: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Duties must be a valid non-negative number"),
      officeCharges: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Office charges must be a valid non-negative number"),
      transferCharges: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Transfer charges must be a valid non-negative number"),
      transportFees: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Transport fees must be a valid non-negative number")
    });
    offloadRequestSchema = insertContainerOffloadSchema.omit({
      containerId: true
    }).extend({
      offloadDate: z.string().min(1, "Offload date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD required)"),
      dutiesAccountId: z.number().nullable().optional(),
      officeChargesAccountId: z.number().nullable().optional(),
      officeChargesCashAccountId: z.number().nullable().optional(),
      transportAccountId: z.number().nullable().optional(),
      additionalCharges: z.array(z.object({
        description: z.string().min(1, "Description is required"),
        amount: z.number().min(0, "Amount must be non-negative"),
        ledgerAccountId: z.number().min(1, "Ledger account is required")
      })).optional()
    });
    vouchers = pgTable("vouchers", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      locationId: integer("location_id"),
      locationName: text("location_name"),
      voucherNumber: varchar("voucher_number", { length: 100 }).notNull().unique(),
      voucherType: text("voucher_type").notNull(),
      voucherDate: date("voucher_date").notNull(),
      description: text("description"),
      totalAmount: decimal("total_amount", { precision: 20, scale: 2 }).notNull(),
      optional: boolean("optional").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertVoucherSchema = createInsertSchema(vouchers).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      locationId: z.number().optional(),
      locationName: z.string().optional(),
      voucherNumber: z.string().min(1, "Voucher number is required"),
      voucherType: z.enum(["Payment", "Receipt", "Journal", "Sales", "Purchase", "Contra", "Stock Transfer"]),
      voucherDate: z.string().min(1, "Voucher date is required"),
      totalAmount: z.string().min(1, "Total amount is required"),
      optional: z.boolean().optional().default(false)
    });
    voucherEntries = pgTable("voucher_entries", {
      id: serial("id").primaryKey(),
      voucherId: integer("voucher_id").notNull(),
      ledgerAccountId: integer("ledger_account_id"),
      bankAccountId: integer("bank_account_id"),
      fixedAssetId: integer("fixed_asset_id"),
      supplierId: integer("supplier_id"),
      employeeId: integer("employee_id"),
      debitAmount: decimal("debit_amount", { precision: 20, scale: 2 }).default("0"),
      creditAmount: decimal("credit_amount", { precision: 20, scale: 2 }).default("0"),
      narration: text("narration"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertVoucherEntrySchema = createInsertSchema(voucherEntries).omit({
      id: true,
      createdAt: true
    }).extend({
      voucherId: z.number().min(1, "Voucher is required"),
      ledgerAccountId: z.number().optional(),
      bankAccountId: z.number().optional(),
      fixedAssetId: z.number().optional(),
      supplierId: z.number().optional(),
      employeeId: z.number().optional(),
      debitAmount: z.string().optional(),
      creditAmount: z.string().optional()
    });
    fiscalPeriodClosures = pgTable("fiscal_period_closures", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
      periodStartDate: date("period_start_date").notNull(),
      periodEndDate: date("period_end_date").notNull(),
      closureDate: timestamp("closure_date").notNull().defaultNow(),
      closedByUserId: varchar("closed_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
      closingVoucherId: integer("closing_voucher_id").notNull().unique().references(() => vouchers.id, { onDelete: "restrict" }),
      retainedEarningsAccountId: integer("retained_earnings_account_id").notNull().references(() => ledgerAccounts.id, { onDelete: "restrict" }),
      totalIncome: decimal("total_income", { precision: 15, scale: 2 }).notNull(),
      totalExpense: decimal("total_expense", { precision: 15, scale: 2 }).notNull(),
      netIncome: decimal("net_income", { precision: 15, scale: 2 }).notNull(),
      status: text("status").notNull().default("CLOSED"),
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyPeriod: uniqueIndex("fiscal_closures_company_period_unique").on(t.companyId, t.periodEndDate)
    }));
    insertFiscalPeriodClosureSchema = createInsertSchema(fiscalPeriodClosures).omit({
      id: true,
      createdAt: true,
      closureDate: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      periodStartDate: z.string().min(1, "Period start date is required"),
      periodEndDate: z.string().min(1, "Period end date is required"),
      closedByUserId: z.string().min(1, "User is required"),
      closingVoucherId: z.number().min(1, "Closing voucher is required"),
      retainedEarningsAccountId: z.number().min(1, "Retained earnings account is required"),
      totalIncome: z.string(),
      totalExpense: z.string(),
      netIncome: z.string(),
      status: z.enum(["CLOSED", "REOPENED"]).optional(),
      notes: z.string().optional()
    });
    stockTransferVouchers = pgTable("stock_transfer_vouchers", {
      id: serial("id").primaryKey(),
      voucherId: integer("voucher_id").notNull(),
      sourceLocationId: integer("source_location_id").notNull(),
      destinationLocationId: integer("destination_location_id").notNull(),
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertStockTransferVoucherSchema = createInsertSchema(stockTransferVouchers).omit({
      id: true,
      createdAt: true
    }).extend({
      voucherId: z.number().min(1, "Voucher is required"),
      sourceLocationId: z.number().min(1, "Source location is required"),
      destinationLocationId: z.number().min(1, "Destination location is required")
    });
    stockTransferItems = pgTable("stock_transfer_items", {
      id: serial("id").primaryKey(),
      transferId: integer("transfer_id").notNull(),
      stockItemId: integer("stock_item_id").notNull(),
      sourceLocationId: integer("source_location_id"),
      quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
      rate: decimal("rate", { precision: 15, scale: 2 }).notNull(),
      totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertStockTransferItemSchema = createInsertSchema(stockTransferItems).omit({
      id: true,
      createdAt: true,
      totalAmount: true
    }).extend({
      transferId: z.number().min(1, "Transfer is required"),
      stockItemId: z.number().min(1, "Stock item is required"),
      quantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Quantity must be positive"),
      rate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Rate must be non-negative")
    });
    stockAdjustmentVouchers = pgTable("stock_adjustment_vouchers", {
      id: serial("id").primaryKey(),
      voucherId: integer("voucher_id").notNull(),
      locationId: integer("location_id").notNull(),
      adjustmentType: text("adjustment_type").notNull(),
      // "Production" or "Consumption"
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertStockAdjustmentVoucherSchema = createInsertSchema(stockAdjustmentVouchers).omit({
      id: true,
      createdAt: true
    }).extend({
      voucherId: z.number().min(1, "Voucher is required"),
      locationId: z.number().min(1, "Location is required"),
      adjustmentType: z.enum(["Production", "Consumption", "Mixed"])
    });
    stockAdjustmentItems = pgTable("stock_adjustment_items", {
      id: serial("id").primaryKey(),
      adjustmentId: integer("adjustment_id").notNull(),
      stockItemId: integer("stock_item_id").notNull(),
      quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
      // Positive for production, negative for consumption
      rate: decimal("rate", { precision: 15, scale: 2 }).notNull(),
      totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertStockAdjustmentItemSchema = createInsertSchema(stockAdjustmentItems).omit({
      id: true,
      createdAt: true,
      totalAmount: true
    }).extend({
      adjustmentId: z.number().min(1, "Adjustment is required"),
      stockItemId: z.number().min(1, "Stock item is required"),
      quantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) !== 0, "Quantity cannot be zero"),
      rate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Rate must be non-negative")
    });
    updateStockTransferItemSchema = z.object({
      sourceLocationId: z.coerce.number().int().positive("Source location must be a positive integer"),
      stockItemId: z.coerce.number().int().positive("Stock item must be a positive integer"),
      quantity: z.coerce.number().finite("Quantity must be a finite number").refine((val) => val !== 0, "Quantity cannot be zero"),
      rate: z.coerce.number().nonnegative("Rate must be non-negative").finite("Rate must be a finite number")
    });
    updateStockTransferSchema = z.object({
      destinationLocationId: z.coerce.number().int().positive("Destination location must be a positive integer"),
      notes: z.string().optional(),
      items: z.array(updateStockTransferItemSchema).min(1, "At least one item is required")
    });
    updateStockAdjustmentItemSchema = z.object({
      stockItemId: z.coerce.number().int().positive("Stock item must be a positive integer"),
      quantity: z.coerce.number().finite("Quantity must be a finite number").refine((val) => val !== 0, "Quantity cannot be zero"),
      rate: z.coerce.number().nonnegative("Rate must be non-negative").finite("Rate must be a finite number")
    });
    updateStockAdjustmentSchema = z.object({
      locationId: z.coerce.number().int().positive("Location must be a positive integer"),
      adjustmentType: z.enum(["Production", "Consumption"]),
      notes: z.string().optional(),
      items: z.array(updateStockAdjustmentItemSchema).min(1, "At least one item is required")
    });
    salesItems = pgTable("sales_items", {
      id: serial("id").primaryKey(),
      voucherId: integer("voucher_id").notNull(),
      stockItemId: integer("stock_item_id").notNull(),
      quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
      sellingPrice: decimal("selling_price", { precision: 15, scale: 2 }).notNull(),
      costPrice: decimal("cost_price", { precision: 15, scale: 2 }).notNull(),
      totalSales: decimal("total_sales", { precision: 15, scale: 2 }).notNull(),
      totalCost: decimal("total_cost", { precision: 15, scale: 2 }).notNull(),
      profit: decimal("profit", { precision: 15, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertSalesItemSchema = createInsertSchema(salesItems).omit({
      id: true,
      createdAt: true
    }).extend({
      voucherId: z.number().min(1, "Voucher is required"),
      stockItemId: z.number().min(1, "Stock item is required"),
      quantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Quantity must be positive"),
      sellingPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Selling price must be non-negative"),
      costPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Cost price must be non-negative"),
      totalSales: z.string(),
      totalCost: z.string(),
      profit: z.string()
    });
    draftPosSales = pgTable("draft_pos_sales", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id", { length: 255 }).notNull(),
      locationId: integer("location_id").notNull(),
      paymentAccountType: text("payment_account_type"),
      // "bank", "cash", or "credit"
      paymentAccountId: integer("payment_account_id"),
      isCreditSale: boolean("is_credit_sale").default(false),
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertDraftPosSaleSchema = createInsertSchema(draftPosSales).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      userId: z.string().min(1, "User is required"),
      locationId: z.number().min(1, "Location is required"),
      paymentAccountType: z.enum(["bank", "cash", "credit"]).optional(),
      paymentAccountId: z.number().optional(),
      isCreditSale: z.boolean().optional(),
      notes: z.string().optional()
    });
    draftPosSaleItems = pgTable("draft_pos_sale_items", {
      id: serial("id").primaryKey(),
      draftId: integer("draft_id").notNull(),
      stockItemId: integer("stock_item_id").notNull(),
      quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
      rate: decimal("rate", { precision: 15, scale: 2 }).notNull(),
      amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertDraftPosSaleItemSchema = createInsertSchema(draftPosSaleItems).omit({
      id: true,
      createdAt: true
    }).extend({
      draftId: z.number().min(1, "Draft is required"),
      stockItemId: z.number().min(1, "Stock item is required"),
      quantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Quantity must be positive"),
      rate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Rate must be non-negative"),
      amount: z.string()
    });
    customers = pgTable("customers", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      ledgerAccountId: integer("ledger_account_id"),
      code: varchar("code", { length: 50 }).notNull(),
      legalName: text("legal_name").notNull(),
      phone: text("phone"),
      openingBalance: decimal("opening_balance", { precision: 15, scale: 2 }).default("0"),
      openingBalanceSide: varchar("opening_balance_side", { length: 2 }).default("Dr"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyCode: uniqueIndex("customers_company_code_unique").on(t.companyId, t.code)
    }));
    insertCustomerSchema = createInsertSchema(customers).omit({
      id: true,
      createdAt: true,
      code: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      legalName: z.string().min(1, "Legal name is required"),
      openingBalance: z.string().optional(),
      openingBalanceSide: z.enum(["Dr", "Cr"]).optional(),
      ledgerAccountId: z.number().optional()
    });
    containerSales = pgTable("container_sales", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      containerId: integer("container_id").notNull(),
      customerId: integer("customer_id").notNull(),
      saleDate: date("sale_date").notNull(),
      containerCost: decimal("container_cost", { precision: 15, scale: 2 }).notNull(),
      commission: decimal("commission", { precision: 15, scale: 2 }).notNull(),
      commissionAccountId: integer("commission_account_id"),
      totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("USD"),
      invoiceNumber: varchar("invoice_number", { length: 100 }),
      paymentStatus: text("payment_status").notNull().default("PENDING"),
      paidAmount: decimal("paid_amount", { precision: 20, scale: 2 }).notNull().default("0"),
      voucherId: integer("voucher_id"),
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyContainer: uniqueIndex("container_sales_company_container_unique").on(t.companyId, t.containerId)
    }));
    insertContainerSaleSchema = createInsertSchema(containerSales).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      containerId: z.number().min(1, "Container is required"),
      customerId: z.number().min(1, "Customer is required"),
      saleDate: z.string().min(1, "Sale date is required"),
      containerCost: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Container cost must be non-negative"),
      commission: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Commission must be non-negative"),
      commissionAccountId: z.number().optional(),
      totalAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Total amount must be positive"),
      currency: z.string().min(1).default("USD"),
      invoiceNumber: z.string().optional(),
      paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID"]).optional(),
      paidAmount: z.string().optional(),
      voucherId: z.number().optional()
    });
    interCompanyTransfers = pgTable("inter_company_transfers", {
      id: serial("id").primaryKey(),
      transferType: text("transfer_type").notNull(),
      fromCompanyId: integer("from_company_id").notNull(),
      toCompanyId: integer("to_company_id").notNull(),
      transferDate: date("transfer_date").notNull(),
      amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
      fromLedgerAccountId: integer("from_ledger_account_id").notNull(),
      toLedgerAccountId: integer("to_ledger_account_id").notNull(),
      fromVoucherId: integer("from_voucher_id"),
      toVoucherId: integer("to_voucher_id"),
      description: text("description"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertInterCompanyTransferSchema = createInsertSchema(interCompanyTransfers).omit({
      id: true,
      createdAt: true
    }).extend({
      transferType: z.enum(["Cash", "Loan"]),
      fromCompanyId: z.number().min(1, "From company is required"),
      toCompanyId: z.number().min(1, "To company is required"),
      transferDate: z.string().min(1, "Transfer date is required"),
      amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be positive"),
      fromLedgerAccountId: z.number().min(1, "From account is required"),
      toLedgerAccountId: z.number().min(1, "To account is required")
    });
    salaryAdvances = pgTable("salary_advances", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      employeeId: integer("employee_id").notNull(),
      advanceDate: date("advance_date").notNull(),
      amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
      remainingBalance: decimal("remaining_balance", { precision: 15, scale: 2 }).notNull(),
      voucherId: integer("voucher_id"),
      notes: text("notes"),
      fullyPaid: boolean("fully_paid").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertSalaryAdvanceSchema = createInsertSchema(salaryAdvances).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      employeeId: z.number().min(1, "Employee is required"),
      advanceDate: z.string().min(1, "Advance date is required"),
      amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be positive"),
      remainingBalance: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Remaining balance must be non-negative")
    });
    salaryAdvanceDeductions = pgTable("salary_advance_deductions", {
      id: serial("id").primaryKey(),
      salaryAdvanceId: integer("salary_advance_id").notNull(),
      payrollMonth: text("payroll_month").notNull(),
      deductionAmount: decimal("deduction_amount", { precision: 15, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertSalaryAdvanceDeductionSchema = createInsertSchema(salaryAdvanceDeductions).omit({
      id: true,
      createdAt: true
    }).extend({
      salaryAdvanceId: z.number().min(1, "Salary advance is required"),
      payrollMonth: z.string().min(1, "Payroll month is required"),
      deductionAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Deduction amount must be positive")
    });
    dashboardCashAccounts = pgTable("dashboard_cash_accounts", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      accountType: text("account_type").notNull(),
      accountId: integer("account_id").notNull(),
      displayOrder: integer("display_order").notNull().default(0),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertDashboardCashAccountSchema = createInsertSchema(dashboardCashAccounts).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      accountType: z.enum(["ledger", "bank"]),
      accountId: z.number().min(1, "Account is required"),
      displayOrder: z.number().optional()
    });
    dashboardPayableAccounts = pgTable("dashboard_payable_accounts", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      accountId: integer("account_id").notNull(),
      displayOrder: integer("display_order").notNull().default(0),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertDashboardPayableAccountSchema = createInsertSchema(dashboardPayableAccounts).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      accountId: z.number().min(1, "Account is required"),
      displayOrder: z.number().optional()
    });
    companySettings = pgTable("company_settings", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull().unique(),
      logoUrl: text("logo_url"),
      logoFileName: text("logo_file_name"),
      logoUpdatedAt: timestamp("logo_updated_at"),
      invoiceFooter: text("invoice_footer"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      logoUrl: z.string().optional(),
      logoFileName: z.string().optional(),
      invoiceFooter: z.string().optional()
    });
    bales = pgTable("bales", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      containerId: integer("container_id"),
      barcode: varchar("barcode", { length: 100 }).notNull(),
      category: text("category").notNull(),
      grade: text("grade").notNull(),
      origin: text("origin").notNull(),
      weight: decimal("weight", { precision: 10, scale: 3 }).notNull(),
      datePressed: date("date_pressed").notNull(),
      price: decimal("price", { precision: 12, scale: 2 }),
      currency: varchar("currency", { length: 3 }).default("USD"),
      soldAt: timestamp("sold_at"),
      soldVoucherId: integer("sold_voucher_id"),
      status: text("status").notNull().default("AVAILABLE"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyBarcode: uniqueIndex("bales_company_barcode_unique").on(t.companyId, t.barcode)
    }));
    insertBaleSchema = createInsertSchema(bales).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      containerId: z.number().optional(),
      barcode: z.string().min(1, "Barcode is required"),
      category: z.string().min(1, "Category is required"),
      grade: z.enum(["A", "B", "C"]),
      origin: z.enum(["EU", "AUS", "USA"]),
      weight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weight must be positive"),
      datePressed: z.string().min(1, "Date pressed is required"),
      price: z.string().optional(),
      currency: z.string().length(3).optional(),
      status: z.enum(["AVAILABLE", "HOLD", "SOLD"]).optional()
    });
    mixBatches = pgTable("mix_batches", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      batchCode: varchar("batch_code", { length: 50 }).notNull(),
      targetCategory: text("target_category"),
      targetGrade: text("target_grade"),
      totalPlannedWeight: decimal("total_planned_weight", { precision: 15, scale: 3 }).notNull(),
      totalActualWeight: decimal("total_actual_weight", { precision: 15, scale: 3 }).default("0"),
      totalCost: decimal("total_cost", { precision: 20, scale: 2 }).notNull(),
      costPerKg: decimal("cost_per_kg", { precision: 20, scale: 2 }).notNull(),
      status: text("status").notNull().default("PLANNING"),
      createdBy: varchar("created_by").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyBatchCode: uniqueIndex("mix_batches_company_batch_code_unique").on(t.companyId, t.batchCode)
    }));
    insertMixBatchSchema = createInsertSchema(mixBatches).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      batchCode: z.string().min(1, "Batch code is required"),
      targetCategory: z.string().optional(),
      targetGrade: z.string().optional(),
      totalPlannedWeight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Total weight must be positive"),
      totalCost: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Total cost must be non-negative"),
      costPerKg: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Cost per kg must be non-negative"),
      status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED"]).optional(),
      createdBy: z.string().min(1, "Creator is required")
    });
    mixBatchSources = pgTable("mix_batch_sources", {
      id: serial("id").primaryKey(),
      mixBatchId: integer("mix_batch_id").notNull(),
      containerId: integer("container_id").notNull(),
      weightKg: decimal("weight_kg", { precision: 15, scale: 3 }).notNull(),
      costPerKg: decimal("cost_per_kg", { precision: 20, scale: 2 }).notNull(),
      totalCost: decimal("total_cost", { precision: 20, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertMixBatchSourceSchema = createInsertSchema(mixBatchSources).omit({
      id: true,
      createdAt: true
    }).extend({
      mixBatchId: z.number().min(1, "Mix batch is required"),
      containerId: z.number().min(1, "Container is required"),
      weightKg: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weight must be positive"),
      costPerKg: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Cost per kg must be non-negative"),
      totalCost: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Total cost must be non-negative")
    });
    baleProducts = pgTable("bale_products", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      code: varchar("code", { length: 50 }).notNull(),
      name: text("name").notNull(),
      description: text("description"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyCode: uniqueIndex("bale_products_company_code_unique").on(t.companyId, t.code)
    }));
    insertBaleProductSchema = createInsertSchema(baleProducts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      code: z.string().min(1, "Product code is required"),
      name: z.string().min(1, "Product name is required"),
      description: z.string().optional(),
      active: z.boolean().optional()
    });
    baleSequences = pgTable("bale_sequences", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull().references(() => companies.id),
      nextNumber: integer("next_number").notNull().default(1),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyId: uniqueIndex("bale_sequences_company_unique").on(t.companyId)
    }));
    productionBales = pgTable("production_bales", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      mixBatchId: integer("mix_batch_id"),
      productId: integer("product_id"),
      locationId: integer("location_id"),
      baleCode: varchar("bale_code", { length: 50 }).notNull(),
      barcodeValue: varchar("barcode_value", { length: 100 }).notNull(),
      category: text("category"),
      grade: text("grade"),
      quantity: integer("quantity").notNull().default(1),
      weightKg: decimal("weight_kg", { precision: 15, scale: 3 }).notNull(),
      costPerKg: decimal("cost_per_kg", { precision: 20, scale: 2 }).notNull(),
      totalCost: decimal("total_cost", { precision: 20, scale: 2 }).notNull(),
      warehouseLocation: text("warehouse_location"),
      status: text("status").notNull().default("LABEL_PRINTED"),
      pressedAt: timestamp("pressed_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (t) => ({
      uniqueCompanyBarcodeValue: uniqueIndex("production_bales_company_barcode_unique").on(t.companyId, t.barcodeValue)
    }));
    insertProductionBaleSchema = createInsertSchema(productionBales).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      mixBatchId: z.number().optional(),
      productId: z.number().optional(),
      baleCode: z.string().min(1, "Bale code is required"),
      barcodeValue: z.string().min(1, "Barcode value is required"),
      category: z.string().optional(),
      grade: z.string().optional(),
      weightKg: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weight must be positive"),
      costPerKg: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Cost per kg must be non-negative"),
      totalCost: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Total cost must be non-negative"),
      warehouseLocation: z.string().optional(),
      status: z.enum(["LABEL_PRINTED", "PRESSED", "IN_STOCK", "RESERVED", "SOLD"]).optional(),
      pressedAt: z.string().optional()
    });
    baleTransfers = pgTable("bale_transfers", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      sourceLocationId: integer("source_location_id").notNull(),
      destinationLocationId: integer("destination_location_id").notNull(),
      transferDate: date("transfer_date").notNull(),
      notes: text("notes"),
      createdBy: varchar("created_by").notNull(),
      updatedBy: varchar("updated_by"),
      status: text("status").notNull().default("PENDING"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertBaleTransferSchema = createInsertSchema(baleTransfers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      sourceLocationId: z.number().min(1, "Source location is required"),
      destinationLocationId: z.number().min(1, "Destination location is required"),
      transferDate: z.string().min(1, "Transfer date is required"),
      notes: z.string().optional(),
      createdBy: z.string().min(1, "Creator is required"),
      updatedBy: z.string().optional(),
      status: z.enum(["PENDING", "COMPLETED"]).optional()
    });
    baleTransferItems = pgTable("bale_transfer_items", {
      id: serial("id").primaryKey(),
      transferId: integer("transfer_id").notNull(),
      productionBaleId: integer("production_bale_id").notNull(),
      quantity: integer("quantity").notNull().default(1),
      weightKg: decimal("weight_kg", { precision: 15, scale: 3 }).notNull(),
      costPerKg: decimal("cost_per_kg", { precision: 20, scale: 2 }).notNull(),
      totalCost: decimal("total_cost", { precision: 20, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertBaleTransferItemSchema = createInsertSchema(baleTransferItems).omit({
      id: true,
      createdAt: true
    }).extend({
      transferId: z.number().min(1, "Transfer is required"),
      productionBaleId: z.number().min(1, "Bale is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      weightKg: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weight must be positive"),
      costPerKg: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Cost per kg must be non-negative"),
      totalCost: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Total cost must be non-negative")
    });
    customerBalances = pgTable("customer_balances", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").notNull(),
      customerId: integer("customer_id").notNull(),
      transactionDate: date("transaction_date").notNull(),
      transactionType: text("transaction_type").notNull(),
      referenceId: integer("reference_id"),
      referenceType: text("reference_type"),
      debitAmount: decimal("debit_amount", { precision: 20, scale: 2 }).notNull().default("0"),
      creditAmount: decimal("credit_amount", { precision: 20, scale: 2 }).notNull().default("0"),
      balance: decimal("balance", { precision: 20, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("USD"),
      description: text("description"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (t) => ({
      customerCompanyIdx: index("customer_balances_customer_company_idx").on(t.customerId, t.companyId)
    }));
    insertCustomerBalanceSchema = createInsertSchema(customerBalances).omit({
      id: true,
      createdAt: true
    }).extend({
      companyId: z.number().min(1, "Company is required"),
      customerId: z.number().min(1, "Customer is required"),
      transactionDate: z.string().min(1, "Transaction date is required"),
      transactionType: z.enum(["SALE", "PAYMENT", "ADJUSTMENT"]),
      referenceId: z.number().optional(),
      referenceType: z.string().optional(),
      debitAmount: z.string().optional(),
      creditAmount: z.string().optional(),
      balance: z.string().refine((val) => !isNaN(parseFloat(val)), "Balance must be a valid number"),
      currency: z.string().min(1).default("USD"),
      description: z.string().optional()
    });
    stockItemLocationPrices = pgTable("stock_item_location_prices", {
      id: serial("id").primaryKey(),
      stockItemId: integer("stock_item_id").notNull(),
      locationId: integer("location_id").notNull(),
      sellingPrice: decimal("selling_price", { precision: 15, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (t) => ({
      uniqueItemLocation: uniqueIndex("stock_item_location_prices_item_location_unique").on(t.stockItemId, t.locationId)
    }));
    insertStockItemLocationPriceSchema = createInsertSchema(stockItemLocationPrices).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      stockItemId: z.number().min(1, "Stock item is required"),
      locationId: z.number().min(1, "Location is required"),
      sellingPrice: z.string().min(1, "Selling price is required")
    });
    userPreferences = pgTable("user_preferences", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      dateFormat: text("date_format").notNull().default("MM/DD/YYYY"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      userId: z.string().min(1, "User ID is required"),
      dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY"]).default("MM/DD/YYYY")
    });
  }
});

// server/index.ts
import express2 from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path3 from "path";
import fs2 from "fs";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import crypto from "crypto-js";

// server/storage.ts
import { eq, and, or, sql as sql2, inArray, desc, ne } from "drizzle-orm";

// server/db.ts
init_schema();
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
var connectionString;
if (process.env.NODE_ENV === "development" && process.env.PGHOST) {
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  connectionString = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
  console.log("Using Replit database for development");
} else if (process.env.DATABASE_URL) {
  connectionString = process.env.DATABASE_URL;
  console.log("Using DATABASE_URL for production");
} else {
  throw new Error("No database configuration found. Did you forget to provision a database?");
}
console.log("Database connection endpoint:", connectionString.replace(/:[^:@]*@/, ":***@"));
var isLocalReplitDB = process.env.PGHOST === "helium";
var sslExplicitlyDisabled = process.env.PGSSLMODE === "disable";
var requiresSSL = !isLocalReplitDB && !sslExplicitlyDisabled;
if (!requiresSSL && !isLocalReplitDB) {
  console.warn("\u26A0\uFE0F  SSL disabled via PGSSLMODE=disable - ensure this is intentional for your environment");
} else if (isLocalReplitDB) {
  console.log("\u2139\uFE0F  SSL disabled for Replit local database (helium)");
} else {
  console.log("\u2713 SSL enabled for external database connection");
}
var pool = new Pool({
  connectionString,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
init_schema();
var DbStorage = class {
  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }
  async getUserCompanyRole(userId, companyId) {
    const [role] = await db.select().from(userCompanyRoles).where(
      and(
        eq(userCompanyRoles.userId, userId),
        eq(userCompanyRoles.companyId, companyId)
      )
    );
    return role;
  }
  // Companies
  async getAllCompanies() {
    return await db.select().from(companies);
  }
  async getCompanyById(id) {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }
  async createCompany(company) {
    const [created] = await db.insert(companies).values(company).returning();
    return created;
  }
  async updateCompany(id, updates) {
    const [updated] = await db.update(companies).set(updates).where(eq(companies.id, id)).returning();
    return updated;
  }
  async deleteCompany(id) {
    await db.execute(sql2`DELETE FROM voucher_entries WHERE voucher_id IN (SELECT id FROM vouchers WHERE company_id = ${id})`);
    await db.execute(sql2`DELETE FROM sales_items WHERE voucher_id IN (SELECT id FROM vouchers WHERE company_id = ${id})`);
    await db.execute(sql2`DELETE FROM stock_transfer_items WHERE transfer_id IN (SELECT stv.id FROM stock_transfer_vouchers stv JOIN vouchers v ON stv.voucher_id = v.id WHERE v.company_id = ${id})`);
    await db.execute(sql2`DELETE FROM stock_transfer_vouchers WHERE voucher_id IN (SELECT id FROM vouchers WHERE company_id = ${id})`);
    await db.execute(sql2`DELETE FROM stock_adjustment_items WHERE adjustment_id IN (SELECT sav.id FROM stock_adjustment_vouchers sav JOIN vouchers v ON sav.voucher_id = v.id WHERE v.company_id = ${id})`);
    await db.execute(sql2`DELETE FROM stock_adjustment_vouchers WHERE voucher_id IN (SELECT id FROM vouchers WHERE company_id = ${id})`);
    await db.delete(vouchers).where(eq(vouchers.companyId, id));
    await db.execute(sql2`DELETE FROM draft_pos_sale_items WHERE draft_id IN (SELECT dps.id FROM draft_pos_sales dps JOIN locations l ON dps.location_id = l.id WHERE l.company_id = ${id})`);
    await db.execute(sql2`DELETE FROM draft_pos_sales WHERE location_id IN (SELECT id FROM locations WHERE company_id = ${id})`);
    await db.execute(sql2`DELETE FROM po_line_items WHERE po_id IN (SELECT id FROM purchase_orders WHERE company_id = ${id})`);
    await db.delete(purchaseOrders).where(eq(purchaseOrders.companyId, id));
    await db.execute(sql2`DELETE FROM container_charges WHERE container_id IN (SELECT id FROM containers WHERE company_id = ${id})`);
    await db.execute(sql2`DELETE FROM container_offloads WHERE container_id IN (SELECT id FROM containers WHERE company_id = ${id})`);
    await db.delete(containers).where(eq(containers.companyId, id));
    await db.delete(inventory).where(eq(inventory.companyId, id));
    await db.delete(stockItemCodeAliases).where(eq(stockItemCodeAliases.companyId, id));
    await db.execute(sql2`DELETE FROM stock_item_location_prices WHERE stock_item_id IN (SELECT id FROM stock_items WHERE company_id = ${id})`);
    await db.delete(stockItems).where(eq(stockItems.companyId, id));
    await db.delete(stockGroups).where(eq(stockGroups.companyId, id));
    await db.execute(sql2`DELETE FROM mix_batch_sources WHERE mix_batch_id IN (SELECT id FROM mix_batches WHERE company_id = ${id})`);
    await db.delete(mixBatches).where(eq(mixBatches.companyId, id));
    await db.delete(productionBales).where(eq(productionBales.companyId, id));
    await db.execute(sql2`DELETE FROM bale_transfer_items WHERE transfer_id IN (SELECT id FROM bale_transfers WHERE company_id = ${id})`);
    await db.delete(baleTransfers).where(eq(baleTransfers.companyId, id));
    await db.delete(baleProducts).where(eq(baleProducts.companyId, id));
    await db.delete(baleSequences).where(eq(baleSequences.companyId, id));
    await db.delete(bales).where(eq(bales.companyId, id));
    await db.delete(salaryAdvances).where(eq(salaryAdvances.companyId, id));
    await db.execute(sql2`DELETE FROM employee_group_members WHERE employee_group_id IN (SELECT id FROM employee_groups WHERE company_id = ${id})`);
    await db.delete(employeeGroups).where(eq(employeeGroups.companyId, id));
    await db.delete(employees).where(eq(employees.companyId, id));
    await db.delete(customerBalances).where(eq(customerBalances.companyId, id));
    await db.delete(customers).where(eq(customers.companyId, id));
    await db.delete(containerSales).where(eq(containerSales.companyId, id));
    await db.delete(interCompanyTransfers).where(or(eq(interCompanyTransfers.fromCompanyId, id), eq(interCompanyTransfers.toCompanyId, id)));
    await db.delete(bankAccounts).where(eq(bankAccounts.companyId, id));
    await db.delete(fixedAssets).where(eq(fixedAssets.companyId, id));
    await db.delete(ledgerAccounts).where(eq(ledgerAccounts.companyId, id));
    await db.delete(locations).where(eq(locations.companyId, id));
    await db.delete(fiscalPeriodClosures).where(eq(fiscalPeriodClosures.companyId, id));
    await db.delete(dashboardCashAccounts).where(eq(dashboardCashAccounts.companyId, id));
    await db.delete(dashboardPayableAccounts).where(eq(dashboardPayableAccounts.companyId, id));
    await db.delete(companySettings).where(eq(companySettings.companyId, id));
    await db.delete(userCompanyRoles).where(eq(userCompanyRoles.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }
  // User-Company Roles
  async getUserCompaniesWithRoles(userId) {
    return await db.select().from(userCompanyRoles).where(eq(userCompanyRoles.userId, userId));
  }
  async createUserCompanyRole(role) {
    const [created] = await db.insert(userCompanyRoles).values(role).returning();
    return created;
  }
  async updateUserCompanyRole(id, updates) {
    const [updated] = await db.update(userCompanyRoles).set(updates).where(eq(userCompanyRoles.id, id)).returning();
    return updated;
  }
  async deleteUserCompanyRole(id) {
    await db.delete(userCompanyRoles).where(eq(userCompanyRoles.id, id));
  }
  // Locations
  async getAllLocations(companyId) {
    console.log("[storage.getAllLocations] Querying locations for companyId:", companyId);
    const locations2 = await db.select().from(locations).where(eq(locations.companyId, companyId));
    console.log("[storage.getAllLocations] Query returned:", locations2.length, "locations");
    return locations2;
  }
  async getLocationById(id) {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }
  async getLocationByCode(code, companyId) {
    const [location] = await db.select().from(locations).where(
      and(eq(locations.code, code), eq(locations.companyId, companyId))
    );
    return location;
  }
  async createLocation(location) {
    const [created] = await db.insert(locations).values(location).returning();
    return created;
  }
  async deleteLocation(id) {
    await db.delete(locations).where(eq(locations.id, id));
  }
  // Ledger Accounts
  async getAllLedgerAccounts(companyId) {
    return await db.select().from(ledgerAccounts).where(eq(ledgerAccounts.companyId, companyId));
  }
  async getLedgerAccountByCode(code, companyId) {
    const [account] = await db.select().from(ledgerAccounts).where(
      and(eq(ledgerAccounts.code, code), eq(ledgerAccounts.companyId, companyId))
    );
    return account;
  }
  async getLedgerAccountByName(name, companyId) {
    const [account] = await db.select().from(ledgerAccounts).where(
      and(eq(ledgerAccounts.name, name), eq(ledgerAccounts.companyId, companyId))
    );
    return account;
  }
  async createLedgerAccount(account) {
    const [created] = await db.insert(ledgerAccounts).values([account]).returning();
    return created;
  }
  async deleteLedgerAccount(id) {
    await db.delete(ledgerAccounts).where(eq(ledgerAccounts.id, id));
  }
  async getLedgerAccountById(id) {
    const [account] = await db.select().from(ledgerAccounts).where(eq(ledgerAccounts.id, id));
    return account;
  }
  async updateLedgerAccount(account) {
    const { id, ...updates } = account;
    const [updated] = await db.update(ledgerAccounts).set(updates).where(eq(ledgerAccounts.id, id)).returning();
    return updated;
  }
  // Employees
  async getAllEmployees(companyId) {
    const employees2 = await db.select().from(employees).where(eq(employees.companyId, companyId));
    return employees2.map((emp) => ({
      ...emp,
      firstName: emp.firstName || emp.first_name,
      lastName: emp.lastName || emp.last_name
    }));
  }
  async getEmployeesWithBalances(companyId) {
    const employees2 = await this.getAllEmployees(companyId);
    const employeesWithBalances = employees2.map((employee) => {
      const calculatedBalance = parseFloat(employee.currentBalance || "0");
      return {
        ...employee,
        calculatedBalance: calculatedBalance.toFixed(2)
      };
    });
    return employeesWithBalances;
  }
  async getEmployeeByCode(code) {
    const [employee] = await db.select().from(employees).where(eq(employees.code, code));
    return employee;
  }
  async getEmployeeById(id) {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }
  async createEmployee(employee) {
    const [created] = await db.insert(employees).values([employee]).returning();
    return created;
  }
  async deleteEmployee(id, forceDelete = false) {
    return await db.transaction(async (tx) => {
      const [employee] = await tx.select().from(employees).where(eq(employees.id, id));
      if (!employee) {
        return { success: false, message: "Employee not found" };
      }
      const salaryAdvances2 = await tx.select().from(salaryAdvances).where(eq(salaryAdvances.employeeId, id)).limit(1);
      if (salaryAdvances2.length > 0) {
        return {
          success: false,
          message: "Cannot delete employee with salary advances. Please remove all salary advances first."
        };
      }
      const employeeBalance = parseFloat(employee.currentBalance || "0");
      const [linkedAccount] = await tx.select().from(ledgerAccounts).where(
        and(
          eq(ledgerAccounts.code, employee.code),
          eq(ledgerAccounts.companyId, employee.companyId)
        )
      );
      let ledgerBalance = 0;
      if (linkedAccount) {
        const voucherEntries2 = await tx.select({ id: voucherEntries.id }).from(voucherEntries).where(eq(voucherEntries.ledgerAccountId, linkedAccount.id)).limit(1);
        if (voucherEntries2.length > 0) {
          return {
            success: false,
            message: "Cannot delete employee. The linked ledger account has transaction history."
          };
        }
        const openingBalance = parseFloat(linkedAccount.openingBalance || "0");
        const openingSide = linkedAccount.openingBalanceSide || "Dr";
        ledgerBalance = openingSide === "Dr" ? openingBalance : -openingBalance;
      }
      if (!forceDelete && (Math.abs(employeeBalance) > 0.01 || Math.abs(ledgerBalance) > 0.01)) {
        return {
          success: false,
          message: "Employee or linked account has a non-zero balance. Admin confirmation required.",
          employeeBalance,
          ledgerBalance
        };
      }
      if (linkedAccount) {
        await tx.delete(ledgerAccounts).where(eq(ledgerAccounts.id, linkedAccount.id));
      }
      await tx.delete(employeeGroupMembers).where(eq(employeeGroupMembers.employeeId, id));
      await tx.delete(employees).where(eq(employees.id, id));
      return { success: true };
    });
  }
  // Employee Groups
  async getAllEmployeeGroups(companyId) {
    const results = await db.select().from(employeeGroups).where(eq(employeeGroups.companyId, companyId));
    return results.map((g) => ({
      ...g,
      groupType: g.groupType || "Employee"
    }));
  }
  async getEmployeeGroupById(id) {
    const [group] = await db.select().from(employeeGroups).where(eq(employeeGroups.id, id));
    return group;
  }
  async createEmployeeGroup(group) {
    const [created] = await db.insert(employeeGroups).values(group).returning();
    return created;
  }
  async updateEmployeeGroup(id, updates) {
    const [updated] = await db.update(employeeGroups).set(updates).where(eq(employeeGroups.id, id)).returning();
    return updated;
  }
  async deleteEmployeeGroup(id) {
    await db.delete(employeeGroupMembers).where(eq(employeeGroupMembers.employeeGroupId, id));
    await db.delete(employeeGroups).where(eq(employeeGroups.id, id));
  }
  async getEmployeeGroupMembers(groupId) {
    const results = await db.select({
      id: employeeGroupMembers.id,
      employeeId: employees.id,
      employeeCode: employees.code,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      department: employees.department
    }).from(employeeGroupMembers).leftJoin(employees, eq(employeeGroupMembers.employeeId, employees.id)).where(eq(employeeGroupMembers.employeeGroupId, groupId));
    return results;
  }
  async addEmployeeToGroup(groupId, employeeId) {
    const [existing] = await db.select().from(employeeGroupMembers).where(
      and(
        eq(employeeGroupMembers.employeeGroupId, groupId),
        eq(employeeGroupMembers.employeeId, employeeId)
      )
    );
    if (!existing) {
      await db.insert(employeeGroupMembers).values({
        employeeGroupId: groupId,
        employeeId
      });
    }
  }
  async removeEmployeeFromGroup(groupId, employeeId) {
    await db.delete(employeeGroupMembers).where(
      and(
        eq(employeeGroupMembers.employeeGroupId, groupId),
        eq(employeeGroupMembers.employeeId, employeeId)
      )
    );
  }
  // Suppliers
  async getAllSuppliers() {
    return await db.select().from(suppliers);
  }
  async getSupplierByCode(code) {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.code, code));
    return supplier;
  }
  async getSupplierById(id) {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }
  async createSupplier(supplier) {
    const [created] = await db.insert(suppliers).values(supplier).returning();
    return created;
  }
  async updateSupplier(id, updates) {
    const [updated] = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning();
    return updated;
  }
  // Stock Groups
  async getAllStockGroups(companyId) {
    return await db.select().from(stockGroups).where(eq(stockGroups.companyId, companyId));
  }
  async getStockGroupByCode(code, companyId) {
    const [group] = await db.select().from(stockGroups).where(
      and(
        eq(stockGroups.code, code),
        eq(stockGroups.companyId, companyId)
      )
    );
    return group;
  }
  async createStockGroup(group) {
    const [created] = await db.insert(stockGroups).values(group).returning();
    return created;
  }
  // Stock Items
  async getAllStockItems(companyId) {
    return await db.select().from(stockItems).where(eq(stockItems.companyId, companyId));
  }
  async getStockItemByCode(code, companyId) {
    const [item] = await db.select().from(stockItems).where(
      and(
        eq(stockItems.code, code),
        eq(stockItems.companyId, companyId)
      )
    );
    return item;
  }
  async getStockItemById(id) {
    const [item] = await db.select().from(stockItems).where(eq(stockItems.id, id));
    return item;
  }
  async createStockItem(item) {
    const [created] = await db.insert(stockItems).values(item).returning();
    return created;
  }
  async updateStockItem(id, updates) {
    const [updated] = await db.update(stockItems).set(updates).where(eq(stockItems.id, id)).returning();
    return updated;
  }
  async deleteStockItem(id) {
    await db.delete(stockItems).where(eq(stockItems.id, id));
  }
  async bulkGetStockItemsByIds(ids, companyId) {
    if (ids.length === 0) return [];
    return await db.select().from(stockItems).where(
      and(
        inArray(stockItems.id, ids),
        eq(stockItems.companyId, companyId)
      )
    );
  }
  async bulkDeleteStockItems(ids) {
    if (ids.length === 0) return;
    await db.delete(stockItems).where(inArray(stockItems.id, ids));
  }
  async getStockItemByCodeOrAlias(code, companyId) {
    const [directMatch] = await db.select().from(stockItems).where(
      and(
        sql2`LOWER(${stockItems.code}) = LOWER(${code})`,
        eq(stockItems.companyId, companyId)
      )
    ).limit(1);
    if (directMatch) {
      return directMatch;
    }
    const [aliasMatch] = await db.select({
      stockItem: stockItems
    }).from(stockItemCodeAliases).innerJoin(
      stockItems,
      eq(stockItemCodeAliases.stockItemId, stockItems.id)
    ).where(
      and(
        sql2`LOWER(${stockItemCodeAliases.aliasCode}) = LOWER(${code})`,
        eq(stockItemCodeAliases.companyId, companyId),
        eq(stockItems.companyId, companyId)
      )
    ).limit(1);
    return aliasMatch?.stockItem;
  }
  // Stock Item Code Aliases
  async getStockItemCodeAliases(stockItemId) {
    return await db.select().from(stockItemCodeAliases).where(eq(stockItemCodeAliases.stockItemId, stockItemId));
  }
  async getStockItemCodeAliasById(id) {
    const [alias] = await db.select().from(stockItemCodeAliases).where(eq(stockItemCodeAliases.id, id)).limit(1);
    return alias;
  }
  async createStockItemCodeAlias(alias) {
    const [created] = await db.insert(stockItemCodeAliases).values(alias).returning();
    return created;
  }
  async deleteStockItemCodeAlias(id) {
    await db.delete(stockItemCodeAliases).where(eq(stockItemCodeAliases.id, id));
  }
  // Bank Accounts
  async getAllBankAccounts(companyId) {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.companyId, companyId));
  }
  async getBankAccountByCode(code) {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.code, code));
    return account;
  }
  async getBankAccountById(id, companyId) {
    const [account] = await db.select().from(bankAccounts).where(
      and(
        eq(bankAccounts.id, id),
        eq(bankAccounts.companyId, companyId)
      )
    );
    return account;
  }
  async createBankAccount(account) {
    const [created] = await db.insert(bankAccounts).values(account).returning();
    return created;
  }
  async updateBankAccount(id, updates, companyId) {
    const existing = await this.getBankAccountById(id, companyId);
    if (!existing) {
      throw new Error("Bank account not found");
    }
    if (updates.code && updates.code !== existing.code) {
      const [duplicate] = await db.select().from(bankAccounts).where(
        and(
          eq(bankAccounts.code, updates.code),
          eq(bankAccounts.companyId, companyId),
          ne(bankAccounts.id, id)
        )
      );
      if (duplicate) {
        throw new Error("Bank account code already exists in this company");
      }
    }
    const [updated] = await db.update(bankAccounts).set(updates).where(
      and(
        eq(bankAccounts.id, id),
        eq(bankAccounts.companyId, companyId)
      )
    ).returning();
    if (!updated) {
      throw new Error("Bank account not found");
    }
    return updated;
  }
  async deleteBankAccount(id, companyId) {
    const existing = await this.getBankAccountById(id, companyId);
    if (!existing) {
      throw new Error("Bank account not found");
    }
    const entries = await db.select({ count: sql2`count(*)` }).from(voucherEntries).where(eq(voucherEntries.bankAccountId, id));
    const entryCount = entries[0]?.count || 0;
    if (entryCount > 0) {
      throw new Error(`Cannot delete bank account: ${entryCount} voucher entries exist`);
    }
    await db.delete(bankAccounts).where(
      and(
        eq(bankAccounts.id, id),
        eq(bankAccounts.companyId, companyId)
      )
    );
  }
  // Fixed Assets
  async getAllFixedAssets(companyId) {
    return await db.select().from(fixedAssets).where(eq(fixedAssets.companyId, companyId));
  }
  async getFixedAssetByCode(code) {
    const [asset] = await db.select().from(fixedAssets).where(eq(fixedAssets.code, code));
    return asset;
  }
  async createFixedAsset(asset) {
    const [created] = await db.insert(fixedAssets).values(asset).returning();
    return created;
  }
  // Containers
  async getAllContainers(companyId) {
    return await db.select().from(containers).where(eq(containers.companyId, companyId));
  }
  async getActiveContainers(companyId) {
    return await db.select().from(containers).where(
      and(
        eq(containers.companyId, companyId),
        ne(containers.status, "SOLD")
      )
    );
  }
  async getSoldContainers(companyId) {
    const results = await db.select({
      containerId: containers.id,
      containerNumber: containers.containerNumber,
      supplierId: containers.supplierId,
      status: containers.status,
      importDate: containers.importDate,
      itemsTotal: containers.itemsTotal,
      chargesTotal: containers.chargesTotal,
      grandTotal: containers.grandTotal,
      saleId: containerSales.id,
      customerId: containerSales.customerId,
      customerName: customers.legalName,
      saleDate: containerSales.saleDate,
      containerCost: containerSales.containerCost,
      commission: containerSales.commission,
      commissionAccountId: containerSales.commissionAccountId,
      totalAmount: containerSales.totalAmount,
      notes: containerSales.notes
    }).from(containers).innerJoin(containerSales, eq(containers.id, containerSales.containerId)).innerJoin(customers, eq(containerSales.customerId, customers.id)).where(
      and(
        eq(containers.companyId, companyId),
        eq(containers.status, "SOLD")
      )
    ).orderBy(sql2`${containerSales.saleDate} DESC`);
    return results;
  }
  async getContainerById(id) {
    const [container] = await db.select().from(containers).where(eq(containers.id, id));
    return container;
  }
  async getContainerByNumber(containerNumber) {
    const [container] = await db.select().from(containers).where(eq(containers.containerNumber, containerNumber));
    return container;
  }
  async createContainer(container) {
    const [created] = await db.insert(containers).values(container).returning();
    return created;
  }
  async updateContainer(id, updates) {
    const [updated] = await db.update(containers).set(updates).where(eq(containers.id, id)).returning();
    return updated;
  }
  // Purchase Orders
  async getAllPurchaseOrders(companyId) {
    return await db.select().from(purchaseOrders).where(eq(purchaseOrders.companyId, companyId));
  }
  async getPurchaseOrderById(id) {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return po;
  }
  async getPurchaseOrdersByContainer(containerId) {
    return await db.select().from(purchaseOrders).where(eq(purchaseOrders.containerId, containerId));
  }
  async getPurchaseOrdersBySupplier(supplierId, companyId) {
    const query = db.select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      containerNumber: containers.containerNumber,
      itemsTotal: purchaseOrders.itemsTotal,
      currency: purchaseOrders.currency,
      status: purchaseOrders.status,
      createdAt: purchaseOrders.createdAt,
      voucherId: purchaseOrders.voucherId
    }).from(purchaseOrders).leftJoin(containers, eq(purchaseOrders.containerId, containers.id)).where(
      and(
        eq(purchaseOrders.supplierId, supplierId),
        eq(purchaseOrders.companyId, companyId)
      )
    ).orderBy(sql2`${purchaseOrders.createdAt} DESC`);
    return await query;
  }
  async createPurchaseOrder(po) {
    const [created] = await db.insert(purchaseOrders).values(po).returning();
    return created;
  }
  async updatePurchaseOrder(id, updates) {
    const [updated] = await db.update(purchaseOrders).set(updates).where(eq(purchaseOrders.id, id)).returning();
    return updated;
  }
  async deletePurchaseOrder(id) {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
    if (!po) {
      throw new Error("Purchase order not found");
    }
    const containerId = po.containerId;
    const poTotal = parseFloat(po.itemsTotal || "0");
    await db.delete(poLineItems).where(eq(poLineItems.poId, id));
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
    if (po.voucherId) {
      await db.delete(voucherEntries).where(eq(voucherEntries.voucherId, po.voucherId));
      await db.delete(vouchers).where(eq(vouchers.id, po.voucherId));
    }
    const remainingPOs = await db.select().from(purchaseOrders).where(eq(purchaseOrders.containerId, containerId)).limit(1);
    if (remainingPOs.length === 0) {
      await db.delete(containerCharges).where(eq(containerCharges.containerId, containerId));
      await db.delete(importLogs).where(eq(importLogs.containerId, containerId));
      await db.delete(containers).where(eq(containers.id, containerId));
    } else {
      const [container] = await db.select().from(containers).where(eq(containers.id, containerId)).limit(1);
      if (container) {
        const newItemsTotal = Math.max(0, parseFloat(container.itemsTotal || "0") - poTotal);
        const chargesTotal = parseFloat(container.chargesTotal || "0");
        const newGrandTotal = newItemsTotal + chargesTotal;
        await db.update(containers).set({
          itemsTotal: newItemsTotal.toString(),
          grandTotal: newGrandTotal.toString()
        }).where(eq(containers.id, containerId));
      }
    }
  }
  async deleteContainer(id) {
    const pos = await db.select().from(purchaseOrders).where(eq(purchaseOrders.containerId, id));
    for (const po of pos) {
      await db.delete(poLineItems).where(eq(poLineItems.poId, po.id));
      if (po.voucherId) {
        await db.delete(voucherEntries).where(eq(voucherEntries.voucherId, po.voucherId));
        await db.delete(vouchers).where(eq(vouchers.id, po.voucherId));
      }
      await db.delete(purchaseOrders).where(eq(purchaseOrders.id, po.id));
    }
    await db.delete(containerCharges).where(eq(containerCharges.containerId, id));
    await db.delete(importLogs).where(eq(importLogs.containerId, id));
    await db.delete(containers).where(eq(containers.id, id));
  }
  // PO Line Items
  async getLineItemsByPO(poId) {
    const items = await db.select({
      id: poLineItems.id,
      poId: poLineItems.poId,
      stockItemId: poLineItems.stockItemId,
      stockItemCode: stockItems.code,
      stockItemName: poLineItems.itemName,
      itemName: poLineItems.itemName,
      quantity: poLineItems.quantity,
      rate: poLineItems.rate,
      lineTotal: poLineItems.lineTotal,
      createdAt: poLineItems.createdAt,
      totalCost: poLineItems.lineTotal
    }).from(poLineItems).leftJoin(stockItems, eq(poLineItems.stockItemId, stockItems.id)).where(eq(poLineItems.poId, poId));
    return items;
  }
  async createPOLineItem(lineItem) {
    const [created] = await db.insert(poLineItems).values(lineItem).returning();
    return created;
  }
  // Container Charges
  async getChargesByContainer(containerId) {
    return await db.select().from(containerCharges).where(eq(containerCharges.containerId, containerId));
  }
  async createContainerCharge(charge) {
    const [created] = await db.insert(containerCharges).values(charge).returning();
    return created;
  }
  // Import Logs
  async getImportLogByHash(hash) {
    const [log2] = await db.select().from(importLogs).where(eq(importLogs.fileHash, hash));
    return log2;
  }
  async createImportLog(log2) {
    const [created] = await db.insert(importLogs).values(log2).returning();
    return created;
  }
  // Stock Items - Code/Barcode lookup
  async getStockItemByBarcode(barcode) {
    const [item] = await db.select().from(stockItems).where(eq(stockItems.code, barcode));
    return item;
  }
  // Stock Item Location Prices
  async getStockItemLocationPrices(stockItemId, companyId) {
    const conditions = [eq(stockItemLocationPrices.stockItemId, stockItemId)];
    if (companyId) {
      conditions.push(eq(locations.companyId, companyId));
    }
    return await db.select({
      id: stockItemLocationPrices.id,
      stockItemId: stockItemLocationPrices.stockItemId,
      locationId: stockItemLocationPrices.locationId,
      sellingPrice: stockItemLocationPrices.sellingPrice,
      createdAt: stockItemLocationPrices.createdAt,
      updatedAt: stockItemLocationPrices.updatedAt,
      locationName: locations.name
    }).from(stockItemLocationPrices).leftJoin(locations, eq(stockItemLocationPrices.locationId, locations.id)).where(and(...conditions));
  }
  async upsertLocationPrice(stockItemId, locationId, sellingPrice) {
    await db.insert(stockItemLocationPrices).values({
      stockItemId,
      locationId,
      sellingPrice
    }).onConflictDoUpdate({
      target: [stockItemLocationPrices.stockItemId, stockItemLocationPrices.locationId],
      set: {
        sellingPrice,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  async deleteLocationPrice(id) {
    await db.delete(stockItemLocationPrices).where(eq(stockItemLocationPrices.id, id));
  }
  // Inventory - Location-based stock tracking
  async getLocationInventory(locationId) {
    const results = await db.select({
      inventoryId: inventory.id,
      locationId: inventory.locationId,
      stockItemId: inventory.stockItemId,
      quantity: inventory.quantity,
      averageRate: inventory.averageRate,
      totalValue: inventory.totalValue,
      lastUpdated: inventory.lastUpdated,
      stockItemCode: stockItems.code,
      stockItemName: stockItems.name,
      stockItemUom: stockItems.uom,
      stockGroupId: stockItems.stockGroupId,
      stockGroupName: sql2`COALESCE(${stockGroups.name}, '')`,
      stockGroupCode: sql2`COALESCE(${stockGroups.code}, '')`,
      lastSellingPrice: sql2`COALESCE(${stockItemLocationPrices.sellingPrice}, ${stockItems.sellingPrice})`.as("configured_price")
    }).from(inventory).leftJoin(stockItems, eq(inventory.stockItemId, stockItems.id)).leftJoin(stockGroups, eq(stockItems.stockGroupId, stockGroups.id)).leftJoin(
      stockItemLocationPrices,
      and(
        eq(stockItemLocationPrices.stockItemId, inventory.stockItemId),
        eq(stockItemLocationPrices.locationId, locationId)
      )
    ).where(eq(inventory.locationId, locationId));
    return results;
  }
  async getCompanyInventory(companyId) {
    const results = await db.select({
      inventoryId: inventory.id,
      locationId: inventory.locationId,
      locationName: locations.name,
      locationCode: locations.code,
      stockItemId: inventory.stockItemId,
      quantity: inventory.quantity,
      averageRate: inventory.averageRate,
      totalValue: inventory.totalValue,
      lastUpdated: inventory.lastUpdated,
      stockItemCode: stockItems.code,
      stockItemName: stockItems.name,
      stockItemUom: stockItems.uom,
      stockGroupId: stockItems.stockGroupId,
      stockGroupName: sql2`COALESCE(${stockGroups.name}, '')`,
      stockGroupCode: sql2`COALESCE(${stockGroups.code}, '')`
    }).from(inventory).leftJoin(stockItems, eq(inventory.stockItemId, stockItems.id)).leftJoin(stockGroups, eq(stockItems.stockGroupId, stockGroups.id)).leftJoin(locations, eq(inventory.locationId, locations.id)).where(eq(inventory.companyId, companyId));
    return results;
  }
  async updateInventory(locationId, stockItemId, quantity, averageRate, totalValue) {
    const [location] = await db.select().from(locations).where(eq(locations.id, locationId));
    if (!location) {
      throw new Error("Location not found");
    }
    const [existing] = await db.select().from(inventory).where(and(
      eq(inventory.locationId, locationId),
      eq(inventory.stockItemId, stockItemId)
    ));
    if (existing) {
      await db.update(inventory).set({
        quantity,
        averageRate,
        totalValue,
        lastUpdated: /* @__PURE__ */ new Date()
      }).where(eq(inventory.id, existing.id));
    } else {
      await db.insert(inventory).values({
        companyId: location.companyId,
        locationId,
        stockItemId,
        quantity,
        averageRate,
        totalValue,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    }
  }
  async updateCostPricesByBarcode(locationId, companyId, updates) {
    const errors = [];
    let updated = 0;
    for (const update of updates) {
      try {
        const stockItem = await this.getStockItemByCodeOrAlias(update.barcode, companyId);
        if (!stockItem) {
          errors.push(`Barcode not found: ${update.barcode}`);
          continue;
        }
        const [inventory2] = await db.select().from(inventory).where(and(
          eq(inventory.locationId, locationId),
          eq(inventory.stockItemId, stockItem.id)
        ));
        if (inventory2) {
          const newTotalValue = (parseFloat(inventory2.quantity) * update.costPrice).toFixed(2);
          await db.update(inventory).set({
            averageRate: update.costPrice.toFixed(2),
            totalValue: newTotalValue,
            lastUpdated: /* @__PURE__ */ new Date()
          }).where(eq(inventory.id, inventory2.id));
          updated++;
        } else {
          errors.push(`Item not found in inventory for barcode: ${update.barcode}`);
        }
      } catch (err) {
        errors.push(`Error processing ${update.barcode}: ${err.message}`);
      }
    }
    return { updated, errors };
  }
  // Container Offload
  async offloadContainer(containerId, locationId, duties, dutiesAccountId, officeCharges, officeChargesAccountId, officeChargesCashAccountId, transferCharges, transportFees, transportAccountId, additionalCharges = [], offloadDate) {
    const pos = await this.getPurchaseOrdersByContainer(containerId);
    const allLineItems = [];
    for (const po of pos) {
      const items = await this.getLineItemsByPO(po.id);
      allLineItems.push(...items);
    }
    const totalBales = allLineItems.reduce((sum, item) => {
      if (!item.stockItemId || item.stockItemId === 0) {
        return sum;
      }
      return sum + parseFloat(item.quantity);
    }, 0);
    const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const totalCharges = parseFloat(duties) + parseFloat(officeCharges) + parseFloat(transferCharges) + parseFloat(transportFees) + additionalChargesTotal;
    const additionalCostPerBale = totalBales > 0 ? totalCharges / totalBales : 0;
    const itemsMap = /* @__PURE__ */ new Map();
    for (const item of allLineItems) {
      const stockItemId = item.stockItemId;
      if (!stockItemId || stockItemId === 0) {
        console.warn(`Skipping line item ${item.id} - invalid stock item ID: ${stockItemId}`);
        continue;
      }
      const quantity = parseFloat(item.quantity);
      const rate = parseFloat(item.rate);
      if (itemsMap.has(stockItemId)) {
        const existing = itemsMap.get(stockItemId);
        existing.totalQuantity += quantity;
        existing.weightedRateSum += rate * quantity;
      } else {
        itemsMap.set(stockItemId, {
          stockItemId,
          totalQuantity: quantity,
          weightedRateSum: rate * quantity
        });
      }
    }
    for (const [stockItemId, data] of Array.from(itemsMap.entries())) {
      if (data.totalQuantity === 0) {
        console.error("Skipping item with zero quantity:", stockItemId);
        continue;
      }
      const averageOriginalRate = data.weightedRateSum / data.totalQuantity;
      const newRate = averageOriginalRate + additionalCostPerBale;
      if (!isFinite(newRate)) {
        throw new Error(`Calculated rate is infinite for stock item ${stockItemId}. averageRate=${averageOriginalRate}, additionalCost=${additionalCostPerBale}`);
      }
      const [existing] = await db.select().from(inventory).where(and(
        eq(inventory.locationId, locationId),
        eq(inventory.stockItemId, stockItemId)
      ));
      if (existing) {
        const existingQty = parseFloat(existing.quantity);
        const existingRate = parseFloat(existing.averageRate);
        if (existingQty < 0) {
          console.warn(`Detected corrupt negative inventory for stock item ${stockItemId} at location ${locationId}. Existing qty: ${existingQty}. Replacing with new qty: ${data.totalQuantity}`);
          const newTotalValue2 = data.totalQuantity * newRate;
          await db.update(inventory).set({
            quantity: data.totalQuantity.toString(),
            averageRate: newRate.toFixed(2),
            totalValue: newTotalValue2.toFixed(2),
            lastUpdated: /* @__PURE__ */ new Date()
          }).where(eq(inventory.id, existing.id));
          continue;
        }
        const newQty = existingQty + data.totalQuantity;
        if (newQty <= 0) {
          throw new Error(`New quantity is ${newQty} for stock item ${stockItemId}. Existing: ${existingQty}, Adding: ${data.totalQuantity}. This indicates corrupt inventory data.`);
        }
        const weightedAvgRate = (existingQty * existingRate + data.totalQuantity * newRate) / newQty;
        if (!isFinite(weightedAvgRate)) {
          throw new Error(`Calculated weighted average rate is infinite for stock item ${stockItemId}. existingQty=${existingQty}, existingRate=${existingRate}, newQty=${newQty}, newRate=${newRate}`);
        }
        const newTotalValue = newQty * weightedAvgRate;
        await db.update(inventory).set({
          quantity: newQty.toString(),
          averageRate: weightedAvgRate.toFixed(2),
          totalValue: newTotalValue.toFixed(2),
          lastUpdated: /* @__PURE__ */ new Date()
        }).where(eq(inventory.id, existing.id));
      } else {
        const [location2] = await db.select().from(locations).where(eq(locations.id, locationId));
        const totalValue = data.totalQuantity * newRate;
        await db.insert(inventory).values({
          companyId: location2.companyId,
          locationId,
          stockItemId,
          quantity: data.totalQuantity.toString(),
          averageRate: newRate.toFixed(2),
          totalValue: totalValue.toFixed(2),
          lastUpdated: /* @__PURE__ */ new Date()
        });
      }
    }
    await this.updateContainer(containerId, { status: "OFFLOADED" });
    const container = await this.getContainerById(containerId);
    const location = await this.getLocationById(locationId);
    if (!container || !location) {
      throw new Error("Container or location not found");
    }
    const voucherDate = offloadDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const findOrCreateExpenseAccount = async (code, name) => {
      let account = await db.select().from(ledgerAccounts).where(
        and(
          eq(ledgerAccounts.companyId, location.companyId),
          eq(ledgerAccounts.code, code)
        )
      ).limit(1);
      if (!account.length) {
        const [newAccount] = await db.insert(ledgerAccounts).values({
          companyId: location.companyId,
          code,
          name,
          accountType: "Expense",
          subType: "Direct Expense",
          openingBalance: "0",
          openingBalanceSide: "Dr"
        }).returning();
        account = [newAccount];
      }
      return account[0].id;
    };
    if (dutiesAccountId && parseFloat(duties) > 0) {
      const dutiesExpenseAccountId = await findOrCreateExpenseAccount("DUTIES", "Duties");
      const voucherNumber = `DUTY-${container.containerNumber}-${Date.now()}`;
      const [voucher] = await db.insert(vouchers).values({
        companyId: location.companyId,
        voucherNumber,
        voucherType: "Payment",
        voucherDate,
        description: `Duties for container ${container.containerNumber}`,
        totalAmount: duties
      }).returning();
      await db.insert(voucherEntries).values({
        voucherId: voucher.id,
        ledgerAccountId: dutiesExpenseAccountId,
        debitAmount: duties,
        creditAmount: "0",
        narration: `Duties for container ${container.containerNumber}`
      });
      await db.insert(voucherEntries).values({
        voucherId: voucher.id,
        ledgerAccountId: dutiesAccountId,
        debitAmount: "0",
        creditAmount: duties,
        narration: `Duties for container ${container.containerNumber}`
      });
    }
    if (officeChargesAccountId && officeChargesCashAccountId && parseFloat(officeCharges) > 0) {
      const officeExpenseAccountId = await findOrCreateExpenseAccount("OFFICE_CHARGES", "Office Charges");
      const voucherNumber = `OFFICE-${container.containerNumber}-${Date.now()}`;
      const [voucher] = await db.insert(vouchers).values({
        companyId: location.companyId,
        voucherNumber,
        voucherType: "Payment",
        voucherDate,
        description: `Office charges for container ${container.containerNumber}`,
        totalAmount: officeCharges
      }).returning();
      await db.insert(voucherEntries).values({
        voucherId: voucher.id,
        ledgerAccountId: officeExpenseAccountId,
        debitAmount: officeCharges,
        creditAmount: "0",
        narration: `Office charges for container ${container.containerNumber}`
      });
      await db.insert(voucherEntries).values({
        voucherId: voucher.id,
        ledgerAccountId: officeChargesCashAccountId,
        debitAmount: "0",
        creditAmount: officeCharges,
        narration: `Office charges for container ${container.containerNumber}`
      });
    }
    if (transportAccountId && parseFloat(transportFees) > 0) {
      const transportExpenseAccountId = await findOrCreateExpenseAccount("TRANSPORT", "Transport Charges");
      const voucherNumber = `TRANS-${container.containerNumber}-${Date.now()}`;
      const [voucher] = await db.insert(vouchers).values({
        companyId: location.companyId,
        voucherNumber,
        voucherType: "Payment",
        voucherDate,
        description: `Transport fees for container ${container.containerNumber}`,
        totalAmount: transportFees
      }).returning();
      await db.insert(voucherEntries).values({
        voucherId: voucher.id,
        ledgerAccountId: transportExpenseAccountId,
        debitAmount: transportFees,
        creditAmount: "0",
        narration: `Transport fees for container ${container.containerNumber}`
      });
      await db.insert(voucherEntries).values({
        voucherId: voucher.id,
        ledgerAccountId: transportAccountId,
        debitAmount: "0",
        creditAmount: transportFees,
        narration: `Transport fees for container ${container.containerNumber}`
      });
    }
    if (parseFloat(transferCharges) > 0) {
      const transferExpenseAccountId = await findOrCreateExpenseAccount("TRANSFER_CHARGES", "Transfer Charges");
    }
    for (const charge of additionalCharges) {
      if (charge.amount > 0) {
        const voucherNumber = `CHG-${container.containerNumber}-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: location.companyId,
          voucherNumber,
          voucherType: "Payment",
          voucherDate,
          description: `${charge.description} for container ${container.containerNumber}`,
          totalAmount: charge.amount.toFixed(2)
        }).returning();
        const additionalExpenseAccountId = await findOrCreateExpenseAccount(
          "ADDITIONAL_CHARGES",
          "Additional Container Charges"
        );
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: additionalExpenseAccountId,
          debitAmount: charge.amount.toFixed(2),
          creditAmount: "0",
          narration: `${charge.description} for container ${container.containerNumber}`
        });
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: charge.ledgerAccountId,
          debitAmount: "0",
          creditAmount: charge.amount.toFixed(2),
          narration: `${charge.description} for container ${container.containerNumber}`
        });
      }
    }
    const [offload] = await db.insert(containerOffloads).values({
      containerId,
      locationId,
      duties,
      officeCharges,
      transferCharges,
      transportFees,
      totalCharges: totalCharges.toFixed(2),
      totalBales: totalBales.toFixed(3),
      additionalCostPerBale: additionalCostPerBale.toFixed(2),
      offloadedAt: offloadDate ? new Date(offloadDate) : /* @__PURE__ */ new Date()
    }).returning();
    return offload;
  }
  // Vouchers and Journal Entries
  async getAllVouchers(companyId) {
    return await db.select().from(vouchers).where(eq(vouchers.companyId, companyId));
  }
  async getVoucherById(id) {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.id, id));
    return voucher;
  }
  async getVouchersByDateRange(startDate, endDate) {
    const vouchers2 = await db.select().from(vouchers).where(
      and(
        sql2`${vouchers.voucherDate} >= ${startDate}`,
        sql2`${vouchers.voucherDate} <= ${endDate}`
      )
    );
    return vouchers2;
  }
  async getVoucherEntriesByLedger(ledgerAccountId, startDate, endDate) {
    const conditions = [
      eq(voucherEntries.ledgerAccountId, ledgerAccountId),
      eq(vouchers.optional, false)
    ];
    if (startDate) {
      conditions.push(sql2`${vouchers.voucherDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql2`${vouchers.voucherDate} <= ${endDate}`);
    }
    const query = db.select({
      entryId: voucherEntries.id,
      voucherId: voucherEntries.voucherId,
      debitAmount: voucherEntries.debitAmount,
      creditAmount: voucherEntries.creditAmount,
      narration: voucherEntries.narration,
      voucherNumber: vouchers.voucherNumber,
      voucherType: vouchers.voucherType,
      voucherDate: vouchers.voucherDate,
      voucherDescription: vouchers.description
    }).from(voucherEntries).leftJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id)).where(and(...conditions));
    return await query;
  }
  async getVoucherEntriesByBankAccount(bankAccountId, startDate, endDate) {
    const conditions = [
      eq(voucherEntries.bankAccountId, bankAccountId),
      eq(vouchers.optional, false)
    ];
    if (startDate) {
      conditions.push(sql2`${vouchers.voucherDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql2`${vouchers.voucherDate} <= ${endDate}`);
    }
    const query = db.select({
      entryId: voucherEntries.id,
      voucherId: voucherEntries.voucherId,
      debitAmount: voucherEntries.debitAmount,
      creditAmount: voucherEntries.creditAmount,
      narration: voucherEntries.narration,
      voucherNumber: vouchers.voucherNumber,
      voucherType: vouchers.voucherType,
      voucherDate: vouchers.voucherDate,
      voucherDescription: vouchers.description
    }).from(voucherEntries).leftJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id)).where(and(...conditions));
    return await query;
  }
  async getVoucherEntriesByFixedAsset(fixedAssetId, startDate, endDate) {
    const conditions = [
      eq(voucherEntries.fixedAssetId, fixedAssetId),
      eq(vouchers.optional, false)
    ];
    if (startDate) {
      conditions.push(sql2`${vouchers.voucherDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql2`${vouchers.voucherDate} <= ${endDate}`);
    }
    const query = db.select({
      entryId: voucherEntries.id,
      voucherId: voucherEntries.voucherId,
      debitAmount: voucherEntries.debitAmount,
      creditAmount: voucherEntries.creditAmount,
      narration: voucherEntries.narration,
      voucherNumber: vouchers.voucherNumber,
      voucherType: vouchers.voucherType,
      voucherDate: vouchers.voucherDate,
      voucherDescription: vouchers.description
    }).from(voucherEntries).leftJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id)).where(and(...conditions));
    return await query;
  }
  async getVoucherEntriesBySupplier(supplierId, companyId, startDate, endDate) {
    const conditions = [
      eq(voucherEntries.supplierId, supplierId),
      eq(vouchers.optional, false)
    ];
    if (companyId) {
      conditions.push(eq(vouchers.companyId, companyId));
    }
    if (startDate) {
      conditions.push(sql2`${vouchers.voucherDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql2`${vouchers.voucherDate} <= ${endDate}`);
    }
    const query = db.select({
      entryId: voucherEntries.id,
      voucherId: voucherEntries.voucherId,
      debitAmount: voucherEntries.debitAmount,
      creditAmount: voucherEntries.creditAmount,
      narration: voucherEntries.narration,
      voucherNumber: vouchers.voucherNumber,
      voucherType: vouchers.voucherType,
      voucherDate: vouchers.voucherDate,
      voucherDescription: vouchers.description,
      companyId: vouchers.companyId
    }).from(voucherEntries).leftJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id)).where(and(...conditions)).orderBy(sql2`${vouchers.voucherDate} DESC`);
    return await query;
  }
  async getVoucherEntriesByEmployee(employeeId, companyId, startDate, endDate) {
    const conditions = [
      eq(voucherEntries.employeeId, employeeId),
      eq(vouchers.optional, false)
    ];
    if (companyId) {
      conditions.push(eq(vouchers.companyId, companyId));
    }
    if (startDate) {
      conditions.push(sql2`${vouchers.voucherDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql2`${vouchers.voucherDate} <= ${endDate}`);
    }
    const query = db.select({
      entryId: voucherEntries.id,
      voucherId: voucherEntries.voucherId,
      debitAmount: voucherEntries.debitAmount,
      creditAmount: voucherEntries.creditAmount,
      narration: voucherEntries.narration,
      voucherNumber: vouchers.voucherNumber,
      voucherType: vouchers.voucherType,
      voucherDate: vouchers.voucherDate,
      voucherDescription: vouchers.description,
      companyId: vouchers.companyId
    }).from(voucherEntries).leftJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id)).where(and(...conditions)).orderBy(sql2`${vouchers.voucherDate} DESC`);
    return await query;
  }
  async getContainerCountBySupplier(supplierId, companyId) {
    const conditions = [
      eq(containers.supplierId, supplierId),
      // Only count containers that are not yet offloaded or sold
      sql2`${containers.status} NOT IN ('OFFLOADED', 'SOLD')`
    ];
    if (companyId !== void 0) {
      conditions.push(eq(containers.companyId, companyId));
    }
    const result = await db.select({ count: sql2`count(*)` }).from(containers).where(and(...conditions));
    return result[0]?.count || 0;
  }
  async createVoucher(voucher) {
    const [created] = await db.insert(vouchers).values(voucher).returning();
    return created;
  }
  async updateVoucher(id, updates) {
    const [updated] = await db.update(vouchers).set(updates).where(eq(vouchers.id, id)).returning();
    return updated;
  }
  async getVoucherEntriesByVoucher(voucherId) {
    const entries = await db.select({
      id: voucherEntries.id,
      voucherId: voucherEntries.voucherId,
      ledgerAccountId: voucherEntries.ledgerAccountId,
      bankAccountId: voucherEntries.bankAccountId,
      fixedAssetId: voucherEntries.fixedAssetId,
      supplierId: voucherEntries.supplierId,
      employeeId: voucherEntries.employeeId,
      debitAmount: voucherEntries.debitAmount,
      creditAmount: voucherEntries.creditAmount,
      narration: voucherEntries.narration,
      createdAt: voucherEntries.createdAt,
      accountName: ledgerAccounts.name,
      accountCode: ledgerAccounts.code,
      bankAccountName: bankAccounts.name,
      bankAccountCode: bankAccounts.code,
      fixedAssetName: fixedAssets.name,
      fixedAssetCode: fixedAssets.code,
      supplierName: suppliers.legalName,
      supplierCode: suppliers.code,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      employeeCode: employees.code
    }).from(voucherEntries).leftJoin(ledgerAccounts, eq(voucherEntries.ledgerAccountId, ledgerAccounts.id)).leftJoin(bankAccounts, eq(voucherEntries.bankAccountId, bankAccounts.id)).leftJoin(fixedAssets, eq(voucherEntries.fixedAssetId, fixedAssets.id)).leftJoin(suppliers, eq(voucherEntries.supplierId, suppliers.id)).leftJoin(employees, eq(voucherEntries.employeeId, employees.id)).where(eq(voucherEntries.voucherId, voucherId));
    return entries.map((entry) => {
      const employeeName = entry.employeeFirstName && entry.employeeLastName ? `${entry.employeeFirstName} ${entry.employeeLastName}` : null;
      return {
        ...entry,
        accountName: entry.accountName || entry.bankAccountName || entry.fixedAssetName || entry.supplierName || employeeName || "Unknown Account",
        accountCode: entry.accountCode || entry.bankAccountCode || entry.fixedAssetCode || entry.supplierCode || entry.employeeCode || "-"
      };
    });
  }
  async getStockItemTransactions(stockItemId, companyId, startDate, endDate) {
    const conditions = [eq(vouchers.companyId, companyId), eq(vouchers.optional, false)];
    if (startDate) {
      conditions.push(sql2`${vouchers.voucherDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql2`${vouchers.voucherDate} <= ${endDate}`);
    }
    const salesItems2 = await db.select({
      id: salesItems.id,
      type: sql2`'sales'`.as("type"),
      voucherId: salesItems.voucherId,
      voucherNumber: vouchers.voucherNumber,
      voucherDate: vouchers.voucherDate,
      quantity: salesItems.quantity,
      rate: salesItems.sellingPrice,
      totalAmount: salesItems.totalSales,
      stockItemId: salesItems.stockItemId,
      notes: vouchers.description
    }).from(salesItems).leftJoin(vouchers, eq(salesItems.voucherId, vouchers.id)).where(and(eq(salesItems.stockItemId, stockItemId), ...conditions));
    const transferItems = await db.select({
      id: stockTransferItems.id,
      type: sql2`'transfer'`.as("type"),
      voucherId: stockTransferVouchers.voucherId,
      voucherNumber: vouchers.voucherNumber,
      voucherDate: vouchers.voucherDate,
      quantity: stockTransferItems.quantity,
      rate: stockTransferItems.rate,
      totalAmount: stockTransferItems.totalAmount,
      stockItemId: stockTransferItems.stockItemId,
      notes: stockTransferVouchers.notes
    }).from(stockTransferItems).leftJoin(stockTransferVouchers, eq(stockTransferItems.transferId, stockTransferVouchers.id)).leftJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id)).where(and(eq(stockTransferItems.stockItemId, stockItemId), ...conditions));
    const adjustmentItems = await db.select({
      id: stockAdjustmentItems.id,
      type: sql2`'adjustment'`.as("type"),
      voucherId: stockAdjustmentVouchers.voucherId,
      voucherNumber: vouchers.voucherNumber,
      voucherDate: vouchers.voucherDate,
      quantity: stockAdjustmentItems.quantity,
      rate: stockAdjustmentItems.rate,
      totalAmount: stockAdjustmentItems.totalAmount,
      stockItemId: stockAdjustmentItems.stockItemId,
      notes: stockAdjustmentVouchers.notes
    }).from(stockAdjustmentItems).leftJoin(stockAdjustmentVouchers, eq(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id)).leftJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id)).where(and(eq(stockAdjustmentItems.stockItemId, stockItemId), ...conditions));
    const allTransactions = [...salesItems2, ...transferItems, ...adjustmentItems].sort((a, b) => {
      if (!a.voucherDate || !b.voucherDate) return 0;
      return new Date(b.voucherDate).getTime() - new Date(a.voucherDate).getTime();
    });
    return allTransactions;
  }
  async createVoucherEntry(entry) {
    const [created] = await db.insert(voucherEntries).values(entry).returning();
    return created;
  }
  async updateVoucherEntry(id, updates) {
    const [updated] = await db.update(voucherEntries).set(updates).where(eq(voucherEntries.id, id)).returning();
    return updated;
  }
  async updateStockTransferItem(id, updates) {
    const [currentItem] = await db.select().from(stockTransferItems).where(eq(stockTransferItems.id, id));
    if (!currentItem) {
      throw new Error("Stock transfer item not found");
    }
    const updateData = {};
    if (updates.stockItemId !== void 0) updateData.stockItemId = updates.stockItemId;
    if (updates.quantity !== void 0) updateData.quantity = updates.quantity;
    if (updates.rate !== void 0) updateData.rate = updates.rate;
    const finalQuantity = updates.quantity !== void 0 ? updates.quantity : currentItem.quantity;
    const finalRate = updates.rate !== void 0 ? updates.rate : currentItem.rate;
    const qty = parseFloat(finalQuantity);
    const rate = parseFloat(finalRate);
    updateData.totalAmount = (qty * rate).toFixed(2);
    const [updated] = await db.update(stockTransferItems).set(updateData).where(eq(stockTransferItems.id, id)).returning();
    return updated;
  }
  async updateStockAdjustmentItem(id, updates) {
    const [currentItem] = await db.select().from(stockAdjustmentItems).where(eq(stockAdjustmentItems.id, id));
    if (!currentItem) {
      throw new Error("Stock adjustment item not found");
    }
    const updateData = {};
    if (updates.stockItemId !== void 0) updateData.stockItemId = updates.stockItemId;
    if (updates.quantity !== void 0) updateData.quantity = updates.quantity;
    if (updates.rate !== void 0) updateData.rate = updates.rate;
    const finalQuantity = updates.quantity !== void 0 ? updates.quantity : currentItem.quantity;
    const finalRate = updates.rate !== void 0 ? updates.rate : currentItem.rate;
    const qty = parseFloat(finalQuantity);
    const rate = parseFloat(finalRate);
    updateData.totalAmount = (qty * rate).toFixed(2);
    const [updated] = await db.update(stockAdjustmentItems).set(updateData).where(eq(stockAdjustmentItems.id, id)).returning();
    return updated;
  }
  async deleteVoucherEntry(id) {
    await db.delete(voucherEntries).where(eq(voucherEntries.id, id));
  }
  async deleteVoucher(id) {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.id, id));
    if (!voucher) {
      throw new Error("Voucher not found");
    }
    if (voucher.voucherType === "Sales" && voucher.locationId) {
      const salesItemsList = await db.select().from(salesItems).where(eq(salesItems.voucherId, id));
      for (const saleItem of salesItemsList) {
        const quantity = parseFloat(saleItem.quantity);
        const costPrice = parseFloat(saleItem.costPrice);
        const [currentInventory] = await db.select().from(inventory).where(and(
          eq(inventory.locationId, voucher.locationId),
          eq(inventory.stockItemId, saleItem.stockItemId)
        ));
        if (currentInventory) {
          const newQuantity = parseFloat(currentInventory.quantity) + quantity;
          const currentTotalValue = parseFloat(currentInventory.totalValue);
          const newTotalValue = currentTotalValue + quantity * costPrice;
          const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
          await db.update(inventory).set({
            quantity: newQuantity.toFixed(3),
            averageRate: newAverageRate.toFixed(2),
            totalValue: newTotalValue.toFixed(2)
          }).where(eq(inventory.id, currentInventory.id));
        } else {
          await db.insert(inventory).values({
            companyId: voucher.companyId,
            locationId: voucher.locationId,
            stockItemId: saleItem.stockItemId,
            quantity: quantity.toFixed(3),
            averageRate: costPrice.toFixed(2),
            totalValue: (quantity * costPrice).toFixed(2)
          });
        }
      }
      await db.delete(salesItems).where(eq(salesItems.voucherId, id));
    }
    if (voucher.voucherType === "Stock Transfer") {
      const [transferVoucher] = await db.select().from(stockTransferVouchers).where(eq(stockTransferVouchers.voucherId, id));
      if (transferVoucher) {
        const transferItems = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, transferVoucher.id));
        for (const item of transferItems) {
          const quantity = parseFloat(item.quantity);
          const rate = parseFloat(item.rate);
          const sourceLocationId = transferVoucher.sourceLocationId;
          const destinationLocationId = transferVoucher.destinationLocationId;
          const [sourceInventory] = await db.select().from(inventory).where(and(
            eq(inventory.locationId, sourceLocationId),
            eq(inventory.stockItemId, item.stockItemId)
          ));
          if (sourceInventory) {
            const newQuantity = parseFloat(sourceInventory.quantity) + quantity;
            const newTotalValue = parseFloat(sourceInventory.totalValue) + quantity * rate;
            const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
            await db.update(inventory).set({
              quantity: newQuantity.toFixed(3),
              averageRate: newAverageRate.toFixed(2),
              totalValue: newTotalValue.toFixed(2)
            }).where(eq(inventory.id, sourceInventory.id));
          } else {
            await db.insert(inventory).values({
              companyId: voucher.companyId,
              locationId: sourceLocationId,
              stockItemId: item.stockItemId,
              quantity: quantity.toFixed(3),
              averageRate: rate.toFixed(2),
              totalValue: (quantity * rate).toFixed(2)
            });
          }
          const [destInventory] = await db.select().from(inventory).where(and(
            eq(inventory.locationId, destinationLocationId),
            eq(inventory.stockItemId, item.stockItemId)
          ));
          if (destInventory) {
            const newQuantity = Math.max(0, parseFloat(destInventory.quantity) - quantity);
            const newTotalValue = Math.max(0, parseFloat(destInventory.totalValue) - quantity * rate);
            const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
            await db.update(inventory).set({
              quantity: newQuantity.toFixed(3),
              averageRate: newAverageRate.toFixed(2),
              totalValue: newTotalValue.toFixed(2)
            }).where(eq(inventory.id, destInventory.id));
          }
        }
        await db.delete(stockTransferItems).where(eq(stockTransferItems.transferId, transferVoucher.id));
        await db.delete(stockTransferVouchers).where(eq(stockTransferVouchers.id, transferVoucher.id));
      }
    }
    if (voucher.voucherType === "Production" || voucher.voucherType === "Consumption") {
      const [adjustmentVoucher] = await db.select().from(stockAdjustmentVouchers).where(eq(stockAdjustmentVouchers.voucherId, id));
      if (adjustmentVoucher) {
        const adjustmentItems = await db.select().from(stockAdjustmentItems).where(eq(stockAdjustmentItems.adjustmentId, adjustmentVoucher.id));
        for (const item of adjustmentItems) {
          const quantity = parseFloat(item.quantity);
          const rate = parseFloat(item.rate);
          const reversedQuantity = -quantity;
          const [currentInventory] = await db.select().from(inventory).where(and(
            eq(inventory.locationId, adjustmentVoucher.locationId),
            eq(inventory.stockItemId, item.stockItemId)
          ));
          if (currentInventory) {
            const newQuantity = Math.max(0, parseFloat(currentInventory.quantity) + reversedQuantity);
            const currentTotalValue = parseFloat(currentInventory.totalValue);
            const newTotalValue = Math.max(0, currentTotalValue + reversedQuantity * rate);
            const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
            await db.update(inventory).set({
              quantity: newQuantity.toFixed(3),
              averageRate: newAverageRate.toFixed(2),
              totalValue: newTotalValue.toFixed(2)
            }).where(eq(inventory.id, currentInventory.id));
          }
        }
        await db.delete(stockAdjustmentItems).where(eq(stockAdjustmentItems.adjustmentId, adjustmentVoucher.id));
        await db.delete(stockAdjustmentVouchers).where(eq(stockAdjustmentVouchers.id, adjustmentVoucher.id));
      }
    }
    const linkedPOs = await db.select().from(purchaseOrders).where(eq(purchaseOrders.voucherId, id));
    if (linkedPOs.length > 0) {
      const containerUpdates = /* @__PURE__ */ new Map();
      for (const po of linkedPOs) {
        const itemsTotal = parseFloat(po.itemsTotal || "0");
        const container = await db.select().from(containers).where(eq(containers.id, po.containerId)).limit(1);
        const containerNumber = container.length > 0 ? container[0].containerNumber : "";
        const existing = containerUpdates.get(po.containerId) || { itemsTotal: 0, containerNumber };
        containerUpdates.set(po.containerId, {
          itemsTotal: existing.itemsTotal + itemsTotal,
          containerNumber
        });
        await db.delete(poLineItems).where(eq(poLineItems.poId, po.id));
      }
      await db.delete(purchaseOrders).where(eq(purchaseOrders.voucherId, id));
      for (const [containerId, totals] of Array.from(containerUpdates.entries())) {
        const [container] = await db.select().from(containers).where(eq(containers.id, containerId)).limit(1);
        if (container) {
          const chargeVouchers = await db.select({ id: vouchers.id }).from(vouchers).where(sql2`${vouchers.voucherNumber} LIKE ${"CHARGE-" + container.containerNumber + "-%"}`);
          for (const chargeVoucher of chargeVouchers) {
            await db.delete(voucherEntries).where(eq(voucherEntries.voucherId, chargeVoucher.id));
            await db.delete(vouchers).where(eq(vouchers.id, chargeVoucher.id));
          }
          const newItemsTotal = Math.max(0, parseFloat(container.itemsTotal || "0") - totals.itemsTotal);
          const newChargesTotal = 0;
          const newGrandTotal = newItemsTotal + newChargesTotal;
          const remainingPOs = await db.select().from(purchaseOrders).where(eq(purchaseOrders.containerId, containerId)).limit(1);
          if (remainingPOs.length === 0) {
            await db.delete(containerCharges).where(eq(containerCharges.containerId, containerId));
            await db.delete(containers).where(eq(containers.id, containerId));
          } else {
            await db.update(containers).set({
              itemsTotal: newItemsTotal.toString(),
              chargesTotal: newChargesTotal.toString(),
              grandTotal: newGrandTotal.toString()
            }).where(eq(containers.id, containerId));
          }
        }
      }
    }
    await db.delete(voucherEntries).where(eq(voucherEntries.voucherId, id));
    await db.delete(vouchers).where(eq(vouchers.id, id));
  }
  // Fiscal Period Closing
  async closeFiscalPeriod(companyId, periodStartDate, periodEndDate, retainedEarningsAccountId, closedByUserId, notes) {
    return await db.transaction(async (tx) => {
      const existingClosure = await tx.select().from(fiscalPeriodClosures).where(
        and(
          eq(fiscalPeriodClosures.companyId, companyId),
          eq(fiscalPeriodClosures.periodEndDate, periodEndDate)
        )
      );
      if (existingClosure.length > 0) {
        throw new Error(`Fiscal period ending ${periodEndDate} has already been closed`);
      }
      const accounts = await tx.select().from(ledgerAccounts).where(
        and(
          eq(ledgerAccounts.companyId, companyId),
          or(
            eq(ledgerAccounts.accountType, "Income"),
            eq(ledgerAccounts.accountType, "Expense")
          )
        )
      );
      if (accounts.length === 0) {
        throw new Error("No Income or Expense accounts found for this company");
      }
      const accountBalances = [];
      let totalIncome = 0;
      let totalExpense = 0;
      for (const account of accounts) {
        const openingBalance = parseFloat(account.openingBalance || "0");
        const openingSide = account.openingBalanceSide || "Dr";
        let balance = openingSide === "Dr" ? openingBalance : -openingBalance;
        const entries = await tx.select().from(voucherEntries).innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id)).where(
          and(
            eq(voucherEntries.ledgerAccountId, account.id),
            sql2`${vouchers.voucherDate} >= ${periodStartDate}`,
            sql2`${vouchers.voucherDate} <= ${periodEndDate}`,
            eq(vouchers.companyId, companyId),
            eq(vouchers.optional, false)
          )
        );
        for (const entry of entries) {
          const debit = parseFloat(entry.voucher_entries.debitAmount || "0");
          const credit = parseFloat(entry.voucher_entries.creditAmount || "0");
          balance += debit - credit;
        }
        if (account.accountType === "Income") {
          totalIncome += -balance;
          accountBalances.push({
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            accountType: account.accountType,
            balance: -balance
            // Store as positive for income
          });
        } else {
          totalExpense += balance;
          accountBalances.push({
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            accountType: account.accountType,
            balance
          });
        }
      }
      const netIncome = totalIncome - totalExpense;
      const voucherNumber = `FISCAL-CLOSE-${periodEndDate}-${Date.now()}`;
      const [closingVoucher] = await tx.insert(vouchers).values({
        companyId,
        voucherNumber,
        voucherType: "Journal",
        voucherDate: periodEndDate,
        description: `Fiscal Period Close: ${periodStartDate} to ${periodEndDate}${notes ? ` - ${notes}` : ""}`,
        totalAmount: Math.abs(netIncome).toFixed(2),
        optional: false
      }).returning();
      for (const account of accountBalances) {
        if (account.balance === 0) continue;
        if (account.accountType === "Income") {
          await tx.insert(voucherEntries).values({
            voucherId: closingVoucher.id,
            ledgerAccountId: account.accountId,
            debitAmount: account.balance.toFixed(2),
            creditAmount: "0",
            narration: `Close ${account.accountName} for period ending ${periodEndDate}`
          });
        } else {
          await tx.insert(voucherEntries).values({
            voucherId: closingVoucher.id,
            ledgerAccountId: account.accountId,
            debitAmount: "0",
            creditAmount: account.balance.toFixed(2),
            narration: `Close ${account.accountName} for period ending ${periodEndDate}`
          });
        }
      }
      if (netIncome !== 0) {
        if (netIncome > 0) {
          await tx.insert(voucherEntries).values({
            voucherId: closingVoucher.id,
            ledgerAccountId: retainedEarningsAccountId,
            debitAmount: "0",
            creditAmount: netIncome.toFixed(2),
            narration: `Net Income for period ending ${periodEndDate}`
          });
        } else {
          await tx.insert(voucherEntries).values({
            voucherId: closingVoucher.id,
            ledgerAccountId: retainedEarningsAccountId,
            debitAmount: Math.abs(netIncome).toFixed(2),
            creditAmount: "0",
            narration: `Net Loss for period ending ${periodEndDate}`
          });
        }
      }
      const [closure] = await tx.insert(fiscalPeriodClosures).values({
        companyId,
        periodStartDate,
        periodEndDate,
        closedByUserId,
        closingVoucherId: closingVoucher.id,
        retainedEarningsAccountId,
        totalIncome: totalIncome.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        netIncome: netIncome.toFixed(2),
        status: "CLOSED",
        notes: notes || null
      }).returning();
      for (const account of accountBalances) {
        await tx.update(ledgerAccounts).set({
          openingBalance: "0",
          openingBalanceSide: "Dr"
        }).where(eq(ledgerAccounts.id, account.accountId));
      }
      return closure;
    });
  }
  async getFiscalPeriodClosures(companyId) {
    return await db.select().from(fiscalPeriodClosures).where(eq(fiscalPeriodClosures.companyId, companyId)).orderBy(sql2`${fiscalPeriodClosures.periodEndDate} DESC`);
  }
  // Stock Transfers
  async createStockTransfer(voucherId, destinationLocationId, notes, items) {
    return await db.transaction(async (tx) => {
      const [voucher] = await tx.select().from(vouchers).where(eq(vouchers.id, voucherId));
      if (!voucher) {
        throw new Error(`Voucher ${voucherId} not found`);
      }
      const isOptional = voucher.optional;
      const [transfer] = await tx.insert(stockTransferVouchers).values({
        voucherId,
        sourceLocationId: items[0].sourceLocationId,
        // Store first item's source for legacy compatibility
        destinationLocationId,
        notes
      }).returning();
      const transferItems = [];
      for (const item of items) {
        const quantity = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const totalAmount = quantity * rate;
        const [transferItem] = await tx.insert(stockTransferItems).values({
          transferId: transfer.id,
          stockItemId: item.stockItemId,
          sourceLocationId: item.sourceLocationId,
          quantity: item.quantity,
          rate: item.rate,
          totalAmount: totalAmount.toFixed(2)
        }).returning();
        transferItems.push(transferItem);
        if (!isOptional) {
          const [sourceInventory] = await tx.select().from(inventory).where(and(
            eq(inventory.locationId, item.sourceLocationId),
            eq(inventory.stockItemId, item.stockItemId)
          ));
          if (sourceInventory) {
            const currentQty = parseFloat(sourceInventory.quantity);
            const currentValue = parseFloat(sourceInventory.totalValue);
            const currentRate = parseFloat(sourceInventory.averageRate);
            const newQty = currentQty - quantity;
            const newValue = newQty > 0 ? newQty * currentRate : 0;
            const [location] = await tx.select().from(locations).where(eq(locations.id, item.sourceLocationId));
            if (!location) {
              throw new Error(`Source location ${item.sourceLocationId} not found`);
            }
            await tx.update(inventory).set({
              quantity: newQty.toFixed(3),
              averageRate: currentRate.toFixed(2),
              totalValue: newValue.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(eq(inventory.id, sourceInventory.id));
          }
          const [destInventory] = await tx.select().from(inventory).where(and(
            eq(inventory.locationId, destinationLocationId),
            eq(inventory.stockItemId, item.stockItemId)
          ));
          if (destInventory) {
            const currentQty = parseFloat(destInventory.quantity);
            const currentValue = parseFloat(destInventory.totalValue);
            const newQty = currentQty + quantity;
            const newValue = currentValue + totalAmount;
            const newRate = newQty > 0 ? newValue / newQty : 0;
            await tx.update(inventory).set({
              quantity: newQty.toFixed(3),
              averageRate: newRate.toFixed(2),
              totalValue: newValue.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(eq(inventory.id, destInventory.id));
          } else {
            const [destLocation] = await tx.select().from(locations).where(eq(locations.id, destinationLocationId));
            if (!destLocation) {
              throw new Error(`Destination location ${destinationLocationId} not found`);
            }
            await tx.insert(inventory).values({
              companyId: destLocation.companyId,
              locationId: destinationLocationId,
              stockItemId: item.stockItemId,
              quantity: item.quantity,
              averageRate: item.rate,
              totalValue: totalAmount.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            });
          }
        }
      }
      return {
        transfer,
        items: transferItems
      };
    });
  }
  // Stock Adjustments
  async createStockAdjustment(voucherId, locationId, adjustmentType, notes, items) {
    return await db.transaction(async (tx) => {
      const [voucher] = await tx.select().from(vouchers).where(eq(vouchers.id, voucherId));
      if (!voucher) {
        throw new Error(`Voucher ${voucherId} not found`);
      }
      const isOptional = voucher.optional;
      const [adjustment] = await tx.insert(stockAdjustmentVouchers).values({
        voucherId,
        locationId,
        adjustmentType,
        notes
      }).returning();
      const [location] = await tx.select().from(locations).where(eq(locations.id, locationId));
      if (!location) {
        throw new Error(`Location ${locationId} not found`);
      }
      const adjustmentItems = [];
      for (const item of items) {
        const quantity = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const totalAmount = Math.abs(quantity) * rate;
        const [adjustmentItem] = await tx.insert(stockAdjustmentItems).values({
          adjustmentId: adjustment.id,
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          rate: item.rate,
          totalAmount: totalAmount.toFixed(2)
        }).returning();
        adjustmentItems.push(adjustmentItem);
        if (!isOptional) {
          const [currentInventory] = await tx.select().from(inventory).where(and(
            eq(inventory.locationId, locationId),
            eq(inventory.stockItemId, item.stockItemId)
          ));
          if (currentInventory) {
            const currentQty = parseFloat(currentInventory.quantity);
            const currentValue = parseFloat(currentInventory.totalValue);
            const currentRate = parseFloat(currentInventory.averageRate);
            let newQty;
            let newValue;
            let newRate;
            if (adjustmentType === "Production") {
              newQty = currentQty + quantity;
              newValue = currentValue + totalAmount;
              newRate = newQty > 0 ? newValue / newQty : 0;
            } else {
              newQty = currentQty - Math.abs(quantity);
              newValue = newQty > 0 ? newQty * currentRate : 0;
              newRate = currentRate;
            }
            await tx.update(inventory).set({
              quantity: newQty.toFixed(3),
              averageRate: newRate.toFixed(2),
              totalValue: newValue.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(eq(inventory.id, currentInventory.id));
          } else if (adjustmentType === "Production") {
            await tx.insert(inventory).values({
              companyId: location.companyId,
              locationId,
              stockItemId: item.stockItemId,
              quantity: item.quantity,
              averageRate: item.rate,
              totalValue: totalAmount.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            });
          }
        }
      }
      return {
        adjustment,
        items: adjustmentItems
      };
    });
  }
  async getStockTransferByVoucherId(voucherId) {
    const [transfer] = await db.select().from(stockTransferVouchers).where(eq(stockTransferVouchers.voucherId, voucherId));
    if (!transfer) {
      return null;
    }
    const items = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, transfer.id));
    return {
      ...transfer,
      items
    };
  }
  async getStockAdjustmentByVoucherId(voucherId) {
    const [adjustment] = await db.select().from(stockAdjustmentVouchers).where(eq(stockAdjustmentVouchers.voucherId, voucherId));
    if (!adjustment) {
      return null;
    }
    const items = await db.select().from(stockAdjustmentItems).where(eq(stockAdjustmentItems.adjustmentId, adjustment.id));
    return {
      ...adjustment,
      items
    };
  }
  async updateStockTransfer(id, destinationLocationId, notes, items) {
    console.log("[storage.updateStockTransfer] Starting update for transfer ID:", id);
    return await db.transaction(async (tx) => {
      const [existingTransfer] = await tx.select().from(stockTransferVouchers).where(eq(stockTransferVouchers.id, id));
      if (!existingTransfer) {
        throw new Error(`Stock transfer ${id} not found`);
      }
      const [voucher] = await tx.select().from(vouchers).where(eq(vouchers.id, existingTransfer.voucherId));
      if (!voucher) {
        throw new Error(`Voucher ${existingTransfer.voucherId} not found`);
      }
      const isOptional = voucher.optional;
      const existingItems = await tx.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, id));
      console.log("[storage.updateStockTransfer] Found existing transfer with", existingItems.length, "items");
      const itemsWithoutSource = existingItems.filter((item) => !item.sourceLocationId);
      if (itemsWithoutSource.length > 0) {
        throw new Error(
          `Cannot edit this stock transfer: ${itemsWithoutSource.length} items missing source location data. This transfer was created before per-item source locations were tracked. Please create a new transfer instead to avoid inventory corruption.`
        );
      }
      if (!isOptional) {
        for (const oldItem of existingItems) {
          const quantity = parseFloat(oldItem.quantity);
          const rate = parseFloat(oldItem.rate);
          const totalAmount = quantity * rate;
          console.log("[storage.updateStockTransfer] Reversing item:", oldItem.stockItemId, "qty:", quantity);
          const sourceLocationId = oldItem.sourceLocationId || existingTransfer.sourceLocationId;
          const [sourceInventory] = await tx.select().from(inventory).where(and(
            eq(inventory.locationId, sourceLocationId),
            eq(inventory.stockItemId, oldItem.stockItemId)
          ));
          if (sourceInventory) {
            const currentQty = parseFloat(sourceInventory.quantity);
            const currentValue = parseFloat(sourceInventory.totalValue);
            const newQty = currentQty + quantity;
            const newValue = currentValue + totalAmount;
            const newRate = newQty > 0 ? newValue / newQty : 0;
            await tx.update(inventory).set({
              quantity: newQty.toFixed(3),
              averageRate: newRate.toFixed(2),
              totalValue: newValue.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(eq(inventory.id, sourceInventory.id));
          } else {
            const [sourceLocation] = await tx.select().from(locations).where(eq(locations.id, sourceLocationId));
            if (sourceLocation) {
              await tx.insert(inventory).values({
                companyId: sourceLocation.companyId,
                locationId: sourceLocationId,
                stockItemId: oldItem.stockItemId,
                quantity: quantity.toFixed(3),
                averageRate: rate.toFixed(2),
                totalValue: totalAmount.toFixed(2),
                lastUpdated: /* @__PURE__ */ new Date()
              });
            }
          }
          const [destInventory] = await tx.select().from(inventory).where(and(
            eq(inventory.locationId, existingTransfer.destinationLocationId),
            eq(inventory.stockItemId, oldItem.stockItemId)
          ));
          if (destInventory) {
            const currentQty = parseFloat(destInventory.quantity);
            const currentValue = parseFloat(destInventory.totalValue);
            const currentRate = parseFloat(destInventory.averageRate);
            const newQty = currentQty - quantity;
            const newValue = newQty > 0 ? newQty * currentRate : 0;
            await tx.update(inventory).set({
              quantity: newQty.toFixed(3),
              averageRate: currentRate.toFixed(2),
              totalValue: newValue.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(eq(inventory.id, destInventory.id));
          }
        }
      }
      await tx.delete(stockTransferItems).where(eq(stockTransferItems.transferId, id));
      console.log("[storage.updateStockTransfer] Deleted old items");
      const [updatedTransfer] = await tx.update(stockTransferVouchers).set({
        sourceLocationId: items[0].sourceLocationId,
        // Store first item's source for legacy compatibility
        destinationLocationId,
        notes
      }).where(eq(stockTransferVouchers.id, id)).returning();
      console.log("[storage.updateStockTransfer] Updated transfer record");
      const transferItems = [];
      for (const item of items) {
        const quantity = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const totalAmount = quantity * rate;
        console.log("[storage.updateStockTransfer] Creating new item:", item.stockItemId, "qty:", quantity);
        const [transferItem] = await tx.insert(stockTransferItems).values({
          transferId: updatedTransfer.id,
          stockItemId: item.stockItemId,
          sourceLocationId: item.sourceLocationId,
          quantity: item.quantity,
          rate: item.rate,
          totalAmount: totalAmount.toFixed(2)
        }).returning();
        transferItems.push(transferItem);
        if (!isOptional) {
          const [sourceInventory] = await tx.select().from(inventory).where(and(
            eq(inventory.locationId, item.sourceLocationId),
            eq(inventory.stockItemId, item.stockItemId)
          ));
          if (sourceInventory) {
            const currentQty = parseFloat(sourceInventory.quantity);
            const currentValue = parseFloat(sourceInventory.totalValue);
            const currentRate = parseFloat(sourceInventory.averageRate);
            const newQty = currentQty - quantity;
            const newValue = newQty > 0 ? newQty * currentRate : 0;
            await tx.update(inventory).set({
              quantity: newQty.toFixed(3),
              averageRate: currentRate.toFixed(2),
              totalValue: newValue.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(eq(inventory.id, sourceInventory.id));
          } else {
            throw new Error(`Insufficient inventory at source location ${item.sourceLocationId} for stock item ${item.stockItemId}`);
          }
          const [destInventory] = await tx.select().from(inventory).where(and(
            eq(inventory.locationId, destinationLocationId),
            eq(inventory.stockItemId, item.stockItemId)
          ));
          if (destInventory) {
            const currentQty = parseFloat(destInventory.quantity);
            const currentValue = parseFloat(destInventory.totalValue);
            const newQty = currentQty + quantity;
            const newValue = currentValue + totalAmount;
            const newRate = newQty > 0 ? newValue / newQty : 0;
            await tx.update(inventory).set({
              quantity: newQty.toFixed(3),
              averageRate: newRate.toFixed(2),
              totalValue: newValue.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(eq(inventory.id, destInventory.id));
          } else {
            const [destLocation] = await tx.select().from(locations).where(eq(locations.id, destinationLocationId));
            if (!destLocation) {
              throw new Error(`Destination location ${destinationLocationId} not found`);
            }
            await tx.insert(inventory).values({
              companyId: destLocation.companyId,
              locationId: destinationLocationId,
              stockItemId: item.stockItemId,
              quantity: item.quantity,
              averageRate: item.rate,
              totalValue: totalAmount.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            });
          }
        }
      }
      console.log("[storage.updateStockTransfer] Transfer updated successfully with", transferItems.length, "new items");
      return {
        transfer: updatedTransfer,
        items: transferItems
      };
    });
  }
  async updateStockAdjustment(id, locationId, adjustmentType, notes, items) {
    console.log("[storage.updateStockAdjustment] Starting update for adjustment ID:", id);
    return await db.transaction(async (tx) => {
      const [existingAdjustment] = await tx.select().from(stockAdjustmentVouchers).where(eq(stockAdjustmentVouchers.id, id));
      if (!existingAdjustment) {
        throw new Error(`Stock adjustment ${id} not found`);
      }
      const [voucher] = await tx.select().from(vouchers).where(eq(vouchers.id, existingAdjustment.voucherId));
      if (!voucher) {
        throw new Error(`Voucher ${existingAdjustment.voucherId} not found`);
      }
      const isOptional = voucher.optional;
      const existingItems = await tx.select().from(stockAdjustmentItems).where(eq(stockAdjustmentItems.adjustmentId, id));
      console.log("[storage.updateStockAdjustment] Found existing adjustment with", existingItems.length, "items");
      const [location] = await tx.select().from(locations).where(eq(locations.id, existingAdjustment.locationId));
      if (!location) {
        throw new Error(`Location ${existingAdjustment.locationId} not found`);
      }
      if (!isOptional) {
        for (const oldItem of existingItems) {
          const quantity = parseFloat(oldItem.quantity);
          const rate = parseFloat(oldItem.rate);
          const totalAmount = Math.abs(quantity) * rate;
          const oldAdjustmentType = existingAdjustment.adjustmentType;
          console.log("[storage.updateStockAdjustment] Reversing item:", oldItem.stockItemId, "qty:", quantity, "type:", oldAdjustmentType);
          const [currentInventory] = await tx.select().from(inventory).where(and(
            eq(inventory.locationId, existingAdjustment.locationId),
            eq(inventory.stockItemId, oldItem.stockItemId)
          ));
          if (currentInventory) {
            const currentQty = parseFloat(currentInventory.quantity);
            const currentValue = parseFloat(currentInventory.totalValue);
            const currentRate = parseFloat(currentInventory.averageRate);
            let newQty;
            let newValue;
            let newRate;
            if (oldAdjustmentType === "Production") {
              newQty = currentQty - quantity;
              newValue = newQty > 0 ? newQty * currentRate : 0;
              newRate = currentRate;
            } else {
              newQty = currentQty + Math.abs(quantity);
              newValue = currentValue + totalAmount;
              newRate = newQty > 0 ? newValue / newQty : 0;
            }
            await tx.update(inventory).set({
              quantity: newQty.toFixed(3),
              averageRate: newRate.toFixed(2),
              totalValue: newValue.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(eq(inventory.id, currentInventory.id));
          } else if (oldAdjustmentType === "Consumption") {
            await tx.insert(inventory).values({
              companyId: location.companyId,
              locationId: existingAdjustment.locationId,
              stockItemId: oldItem.stockItemId,
              quantity: Math.abs(quantity).toFixed(3),
              averageRate: rate.toFixed(2),
              totalValue: totalAmount.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            });
          }
        }
      }
      await tx.delete(stockAdjustmentItems).where(eq(stockAdjustmentItems.adjustmentId, id));
      console.log("[storage.updateStockAdjustment] Deleted old items");
      const [updatedAdjustment] = await tx.update(stockAdjustmentVouchers).set({
        locationId,
        adjustmentType,
        notes
      }).where(eq(stockAdjustmentVouchers.id, id)).returning();
      console.log("[storage.updateStockAdjustment] Updated adjustment record");
      const [newLocation] = await tx.select().from(locations).where(eq(locations.id, locationId));
      if (!newLocation) {
        throw new Error(`Location ${locationId} not found`);
      }
      const adjustmentItems = [];
      for (const item of items) {
        const quantity = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const totalAmount = Math.abs(quantity) * rate;
        console.log("[storage.updateStockAdjustment] Creating new item:", item.stockItemId, "qty:", quantity);
        const [adjustmentItem] = await tx.insert(stockAdjustmentItems).values({
          adjustmentId: updatedAdjustment.id,
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          rate: item.rate,
          totalAmount: totalAmount.toFixed(2)
        }).returning();
        adjustmentItems.push(adjustmentItem);
        if (!isOptional) {
          const [currentInventory] = await tx.select().from(inventory).where(and(
            eq(inventory.locationId, locationId),
            eq(inventory.stockItemId, item.stockItemId)
          ));
          if (currentInventory) {
            const currentQty = parseFloat(currentInventory.quantity);
            const currentValue = parseFloat(currentInventory.totalValue);
            const currentRate = parseFloat(currentInventory.averageRate);
            let newQty;
            let newValue;
            let newRate;
            if (adjustmentType === "Production") {
              newQty = currentQty + quantity;
              newValue = currentValue + totalAmount;
              newRate = newQty > 0 ? newValue / newQty : 0;
            } else {
              newQty = currentQty - Math.abs(quantity);
              newValue = newQty > 0 ? newQty * currentRate : 0;
              newRate = currentRate;
            }
            await tx.update(inventory).set({
              quantity: newQty.toFixed(3),
              averageRate: newRate.toFixed(2),
              totalValue: newValue.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(eq(inventory.id, currentInventory.id));
          } else if (adjustmentType === "Production") {
            await tx.insert(inventory).values({
              companyId: newLocation.companyId,
              locationId,
              stockItemId: item.stockItemId,
              quantity: item.quantity,
              averageRate: item.rate,
              totalValue: totalAmount.toFixed(2),
              lastUpdated: /* @__PURE__ */ new Date()
            });
          } else {
            throw new Error(`Insufficient inventory at location ${locationId} for stock item ${item.stockItemId}`);
          }
        }
      }
      console.log("[storage.updateStockAdjustment] Adjustment updated successfully with", adjustmentItems.length, "new items");
      return {
        adjustment: updatedAdjustment,
        items: adjustmentItems
      };
    });
  }
  // Stock Query Methods
  async getLastPurchaseOrderForItem(stockItemId, companyId) {
    const result = await db.select({
      poNumber: purchaseOrders.poNumber,
      poDate: purchaseOrders.createdAt,
      supplierName: suppliers.legalName,
      quantity: poLineItems.quantity,
      rate: poLineItems.rate,
      amount: poLineItems.lineTotal
    }).from(poLineItems).innerJoin(purchaseOrders, eq(poLineItems.poId, purchaseOrders.id)).innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id)).where(and(
      eq(poLineItems.stockItemId, stockItemId),
      eq(purchaseOrders.companyId, companyId)
    )).orderBy(sql2`${purchaseOrders.createdAt} DESC`).limit(1);
    return result.length > 0 ? result[0] : null;
  }
  async getLastSaleForItem(stockItemId, companyId) {
    const result = await db.select({
      voucherNumber: vouchers.voucherNumber,
      saleDate: vouchers.voucherDate,
      locationName: locations.name,
      quantity: salesItems.quantity,
      sellingPrice: salesItems.sellingPrice,
      totalSales: salesItems.totalSales
    }).from(salesItems).innerJoin(vouchers, eq(salesItems.voucherId, vouchers.id)).leftJoin(locations, eq(vouchers.locationId, locations.id)).where(and(
      eq(salesItems.stockItemId, stockItemId),
      eq(vouchers.companyId, companyId)
    )).orderBy(sql2`${vouchers.voucherDate} DESC`).limit(1);
    return result.length > 0 ? result[0] : null;
  }
  async getAllPurchasesForItem(stockItemId, companyId) {
    const results = await db.select({
      poNumber: purchaseOrders.poNumber,
      poDate: purchaseOrders.createdAt,
      supplierName: suppliers.legalName,
      containerNumber: containers.containerNumber,
      quantity: poLineItems.quantity,
      rate: poLineItems.rate,
      amount: poLineItems.lineTotal
    }).from(poLineItems).innerJoin(purchaseOrders, eq(poLineItems.poId, purchaseOrders.id)).innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id)).leftJoin(containers, eq(purchaseOrders.containerId, containers.id)).where(and(
      eq(poLineItems.stockItemId, stockItemId),
      eq(purchaseOrders.companyId, companyId)
    )).orderBy(sql2`${purchaseOrders.createdAt} DESC`);
    return results;
  }
  async getAllSalesForItem(stockItemId, companyId) {
    const results = await db.select({
      voucherId: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      saleDate: vouchers.voucherDate,
      locationName: locations.name,
      quantity: salesItems.quantity,
      sellingPrice: salesItems.sellingPrice,
      totalSales: salesItems.totalSales
    }).from(salesItems).innerJoin(vouchers, eq(salesItems.voucherId, vouchers.id)).leftJoin(locations, eq(vouchers.locationId, locations.id)).where(and(
      eq(salesItems.stockItemId, stockItemId),
      eq(vouchers.companyId, companyId),
      eq(vouchers.optional, false)
    )).orderBy(sql2`${vouchers.voucherDate} DESC`);
    return results;
  }
  async getInventoryLocationsByItem(stockItemId, companyId) {
    const results = await db.select({
      locationId: inventory.locationId,
      locationName: locations.name,
      locationCode: locations.code,
      quantity: inventory.quantity,
      averageRate: inventory.averageRate,
      totalValue: inventory.totalValue
    }).from(inventory).innerJoin(locations, eq(inventory.locationId, locations.id)).where(and(
      eq(inventory.stockItemId, stockItemId),
      eq(locations.companyId, companyId),
      sql2`${inventory.quantity}::numeric > 0`
      // Only show locations with positive inventory
    )).orderBy(locations.name);
    return results;
  }
  async getVoucherHistoryForItem(stockItemId, companyId) {
    const sales = await db.select({
      voucherId: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      voucherType: vouchers.voucherType,
      voucherDate: vouchers.voucherDate,
      locationId: vouchers.locationId,
      locationName: locations.name,
      locationCode: locations.code,
      quantityOut: salesItems.quantity,
      quantityIn: sql2`'0'`,
      rate: salesItems.sellingPrice,
      amount: salesItems.totalSales
    }).from(salesItems).innerJoin(vouchers, eq(salesItems.voucherId, vouchers.id)).leftJoin(locations, eq(vouchers.locationId, locations.id)).where(and(
      eq(salesItems.stockItemId, stockItemId),
      eq(vouchers.companyId, companyId),
      eq(vouchers.optional, false)
    ));
    const transfersOut = await db.select({
      voucherId: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      voucherType: vouchers.voucherType,
      voucherDate: vouchers.voucherDate,
      locationId: stockTransferItems.sourceLocationId,
      locationName: locations.name,
      locationCode: locations.code,
      quantityOut: stockTransferItems.quantity,
      quantityIn: sql2`'0'`,
      rate: stockTransferItems.rate,
      amount: sql2`(${stockTransferItems.quantity}::numeric * ${stockTransferItems.rate}::numeric)::text`
    }).from(stockTransferItems).innerJoin(stockTransferVouchers, eq(stockTransferItems.stockTransferVoucherId, stockTransferVouchers.id)).innerJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id)).leftJoin(locations, eq(stockTransferItems.sourceLocationId, locations.id)).where(and(
      eq(stockTransferItems.stockItemId, stockItemId),
      eq(vouchers.companyId, companyId),
      eq(vouchers.optional, false)
    ));
    const transfersIn = await db.select({
      voucherId: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      voucherType: vouchers.voucherType,
      voucherDate: vouchers.voucherDate,
      locationId: stockTransferVouchers.destinationLocationId,
      locationName: locations.name,
      locationCode: locations.code,
      quantityOut: sql2`'0'`,
      quantityIn: stockTransferItems.quantity,
      rate: stockTransferItems.rate,
      amount: sql2`(${stockTransferItems.quantity}::numeric * ${stockTransferItems.rate}::numeric)::text`
    }).from(stockTransferItems).innerJoin(stockTransferVouchers, eq(stockTransferItems.stockTransferVoucherId, stockTransferVouchers.id)).innerJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id)).leftJoin(locations, eq(stockTransferVouchers.destinationLocationId, locations.id)).where(and(
      eq(stockTransferItems.stockItemId, stockItemId),
      eq(vouchers.companyId, companyId),
      eq(vouchers.optional, false)
    ));
    const adjustments = await db.select({
      voucherId: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      voucherType: vouchers.voucherType,
      voucherDate: vouchers.voucherDate,
      locationId: stockAdjustmentVouchers.locationId,
      locationName: locations.name,
      locationCode: locations.code,
      quantityOut: sql2`CASE WHEN ${stockAdjustmentItems.quantity}::numeric < 0 THEN ABS(${stockAdjustmentItems.quantity}::numeric)::text ELSE '0' END`,
      quantityIn: sql2`CASE WHEN ${stockAdjustmentItems.quantity}::numeric > 0 THEN ${stockAdjustmentItems.quantity} ELSE '0' END`,
      rate: stockAdjustmentItems.rate,
      amount: sql2`(${stockAdjustmentItems.quantity}::numeric * ${stockAdjustmentItems.rate}::numeric)::text`
    }).from(stockAdjustmentItems).innerJoin(stockAdjustmentVouchers, eq(stockAdjustmentItems.stockAdjustmentVoucherId, stockAdjustmentVouchers.id)).innerJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id)).leftJoin(locations, eq(stockAdjustmentVouchers.locationId, locations.id)).where(and(
      eq(stockAdjustmentItems.stockItemId, stockItemId),
      eq(vouchers.companyId, companyId),
      eq(vouchers.optional, false)
    ));
    const allTransactions = [...sales, ...transfersOut, ...transfersIn, ...adjustments];
    allTransactions.sort((a, b) => new Date(b.voucherDate).getTime() - new Date(a.voucherDate).getTime());
    return allTransactions;
  }
  // Customer Methods
  async getAllCustomers(companyId) {
    return await db.select().from(customers).where(eq(customers.companyId, companyId)).orderBy(customers.legalName);
  }
  async getCustomerById(id) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  async getCustomerByCode(code, companyId) {
    const [customer] = await db.select().from(customers).where(and(eq(customers.code, code), eq(customers.companyId, companyId)));
    return customer;
  }
  async createCustomer(customer) {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }
  async updateCustomer(id, updates) {
    const [customer] = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    return customer;
  }
  // Inter-Company Transfer Methods
  async getAllInterCompanyTransfers(companyId) {
    if (companyId) {
      return await db.select().from(interCompanyTransfers).where(or(
        eq(interCompanyTransfers.fromCompanyId, companyId),
        eq(interCompanyTransfers.toCompanyId, companyId)
      )).orderBy(sql2`${interCompanyTransfers.transferDate} DESC`);
    }
    return await db.select().from(interCompanyTransfers).orderBy(sql2`${interCompanyTransfers.transferDate} DESC`);
  }
  async getInterCompanyTransferById(id) {
    const [transfer] = await db.select().from(interCompanyTransfers).where(eq(interCompanyTransfers.id, id));
    return transfer;
  }
  async createInterCompanyTransfer(transfer) {
    const [newTransfer] = await db.insert(interCompanyTransfers).values(transfer).returning();
    return newTransfer;
  }
  // Salary Advance Methods
  async getAllSalaryAdvances(companyId) {
    return await db.select().from(salaryAdvances).where(eq(salaryAdvances.companyId, companyId)).orderBy(sql2`${salaryAdvances.advanceDate} DESC`);
  }
  async getSalaryAdvanceById(id) {
    const [advance] = await db.select().from(salaryAdvances).where(eq(salaryAdvances.id, id));
    return advance;
  }
  async getSalaryAdvancesByEmployee(employeeId) {
    return await db.select().from(salaryAdvances).where(eq(salaryAdvances.employeeId, employeeId)).orderBy(sql2`${salaryAdvances.advanceDate} DESC`);
  }
  async getUnpaidSalaryAdvancesByEmployee(employeeId) {
    return await db.select().from(salaryAdvances).where(and(
      eq(salaryAdvances.employeeId, employeeId),
      eq(salaryAdvances.fullyPaid, false)
    )).orderBy(sql2`${salaryAdvances.advanceDate}`);
  }
  async createSalaryAdvance(advance) {
    const [newAdvance] = await db.insert(salaryAdvances).values(advance).returning();
    return newAdvance;
  }
  async updateSalaryAdvance(id, updates) {
    const [advance] = await db.update(salaryAdvances).set(updates).where(eq(salaryAdvances.id, id)).returning();
    return advance;
  }
  // Salary Advance Deduction Methods
  async getSalaryAdvanceDeductions(salaryAdvanceId) {
    return await db.select().from(salaryAdvanceDeductions).where(eq(salaryAdvanceDeductions.salaryAdvanceId, salaryAdvanceId)).orderBy(salaryAdvanceDeductions.payrollMonth);
  }
  async createSalaryAdvanceDeduction(deduction) {
    const [newDeduction] = await db.insert(salaryAdvanceDeductions).values(deduction).returning();
    return newDeduction;
  }
  // Draft POS Sales Methods
  async getAllDraftPosSales(userId, locationId) {
    if (locationId) {
      return await db.select().from(draftPosSales).where(and(
        eq(draftPosSales.userId, userId),
        eq(draftPosSales.locationId, locationId)
      )).orderBy(sql2`${draftPosSales.updatedAt} DESC`);
    }
    return await db.select().from(draftPosSales).where(eq(draftPosSales.userId, userId)).orderBy(sql2`${draftPosSales.updatedAt} DESC`);
  }
  async getDraftPosSaleById(id) {
    const [draft] = await db.select().from(draftPosSales).where(eq(draftPosSales.id, id));
    if (!draft) return void 0;
    const items = await db.select({
      id: draftPosSaleItems.id,
      stockItemId: draftPosSaleItems.stockItemId,
      stockItemName: stockItems.name,
      stockItemCode: stockItems.code,
      quantity: draftPosSaleItems.quantity,
      rate: draftPosSaleItems.rate,
      amount: draftPosSaleItems.amount
    }).from(draftPosSaleItems).leftJoin(stockItems, eq(draftPosSaleItems.stockItemId, stockItems.id)).where(eq(draftPosSaleItems.draftId, id));
    return { ...draft, items };
  }
  async createDraftPosSale(draft, items) {
    const [newDraft] = await db.insert(draftPosSales).values(draft).returning();
    if (items && items.length > 0) {
      const draftItems = items.map((item) => ({
        draftId: newDraft.id,
        stockItemId: item.stockItemId,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      }));
      await db.insert(draftPosSaleItems).values(draftItems);
    }
    return newDraft;
  }
  async updateDraftPosSale(id, draft, items) {
    const updateData = { ...draft, updatedAt: sql2`now()` };
    const [updatedDraft] = await db.update(draftPosSales).set(updateData).where(eq(draftPosSales.id, id)).returning();
    if (items) {
      await db.delete(draftPosSaleItems).where(eq(draftPosSaleItems.draftId, id));
      if (items.length > 0) {
        const draftItems = items.map((item) => ({
          draftId: id,
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }));
        await db.insert(draftPosSaleItems).values(draftItems);
      }
    }
    return updatedDraft;
  }
  async deleteDraftPosSale(id) {
    await db.delete(draftPosSaleItems).where(eq(draftPosSaleItems.draftId, id));
    await db.delete(draftPosSales).where(eq(draftPosSales.id, id));
  }
  // Company Settings
  async getCompanySettings(companyId) {
    const [settings] = await db.select().from(companySettings).where(eq(companySettings.companyId, companyId));
    return settings;
  }
  async upsertCompanySettings(settings) {
    const existing = await this.getCompanySettings(settings.companyId);
    if (existing) {
      const [updated] = await db.update(companySettings).set({ ...settings, updatedAt: sql2`now()` }).where(eq(companySettings.companyId, settings.companyId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(companySettings).values(settings).returning();
      return created;
    }
  }
  // Bales
  async getAllBales(companyId) {
    return await db.select().from(bales).where(and(
      eq(bales.companyId, companyId),
      eq(bales.active, true)
    )).orderBy(desc(bales.createdAt));
  }
  async getBaleById(id) {
    const [bale] = await db.select().from(bales).where(eq(bales.id, id));
    return bale;
  }
  async getBaleByBarcode(barcode, companyId) {
    const [bale] = await db.select().from(bales).where(and(
      eq(bales.barcode, barcode),
      eq(bales.companyId, companyId)
    ));
    return bale;
  }
  async createBale(bale) {
    const [created] = await db.insert(bales).values(bale).returning();
    return created;
  }
  async updateBale(id, updates) {
    const [updated] = await db.update(bales).set({ ...updates, updatedAt: sql2`now()` }).where(eq(bales.id, id)).returning();
    return updated;
  }
  async deleteBale(id) {
    await db.update(bales).set({ active: false }).where(eq(bales.id, id));
  }
  async bulkCreateBales(bales2) {
    if (bales2.length === 0) return [];
    return await db.insert(bales).values(bales2).returning();
  }
  // Bale Products
  async getAllBaleProducts(companyId) {
    return await db.select().from(baleProducts).where(eq(baleProducts.companyId, companyId)).orderBy(baleProducts.code);
  }
  async getBaleProductById(id) {
    const [product] = await db.select().from(baleProducts).where(eq(baleProducts.id, id));
    return product;
  }
  async getBaleProductByCode(code, companyId) {
    const [product] = await db.select().from(baleProducts).where(
      and(
        eq(baleProducts.code, code),
        eq(baleProducts.companyId, companyId)
      )
    );
    return product;
  }
  async createBaleProduct(product) {
    const [created] = await db.insert(baleProducts).values(product).returning();
    return created;
  }
  async updateBaleProduct(id, updates) {
    const [updated] = await db.update(baleProducts).set({ ...updates, updatedAt: sql2`now()` }).where(eq(baleProducts.id, id)).returning();
    return updated;
  }
  async deleteBaleProduct(id) {
    await db.delete(baleProducts).where(eq(baleProducts.id, id));
  }
  async bulkCreateBaleProducts(products) {
    if (products.length === 0) return [];
    const companyIds = new Set(products.map((p) => p.companyId));
    if (companyIds.size > 1) {
      throw new Error("All products must belong to the same company");
    }
    const codes = products.map((p) => p.code);
    const duplicates = codes.filter((code, index2) => codes.indexOf(code) !== index2);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate product codes in import: ${duplicates.join(", ")}`);
    }
    return await db.insert(baleProducts).values(products).returning();
  }
  // Bale Transfers
  async getAllBaleTransfers(companyId) {
    return await db.select().from(baleTransfers).where(eq(baleTransfers.companyId, companyId)).orderBy(desc(baleTransfers.createdAt));
  }
  async getBaleTransferById(id) {
    const [transfer] = await db.select().from(baleTransfers).where(eq(baleTransfers.id, id));
    return transfer;
  }
  async createBaleTransfer(transfer) {
    const [created] = await db.insert(baleTransfers).values(transfer).returning();
    return created;
  }
  async updateBaleTransfer(id, updates) {
    const [updated] = await db.update(baleTransfers).set({ ...updates, updatedAt: sql2`now()` }).where(eq(baleTransfers.id, id)).returning();
    return updated;
  }
  async deleteBaleTransfer(id) {
    await db.delete(baleTransfers).where(eq(baleTransfers.id, id));
  }
  async getBaleTransferItems(transferId) {
    return await db.select().from(baleTransferItems).where(eq(baleTransferItems.transferId, transferId));
  }
  async createBaleTransferItem(item) {
    const [created] = await db.insert(baleTransferItems).values(item).returning();
    return created;
  }
  async updateBaleTransferItem(id, updates) {
    const [updated] = await db.update(baleTransferItems).set({ ...updates, updatedAt: sql2`now()` }).where(eq(baleTransferItems.id, id)).returning();
    return updated;
  }
  async deleteBaleTransferItem(id) {
    await db.delete(baleTransferItems).where(eq(baleTransferItems.id, id));
  }
  async getProductionBalesByLocation(companyId, locationId) {
    return await db.select().from(productionBales).where(and(
      eq(productionBales.companyId, companyId),
      eq(productionBales.locationId, locationId),
      eq(productionBales.status, "IN_STOCK")
    ));
  }
  // Mix Batches
  async getAllMixBatches(companyId) {
    return await db.select().from(mixBatches).where(eq(mixBatches.companyId, companyId)).orderBy(desc(mixBatches.createdAt));
  }
  async getMixBatchById(id, companyId) {
    const [batch] = await db.select().from(mixBatches).where(and(
      eq(mixBatches.id, id),
      eq(mixBatches.companyId, companyId)
    ));
    return batch;
  }
  async createMixBatch(batch) {
    const [created] = await db.insert(mixBatches).values(batch).returning();
    return created;
  }
  async updateMixBatch(id, updates) {
    const [updated] = await db.update(mixBatches).set({ ...updates, updatedAt: sql2`now()` }).where(eq(mixBatches.id, id)).returning();
    return updated;
  }
  // Mix Batch Sources
  async getMixBatchSources(mixBatchId, companyId) {
    const batch = await this.getMixBatchById(mixBatchId, companyId);
    if (!batch) {
      return [];
    }
    return await db.select().from(mixBatchSources).where(eq(mixBatchSources.mixBatchId, mixBatchId));
  }
  async addMixBatchSource(source) {
    const [created] = await db.insert(mixBatchSources).values(source).returning();
    return created;
  }
  // Production Bales
  async getAllProductionBales(companyId, filters) {
    let conditions = [eq(productionBales.companyId, companyId)];
    if (filters?.mixBatchId) {
      conditions.push(eq(productionBales.mixBatchId, filters.mixBatchId));
    }
    if (filters?.status) {
      conditions.push(eq(productionBales.status, filters.status));
    }
    if (filters?.category) {
      conditions.push(eq(productionBales.category, filters.category));
    }
    if (filters?.grade) {
      conditions.push(eq(productionBales.grade, filters.grade));
    }
    return await db.select({
      bale: productionBales,
      product: baleProducts,
      location: locations
    }).from(productionBales).leftJoin(baleProducts, eq(productionBales.productId, baleProducts.id)).leftJoin(locations, eq(productionBales.locationId, locations.id)).where(and(...conditions)).orderBy(desc(productionBales.createdAt));
  }
  async getProductionBaleById(id) {
    const [bale] = await db.select().from(productionBales).where(eq(productionBales.id, id));
    return bale;
  }
  async getProductionBaleByBarcode(barcodeValue, companyId) {
    const [bale] = await db.select().from(productionBales).where(and(
      eq(productionBales.barcodeValue, barcodeValue),
      eq(productionBales.companyId, companyId)
    ));
    return bale;
  }
  async createProductionBale(bale) {
    const baleData = { ...bale };
    if (bale.pressedAt) {
      baleData.pressedAt = new Date(bale.pressedAt);
    }
    const [created] = await db.insert(productionBales).values(baleData).returning();
    return created;
  }
  async updateProductionBale(id, updates) {
    const updateData = { ...updates, updatedAt: sql2`now()` };
    if (updates.pressedAt) {
      updateData.pressedAt = new Date(updates.pressedAt);
    }
    const [updated] = await db.update(productionBales).set(updateData).where(eq(productionBales.id, id)).returning();
    return updated;
  }
  async deleteProductionBale(id, companyId) {
    await db.delete(productionBales).where(and(
      eq(productionBales.id, id),
      eq(productionBales.companyId, companyId)
    ));
  }
  async bulkCreateProductionBales(bales2) {
    if (bales2.length === 0) return [];
    const balesData = bales2.map((bale) => {
      const data = { ...bale };
      if (bale.pressedAt) {
        data.pressedAt = new Date(bale.pressedAt);
      }
      return data;
    });
    return await db.insert(productionBales).values(balesData).returning();
  }
  // Update bale from scan (for factory floor scanning)
  async updateProductionBaleFromScan(barcodeValue, companyId, updates) {
    const bale = await this.getProductionBaleByBarcode(barcodeValue, companyId);
    if (!bale) {
      throw new Error(`Bale with barcode ${barcodeValue} not found`);
    }
    let costPerKg = "0";
    let totalCost = "0";
    if (bale.mixBatchId) {
      const batch = await this.getMixBatchById(bale.mixBatchId, companyId);
      if (batch) {
        costPerKg = batch.costPerKg;
        const weight = parseFloat(updates.weightKg);
        const cost = parseFloat(costPerKg);
        totalCost = (weight * cost).toFixed(2);
      }
    }
    const [updated] = await db.update(productionBales).set({
      weightKg: updates.weightKg,
      category: updates.category,
      grade: updates.grade,
      warehouseLocation: updates.warehouseLocation,
      costPerKg,
      totalCost,
      status: "PRESSED",
      pressedAt: sql2`now()`,
      updatedAt: sql2`now()`
    }).where(eq(productionBales.id, bale.id)).returning();
    return updated;
  }
  // Barcode generation for production bales
  async getNextBaleBarcode(companyId) {
    const [sequence] = await db.select().from(baleSequences).where(eq(baleSequences.companyId, companyId));
    if (!sequence) {
      const [newSeq] = await db.insert(baleSequences).values({ companyId, nextNumber: 2 }).returning();
      return `HD${String(newSeq.nextNumber - 1).padStart(5, "0")}`;
    }
    const nextNum = sequence.nextNumber;
    await db.update(baleSequences).set({ nextNumber: nextNum + 1 }).where(eq(baleSequences.id, sequence.id));
    return `HD${String(nextNum).padStart(5, "0")}`;
  }
  // Container Sales API
  async createContainerSale(sale) {
    const [created] = await db.insert(containerSales).values(sale).returning();
    await this.addCustomerBalanceEntry({
      companyId: sale.companyId,
      customerId: sale.customerId,
      transactionDate: sale.saleDate,
      transactionType: "SALE",
      referenceId: created.id,
      referenceType: "CONTAINER_SALE",
      debitAmount: sale.totalAmount,
      creditAmount: "0",
      balance: sale.totalAmount,
      currency: sale.currency || "USD",
      description: `Container sale - Invoice ${sale.invoiceNumber || created.id}`
    });
    return created;
  }
  async getContainerSales(companyId) {
    return await db.select().from(containerSales).where(eq(containerSales.companyId, companyId)).orderBy(desc(containerSales.saleDate));
  }
  async getContainerSaleById(id, companyId) {
    const [sale] = await db.select().from(containerSales).where(and(
      eq(containerSales.id, id),
      eq(containerSales.companyId, companyId)
    ));
    return sale;
  }
  async updateContainerSalePayment(id, companyId, paidAmount, paymentStatus) {
    const [updated] = await db.update(containerSales).set({
      paidAmount,
      paymentStatus,
      updatedAt: sql2`now()`
    }).where(and(
      eq(containerSales.id, id),
      eq(containerSales.companyId, companyId)
    )).returning();
    return updated;
  }
  async getContainerSaleByContainerId(containerId, companyId) {
    const [sale] = await db.select().from(containerSales).where(and(
      eq(containerSales.containerId, containerId),
      eq(containerSales.companyId, companyId)
    ));
    return sale;
  }
  async getContainerSalesByCustomer(customerId, companyId) {
    return await db.select().from(containerSales).where(and(
      eq(containerSales.customerId, customerId),
      eq(containerSales.companyId, companyId)
    )).orderBy(desc(containerSales.saleDate));
  }
  // Customer Balance API
  async addCustomerBalanceEntry(entry) {
    const debitAmount = entry.debitAmount || "0";
    const creditAmount = entry.creditAmount || "0";
    if (isNaN(Number(debitAmount)) || isNaN(Number(creditAmount))) {
      throw new Error("Invalid debit or credit amount");
    }
    const [latestBalance] = await db.select({ balance: customerBalances.balance }).from(customerBalances).where(and(
      eq(customerBalances.customerId, entry.customerId),
      eq(customerBalances.companyId, entry.companyId)
    )).orderBy(desc(customerBalances.id)).limit(1);
    const currentBalance = latestBalance?.balance || "0";
    const [created] = await db.insert(customerBalances).values({
      ...entry,
      debitAmount,
      creditAmount,
      balance: sql2`(${currentBalance}::decimal + ${debitAmount}::decimal - ${creditAmount}::decimal)`
    }).returning();
    return created;
  }
  async getCustomerBalance(customerId, companyId) {
    const [result] = await db.select({ balance: customerBalances.balance }).from(customerBalances).where(and(
      eq(customerBalances.customerId, customerId),
      eq(customerBalances.companyId, companyId)
    )).orderBy(desc(customerBalances.createdAt)).limit(1);
    return result ? parseFloat(result.balance) : 0;
  }
  async getCustomerStatement(customerId, companyId, startDate, endDate) {
    const conditions = [
      eq(customerBalances.customerId, customerId),
      eq(customerBalances.companyId, companyId)
    ];
    if (startDate) {
      conditions.push(sql2`${customerBalances.transactionDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql2`${customerBalances.transactionDate} <= ${endDate}`);
    }
    return await db.select().from(customerBalances).where(and(...conditions)).orderBy(customerBalances.transactionDate);
  }
};
var storage = new DbStorage();

// server/auth.ts
async function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.userId = void 0;
    return res.status(401).json({ message: "User not found" });
  }
  if (!req.session.currentCompanyId) {
    return res.status(401).json({ message: "No company selected" });
  }
  const userCompanyRole = await storage.getUserCompanyRole(req.session.userId, req.session.currentCompanyId);
  if (!userCompanyRole) {
    return res.status(403).json({ message: "You do not have access to this company" });
  }
  req.user = {
    ...user,
    role: userCompanyRole.role,
    assignedLocationId: userCompanyRole.assignedLocationId,
    posStation: userCompanyRole.posStation,
    cashAccountId: userCompanyRole.cashAccountId,
    // Admin always has negative stock permission
    canSellNegativeStock: userCompanyRole.role === "Admin" ? true : userCompanyRole.canSellNegativeStock,
    canEditDaybook: userCompanyRole.canEditDaybook
  };
  next();
}
function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
function checkPOSLocation(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const isPOS = req.user.role.startsWith("POS");
  if (!isPOS) {
    return next();
  }
  const locationId = parseInt(req.params.locationId || req.body.locationId || req.query.locationId);
  if (locationId && req.user.assignedLocationId !== locationId) {
    return res.status(403).json({
      message: "You can only access data for your assigned location"
    });
  }
  next();
}
function requireNonPOS(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const isPOS = req.user.role.startsWith("POS");
  if (isPOS) {
    return res.status(403).json({
      message: "Access denied: This resource is not available for POS users"
    });
  }
  next();
}

// server/routes.ts
init_schema();
import { z as z2 } from "zod";
import { eq as eq2, and as and2, inArray as inArray2, sql as sql3, like, desc as desc2, or as or2 } from "drizzle-orm";
import { format } from "date-fns";
var upload = multer({ storage: multer.memoryStorage() });
function hashPassword(password) {
  return crypto.SHA256(password).toString();
}
async function syncEmployeeBalancesFromEntries(entries, companyId, reverse = false) {
  const allAccounts = await storage.getAllLedgerAccounts(companyId);
  const employeeAccountMap = /* @__PURE__ */ new Map();
  for (const account of allAccounts) {
    if (account.code.startsWith("EMP-")) {
      const employeeCode = account.code.replace("EMP-", "");
      employeeAccountMap.set(account.id, { code: account.code, employeeCode });
    }
  }
  const employeeBalanceChangesById = /* @__PURE__ */ new Map();
  const employeeBalanceChangesByCode = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    const debit = parseFloat(entry.debitAmount || "0");
    const credit = parseFloat(entry.creditAmount || "0");
    let change = credit - debit;
    if (reverse) {
      change = -change;
    }
    if (entry.employeeId) {
      const current = employeeBalanceChangesById.get(entry.employeeId) || 0;
      employeeBalanceChangesById.set(entry.employeeId, current + change);
      continue;
    }
    if (entry.ledgerAccountId) {
      const employeeAccount = employeeAccountMap.get(entry.ledgerAccountId);
      if (employeeAccount) {
        const current = employeeBalanceChangesByCode.get(employeeAccount.employeeCode) || 0;
        employeeBalanceChangesByCode.set(employeeAccount.employeeCode, current + change);
      }
    }
  }
  for (const [employeeId, change] of Array.from(employeeBalanceChangesById.entries())) {
    if (change === 0) continue;
    const employee = await storage.getEmployeeById(employeeId);
    if (!employee) continue;
    const currentBalance = parseFloat(employee.currentBalance || "0");
    const newBalance = currentBalance + change;
    await db.update(employees).set({
      currentBalance: newBalance.toFixed(2)
    }).where(eq2(employees.id, employee.id));
    console.log(`[Payroll Sync] Employee ID ${employeeId} (${employee.code}): balance changed by ${change.toFixed(2)} (new balance: ${newBalance.toFixed(2)})`);
  }
  for (const [employeeCode, change] of Array.from(employeeBalanceChangesByCode.entries())) {
    if (change === 0) continue;
    const employee = await storage.getEmployeeByCode(employeeCode);
    if (!employee) continue;
    const currentBalance = parseFloat(employee.currentBalance || "0");
    const newBalance = currentBalance + change;
    await db.update(employees).set({
      currentBalance: newBalance.toFixed(2)
    }).where(eq2(employees.id, employee.id));
    console.log(`[Payroll Sync] Employee ${employeeCode}: balance changed by ${change.toFixed(2)} (new balance: ${newBalance.toFixed(2)})`);
  }
}
async function registerRoutes(app2) {
  app2.get("/api/health/db", async (_req, res) => {
    try {
      const result = await db.execute(sql3`SELECT 1 as test`);
      res.json({ status: "ok", message: "Database connection successful" });
    } catch (error) {
      console.error("Database connection failed:", error);
      res.status(500).json({ status: "error", message: error.message });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt started for username:", req.body.username);
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      console.log("Fetching user from database...");
      const user = await Promise.race([
        storage.getUserByUsername(username),
        new Promise(
          (_2, reject) => setTimeout(() => reject(new Error("Database query timeout")), 5e3)
        )
      ]);
      console.log("User fetch complete:", user ? "Found" : "Not found");
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const hashedPassword = hashPassword(password);
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (!user.active) {
        return res.status(403).json({ message: "Account is inactive" });
      }
      req.session.userId = user.id;
      const userCompanies = await storage.getUserCompaniesWithRoles(user.id);
      if (userCompanies.length > 0) {
        const firstCompany = userCompanies[0];
        req.session.currentCompanyId = firstCompany.companyId;
        req.session.currentRole = firstCompany.role;
        req.session.currentLocationId = firstCompany.assignedLocationId;
        req.session.currentPOSStation = firstCompany.posStation;
        req.session.cashAccountId = firstCompany.cashAccountId;
      }
      console.log("\u2705 Login successful, session saved");
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  app2.get(
    "/api/users",
    requireAuth,
    requireRole("Admin"),
    async (_req, res) => {
      try {
        const users2 = await storage.getAllUsers();
        const usersWithoutPasswords = users2.map(
          ({ password, ...user }) => user
        );
        res.json(usersWithoutPasswords);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/users",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const parsed = insertUserSchema.parse(req.body);
        const existing = await storage.getUserByUsername(parsed.username);
        if (existing) {
          return res.status(400).json({ message: "Username already exists" });
        }
        const hashedPassword = hashPassword(parsed.password);
        const user = await storage.createUser({
          ...parsed,
          password: hashedPassword
        });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.patch(
    "/api/users/:id",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        if (updates.password) {
          updates.password = hashPassword(updates.password);
        }
        const user = await storage.updateUser(id, updates);
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/users/:userId/company-roles",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const roles = await storage.getUserCompaniesWithRoles(userId);
        res.json(roles);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/user-company-roles",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const parsed = insertUserCompanyRoleSchema.parse(req.body);
        if (parsed.role.startsWith("POS") && !parsed.assignedLocationId) {
          return res.status(400).json({ message: "POS roles require an assigned location" });
        }
        const role = await storage.createUserCompanyRole(parsed);
        res.status(201).json(role);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.patch(
    "/api/user-company-roles/:id",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const parsed = insertUserCompanyRoleSchema.partial().parse(req.body);
        if (parsed.role?.startsWith("POS") && !parsed.assignedLocationId) {
          return res.status(400).json({ message: "POS roles require an assigned location" });
        }
        const role = await storage.updateUserCompanyRole(parseInt(id), parsed);
        res.json(role);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.delete(
    "/api/user-company-roles/:id",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        await storage.deleteUserCompanyRole(parseInt(id));
        res.status(204).send();
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get("/api/user-preferences", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const prefs = await db.select().from(userPreferences).where(eq2(userPreferences.userId, req.user.id));
      if (prefs.length === 0) {
        return res.json({ dateFormat: "MM/DD/YYYY" });
      }
      res.json(prefs[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.put("/api/user-preferences", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { dateFormat } = req.body;
      if (!["MM/DD/YYYY", "DD/MM/YYYY"].includes(dateFormat)) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      const existing = await db.select().from(userPreferences).where(eq2(userPreferences.userId, req.user.id));
      if (existing.length === 0) {
        const newPrefs = await db.insert(userPreferences).values({
          userId: req.user.id,
          dateFormat
        }).returning();
        return res.json(newPrefs[0]);
      }
      const updated = await db.update(userPreferences).set({ dateFormat, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(userPreferences.userId, req.user.id)).returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const companies2 = await storage.getAllCompanies();
      res.json(companies2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/user/companies", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userCompanies = await storage.getUserCompaniesWithRoles(
        req.user.id
      );
      const companiesWithRoles = await Promise.all(
        userCompanies.map(async (uc) => {
          const company = await storage.getCompanyById(uc.companyId);
          return {
            ...uc,
            companyCode: company?.code,
            companyName: company?.name,
            companyActive: company?.active
          };
        })
      );
      res.json(companiesWithRoles);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/companies",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const company = await storage.createCompany(req.body);
        res.status(201).json(company);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.patch(
    "/api/companies/:id",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const company = await storage.updateCompany(parseInt(id), req.body);
        res.json(company);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.delete(
    "/api/companies/:id",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        await storage.deleteCompany(parseInt(id));
        res.json({ message: "Company deleted successfully" });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.post("/api/auth/set-company", requireAuth, async (req, res) => {
    try {
      const { companyId } = req.body;
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userRole = await storage.getUserCompanyRole(req.user.id, companyId);
      if (!userRole) {
        return res.status(403).json({ message: "You don't have access to this company" });
      }
      req.session.currentCompanyId = companyId;
      req.session.currentRole = userRole.role;
      req.session.currentLocationId = userRole.assignedLocationId;
      req.session.currentPOSStation = userRole.posStation;
      req.session.cashAccountId = userRole.cashAccountId;
      req.session.canSellNegativeStock = userRole.canSellNegativeStock;
      req.session.canEditDaybook = userRole.canEditDaybook;
      res.json({ message: "Company set successfully", companyId });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/locations", requireAuth, async (req, res) => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId) : req.session.currentCompanyId;
      console.log("[/api/locations] Request from user:", req.user?.username);
      console.log(
        "[/api/locations] Company ID from query:",
        req.query.companyId
      );
      console.log(
        "[/api/locations] Company ID from session:",
        req.session.currentCompanyId
      );
      console.log("[/api/locations] Final companyId to query:", companyId);
      if (!companyId) {
        return res.status(400).json({ message: "No company selected or specified" });
      }
      const locations2 = await storage.getAllLocations(companyId);
      console.log(
        "[/api/locations] Found locations:",
        locations2.length,
        "for company",
        companyId
      );
      res.json(locations2);
    } catch (error) {
      console.error("[/api/locations] Error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/locations", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const parsed = insertLocationSchema.parse({
        ...req.body,
        companyId: req.session.currentCompanyId
      });
      if (!parsed.code) {
        const sanitized = parsed.name.trim().replace(/[^a-zA-Z0-9]/g, "");
        let baseCode = sanitized.substring(0, 6).toUpperCase();
        if (!baseCode || baseCode.length === 0) {
          baseCode = "LOC";
        }
        let code = baseCode;
        let suffix = 1;
        while (await storage.getLocationByCode(code, req.session.currentCompanyId)) {
          code = `${baseCode}${suffix}`;
          suffix++;
        }
        parsed.code = code;
      } else {
        const existing = await storage.getLocationByCode(
          parsed.code,
          req.session.currentCompanyId
        );
        if (existing) {
          return res.status(400).json({ message: "Location code already exists" });
        }
      }
      const locationData = {
        ...parsed,
        city: parsed.city || "",
        state: parsed.state || "",
        country: parsed.country || ""
      };
      const location = await storage.createLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get(
    "/api/locations/:locationId",
    requireAuth,
    checkPOSLocation,
    async (req, res) => {
      try {
        const locationId = parseInt(req.params.locationId);
        if (isNaN(locationId)) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
        const location = await storage.getLocationById(locationId);
        if (!location) {
          return res.status(404).json({ message: "Location not found" });
        }
        if (location.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Location belongs to a different company"
          });
        }
        res.json(location);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.delete("/api/locations/:locationId", requireAuth, async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      if (isNaN(locationId)) {
        return res.status(400).json({ message: "Invalid location ID" });
      }
      const location = await storage.getLocationById(locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      if (location.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Location belongs to a different company"
        });
      }
      await storage.deleteLocation(locationId);
      res.json({ message: "Location deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get(
    "/api/locations/:locationId/inventory",
    requireAuth,
    checkPOSLocation,
    async (req, res) => {
      try {
        const locationId = parseInt(req.params.locationId);
        if (isNaN(locationId)) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
        const location = await storage.getLocationById(locationId);
        if (!location) {
          return res.status(404).json({ message: "Location not found" });
        }
        if (location.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Location belongs to a different company"
          });
        }
        const inventory2 = await storage.getLocationInventory(locationId);
        const isPOS = req.user?.role?.startsWith("POS");
        if (isPOS) {
          const filteredInventory = inventory2.map((item) => ({
            ...item,
            averageRate: null,
            totalValue: null
          }));
          res.json(filteredInventory);
        } else {
          res.json(inventory2);
        }
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/inventory", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const inventory2 = await storage.getCompanyInventory(
        req.session.currentCompanyId
      );
      res.json(inventory2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/locations/:locationId/import-cost-prices",
    requireAuth,
    checkPOSLocation,
    async (req, res) => {
      try {
        const locationId = parseInt(req.params.locationId);
        if (isNaN(locationId)) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const location = await storage.getLocationById(locationId);
        if (!location) {
          return res.status(404).json({ message: "Location not found" });
        }
        if (location.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Location belongs to a different company"
          });
        }
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
          return res.status(400).json({ message: "Updates must be an array" });
        }
        const result = await storage.updateCostPricesByBarcode(locationId, req.session.currentCompanyId, updates);
        res.json(result);
      } catch (error) {
        console.error("Error updating cost prices:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/locations/:locationId/import-inventory",
    requireAuth,
    checkPOSLocation,
    async (req, res) => {
      try {
        const locationId = parseInt(req.params.locationId);
        if (isNaN(locationId)) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const location = await storage.getLocationById(locationId);
        if (!location) {
          return res.status(404).json({ message: "Location not found" });
        }
        if (location.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Location belongs to a different company"
          });
        }
        const { items } = req.body;
        if (!Array.isArray(items)) {
          return res.status(400).json({ message: "Items must be an array" });
        }
        const allStockItems = await storage.getAllStockItems(
          req.session.currentCompanyId
        );
        const allStockGroups = await storage.getAllStockGroups(
          req.session.currentCompanyId
        );
        let uncategorizedGroup = await storage.getStockGroupByCode(
          "UNCATEGORIZED",
          req.session.currentCompanyId
        );
        if (!uncategorizedGroup) {
          uncategorizedGroup = await storage.createStockGroup({
            companyId: req.session.currentCompanyId,
            code: "UNCATEGORIZED",
            name: "Uncategorized",
            active: true
          });
        }
        const results = {
          created: [],
          updated: [],
          skipped: [],
          errors: []
        };
        for (const item of items) {
          try {
            let stockItem = await storage.getStockItemByCodeOrAlias(
              item.Item_barcode,
              req.session.currentCompanyId
            );
            if (!stockItem) {
              let stockGroupId = uncategorizedGroup.id;
              const normalizedCode = item.Item_barcode.trim().toUpperCase();
              const prefixes = [];
              if (normalizedCode.length >= 3)
                prefixes.push(normalizedCode.substring(0, 3));
              if (normalizedCode.length >= 2)
                prefixes.push(normalizedCode.substring(0, 2));
              for (const prefix of prefixes) {
                const stockGroup = allStockGroups.find(
                  (sg) => sg.code.toUpperCase() === prefix
                );
                if (stockGroup) {
                  stockGroupId = stockGroup.id;
                  break;
                }
              }
              if (stockGroupId === uncategorizedGroup.id && item.stockGroupCode) {
                const stockGroup = allStockGroups.find(
                  (sg) => sg.code.toLowerCase() === item.stockGroupCode.toLowerCase()
                );
                if (stockGroup) {
                  stockGroupId = stockGroup.id;
                }
              }
              const newStockItem = await storage.createStockItem({
                companyId: req.session.currentCompanyId,
                code: item.Item_barcode,
                name: item.Item_barcode,
                // Use Item_barcode as name if not provided
                uom: "PCS",
                // Default unit
                stockGroupId,
                active: true
              });
              stockItem = newStockItem;
              allStockItems.push(newStockItem);
            }
            const quantity = parseFloat(item.quantity || "0");
            const rate = parseFloat(item.rate || "0");
            const value = parseFloat(
              item.value || (quantity * rate).toString()
            );
            const existingInventory = await storage.getLocationInventory(locationId);
            const existing = existingInventory.find(
              (inv) => inv.stockItemId === stockItem.id
            );
            if (existing) {
              const newQuantity = parseFloat(existing.quantity) + quantity;
              const newTotalValue = parseFloat(existing.totalValue) + value;
              const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
              await storage.updateInventory(
                locationId,
                stockItem.id,
                newQuantity.toString(),
                newAverageRate.toString(),
                newTotalValue.toString()
              );
              results.updated.push({
                code: item.Item_barcode,
                itemName: stockItem.name,
                addedQuantity: quantity,
                newQuantity
              });
            } else {
              await storage.updateInventory(
                locationId,
                stockItem.id,
                quantity.toString(),
                rate.toString(),
                value.toString()
              );
              results.created.push({
                code: item.Item_barcode,
                itemName: stockItem.name,
                quantity
              });
            }
          } catch (error) {
            results.errors.push({
              code: item.code,
              error: error.message
            });
          }
        }
        res.json({
          message: `Import completed: ${results.created.length} created, ${results.updated.length} updated, ${results.skipped.length} skipped, ${results.errors.length} errors`,
          results
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/ledger-accounts", requireAuth, async (req, res) => {
    try {
      const { companyId } = req.query;
      const effectiveCompanyId = companyId ? parseInt(companyId) : req.session.currentCompanyId;
      if (!effectiveCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const accounts = await storage.getAllLedgerAccounts(effectiveCompanyId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/ledger-accounts/:id", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid ledger account ID" });
      }
      const account = await storage.getLedgerAccountById(accountId);
      if (!account) {
        return res.status(404).json({ message: "Ledger account not found" });
      }
      if (account.companyId !== req.session.currentCompanyId) {
        return res.status(404).json({ message: "Ledger account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/ledger-accounts",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const parsed = insertLedgerAccountSchema.parse(req.body);
        const existingByName = await storage.getLedgerAccountByName(
          parsed.name,
          parsed.companyId
        );
        if (existingByName) {
          return res.status(400).json({
            message: "Duplicate ledger: A ledger account with this name already exists"
          });
        }
        if (!parsed.code) {
          const words = parsed.name.trim().split(/\s+/).filter((w) => w.length > 0);
          let baseCode = words.map((w) => w.substring(0, 3)).join("").toUpperCase();
          if (!baseCode || baseCode.length === 0) {
            baseCode = "ACC";
          }
          let code = baseCode;
          let suffix = 1;
          while (await storage.getLedgerAccountByCode(code, req.session.currentCompanyId)) {
            code = `${baseCode}${suffix}`;
            suffix++;
          }
          parsed.code = code;
        } else {
          const existing = await storage.getLedgerAccountByCode(parsed.code, req.session.currentCompanyId);
          if (existing) {
            return res.status(400).json({ message: "Ledger account code already exists" });
          }
        }
        const hasBalance = parsed.openingBalance && parseFloat(parsed.openingBalance) !== 0;
        const hasSide = parsed.openingBalanceSide !== void 0 && parsed.openingBalanceSide !== null;
        if (hasBalance && !hasSide) {
          return res.status(400).json({ message: "Opening balance requires Dr/Cr side" });
        }
        if (!hasBalance && hasSide) {
          return res.status(400).json({ message: "Dr/Cr side requires opening balance amount" });
        }
        const validSubTypes = {
          Income: ["Direct Income", "Indirect Income"],
          Expense: ["Direct Expense", "Indirect Expense"],
          Liability: [
            "Current Liability",
            "Long-term Liability",
            "Loans Payable",
            "Output Tax",
            "Tax Payable"
          ],
          Asset: [
            "Current Asset",
            "Fixed Asset",
            "Input Tax",
            "Tax Receivable"
          ]
        };
        if (parsed.subType && validSubTypes[parsed.accountType]) {
          if (!validSubTypes[parsed.accountType].includes(parsed.subType)) {
            return res.status(400).json({
              message: `Invalid subType "${parsed.subType}" for accountType "${parsed.accountType}". Valid options: ${validSubTypes[parsed.accountType].join(", ")}`
            });
          }
        }
        const account = await storage.createLedgerAccount(parsed);
        res.status(201).json(account);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.put(
    "/api/ledger-accounts/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const accountId = parseInt(req.params.id);
        if (isNaN(accountId)) {
          return res.status(400).json({ message: "Invalid account ID" });
        }
        const existingAccount = await storage.getLedgerAccountById(accountId);
        if (!existingAccount) {
          return res.status(404).json({ message: "Account not found" });
        }
        if (existingAccount.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Account belongs to a different company"
          });
        }
        const parsed = updateLedgerAccountSchema.parse({
          ...req.body,
          id: accountId
        });
        if (parsed.code && parsed.code !== existingAccount.code) {
          const duplicate = await storage.getLedgerAccountByCode(parsed.code, req.session.currentCompanyId);
          if (duplicate) {
            return res.status(400).json({ message: "Ledger account code already exists" });
          }
        }
        const hasBalance = parsed.openingBalance && parseFloat(parsed.openingBalance) !== 0;
        const hasSide = parsed.openingBalanceSide !== void 0 && parsed.openingBalanceSide !== null;
        if (hasBalance && !hasSide) {
          return res.status(400).json({ message: "Opening balance requires Dr/Cr side" });
        }
        if (!hasBalance && hasSide) {
          return res.status(400).json({ message: "Dr/Cr side requires opening balance amount" });
        }
        const accountType = parsed.accountType || existingAccount.accountType;
        const validSubTypes = {
          Income: ["Direct Income", "Indirect Income"],
          Expense: ["Direct Expense", "Indirect Expense"],
          Liability: [
            "Current Liability",
            "Long-term Liability",
            "Loans Payable",
            "Output Tax",
            "Tax Payable"
          ],
          Asset: [
            "Current Asset",
            "Fixed Asset",
            "Input Tax",
            "Tax Receivable"
          ]
        };
        if (parsed.subType && validSubTypes[accountType]) {
          if (!validSubTypes[accountType].includes(parsed.subType)) {
            return res.status(400).json({
              message: `Invalid subType "${parsed.subType}" for accountType "${accountType}". Valid options: ${validSubTypes[accountType].join(", ")}`
            });
          }
        }
        const updatedAccount = await storage.updateLedgerAccount(parsed);
        res.json(updatedAccount);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.delete(
    "/api/ledger-accounts/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const accountId = parseInt(req.params.id);
        if (isNaN(accountId)) {
          return res.status(400).json({ message: "Invalid account ID" });
        }
        const existingAccount = await storage.getLedgerAccountById(accountId);
        if (!existingAccount) {
          return res.status(404).json({ message: "Account not found" });
        }
        if (existingAccount.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Account belongs to a different company"
          });
        }
        const entries = await storage.getVoucherEntriesByLedger(accountId);
        if (entries && entries.length > 0) {
          return res.status(400).json({
            message: "Cannot delete ledger account: It has been used in transactions. Please remove all related transactions first."
          });
        }
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        const hasChildren = allAccounts.some(
          (acc) => acc.parentId === accountId
        );
        if (hasChildren) {
          return res.status(400).json({
            message: "Cannot delete ledger account: It is a parent account. Please remove or reassign child accounts first."
          });
        }
        await storage.deleteLedgerAccount(accountId);
        res.json({ message: "Ledger account deleted successfully" });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get("/api/employees", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const employees2 = await storage.getAllEmployees(
        req.session.currentCompanyId
      );
      const transformedEmployees = employees2.map((emp) => {
        const openingBalance = parseFloat(emp.openingBalance || "0");
        const totalDeposits = parseFloat(emp.totalDeposits || "0");
        const totalWithdrawals = parseFloat(emp.totalWithdrawals || "0");
        const calculatedBalance = openingBalance + totalDeposits - totalWithdrawals;
        console.log(`Employee ${emp.firstName} ${emp.lastName}: opening=${openingBalance}, deposits=${totalDeposits}, withdrawals=${totalWithdrawals}, calculated=${calculatedBalance}`);
        return {
          ...emp,
          firstName: emp.firstName || emp.first_name,
          lastName: emp.lastName || emp.last_name,
          currentBalance: calculatedBalance.toFixed(2),
          calculatedBalance: calculatedBalance.toFixed(2)
        };
      });
      res.json(transformedEmployees);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/employees", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const parsed = insertEmployeeSchema.parse(req.body);
      if (!parsed.code) {
        const firstPart = parsed.firstName.trim().substring(0, 3).toUpperCase();
        const lastPart = parsed.lastName.trim().substring(0, 3).toUpperCase();
        let baseCode = firstPart + lastPart;
        if (!baseCode || baseCode.length === 0) {
          baseCode = "EMP";
        }
        let code = baseCode;
        let suffix = 1;
        while (await storage.getEmployeeByCode(code)) {
          code = `${baseCode}${suffix}`;
          suffix++;
        }
        parsed.code = code;
      } else {
        const existing = await storage.getEmployeeByCode(parsed.code);
        if (existing) {
          return res.status(400).json({ message: "Employee code already exists" });
        }
      }
      let employee = await storage.createEmployee(parsed);
      if (parsed.openingBalance && parseFloat(parsed.openingBalance) > 0) {
        await db.update(employees).set({
          currentBalance: parsed.openingBalance
        }).where(eq2(employees.id, employee.id));
        employee = {
          ...employee,
          currentBalance: parsed.openingBalance
        };
      }
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.currentRole;
      if (userRole !== "Admin") {
        return res.status(403).json({
          message: "Only Admin users can delete employees"
        });
      }
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const allEmployees = await storage.getAllEmployees(req.session.currentCompanyId);
      const employee = allEmployees.find((e) => e.id === employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      if (employee.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Employee belongs to a different company"
        });
      }
      const forceDelete = req.query.forceDelete === "true";
      const result = await storage.deleteEmployee(employeeId, forceDelete);
      if (!result.success) {
        if (result.employeeBalance !== void 0 || result.ledgerBalance !== void 0) {
          return res.status(409).json({
            message: result.message,
            employeeBalance: result.employeeBalance,
            ledgerBalance: result.ledgerBalance,
            requiresConfirmation: true
          });
        }
        return res.status(400).json({ message: result.message });
      }
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/employee-groups", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const groups = await storage.getAllEmployeeGroups(
        req.session.currentCompanyId
      );
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/employee-groups/:id", requireAuth, async (req, res) => {
    try {
      const group = await storage.getEmployeeGroupById(parseInt(req.params.id));
      if (!group) {
        return res.status(404).json({ message: "Employee group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/employee-groups", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const parsed = insertEmployeeGroupSchema.parse({
        ...req.body,
        companyId: req.session.currentCompanyId
      });
      const group = await storage.createEmployeeGroup(parsed);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/employee-groups/:id", requireAuth, async (req, res) => {
    try {
      const group = await storage.updateEmployeeGroup(
        parseInt(req.params.id),
        req.body
      );
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/employee-groups/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteEmployeeGroup(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/employee-groups/:id/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getEmployeeGroupMembers(
        parseInt(req.params.id)
      );
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/employee-groups/:groupId/members/:employeeId",
    requireAuth,
    async (req, res) => {
      try {
        await storage.addEmployeeToGroup(
          parseInt(req.params.groupId),
          parseInt(req.params.employeeId)
        );
        res.status(201).send();
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.delete(
    "/api/employee-groups/:groupId/members/:employeeId",
    requireAuth,
    async (req, res) => {
      try {
        await storage.removeEmployeeFromGroup(
          parseInt(req.params.groupId),
          parseInt(req.params.employeeId)
        );
        res.status(204).send();
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get("/api/worker-groups", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const allGroups = await storage.getAllEmployeeGroups(req.session.currentCompanyId);
      const workerGroups = allGroups.filter((g) => (g.groupType || g.group_type) === "Worker");
      res.json(workerGroups);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/worker-groups/with-members", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const companyId = req.session.currentCompanyId;
      const allGroups = await storage.getAllEmployeeGroups(companyId);
      console.log("DEBUG: allGroups from storage:", JSON.stringify(allGroups, null, 2));
      const workerGroups = allGroups.filter((g) => {
        const type = g.groupType || g.group_type;
        console.log(`DEBUG: Checking group ${g.id} (${g.name}): groupType=${g.groupType}, group_type=${g.group_type}, final type=${type}`);
        return type === "Worker";
      });
      console.log(`DEBUG: Found ${workerGroups.length} worker groups out of ${allGroups.length} total groups`);
      const groupsWithMembers = await Promise.all(
        workerGroups.map(async (group) => {
          const memberRecords = await storage.getEmployeeGroupMembers(group.id);
          console.log(`DEBUG: Group ${group.id} (${group.name}) memberRecords:`, JSON.stringify(memberRecords, null, 2));
          const members = await Promise.all(
            memberRecords.map(async (m) => {
              const [worker] = await db.select().from(employees).where(
                and2(
                  eq2(employees.id, m.employeeId),
                  eq2(employees.companyId, companyId)
                )
              );
              console.log(`DEBUG: Looking for employee ${m.employeeId} in company ${companyId}, found:`, worker ? worker.id : "NOT FOUND");
              return worker;
            })
          );
          const finalResult = {
            ...group,
            members: members.filter(Boolean)
          };
          console.log(`DEBUG: Final group response - id=${group.id}, members count=${finalResult.members.length}`);
          return finalResult;
        })
      );
      console.log(`DEBUG: Final response has ${groupsWithMembers.length} groups with members`);
      res.json(groupsWithMembers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/worker-groups", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const parsed = insertEmployeeGroupSchema.parse({
        ...req.body,
        companyId: req.session.currentCompanyId,
        groupType: "Worker"
      });
      const group = await storage.createEmployeeGroup(parsed);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/worker-groups/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteEmployeeGroup(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/worker-groups/:id/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getEmployeeGroupMembers(parseInt(req.params.id));
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/worker-groups/:groupId/members/:workerId",
    requireAuth,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const companyId = req.session.currentCompanyId;
        const groupId = parseInt(req.params.groupId);
        const workerId = parseInt(req.params.workerId);
        const group = await storage.getEmployeeGroupById(groupId);
        if (!group || group.companyId !== companyId) {
          return res.status(403).json({ message: "Group not found or access denied" });
        }
        const [worker] = await db.select().from(employees).where(and2(eq2(employees.id, workerId), eq2(employees.companyId, companyId)));
        if (!worker) {
          return res.status(404).json({ message: "Worker not found" });
        }
        await storage.addEmployeeToGroup(groupId, workerId);
        res.status(201).send();
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.delete(
    "/api/worker-groups/:groupId/members/:workerId",
    requireAuth,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const companyId = req.session.currentCompanyId;
        const groupId = parseInt(req.params.groupId);
        const workerId = parseInt(req.params.workerId);
        const group = await storage.getEmployeeGroupById(groupId);
        if (!group || group.companyId !== companyId) {
          return res.status(403).json({ message: "Group not found or access denied" });
        }
        await storage.removeEmployeeFromGroup(groupId, workerId);
        res.status(204).send();
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/payroll/deposit-employee",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { employeeId, amount, date: date2, notes } = req.body;
        if (!employeeId || !amount || !date2) {
          return res.status(400).json({ message: "Employee, amount, and date are required" });
        }
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
          return res.status(400).json({ message: "Amount must be a positive number" });
        }
        const [employee] = await db.select().from(employees).where(eq2(employees.id, employeeId));
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        let salaryExpenseAccount = allAccounts.find(
          (a) => a.code === "SALARY_EXPENSE"
        );
        if (!salaryExpenseAccount) {
          salaryExpenseAccount = await storage.createLedgerAccount({
            companyId: req.session.currentCompanyId,
            code: "SALARY_EXPENSE",
            name: "Salary Expense",
            accountType: "Expense",
            openingBalance: "0",
            active: true
          });
        }
        const employeeAccountCode = `EMP-${employee.code}`;
        let employeeAccount = allAccounts.find(
          (a) => a.code === employeeAccountCode
        );
        if (!employeeAccount) {
          employeeAccount = await storage.createLedgerAccount({
            companyId: req.session.currentCompanyId,
            code: employeeAccountCode,
            name: `${employee.firstName} ${employee.lastName} - Salary Account`,
            accountType: "Liability",
            openingBalance: "0",
            active: true
          });
        }
        const voucherNumber = `SAL-DEP-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherNumber,
          voucherType: "Journal",
          voucherDate: date2,
          description: notes || `Salary deposit for ${employee.firstName} ${employee.lastName}`,
          totalAmount: depositAmount.toFixed(2),
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: salaryExpenseAccount.id,
          debitAmount: depositAmount.toFixed(2),
          creditAmount: "0",
          narration: `Salary deposit - ${voucherNumber}`
        });
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: employeeAccount.id,
          debitAmount: "0",
          creditAmount: depositAmount.toFixed(2),
          narration: `Salary deposit - ${voucherNumber}`
        });
        const newBalance = parseFloat(employee.currentBalance) + depositAmount;
        const newTotalDeposits = parseFloat(employee.totalDeposits) + depositAmount;
        await db.update(employees).set({
          currentBalance: newBalance.toFixed(2),
          totalDeposits: newTotalDeposits.toFixed(2)
        }).where(eq2(employees.id, employeeId));
        res.json({
          voucher,
          employee: {
            ...employee,
            currentBalance: newBalance.toFixed(2),
            totalDeposits: newTotalDeposits.toFixed(2)
          }
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/payroll/bulk-deposit-employees",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { deposits, date: date2, notes } = req.body;
        if (!deposits || !Array.isArray(deposits) || deposits.length === 0) {
          return res.status(400).json({ message: "No deposits provided" });
        }
        if (!date2) {
          return res.status(400).json({ message: "Date is required" });
        }
        for (const deposit of deposits) {
          const amount = parseFloat(deposit.amount);
          if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
              message: "All deposit amounts must be positive numbers"
            });
          }
        }
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        let salaryExpenseAccount = allAccounts.find(
          (a) => a.code === "SALARY_EXPENSE"
        );
        if (!salaryExpenseAccount) {
          salaryExpenseAccount = await storage.createLedgerAccount({
            companyId: req.session.currentCompanyId,
            code: "SALARY_EXPENSE",
            name: "Salary Expense",
            accountType: "Expense",
            openingBalance: "0",
            active: true
          });
        }
        const totalAmount = deposits.reduce(
          (sum, d) => sum + parseFloat(d.amount),
          0
        );
        const voucherNumber = `SAL-DEP-BULK-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherNumber,
          voucherType: "Journal",
          voucherDate: date2,
          description: notes || `Bulk salary deposit for ${deposits.length} employees`,
          totalAmount: totalAmount.toFixed(2),
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: salaryExpenseAccount.id,
          debitAmount: totalAmount.toFixed(2),
          creditAmount: "0",
          narration: `Bulk salary deposit - ${deposits.length} employees - ${voucherNumber}`
        });
        const results = [];
        for (const deposit of deposits) {
          const [employee] = await db.select().from(employees).where(eq2(employees.id, deposit.employeeId));
          if (!employee) {
            continue;
          }
          if (employee.companyId !== req.session.currentCompanyId) {
            continue;
          }
          const depositAmount = parseFloat(deposit.amount);
          const employeeAccountCode = `EMP-${employee.code}`;
          let employeeAccount = allAccounts.find(
            (a) => a.code === employeeAccountCode
          );
          if (!employeeAccount) {
            employeeAccount = await storage.createLedgerAccount({
              companyId: req.session.currentCompanyId,
              code: employeeAccountCode,
              name: `${employee.firstName} ${employee.lastName} - Salary Account`,
              accountType: "Liability",
              openingBalance: "0",
              active: true
            });
            allAccounts.push(employeeAccount);
          }
          await db.insert(voucherEntries).values({
            voucherId: voucher.id,
            ledgerAccountId: employeeAccount.id,
            debitAmount: "0",
            creditAmount: depositAmount.toFixed(2),
            narration: `Salary deposit for ${employee.firstName} ${employee.lastName} - ${voucherNumber}`
          });
          const newBalance = parseFloat(employee.currentBalance) + depositAmount;
          const newTotalDeposits = parseFloat(employee.totalDeposits) + depositAmount;
          await db.update(employees).set({
            currentBalance: newBalance.toFixed(2),
            totalDeposits: newTotalDeposits.toFixed(2)
          }).where(eq2(employees.id, deposit.employeeId));
          results.push({
            employeeId: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            amount: depositAmount,
            newBalance
          });
        }
        res.json({
          voucher,
          deposits: results,
          totalAmount
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/payroll/bulk-bonus-employees",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { bonuses, date: date2, notes } = req.body;
        if (!bonuses || !Array.isArray(bonuses) || bonuses.length === 0) {
          return res.status(400).json({ message: "No bonuses provided" });
        }
        if (!date2) {
          return res.status(400).json({ message: "Date is required" });
        }
        const validBonuses = bonuses.filter((b) => {
          const amount = parseFloat(b.amount);
          return !isNaN(amount) && amount > 0;
        });
        if (validBonuses.length === 0) {
          return res.status(400).json({ message: "No valid bonus amounts provided" });
        }
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        let bonusExpenseAccount = allAccounts.find(
          (a) => a.code === "BONUS_EXPENSE"
        );
        if (!bonusExpenseAccount) {
          bonusExpenseAccount = await storage.createLedgerAccount({
            companyId: req.session.currentCompanyId,
            code: "BONUS_EXPENSE",
            name: "Bonus Expense",
            accountType: "Expense",
            openingBalance: "0",
            active: true
          });
        }
        const totalAmount = validBonuses.reduce(
          (sum, b) => sum + parseFloat(b.amount),
          0
        );
        const voucherNumber = `BONUS-BULK-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherNumber,
          voucherType: "Journal",
          voucherDate: date2,
          description: notes || `Bulk bonus deposit for ${validBonuses.length} employees`,
          totalAmount: totalAmount.toFixed(2),
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: bonusExpenseAccount.id,
          debitAmount: totalAmount.toFixed(2),
          creditAmount: "0",
          narration: `Bulk bonus deposit - ${validBonuses.length} employees - ${voucherNumber}`
        });
        const results = [];
        for (const bonus of validBonuses) {
          const [employee] = await db.select().from(employees).where(eq2(employees.id, bonus.employeeId));
          if (!employee) {
            continue;
          }
          if (employee.companyId !== req.session.currentCompanyId) {
            continue;
          }
          const bonusAmount = parseFloat(bonus.amount);
          const employeeAccountCode = `EMP-${employee.code}`;
          let employeeAccount = allAccounts.find(
            (a) => a.code === employeeAccountCode
          );
          if (!employeeAccount) {
            employeeAccount = await storage.createLedgerAccount({
              companyId: req.session.currentCompanyId,
              code: employeeAccountCode,
              name: `${employee.firstName} ${employee.lastName} - Salary Account`,
              accountType: "Liability",
              openingBalance: "0",
              active: true
            });
            allAccounts.push(employeeAccount);
          }
          await db.insert(voucherEntries).values({
            voucherId: voucher.id,
            ledgerAccountId: employeeAccount.id,
            debitAmount: "0",
            creditAmount: bonusAmount.toFixed(2),
            narration: `Bonus for ${employee.firstName} ${employee.lastName} - ${voucherNumber}`
          });
          const newBalance = parseFloat(employee.currentBalance) + bonusAmount;
          const newTotalDeposits = parseFloat(employee.totalDeposits) + bonusAmount;
          await db.update(employees).set({
            currentBalance: newBalance.toFixed(2),
            totalDeposits: newTotalDeposits.toFixed(2)
          }).where(eq2(employees.id, bonus.employeeId));
          results.push({
            employeeId: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            amount: bonusAmount,
            newBalance
          });
        }
        res.json({
          voucher,
          bonuses: results,
          totalAmount
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/payroll/bulk-withdraw-employees",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { withdrawals, date: date2, notes, paymentAccountType, paymentAccountId } = req.body;
        if (!withdrawals || !Array.isArray(withdrawals) || withdrawals.length === 0) {
          return res.status(400).json({ message: "No withdrawals provided" });
        }
        if (!date2 || !paymentAccountType || !paymentAccountId) {
          return res.status(400).json({ message: "Date, account type, and account are required" });
        }
        const validWithdrawals = withdrawals.filter((w) => {
          const amount = parseFloat(w.amount);
          return !isNaN(amount) && amount > 0;
        });
        if (validWithdrawals.length === 0) {
          return res.status(400).json({ message: "No valid withdrawal amounts provided" });
        }
        for (const withdrawal of validWithdrawals) {
          const [employee] = await db.select().from(employees).where(eq2(employees.id, withdrawal.employeeId));
          if (!employee) continue;
          if (employee.companyId !== req.session.currentCompanyId) continue;
          const balance = parseFloat(employee.currentBalance);
          const withdrawAmount = parseFloat(withdrawal.amount);
          if (balance < withdrawAmount) {
            return res.status(400).json({
              message: `${employee.firstName} ${employee.lastName} has insufficient balance. Balance: ${balance}, Requested: ${withdrawAmount}`
            });
          }
        }
        const totalAmount = validWithdrawals.reduce(
          (sum, w) => sum + parseFloat(w.amount),
          0
        );
        let paymentAccount;
        if (paymentAccountType === "bank") {
          [paymentAccount] = await db.select().from(bankAccounts).where(eq2(bankAccounts.id, parseInt(paymentAccountId)));
        } else {
          const allAccounts2 = await storage.getAllLedgerAccounts(req.session.currentCompanyId);
          paymentAccount = allAccounts2.find((a) => a.id === parseInt(paymentAccountId));
        }
        if (!paymentAccount) {
          return res.status(404).json({ message: "Payment account not found" });
        }
        const voucherNumber = `WD-BULK-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherNumber,
          voucherType: "Journal",
          voucherDate: date2,
          description: notes || `Bulk withdrawal for ${validWithdrawals.length} employees`,
          totalAmount: totalAmount.toFixed(2),
          optional: false
        }).returning();
        const paymentAccountId_num = parseInt(paymentAccountId);
        const allAccounts = await storage.getAllLedgerAccounts(req.session.currentCompanyId);
        let paymentLedgerAccount;
        if (paymentAccountType === "bank") {
          paymentLedgerAccount = allAccounts.find((a) => a.bankAccountId === paymentAccountId_num);
          if (!paymentLedgerAccount) {
            return res.status(404).json({ message: "Ledger account for bank account not found" });
          }
        } else {
          paymentLedgerAccount = allAccounts.find((a) => a.id === paymentAccountId_num);
          if (!paymentLedgerAccount) {
            return res.status(404).json({ message: "Cash account not found" });
          }
        }
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: paymentLedgerAccount.id,
          debitAmount: totalAmount.toFixed(2),
          creditAmount: "0",
          narration: `Bulk withdrawal - ${validWithdrawals.length} employees - ${voucherNumber}`
        });
        const results = [];
        for (const withdrawal of validWithdrawals) {
          const [employee] = await db.select().from(employees).where(eq2(employees.id, withdrawal.employeeId));
          if (!employee) continue;
          if (employee.companyId !== req.session.currentCompanyId) continue;
          const withdrawAmount = parseFloat(withdrawal.amount);
          const employeeAccountCode = `EMP-${employee.code}`;
          let employeeAccount = allAccounts.find((a) => a.code === employeeAccountCode);
          if (!employeeAccount) {
            employeeAccount = await storage.createLedgerAccount({
              companyId: req.session.currentCompanyId,
              code: employeeAccountCode,
              name: `${employee.firstName} ${employee.lastName} - Salary Account`,
              accountType: "Liability",
              openingBalance: "0",
              active: true
            });
            allAccounts.push(employeeAccount);
          }
          await db.insert(voucherEntries).values({
            voucherId: voucher.id,
            ledgerAccountId: employeeAccount.id,
            debitAmount: withdrawAmount.toFixed(2),
            creditAmount: "0",
            narration: `Withdrawal for ${employee.firstName} ${employee.lastName} - ${voucherNumber}`
          });
          const newBalance = parseFloat(employee.currentBalance) - withdrawAmount;
          const newTotalWithdrawals = parseFloat(employee.totalWithdrawals) + withdrawAmount;
          await db.update(employees).set({
            currentBalance: newBalance.toFixed(2),
            totalWithdrawals: newTotalWithdrawals.toFixed(2)
          }).where(eq2(employees.id, withdrawal.employeeId));
          results.push({
            employeeId: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            amount: withdrawAmount,
            newBalance
          });
        }
        res.json({
          voucher,
          withdrawals: results,
          totalAmount
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/payroll/bonus-employee",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { employeeId, amount, date: date2, notes } = req.body;
        if (!employeeId || !amount || !date2) {
          return res.status(400).json({ message: "Employee, amount, and date are required" });
        }
        const bonusAmount = parseFloat(amount);
        if (isNaN(bonusAmount) || bonusAmount <= 0) {
          return res.status(400).json({ message: "Amount must be a positive number" });
        }
        const [employee] = await db.select().from(employees).where(eq2(employees.id, employeeId));
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        let salaryExpenseAccount = allAccounts.find(
          (a) => a.code === "SALARY_EXPENSE"
        );
        if (!salaryExpenseAccount) {
          salaryExpenseAccount = await storage.createLedgerAccount({
            companyId: req.session.currentCompanyId,
            code: "SALARY_EXPENSE",
            name: "Salary Expense",
            accountType: "Expense",
            openingBalance: "0",
            active: true
          });
        }
        const employeeAccountCode = `EMP-${employee.code}`;
        let employeeAccount = allAccounts.find(
          (a) => a.code === employeeAccountCode
        );
        if (!employeeAccount) {
          employeeAccount = await storage.createLedgerAccount({
            companyId: req.session.currentCompanyId,
            code: employeeAccountCode,
            name: `${employee.firstName} ${employee.lastName} - Salary Account`,
            accountType: "Liability",
            openingBalance: "0",
            active: true
          });
        }
        const voucherNumber = `BONUS-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherNumber,
          voucherType: "Journal",
          voucherDate: date2,
          description: notes || `Bonus for ${employee.firstName} ${employee.lastName}`,
          totalAmount: bonusAmount.toFixed(2),
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: salaryExpenseAccount.id,
          debitAmount: bonusAmount.toFixed(2),
          creditAmount: "0",
          narration: `Bonus payment - ${voucherNumber}`
        });
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: employeeAccount.id,
          debitAmount: "0",
          creditAmount: bonusAmount.toFixed(2),
          narration: `Bonus payment - ${voucherNumber}`
        });
        const newBalance = parseFloat(employee.currentBalance) + bonusAmount;
        const newTotalDeposits = parseFloat(employee.totalDeposits) + bonusAmount;
        await db.update(employees).set({
          currentBalance: newBalance.toFixed(2),
          totalDeposits: newTotalDeposits.toFixed(2)
        }).where(eq2(employees.id, employeeId));
        res.json({
          voucher,
          employee: {
            ...employee,
            currentBalance: newBalance.toFixed(2),
            totalDeposits: newTotalDeposits.toFixed(2)
          }
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/payroll/withdraw-employee",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const {
          employeeId,
          amount,
          paymentAccountType,
          paymentAccountId,
          bankAccountId,
          date: date2,
          notes
        } = req.body;
        const accountType = paymentAccountType || "bank";
        const accountId = paymentAccountId || bankAccountId;
        if (!employeeId || !amount || !accountId || !date2) {
          return res.status(400).json({
            message: "Employee, amount, payment account, and date are required"
          });
        }
        const withdrawalAmount = parseFloat(amount);
        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
          return res.status(400).json({ message: "Amount must be a positive number" });
        }
        const [employee] = await db.select().from(employees).where(eq2(employees.id, employeeId));
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }
        const currentBalance = parseFloat(employee.currentBalance);
        if (withdrawalAmount > currentBalance) {
          return res.status(400).json({
            message: `Insufficient balance. Current balance: ${currentBalance.toFixed(2)}`
          });
        }
        const employeeAccountCode = `EMP-${employee.code}`;
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        const employeeAccount = allAccounts.find(
          (a) => a.code === employeeAccountCode
        );
        if (!employeeAccount) {
          return res.status(404).json({ message: "Employee account not found" });
        }
        const voucherNumber = `SAL-WD-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherNumber,
          voucherType: "Payment",
          voucherDate: date2,
          description: notes || `Salary withdrawal for ${employee.firstName} ${employee.lastName}`,
          totalAmount: withdrawalAmount.toFixed(2),
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: employeeAccount.id,
          debitAmount: withdrawalAmount.toFixed(2),
          creditAmount: "0",
          narration: `Salary withdrawal - ${voucherNumber}`
        });
        const creditEntry = {
          voucherId: voucher.id,
          debitAmount: "0",
          creditAmount: withdrawalAmount.toFixed(2),
          narration: `Salary withdrawal - ${voucherNumber}`
        };
        if (accountType === "cash") {
          creditEntry.ledgerAccountId = accountId;
        } else {
          creditEntry.bankAccountId = accountId;
        }
        await db.insert(voucherEntries).values(creditEntry);
        const newBalance = currentBalance - withdrawalAmount;
        const newTotalWithdrawals = parseFloat(employee.totalWithdrawals) + withdrawalAmount;
        await db.update(employees).set({
          currentBalance: newBalance.toFixed(2),
          totalWithdrawals: newTotalWithdrawals.toFixed(2)
        }).where(eq2(employees.id, employeeId));
        res.json({
          voucher,
          employee: {
            ...employee,
            currentBalance: newBalance.toFixed(2),
            totalWithdrawals: newTotalWithdrawals.toFixed(2)
          }
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/payroll/pay-worker",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { employeeId, amount, bankAccountId, date: date2, notes } = req.body;
        if (!employeeId || !amount || !bankAccountId || !date2) {
          return res.status(400).json({
            message: "Employee, amount, bank account, and date are required"
          });
        }
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
          return res.status(400).json({ message: "Amount must be a positive number" });
        }
        const [employee] = await db.select().from(employees).where(eq2(employees.id, employeeId));
        if (!employee) {
          return res.status(404).json({ message: "Worker not found" });
        }
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        let salaryExpenseAccount = allAccounts.find(
          (a) => a.code === "SALARY_EXPENSE"
        );
        if (!salaryExpenseAccount) {
          salaryExpenseAccount = await storage.createLedgerAccount({
            companyId: req.session.currentCompanyId,
            code: "SALARY_EXPENSE",
            name: "Salary Expense",
            accountType: "Expense",
            openingBalance: "0",
            active: true
          });
        }
        const voucherNumber = `SAL-PAY-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherNumber,
          voucherType: "Payment",
          voucherDate: date2,
          description: notes || `Salary payment for ${employee.firstName} ${employee.lastName}`,
          totalAmount: paymentAmount.toFixed(2),
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: salaryExpenseAccount.id,
          debitAmount: paymentAmount.toFixed(2),
          creditAmount: "0",
          narration: `Salary payment - ${voucherNumber}`
        });
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          bankAccountId,
          debitAmount: "0",
          creditAmount: paymentAmount.toFixed(2),
          narration: `Salary payment - ${voucherNumber}`
        });
        res.json({
          voucher,
          employee
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/payroll/bulk-pay-workers",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const {
          payments,
          paymentAccountType,
          paymentAccountId,
          bankAccountId,
          date: date2,
          notes
        } = req.body;
        const accountType = paymentAccountType || "bank";
        const accountId = paymentAccountId || bankAccountId;
        if (!payments || !Array.isArray(payments) || payments.length === 0) {
          return res.status(400).json({ message: "No payments provided" });
        }
        if (!accountId || !date2) {
          return res.status(400).json({ message: "Payment account and date are required" });
        }
        for (const payment of payments) {
          const amount = parseFloat(payment.amount);
          if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
              message: "All payment amounts must be positive numbers"
            });
          }
        }
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        let salaryExpenseAccount = allAccounts.find(
          (a) => a.code === "SALARY_EXPENSE"
        );
        if (!salaryExpenseAccount) {
          salaryExpenseAccount = await storage.createLedgerAccount({
            companyId: req.session.currentCompanyId,
            code: "SALARY_EXPENSE",
            name: "Salary Expense",
            accountType: "Expense",
            openingBalance: "0",
            active: true
          });
        }
        const totalAmount = payments.reduce(
          (sum, p) => sum + parseFloat(p.amount),
          0
        );
        const voucherNumber = `SAL-BULK-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherNumber,
          voucherType: "Payment",
          voucherDate: date2,
          description: notes || `Bulk salary payment for ${payments.length} workers`,
          totalAmount: totalAmount.toFixed(2),
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: salaryExpenseAccount.id,
          debitAmount: totalAmount.toFixed(2),
          creditAmount: "0",
          narration: `Bulk salary payment - ${payments.length} workers - ${voucherNumber}`
        });
        const creditEntry = {
          voucherId: voucher.id,
          debitAmount: "0",
          creditAmount: totalAmount.toFixed(2),
          narration: `Bulk salary payment - ${payments.length} workers - ${voucherNumber}`
        };
        if (accountType === "cash") {
          creditEntry.ledgerAccountId = parseInt(accountId);
        } else {
          creditEntry.bankAccountId = parseInt(accountId);
        }
        await db.insert(voucherEntries).values(creditEntry);
        res.json({
          voucher,
          paymentsProcessed: payments.length,
          totalAmount: totalAmount.toFixed(2)
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/payroll/employees-with-balances",
    requireAuth,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const employeesWithBalances = await storage.getEmployeesWithBalances(
          req.session.currentCompanyId
        );
        res.json(employeesWithBalances);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/payroll/worker-payments-summary",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const allEmployees = await storage.getAllEmployees(
          req.session.currentCompanyId
        );
        const workers = allEmployees.filter(
          (emp) => emp.employeeType === "Worker"
        );
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        const workerPayments = await Promise.all(
          workers.map(async (worker) => {
            const employeeAccountCode = `EMP-${worker.code}`;
            const employeeAccount = allAccounts.find(
              (a) => a.code === employeeAccountCode
            );
            let totalPaid = 0;
            if (employeeAccount) {
              const entries = await db.select({
                creditAmount: voucherEntries.creditAmount
              }).from(voucherEntries).innerJoin(vouchers, eq2(voucherEntries.voucherId, vouchers.id)).where(
                and2(
                  eq2(vouchers.companyId, req.session.currentCompanyId),
                  eq2(voucherEntries.ledgerAccountId, employeeAccount.id),
                  eq2(vouchers.optional, false)
                )
              );
              totalPaid = entries.reduce(
                (sum, entry) => sum + parseFloat(entry.creditAmount || "0"),
                0
              );
            }
            return {
              workerId: worker.id,
              workerCode: worker.code,
              workerName: `${worker.firstName} ${worker.lastName}`,
              totalPaid: totalPaid.toFixed(2)
            };
          })
        );
        const grandTotal = workerPayments.reduce(
          (sum, wp) => sum + parseFloat(wp.totalPaid),
          0
        );
        res.json({
          workerPayments,
          grandTotal: grandTotal.toFixed(2)
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/suppliers", async (_req, res) => {
    try {
      const suppliers2 = await storage.getAllSuppliers();
      res.json(suppliers2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/suppliers/stats", requireAuth, async (req, res) => {
    try {
      const suppliers2 = await storage.getAllSuppliers();
      const suppliersWithStats = await Promise.all(
        suppliers2.map(async (supplier) => {
          const containerCount = await storage.getContainerCountBySupplier(
            supplier.id
          );
          const entries = await storage.getVoucherEntriesBySupplier(
            supplier.id
          );
          const openingBalance = parseFloat(supplier.openingBalance || "0");
          const balance = entries.reduce((sum, entry) => {
            const credit = parseFloat(entry.creditAmount || "0");
            const debit = parseFloat(entry.debitAmount || "0");
            if (credit > 0 && debit === 0) {
              return sum + credit;
            } else if (debit > 0 && credit === 0) {
              return sum - debit;
            }
            return sum;
          }, openingBalance);
          return {
            ...supplier,
            containerCount,
            balance
          };
        })
      );
      res.json(suppliersWithStats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/suppliers/:id", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      if (isNaN(supplierId)) {
        return res.status(400).json({ message: "Invalid supplier ID" });
      }
      const supplier = await storage.getSupplierById(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/suppliers", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const parsed = insertSupplierSchema.parse(req.body);
      if (!parsed.code) {
        const sanitized = parsed.legalName.trim().replace(/[^a-zA-Z0-9]/g, "");
        let baseCode = sanitized.substring(0, 6).toUpperCase();
        if (!baseCode || baseCode.length === 0) {
          baseCode = "SUP";
        }
        let code = baseCode;
        let suffix = 1;
        while (await storage.getSupplierByCode(code)) {
          code = `${baseCode}${suffix}`;
          suffix++;
        }
        parsed.code = code;
      } else {
        const existing = await storage.getSupplierByCode(parsed.code);
        if (existing) {
          return res.status(400).json({ message: "Supplier code already exists" });
        }
      }
      const supplierData = {
        ...parsed,
        email: parsed.email || "",
        phone: parsed.phone || "",
        address: parsed.address || "",
        taxId: parsed.taxId || "",
        paymentTerms: parsed.paymentTerms || ""
      };
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch(
    "/api/suppliers/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const supplierId = parseInt(req.params.id);
        if (isNaN(supplierId)) {
          return res.status(400).json({ message: "Invalid supplier ID" });
        }
        const existingSupplier = await storage.getSupplierById(supplierId);
        if (!existingSupplier) {
          return res.status(404).json({ message: "Supplier not found" });
        }
        if (req.body.code && req.body.code !== existingSupplier.code) {
          const duplicate = await storage.getSupplierByCode(req.body.code);
          if (duplicate) {
            return res.status(400).json({ message: "Supplier code already exists" });
          }
        }
        const parsed = insertSupplierSchema.partial().parse(req.body);
        const updatedSupplier = await storage.updateSupplier(
          supplierId,
          parsed
        );
        res.json(updatedSupplier);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get("/api/customers", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const customers3 = await storage.getAllCustomers(
        req.session.currentCompanyId
      );
      res.json(customers3);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/customers/stats", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const customers3 = await storage.getAllCustomers(req.session.currentCompanyId);
      const customersWithBalances = await Promise.all(
        customers3.map(async (customer) => {
          if (customer.ledgerAccountId) {
            const entries = await storage.getVoucherEntriesByLedger(customer.ledgerAccountId);
            const openingBalance = parseFloat(customer.openingBalance || "0");
            const openingSide = customer.openingBalanceSide || "Dr";
            const balance = entries.reduce((sum, entry) => {
              const debit = parseFloat(entry.debitAmount || "0");
              const credit = parseFloat(entry.creditAmount || "0");
              if (debit > 0 && credit === 0) {
                return sum + debit;
              } else if (credit > 0 && debit === 0) {
                return sum - credit;
              }
              return sum;
            }, openingSide === "Dr" ? openingBalance : -openingBalance);
            return {
              ...customer,
              balance: Math.abs(balance),
              balanceSide: balance >= 0 ? "Dr" : "Cr"
            };
          }
          return {
            ...customer,
            balance: parseFloat(customer.openingBalance || "0"),
            balanceSide: customer.openingBalanceSide || "Dr"
          };
        })
      );
      res.json(customersWithBalances);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get(
    "/api/customers/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const customerId = parseInt(req.params.id);
        if (isNaN(customerId)) {
          return res.status(400).json({ message: "Invalid customer ID" });
        }
        const customer = await storage.getCustomerById(customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        if (req.session.currentCompanyId && customer.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Customer belongs to a different company"
          });
        }
        res.json(customer);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post("/api/customers", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const dataWithCompany = {
        ...req.body,
        companyId: req.session.currentCompanyId
      };
      const parsed = insertCustomerSchema.parse(dataWithCompany);
      let code = "CUST001";
      let suffix = 1;
      const allCustomers = await storage.getAllCustomers(
        req.session.currentCompanyId
      );
      const existingCodes = allCustomers.map((c) => c.code).filter((c) => c.startsWith("CUST")).map((c) => parseInt(c.replace("CUST", ""))).filter((n) => !isNaN(n));
      if (existingCodes.length > 0) {
        const maxNumber = Math.max(...existingCodes);
        suffix = maxNumber + 1;
      }
      code = `CUST${suffix.toString().padStart(3, "0")}`;
      while (await storage.getCustomerByCode(code, req.session.currentCompanyId)) {
        suffix++;
        code = `CUST${suffix.toString().padStart(3, "0")}`;
      }
      const customer = await storage.createCustomer({ ...parsed, code });
      const customerAccountCode = `CUST-${customer.code}`;
      let customerAccount = await storage.getLedgerAccountByCode(customerAccountCode, req.session.currentCompanyId);
      if (!customerAccount) {
        customerAccount = await storage.createLedgerAccount({
          companyId: req.session.currentCompanyId,
          code: customerAccountCode,
          name: `${customer.legalName} - Customer Account`,
          accountType: "Asset",
          subType: "Accounts Receivable",
          openingBalance: parsed.openingBalance || "0",
          openingBalanceSide: parsed.openingBalanceSide || "Dr",
          active: true
        });
        await storage.updateCustomer(customer.id, {
          ledgerAccountId: customerAccount.id
        });
      }
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.put(
    "/api/customers/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const customerId = parseInt(req.params.id);
        if (isNaN(customerId)) {
          return res.status(400).json({ message: "Invalid customer ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const existingCustomer = await storage.getCustomerById(customerId);
        if (!existingCustomer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        if (existingCustomer.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Customer belongs to a different company"
          });
        }
        if (req.body.code && req.body.code !== existingCustomer.code) {
          const duplicate = await storage.getCustomerByCode(
            req.body.code,
            req.session.currentCompanyId
          );
          if (duplicate) {
            return res.status(400).json({
              message: "Customer code already exists in this company"
            });
          }
        }
        const parsed = insertCustomerSchema.partial().parse(req.body);
        const updatedCustomer = await storage.updateCustomer(
          customerId,
          parsed
        );
        res.json(updatedCustomer);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/container-sales",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const sales = await storage.getContainerSales(
          req.session.currentCompanyId
        );
        res.json(sales);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/container-sales/customer/:customerId",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const customerId = parseInt(req.params.customerId);
        if (isNaN(customerId)) {
          return res.status(400).json({ message: "Invalid customer ID" });
        }
        const sales = await storage.getContainerSalesByCustomer(
          customerId,
          req.session.currentCompanyId
        );
        res.json(sales);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/container-sales",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const dataWithCompany = {
          ...req.body,
          companyId: req.session.currentCompanyId
        };
        const parsed = insertContainerSaleSchema.parse(dataWithCompany);
        const customer = await storage.getCustomerById(parsed.customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        if (customer.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({ message: "Customer belongs to a different company" });
        }
        const container = await storage.getContainerById(parsed.containerId);
        if (!container) {
          return res.status(404).json({ message: "Container not found" });
        }
        if (container.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({ message: "Container belongs to a different company" });
        }
        const existingSale = await storage.getContainerSaleByContainerId(
          parsed.containerId,
          req.session.currentCompanyId
        );
        if (existingSale) {
          return res.status(400).json({ message: "Container has already been sold" });
        }
        if (!customer.ledgerAccountId) {
          return res.status(400).json({ message: "Customer does not have a ledger account" });
        }
        let commissionAccountId = parsed.commissionAccountId;
        if (commissionAccountId) {
          const commissionAccount = await storage.getLedgerAccountById(commissionAccountId);
          if (!commissionAccount) {
            return res.status(404).json({ message: "Commission account not found" });
          }
          if (commissionAccount.companyId !== req.session.currentCompanyId) {
            return res.status(403).json({ message: "Commission account belongs to a different company" });
          }
        } else {
          const allAccounts = await storage.getAllLedgerAccounts(
            req.session.currentCompanyId
          );
          let commissionRevenueAccount = allAccounts.find(
            (a) => a.code === "COMMISSION_REVENUE"
          );
          if (!commissionRevenueAccount) {
            commissionRevenueAccount = await storage.createLedgerAccount({
              companyId: req.session.currentCompanyId,
              code: "COMMISSION_REVENUE",
              name: "Commission Revenue",
              accountType: "Income",
              openingBalance: "0",
              active: true
            });
          }
          commissionAccountId = commissionRevenueAccount.id;
        }
        const sale = await db.transaction(async (tx) => {
          const voucherNumber = `CS-${Date.now()}`;
          const [voucher] = await tx.insert(vouchers).values({
            companyId: req.session.currentCompanyId,
            voucherNumber,
            voucherType: "Sales",
            voucherDate: parsed.saleDate,
            description: parsed.notes || `Container sale - ${container.containerNumber} to ${customer.legalName}`,
            totalAmount: parsed.totalAmount,
            optional: false
          }).returning();
          await tx.insert(voucherEntries).values({
            voucherId: voucher.id,
            ledgerAccountId: customer.ledgerAccountId,
            debitAmount: parsed.totalAmount,
            creditAmount: "0",
            narration: `Container sale - ${voucherNumber}`
          });
          await tx.insert(voucherEntries).values({
            voucherId: voucher.id,
            ledgerAccountId: commissionAccountId,
            debitAmount: "0",
            creditAmount: parsed.totalAmount,
            narration: `Container sale commission - ${voucherNumber}`
          });
          const [createdSale] = await tx.insert(containerSales).values({
            ...parsed,
            commissionAccountId,
            voucherId: voucher.id
          }).returning();
          await tx.update(containers).set({ status: "SOLD" }).where(eq2(containers.id, parsed.containerId));
          return createdSale;
        });
        res.status(201).json(sale);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/inter-company-transfers",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const transfers = await storage.getAllInterCompanyTransfers(
          req.session.currentCompanyId
        );
        res.json(transfers);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/inter-company-transfers",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const parsed = insertInterCompanyTransferSchema.parse(req.body);
        const fromCompany = await storage.getCompanyById(parsed.fromCompanyId);
        if (!fromCompany) {
          return res.status(404).json({ message: "From company not found" });
        }
        const toCompany = await storage.getCompanyById(parsed.toCompanyId);
        if (!toCompany) {
          return res.status(404).json({ message: "To company not found" });
        }
        const fromAccount = await storage.getLedgerAccountById(
          parsed.fromLedgerAccountId
        );
        if (!fromAccount || fromAccount.companyId !== parsed.fromCompanyId) {
          return res.status(404).json({
            message: "From ledger account not found or doesn't belong to from company"
          });
        }
        const toAccount = await storage.getLedgerAccountById(
          parsed.toLedgerAccountId
        );
        if (!toAccount || toAccount.companyId !== parsed.toCompanyId) {
          return res.status(404).json({
            message: "To ledger account not found or doesn't belong to to company"
          });
        }
        const fromCompanyAccounts = await storage.getAllLedgerAccounts(
          parsed.fromCompanyId
        );
        let fromInterCompanyAccount = fromCompanyAccounts.find(
          (a) => a.code === `IC-TO-${toCompany.code}`
        );
        if (!fromInterCompanyAccount) {
          fromInterCompanyAccount = await storage.createLedgerAccount({
            companyId: parsed.fromCompanyId,
            code: `IC-TO-${toCompany.code}`,
            name: `Inter-Company - ${toCompany.name}`,
            accountType: parsed.transferType === "Loan" ? "Asset" : "Asset",
            openingBalance: "0",
            active: true
          });
        }
        const toCompanyAccounts = await storage.getAllLedgerAccounts(
          parsed.toCompanyId
        );
        let toInterCompanyAccount = toCompanyAccounts.find(
          (a) => a.code === `IC-FROM-${fromCompany.code}`
        );
        if (!toInterCompanyAccount) {
          toInterCompanyAccount = await storage.createLedgerAccount({
            companyId: parsed.toCompanyId,
            code: `IC-FROM-${fromCompany.code}`,
            name: `Inter-Company - ${fromCompany.name}`,
            accountType: parsed.transferType === "Loan" ? "Liability" : "Liability",
            openingBalance: "0",
            active: true
          });
        }
        const fromVoucherNumber = `ICT-FROM-${Date.now()}`;
        const [fromVoucher] = await db.insert(vouchers).values({
          companyId: parsed.fromCompanyId,
          voucherNumber: fromVoucherNumber,
          voucherType: "Payment",
          voucherDate: parsed.transferDate,
          description: parsed.description || `Inter-company transfer to ${toCompany.name}`,
          totalAmount: parsed.amount,
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: fromVoucher.id,
          ledgerAccountId: fromInterCompanyAccount.id,
          debitAmount: parsed.amount,
          creditAmount: "0",
          narration: `Transfer to ${toCompany.name} - ${fromVoucherNumber}`
        });
        await db.insert(voucherEntries).values({
          voucherId: fromVoucher.id,
          ledgerAccountId: parsed.fromLedgerAccountId,
          debitAmount: "0",
          creditAmount: parsed.amount,
          narration: `Transfer to ${toCompany.name} - ${fromVoucherNumber}`
        });
        const toVoucherNumber = `ICT-TO-${Date.now()}`;
        const [toVoucher] = await db.insert(vouchers).values({
          companyId: parsed.toCompanyId,
          voucherNumber: toVoucherNumber,
          voucherType: "Receipt",
          voucherDate: parsed.transferDate,
          description: parsed.description || `Inter-company transfer from ${fromCompany.name}`,
          totalAmount: parsed.amount,
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: toVoucher.id,
          ledgerAccountId: parsed.toLedgerAccountId,
          debitAmount: parsed.amount,
          creditAmount: "0",
          narration: `Transfer from ${fromCompany.name} - ${toVoucherNumber}`
        });
        await db.insert(voucherEntries).values({
          voucherId: toVoucher.id,
          ledgerAccountId: toInterCompanyAccount.id,
          debitAmount: "0",
          creditAmount: parsed.amount,
          narration: `Transfer from ${fromCompany.name} - ${toVoucherNumber}`
        });
        const transfer = await storage.createInterCompanyTransfer({
          ...parsed,
          fromVoucherId: fromVoucher.id,
          toVoucherId: toVoucher.id
        });
        res.status(201).json(transfer);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/salary-advances",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const advances = await storage.getAllSalaryAdvances(
          req.session.currentCompanyId
        );
        res.json(advances);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/salary-advances/employee/:employeeId",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const employeeId = parseInt(req.params.employeeId);
        if (isNaN(employeeId)) {
          return res.status(400).json({ message: "Invalid employee ID" });
        }
        const advances = await storage.getSalaryAdvancesByEmployee(employeeId);
        res.json(advances);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/salary-advances",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const dataWithCompany = {
          ...req.body,
          companyId: req.session.currentCompanyId,
          remainingBalance: req.body.amount
          // Initially, remaining balance equals full amount
        };
        const parsed = insertSalaryAdvanceSchema.parse(dataWithCompany);
        const employee = await db.select().from(employees).where(eq2(employees.id, parsed.employeeId)).limit(1);
        if (!employee || employee.length === 0) {
          return res.status(404).json({ message: "Employee not found" });
        }
        if (employee[0].companyId !== req.session.currentCompanyId) {
          return res.status(403).json({ message: "Employee belongs to a different company" });
        }
        const allAccounts = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        const employeeAccountCode = `EMP-${employee[0].code}`;
        let employeeAccount = allAccounts.find(
          (a) => a.code === employeeAccountCode
        );
        if (!employeeAccount) {
          employeeAccount = await storage.createLedgerAccount({
            companyId: req.session.currentCompanyId,
            code: employeeAccountCode,
            name: `${employee[0].firstName} ${employee[0].lastName} - Salary Account`,
            accountType: "Liability",
            openingBalance: "0",
            active: true
          });
        }
        const cashAccountId = req.body.cashAccountId || req.session.cashAccountId;
        if (!cashAccountId) {
          return res.status(400).json({ message: "Cash account is required" });
        }
        const voucherNumber = `SA-${Date.now()}`;
        const [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherNumber,
          voucherType: "Payment",
          voucherDate: parsed.advanceDate,
          description: parsed.notes || `Salary advance for ${employee[0].firstName} ${employee[0].lastName}`,
          totalAmount: parsed.amount,
          optional: false
        }).returning();
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: employeeAccount.id,
          debitAmount: parsed.amount,
          creditAmount: "0",
          narration: `Salary advance - ${voucherNumber}`
        });
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: cashAccountId,
          debitAmount: "0",
          creditAmount: parsed.amount,
          narration: `Salary advance - ${voucherNumber}`
        });
        const advance = await storage.createSalaryAdvance({
          ...parsed,
          voucherId: voucher.id
        });
        res.status(201).json(advance);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/salary-advances/:id/deduction",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const advanceId = parseInt(req.params.id);
        if (isNaN(advanceId)) {
          return res.status(400).json({ message: "Invalid salary advance ID" });
        }
        const parsed = insertSalaryAdvanceDeductionSchema.parse(req.body);
        const advance = await storage.getSalaryAdvanceById(advanceId);
        if (!advance) {
          return res.status(404).json({ message: "Salary advance not found" });
        }
        if (advance.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({ message: "Salary advance belongs to a different company" });
        }
        if (advance.fullyPaid) {
          return res.status(400).json({ message: "Salary advance is already fully paid" });
        }
        const deductionAmount = parseFloat(parsed.deductionAmount);
        const remainingBalance = parseFloat(advance.remainingBalance);
        if (deductionAmount > remainingBalance) {
          return res.status(400).json({
            message: `Deduction amount cannot exceed remaining balance of ${remainingBalance}`
          });
        }
        await db.insert(salaryAdvanceDeductions).values({
          salaryAdvanceId: advanceId,
          payrollMonth: parsed.payrollMonth,
          deductionAmount: parsed.deductionAmount
        });
        const newRemainingBalance = remainingBalance - deductionAmount;
        const isFullyPaid = newRemainingBalance <= 0.01;
        await db.update(salaryAdvances).set({
          remainingBalance: newRemainingBalance.toFixed(2),
          fullyPaid: isFullyPaid
        }).where(eq2(salaryAdvances.id, advanceId));
        res.json({
          message: "Deduction recorded successfully",
          newRemainingBalance: newRemainingBalance.toFixed(2),
          fullyPaid: isFullyPaid
        });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get("/api/stock-groups", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const groups = await storage.getAllStockGroups(
        req.session.currentCompanyId
      );
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/stock-groups",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const dataWithCompany = {
          ...req.body,
          companyId: req.session.currentCompanyId
        };
        const parsed = insertStockGroupSchema.parse(dataWithCompany);
        const existing = await storage.getStockGroupByCode(
          parsed.code,
          req.session.currentCompanyId
        );
        if (existing) {
          return res.status(400).json({
            message: "Stock group code already exists in this company"
          });
        }
        const group = await storage.createStockGroup(parsed);
        res.status(201).json(group);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
  app2.get("/api/stock-items", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const items = await storage.getAllStockItems(
        req.session.currentCompanyId
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/stock-items", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const dataWithCompany = {
        ...req.body,
        companyId: req.session.currentCompanyId
      };
      const parsed = insertStockItemSchema.parse(dataWithCompany);
      const existing = await storage.getStockItemByCode(
        parsed.code,
        req.session.currentCompanyId
      );
      if (existing) {
        return res.status(400).json({ message: "Stock item code already exists in this company" });
      }
      if (parsed.openingQty && parsed.openingRate) {
        const qty = parseFloat(parsed.openingQty);
        const rate = parseFloat(parsed.openingRate);
        parsed.openingValue = (qty * rate).toFixed(2);
      }
      const item = await storage.createStockItem(parsed);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/stock-items/bulk-delete", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty ids array" });
      }
      const validItems = await storage.bulkGetStockItemsByIds(ids, req.session.currentCompanyId);
      const validIds = validItems.map((item) => item.id);
      if (validIds.length === 0) {
        return res.status(404).json({ message: "No valid stock items found to delete" });
      }
      await storage.bulkDeleteStockItems(validIds);
      const skippedCount = ids.length - validIds.length;
      const message = skippedCount > 0 ? `Successfully deleted ${validIds.length} stock item(s). ${skippedCount} item(s) were skipped (not found or belong to another company).` : `Successfully deleted ${validIds.length} stock item(s)`;
      res.json({
        message,
        deleted: validIds.length,
        skipped: skippedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/stock-items/bulk-update-prices", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { prices } = req.body;
      if (!Array.isArray(prices) || prices.length === 0) {
        return res.status(400).json({ message: "Invalid or empty prices array" });
      }
      let updated = 0;
      let notFound = 0;
      for (const priceEntry of prices) {
        const { barcode, sellingPrice, locationId } = priceEntry;
        if (!barcode || !sellingPrice) continue;
        const item = await storage.getStockItemByBarcode(barcode);
        if (item) {
          if (locationId) {
            await storage.upsertLocationPrice(item.id, locationId, sellingPrice);
          } else {
            await storage.updateStockItem(item.id, { sellingPrice });
          }
          updated++;
        } else {
          notFound++;
        }
      }
      const message = `Updated ${updated} price(s)${notFound > 0 ? `. ${notFound} barcode(s) not found.` : "."}`;
      res.json({ message, updated, notFound });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/stock-items/bulk-update-uom", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const baleItems = await db.query.stockItems.findMany({
        where: and2(
          eq2(stockItems.companyId, req.session.currentCompanyId),
          or2(
            eq2(stockItems.uom, "bale"),
            eq2(stockItems.uom, "Bale"),
            eq2(stockItems.uom, "BALE")
          )
        )
      });
      if (baleItems.length === 0) {
        return res.json({ message: "No items with UOM 'bale' found to update", updated: 0 });
      }
      let updated = 0;
      for (const item of baleItems) {
        await storage.updateStockItem(item.id, { uom: "BL" });
        updated++;
      }
      res.json({ message: `Successfully updated ${updated} stock item(s) from 'bale' to 'BL'`, updated });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stock-items/:id", requireAuth, async (req, res) => {
    try {
      const stockItemId = parseInt(req.params.id);
      if (isNaN(stockItemId)) {
        return res.status(400).json({ message: "Invalid stock item ID" });
      }
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const stockItem = await storage.getStockItemById(stockItemId);
      if (!stockItem) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      if (stockItem.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Stock item belongs to a different company"
        });
      }
      res.json(stockItem);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stock-items/:id/location-prices", requireAuth, async (req, res) => {
    try {
      const stockItemId = parseInt(req.params.id);
      if (isNaN(stockItemId)) {
        return res.status(400).json({ message: "Invalid stock item ID" });
      }
      const prices = await storage.getStockItemLocationPrices(stockItemId, req.session.currentCompanyId);
      res.json(prices);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/stock-items/:id/location-prices", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const stockItemId = parseInt(req.params.id);
      if (isNaN(stockItemId)) {
        return res.status(400).json({ message: "Invalid stock item ID" });
      }
      const { locationId, sellingPrice } = req.body;
      if (!locationId || !sellingPrice) {
        return res.status(400).json({ message: "Location ID and selling price are required" });
      }
      await storage.upsertLocationPrice(stockItemId, locationId, sellingPrice);
      res.json({ message: "Location price updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.delete("/api/stock-item-location-prices/:id", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const priceId = parseInt(req.params.id);
      if (isNaN(priceId)) {
        return res.status(400).json({ message: "Invalid price ID" });
      }
      await storage.deleteLocationPrice(priceId);
      res.json({ message: "Location price deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/stock-items/import",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { items } = req.body;
        if (!Array.isArray(items)) {
          return res.status(400).json({ message: "Items must be an array" });
        }
        let uncategorizedGroup = await storage.getStockGroupByCode(
          "UNCATEGORIZED",
          req.session.currentCompanyId
        );
        if (!uncategorizedGroup) {
          uncategorizedGroup = await storage.createStockGroup({
            companyId: req.session.currentCompanyId,
            code: "UNCATEGORIZED",
            name: "Uncategorized",
            active: true
          });
        }
        const validStockGroups = await storage.getAllStockGroups(
          req.session.currentCompanyId
        );
        const validStockGroupIds = new Set(validStockGroups.map((sg) => sg.id));
        const results = {
          created: [],
          skipped: [],
          errors: []
        };
        for (const item of items) {
          try {
            const itemWithCompany = {
              ...item,
              companyId: req.session.currentCompanyId
            };
            if (!itemWithCompany.stockGroupId || !validStockGroupIds.has(itemWithCompany.stockGroupId)) {
              itemWithCompany.stockGroupId = uncategorizedGroup.id;
            }
            const parsed = insertStockItemSchema.parse(itemWithCompany);
            const existing = await storage.getStockItemByCode(
              parsed.code,
              req.session.currentCompanyId
            );
            if (existing) {
              results.skipped.push({
                code: parsed.code,
                name: parsed.name,
                reason: "Code already exists"
              });
              continue;
            }
            const created = await storage.createStockItem(parsed);
            results.created.push(created);
          } catch (error) {
            results.errors.push({
              code: item.code,
              name: item.name,
              error: error.message
            });
          }
        }
        res.json({
          message: `Import completed: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`,
          results
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.patch(
    "/api/stock-items/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const stockItemId = parseInt(req.params.id);
        if (isNaN(stockItemId)) {
          return res.status(400).json({ message: "Invalid stock item ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const existingItem = await storage.getStockItemById(stockItemId);
        if (!existingItem) {
          return res.status(404).json({ message: "Stock item not found" });
        }
        if (existingItem.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Stock item belongs to a different company"
          });
        }
        const updates = {};
        if (req.body.code !== void 0) {
          const trimmedCode = String(req.body.code).trim();
          if (trimmedCode === "") {
            return res.status(400).json({ message: "Code is required" });
          }
          updates.code = trimmedCode;
        }
        if (req.body.name !== void 0) {
          const trimmedName = String(req.body.name).trim();
          if (trimmedName === "") {
            return res.status(400).json({ message: "Name is required" });
          }
          updates.name = trimmedName;
        }
        if (req.body.uom !== void 0) {
          const trimmedUom = String(req.body.uom).trim();
          if (trimmedUom === "") {
            return res.status(400).json({ message: "Unit of measure is required" });
          }
          updates.uom = trimmedUom;
        }
        if (req.body.barcode !== void 0) {
          updates.barcode = req.body.barcode ? String(req.body.barcode).trim() : null;
        }
        if (req.body.stockGroupId !== void 0) {
          updates.stockGroupId = req.body.stockGroupId;
        }
        if (req.body.sellingPrice !== void 0) {
          updates.sellingPrice = req.body.sellingPrice ? String(req.body.sellingPrice) : "0";
        }
        if (req.body.active !== void 0) {
          updates.active = req.body.active;
        }
        if (updates.code && updates.code !== existingItem.code) {
          const duplicate = await storage.getStockItemByCode(
            updates.code,
            req.session.currentCompanyId
          );
          if (duplicate) {
            return res.status(400).json({ message: "Stock item code already exists" });
          }
        }
        const updated = await storage.updateStockItem(stockItemId, updates);
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.delete(
    "/api/stock-items/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const stockItemId = parseInt(req.params.id);
        if (isNaN(stockItemId)) {
          return res.status(400).json({ message: "Invalid stock item ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const existingItem = await storage.getStockItemById(stockItemId);
        if (!existingItem) {
          return res.status(404).json({ message: "Stock item not found" });
        }
        if (existingItem.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Stock item belongs to a different company"
          });
        }
        const inventoryLocations = await storage.getInventoryLocationsByItem(
          stockItemId,
          req.session.currentCompanyId
        );
        const hasInventory = inventoryLocations.some(
          (loc) => parseFloat(loc.quantity) > 0
        );
        if (hasInventory) {
          return res.status(400).json({
            message: "Cannot delete stock item with existing inventory. Please transfer or adjust inventory to zero first."
          });
        }
        await storage.deleteStockItem(stockItemId);
        res.json({ message: "Stock item deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/stock-items/:id/transactions",
    requireAuth,
    async (req, res) => {
      try {
        const stockItemId = parseInt(req.params.id);
        if (isNaN(stockItemId)) {
          return res.status(400).json({ message: "Invalid stock item ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const existingItem = await storage.getStockItemById(stockItemId);
        if (!existingItem) {
          return res.status(404).json({ message: "Stock item not found" });
        }
        if (existingItem.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Stock item belongs to a different company"
          });
        }
        const { startDate, endDate } = req.query;
        const transactions = await storage.getStockItemTransactions(
          stockItemId,
          req.session.currentCompanyId,
          startDate,
          endDate
        );
        res.json(transactions);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/stock-items/:id/details", requireAuth, async (req, res) => {
    try {
      const stockItemId = parseInt(req.params.id);
      if (isNaN(stockItemId)) {
        return res.status(400).json({ message: "Invalid stock item ID" });
      }
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const existingItem = await storage.getStockItemById(stockItemId);
      if (!existingItem) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      if (existingItem.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Stock item belongs to a different company"
        });
      }
      const [purchases, sales, inventoryLocations] = await Promise.all([
        storage.getAllPurchasesForItem(
          stockItemId,
          req.session.currentCompanyId
        ),
        storage.getAllSalesForItem(stockItemId, req.session.currentCompanyId),
        storage.getInventoryLocationsByItem(
          stockItemId,
          req.session.currentCompanyId
        )
      ]);
      res.json({
        purchases,
        sales,
        inventoryLocations
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stock-items/:id/voucher-history", requireAuth, async (req, res) => {
    try {
      const stockItemId = parseInt(req.params.id);
      if (isNaN(stockItemId)) {
        return res.status(400).json({ message: "Invalid stock item ID" });
      }
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const existingItem = await storage.getStockItemById(stockItemId);
      if (!existingItem) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      if (existingItem.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Stock item belongs to a different company"
        });
      }
      const voucherHistory = await storage.getVoucherHistoryForItem(stockItemId, req.session.currentCompanyId);
      res.json(voucherHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get(
    "/api/stock-items/:id/code-aliases",
    requireAuth,
    async (req, res) => {
      try {
        const stockItemId = parseInt(req.params.id);
        if (isNaN(stockItemId)) {
          return res.status(400).json({ message: "Invalid stock item ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const existingItem = await storage.getStockItemById(stockItemId);
        if (!existingItem) {
          return res.status(404).json({ message: "Stock item not found" });
        }
        if (existingItem.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Stock item belongs to a different company"
          });
        }
        const aliases = await storage.getStockItemCodeAliases(stockItemId);
        res.json(aliases);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/stock-items/:id/code-aliases",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const stockItemId = parseInt(req.params.id);
        if (isNaN(stockItemId)) {
          return res.status(400).json({ message: "Invalid stock item ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const existingItem = await storage.getStockItemById(stockItemId);
        if (!existingItem) {
          return res.status(404).json({ message: "Stock item not found" });
        }
        if (existingItem.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Stock item belongs to a different company"
          });
        }
        const validatedAlias = insertStockItemCodeAliasSchema.parse({
          ...req.body,
          stockItemId,
          companyId: req.session.currentCompanyId
        });
        const alias = await storage.createStockItemCodeAlias(validatedAlias);
        res.status(201).json(alias);
      } catch (error) {
        if (error.name === "ZodError") {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.delete(
    "/api/stock-item-code-aliases/:id",
    requireAuth,
    async (req, res) => {
      try {
        const aliasId = parseInt(req.params.id);
        if (isNaN(aliasId)) {
          return res.status(400).json({ message: "Invalid alias ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const alias = await storage.getStockItemCodeAliasById(aliasId);
        if (!alias) {
          return res.status(404).json({ message: "Code alias not found" });
        }
        if (alias.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Code alias belongs to a different company"
          });
        }
        await storage.deleteStockItemCodeAlias(aliasId);
        res.json({ message: "Code alias deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.patch("/api/stock-transfer-items/:id", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      if (req.body.quantity !== void 0) {
        const qty = parseFloat(req.body.quantity);
        if (isNaN(qty)) {
          return res.status(400).json({ message: "Quantity must be a valid number" });
        }
      }
      if (req.body.rate !== void 0) {
        const rate = parseFloat(req.body.rate);
        if (isNaN(rate) || rate < 0) {
          return res.status(400).json({ message: "Rate must be a valid non-negative number" });
        }
      }
      if (req.body.stockItemId !== void 0) {
        const stockItemId = parseInt(req.body.stockItemId);
        if (isNaN(stockItemId)) {
          return res.status(400).json({ message: "Stock item ID must be a valid number" });
        }
      }
      const updated = await storage.updateStockTransferItem(itemId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch(
    "/api/stock-adjustment-items/:id",
    requireAuth,
    async (req, res) => {
      try {
        const itemId = parseInt(req.params.id);
        if (isNaN(itemId)) {
          return res.status(400).json({ message: "Invalid item ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        if (req.body.quantity !== void 0) {
          const qty = parseFloat(req.body.quantity);
          if (isNaN(qty)) {
            return res.status(400).json({ message: "Quantity must be a valid number" });
          }
        }
        if (req.body.rate !== void 0) {
          const rate = parseFloat(req.body.rate);
          if (isNaN(rate) || rate < 0) {
            return res.status(400).json({ message: "Rate must be a valid non-negative number" });
          }
        }
        if (req.body.stockItemId !== void 0) {
          const stockItemId = parseInt(req.body.stockItemId);
          if (isNaN(stockItemId)) {
            return res.status(400).json({ message: "Stock item ID must be a valid number" });
          }
        }
        const updated = await storage.updateStockAdjustmentItem(
          itemId,
          req.body
        );
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/stock-query", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const allStockItems = await db.select({
        id: stockItems.id,
        code: stockItems.code,
        name: stockItems.name,
        uom: stockItems.uom,
        stockGroupId: stockItems.stockGroupId,
        stockGroupCode: stockGroups.code,
        stockGroupName: stockGroups.name,
        openingQty: stockItems.openingQty,
        openingRate: stockItems.openingRate,
        openingValue: stockItems.openingValue,
        sellingPrice: stockItems.sellingPrice,
        active: stockItems.active
      }).from(stockItems).leftJoin(stockGroups, eq2(stockItems.stockGroupId, stockGroups.id)).where(eq2(stockItems.companyId, req.session.currentCompanyId));
      const inventoryRecords = await db.select({
        stockItemId: inventory.stockItemId,
        quantity: inventory.quantity,
        totalValue: inventory.totalValue
      }).from(inventory).innerJoin(locations, eq2(inventory.locationId, locations.id)).where(eq2(locations.companyId, req.session.currentCompanyId));
      const inventoryMap = /* @__PURE__ */ new Map();
      for (const record of inventoryRecords) {
        const existing = inventoryMap.get(record.stockItemId) || {
          totalQty: 0,
          totalValue: 0
        };
        existing.totalQty += parseFloat(record.quantity || "0");
        existing.totalValue += parseFloat(record.totalValue || "0");
        inventoryMap.set(record.stockItemId, existing);
      }
      const result = allStockItems.map((item) => {
        const inv = inventoryMap.get(item.id) || { totalQty: 0, totalValue: 0 };
        return {
          ...item,
          currentQty: inv.totalQty.toFixed(3),
          currentValue: inv.totalValue.toFixed(2)
        };
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/bank-accounts", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const accounts = await storage.getAllBankAccounts(
        req.session.currentCompanyId
      );
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/bank-accounts", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const parsed = insertBankAccountSchema.parse(req.body);
      const existing = await storage.getBankAccountByCode(parsed.code);
      if (existing) {
        return res.status(400).json({ message: "Bank account code already exists" });
      }
      const hasBalance = parsed.openingBalance && parseFloat(parsed.openingBalance) !== 0;
      const hasSide = parsed.openingBalanceSide !== void 0 && parsed.openingBalanceSide !== null;
      if (hasBalance && !hasSide) {
        return res.status(400).json({ message: "Opening balance requires Dr/Cr side" });
      }
      if (!hasBalance && hasSide) {
        return res.status(400).json({ message: "Dr/Cr side requires opening balance amount" });
      }
      if (parsed.linkedLedgerId) {
        const allLedgers = await storage.getAllLedgerAccounts(
          req.session.currentCompanyId
        );
        const linkedLedger = allLedgers.find(
          (l) => l.id === parsed.linkedLedgerId
        );
        if (!linkedLedger) {
          return res.status(400).json({ message: "Linked ledger account not found" });
        }
        if (linkedLedger.accountType !== "Bank" && linkedLedger.accountType !== "Cash") {
          return res.status(400).json({
            message: `Linked ledger must be Bank or Cash type. Found: ${linkedLedger.accountType}`
          });
        }
      }
      const account = await storage.createBankAccount(parsed);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.put("/api/bank-accounts/:id", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      const parsed = insertBankAccountSchema.partial().parse(req.body);
      const hasBalance = parsed.openingBalance && parseFloat(parsed.openingBalance) !== 0;
      const hasSide = parsed.openingBalanceSide !== void 0 && parsed.openingBalanceSide !== null;
      if (hasBalance && !hasSide) {
        return res.status(400).json({ message: "Opening balance requires Dr/Cr side" });
      }
      if (!hasBalance && hasSide) {
        return res.status(400).json({ message: "Dr/Cr side requires opening balance amount" });
      }
      const account = await storage.updateBankAccount(id, parsed, req.session.currentCompanyId);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/bank-accounts/:id", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      await storage.deleteBankAccount(id, req.session.currentCompanyId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/fixed-assets", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const assets = await storage.getAllFixedAssets(
        req.session.currentCompanyId
      );
      const transformedAssets = assets.map((asset) => ({
        ...asset,
        assetCode: asset.code,
        assetName: asset.name
      }));
      res.json(transformedAssets);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/fixed-assets", async (req, res) => {
    try {
      const parsed = insertFixedAssetSchema.parse(req.body);
      const existing = await storage.getFixedAssetByCode(parsed.code);
      if (existing) {
        return res.status(400).json({ message: "Fixed asset code already exists" });
      }
      if (parsed.depreciationMethod !== "None" && (!parsed.usefulLife || parsed.usefulLife <= 0)) {
        return res.status(400).json({
          message: "Useful life (years) is required and must be greater than 0 when depreciation method is not 'None'"
        });
      }
      const asset = await storage.createFixedAsset(parsed);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.post(
    "/api/po-import/parse",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        if (rawData.length === 0) {
          return res.status(400).json({ message: "Excel file is empty" });
        }
        const fileHash = crypto.MD5(req.file.buffer.toString("base64")).toString();
        const existingImport = await storage.getImportLogByHash(fileHash);
        if (existingImport) {
          return res.status(400).json({
            message: "This file has already been imported",
            importedAt: existingImport.createdAt,
            containerId: existingImport.containerId
          });
        }
        const rows = rawData;
        const errors = [];
        const itemRows = [];
        const chargeRows = [];
        const allStockItems = await storage.getAllStockItems(
          req.session.currentCompanyId
        );
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;
          if (row.Charge_Type && row.Charge_Amount) {
            chargeRows.push({
              rowNum,
              chargeType: row.Charge_Type,
              amount: parseFloat(row.Charge_Amount),
              containerNumber: row.Container_Number
            });
          } else if (row.Item_Barcode || row.Item_Name) {
            let stockItem = null;
            let itemName = row.Item_Name;
            if (row.Item_Barcode) {
              stockItem = await storage.getStockItemByCodeOrAlias(
                row.Item_Barcode,
                req.session.currentCompanyId
              );
              if (stockItem) {
                itemName = stockItem.name;
              }
            } else if (row.Item_Name) {
              stockItem = allStockItems.find(
                (item) => item.name === row.Item_Name
              );
            }
            const quantity = parseFloat(row.Quantity);
            const rate = parseFloat(row.Rate);
            if (!quantity || quantity <= 0) {
              errors.push(`Row ${rowNum}: Quantity must be greater than 0`);
              continue;
            }
            if (rate === void 0 || rate < 0) {
              errors.push(`Row ${rowNum}: Rate must be non-negative`);
              continue;
            }
            itemRows.push({
              rowNum,
              poNumber: row.PO_Number,
              containerNumber: row.Container_Number,
              supplierCode: row.Supplier_Code,
              barcode: row.Item_Barcode || null,
              stockItemId: stockItem?.id || null,
              itemName,
              quantity,
              rate,
              lineTotal: quantity * rate,
              currency: row.Currency || "USD",
              freight: parseFloat(row.Freight || 0),
              surcharge: parseFloat(row.Surcharge || 0),
              fumigation: parseFloat(row.Fumigation || 0),
              discount: parseFloat(row.Discount || 0),
              documentCharges: parseFloat(row.Document_Charges || 0)
            });
          }
        }
        if (errors.length > 0) {
          return res.status(400).json({ message: "Validation errors", errors });
        }
        if (itemRows.length === 0) {
          return res.status(400).json({ message: "No valid item rows found" });
        }
        const containerGroups = itemRows.reduce(
          (acc, row) => {
            if (!acc[row.containerNumber]) {
              acc[row.containerNumber] = {
                containerNumber: row.containerNumber,
                supplierCode: row.supplierCode,
                items: [],
                pos: /* @__PURE__ */ new Map()
              };
            }
            const container = acc[row.containerNumber];
            container.items.push(row);
            if (!container.pos.has(row.poNumber)) {
              container.pos.set(row.poNumber, []);
            }
            container.pos.get(row.poNumber).push(row);
            return acc;
          },
          {}
        );
        const preview = Object.values(containerGroups).map((container) => {
          const itemsTotal = container.items.reduce(
            (sum, item) => sum + item.lineTotal,
            0
          );
          const charges = {
            freight: 0,
            surcharge: 0,
            fumigation: 0,
            discount: 0,
            documentCharges: 0
          };
          const containerCharges2 = chargeRows.filter(
            (c) => c.containerNumber === container.containerNumber
          );
          if (containerCharges2.length > 0) {
            containerCharges2.forEach((charge) => {
              const chargeType = charge.chargeType.toLowerCase().replace(/[_\s]/g, "");
              if (chargeType === "freight") charges.freight = charge.amount;
              else if (chargeType === "surcharge")
                charges.surcharge = charge.amount;
              else if (chargeType === "fumigation")
                charges.fumigation = charge.amount;
              else if (chargeType === "discount")
                charges.discount = charge.amount;
              else if (chargeType.includes("document"))
                charges.documentCharges = charge.amount;
            });
          } else {
            container.items.forEach((item) => {
              charges.freight += item.freight;
              charges.surcharge += item.surcharge;
              charges.fumigation += item.fumigation;
              charges.discount += item.discount;
              charges.documentCharges += item.documentCharges;
            });
          }
          const chargesTotal = charges.freight + charges.surcharge + charges.fumigation + charges.documentCharges - charges.discount;
          const grandTotal = itemsTotal + chargesTotal;
          return {
            containerNumber: container.containerNumber,
            supplierCode: container.supplierCode,
            itemsCount: container.items.length,
            posCount: container.pos.size,
            itemsTotal,
            charges,
            chargesTotal,
            grandTotal,
            items: container.items,
            pos: Array.from(container.pos.keys())
          };
        });
        res.json({
          fileHash,
          fileName: req.file.originalname,
          rowCount: rows.length,
          preview
        });
      } catch (error) {
        console.error("PO Import parse error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post("/api/po-import/validate", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { containerNumber, supplierId, preview } = req.body;
      if (!containerNumber || !supplierId || !preview) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const errors = [];
      const allSuppliers = await storage.getAllSuppliers();
      const supplier = allSuppliers.find((s) => s.id === supplierId);
      if (!supplier) {
        errors.push("Selected supplier not found");
      }
      const allStockItems = await storage.getAllStockItems(
        req.session.currentCompanyId
      );
      const containerPreview = preview.find(
        (p) => p.containerNumber === containerNumber
      );
      if (!containerPreview) {
        errors.push("Container data not found in preview");
      } else {
        const seenBarcodes = /* @__PURE__ */ new Set();
        for (const item of containerPreview.items) {
          if (item.barcode && seenBarcodes.has(item.barcode)) {
            errors.push(`Duplicate barcode in import: ${item.barcode}`);
          } else if (item.barcode) {
            seenBarcodes.add(item.barcode);
          }
          let stockItem = null;
          if (item.barcode) {
            stockItem = await storage.getStockItemByCodeOrAlias(
              item.barcode,
              req.session.currentCompanyId
            );
          }
          if (!stockItem && item.itemName) {
            stockItem = allStockItems.find((si) => si.name === item.itemName);
          }
          if (!stockItem) {
            if (item.barcode) {
              errors.push(
                `Item not found: code ${item.barcode} (${item.itemName})`
              );
            } else {
              errors.push(`Item not found by name: ${item.itemName}`);
            }
          }
        }
      }
      res.json({
        valid: errors.length === 0,
        errors
      });
    } catch (error) {
      console.error("PO Import validation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/po-import/import", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const {
        fileHash,
        fileName,
        containerNumber,
        supplierId,
        importDate,
        preview
      } = req.body;
      if (!fileHash || !containerNumber || !supplierId || !importDate || !preview) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const validationErrors = [];
      const allSuppliers = await storage.getAllSuppliers();
      const supplier = allSuppliers.find((s) => s.id === supplierId);
      if (!supplier) {
        validationErrors.push("Selected supplier not found");
      }
      const allStockItems = await storage.getAllStockItems(
        req.session.currentCompanyId
      );
      const containerPreview = preview.find(
        (p) => p.containerNumber === containerNumber
      );
      if (!containerPreview) {
        validationErrors.push("Container data not found in preview");
      } else {
        const seenBarcodes = /* @__PURE__ */ new Set();
        for (const item of containerPreview.items) {
          if (item.barcode && seenBarcodes.has(item.barcode)) {
            validationErrors.push(
              `Duplicate barcode in import: ${item.barcode}`
            );
          } else if (item.barcode) {
            seenBarcodes.add(item.barcode);
          }
          let stockItem = null;
          if (item.barcode) {
            stockItem = await storage.getStockItemByCodeOrAlias(
              item.barcode,
              req.session.currentCompanyId
            );
          }
          if (!stockItem && item.itemName) {
            stockItem = allStockItems.find((si) => si.name === item.itemName);
          }
          if (!stockItem) {
            if (item.barcode) {
              validationErrors.push(
                `Item not found: code ${item.barcode} (${item.itemName})`
              );
            } else {
              validationErrors.push(`Item not found by name: ${item.itemName}`);
            }
          }
        }
      }
      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationErrors
        });
      }
      const existingImport = await storage.getImportLogByHash(fileHash);
      if (existingImport) {
        return res.status(400).json({ message: "This file has already been imported" });
      }
      let container = await storage.getContainerByNumber(containerNumber);
      if (!container) {
        container = await storage.createContainer({
          companyId: req.session.currentCompanyId,
          containerNumber,
          supplierId,
          status: "OTW",
          importDate,
          itemsTotal: containerPreview.itemsTotal.toString(),
          chargesTotal: containerPreview.chargesTotal.toString(),
          grandTotal: containerPreview.grandTotal.toString()
        });
      } else {
        await storage.updateContainer(container.id, {
          itemsTotal: (parseFloat(container.itemsTotal || "0") + containerPreview.itemsTotal).toString(),
          chargesTotal: (parseFloat(container.chargesTotal || "0") + containerPreview.chargesTotal).toString(),
          grandTotal: (parseFloat(container.grandTotal || "0") + containerPreview.grandTotal).toString()
        });
      }
      const poGroups = containerPreview.items.reduce((acc, item) => {
        if (!acc[item.poNumber]) {
          acc[item.poNumber] = [];
        }
        acc[item.poNumber].push(item);
        return acc;
      }, {});
      const freshStockItems = await storage.getAllStockItems(
        req.session.currentCompanyId
      );
      let purchasesAccount = await storage.getLedgerAccountByCode("PURCHASES", req.session.currentCompanyId);
      if (!purchasesAccount) {
        purchasesAccount = await storage.createLedgerAccount({
          companyId: req.session.currentCompanyId,
          code: "PURCHASES",
          name: "Purchases",
          accountType: "Expense",
          openingBalance: "0",
          openingBalanceSide: "Dr",
          active: true
        });
      }
      let importChargesAccount = await storage.getLedgerAccountByCode("IMPORT_CHARGES", req.session.currentCompanyId);
      if (!importChargesAccount) {
        importChargesAccount = await storage.createLedgerAccount({
          companyId: req.session.currentCompanyId,
          code: "IMPORT_CHARGES",
          name: "Import Charges",
          accountType: "Expense",
          openingBalance: "0",
          openingBalanceSide: "Dr",
          active: true
        });
      }
      for (const [poNumber, items] of Object.entries(poGroups)) {
        const poItems = items;
        const poTotal = poItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const voucher = await storage.createVoucher({
          companyId: req.session.currentCompanyId,
          voucherNumber: `PO-${poNumber}-${Date.now()}`,
          voucherType: "Purchase",
          voucherDate: importDate,
          description: `Purchase Order ${poNumber} - Container ${containerNumber}`,
          totalAmount: poTotal.toString(),
          optional: false
        });
        await storage.createVoucherEntry({
          voucherId: voucher.id,
          ledgerAccountId: purchasesAccount.id,
          debitAmount: poTotal.toString(),
          creditAmount: "0",
          narration: `PO ${poNumber} - Container ${containerNumber}`
        });
        await storage.createVoucherEntry({
          voucherId: voucher.id,
          supplierId,
          debitAmount: "0",
          creditAmount: poTotal.toString(),
          narration: `PO ${poNumber} - Container ${containerNumber}`
        });
        const po = await storage.createPurchaseOrder({
          companyId: req.session.currentCompanyId,
          poNumber,
          containerId: container.id,
          supplierId,
          voucherId: voucher.id,
          currency: poItems[0].currency,
          itemsTotal: poTotal.toString()
        });
        for (const item of poItems) {
          let stockItemId = item.stockItemId;
          let stockItem = null;
          if (item.barcode) {
            stockItem = await storage.getStockItemByCodeOrAlias(
              item.barcode,
              req.session.currentCompanyId
            );
          }
          if (!stockItem && item.itemName) {
            stockItem = freshStockItems.find((si) => si.name === item.itemName);
          }
          if (stockItem) {
            stockItemId = stockItem.id;
          }
          if (!stockItemId) {
            return res.status(400).json({
              message: `Stock item not found: ${item.barcode || item.itemName}. Please ensure all items exist before importing.`
            });
          }
          await storage.createPOLineItem({
            poId: po.id,
            stockItemId,
            itemName: item.itemName,
            quantity: item.quantity.toString(),
            rate: item.rate.toString(),
            lineTotal: item.lineTotal.toString()
          });
        }
      }
      const charges = containerPreview.charges;
      const chargeTypes = [
        { type: "Freight", amount: charges.freight, isNegative: false },
        { type: "Surcharge", amount: charges.surcharge, isNegative: false },
        { type: "Fumigation", amount: charges.fumigation, isNegative: false },
        { type: "Discount", amount: charges.discount, isNegative: true },
        {
          type: "Document Charges",
          amount: charges.documentCharges,
          isNegative: false
        }
      ];
      for (const charge of chargeTypes) {
        if (charge.amount > 0) {
          const actualAmount = charge.isNegative ? -charge.amount : charge.amount;
          await storage.createContainerCharge({
            containerId: container.id,
            chargeType: charge.type,
            amount: actualAmount.toString()
          });
          const chargeVoucher = await storage.createVoucher({
            companyId: req.session.currentCompanyId,
            voucherNumber: `CHARGE-${containerNumber}-${charge.type.toUpperCase().replace(/\s+/g, "_")}-${Date.now()}`,
            voucherType: "Purchase",
            voucherDate: importDate,
            description: `${charge.type} - Container ${containerNumber}`,
            totalAmount: Math.abs(actualAmount).toString(),
            optional: false
          });
          if (!charge.isNegative) {
            await storage.createVoucherEntry({
              voucherId: chargeVoucher.id,
              ledgerAccountId: importChargesAccount.id,
              debitAmount: actualAmount.toString(),
              creditAmount: "0",
              narration: `${charge.type} - Container ${containerNumber}`
            });
            await storage.createVoucherEntry({
              voucherId: chargeVoucher.id,
              supplierId,
              debitAmount: "0",
              creditAmount: actualAmount.toString(),
              narration: `${charge.type} - Container ${containerNumber}`
            });
          } else {
            await storage.createVoucherEntry({
              voucherId: chargeVoucher.id,
              ledgerAccountId: importChargesAccount.id,
              debitAmount: "0",
              creditAmount: Math.abs(actualAmount).toString(),
              narration: `${charge.type} - Container ${containerNumber}`
            });
            await storage.createVoucherEntry({
              voucherId: chargeVoucher.id,
              supplierId,
              debitAmount: Math.abs(actualAmount).toString(),
              creditAmount: "0",
              narration: `${charge.type} - Container ${containerNumber}`
            });
          }
        }
      }
      await storage.createImportLog({
        fileName,
        fileHash,
        rowCount: containerPreview.items.length,
        containerId: container.id,
        status: "Success"
      });
      res.json({
        success: true,
        containerId: container.id,
        containerNumber: container.containerNumber,
        itemsCount: containerPreview.itemsCount,
        grandTotal: containerPreview.grandTotal
      });
    } catch (error) {
      console.error("PO Import error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/po-import/template", (_req, res) => {
    try {
      const sampleData = [
        {
          PO_Number: "PO-2024-001",
          Container_Number: "CONT-2024-001",
          Supplier_Code: "SUP-001",
          Item_Barcode: "BC001",
          Item_Name: "Men's Jeans Mix - Grade A",
          Quantity: 100,
          Rate: 5.5,
          Currency: "USD",
          Freight: 500,
          Surcharge: 50,
          Fumigation: 100,
          Discount: 0,
          Document_Charges: 75
        },
        {
          PO_Number: "PO-2024-001",
          Container_Number: "CONT-2024-001",
          Supplier_Code: "SUP-001",
          Item_Barcode: "BC002",
          Item_Name: "Women's Tops Mix - Grade A",
          Quantity: 150,
          Rate: 4.25,
          Currency: "USD",
          Freight: 0,
          Surcharge: 0,
          Fumigation: 0,
          Discount: 0,
          Document_Charges: 0
        },
        {
          PO_Number: "PO-2024-001",
          Container_Number: "CONT-2024-001",
          Supplier_Code: "SUP-001",
          Item_Barcode: "BC003",
          Item_Name: "Kids Clothing Mix - Grade B",
          Quantity: 80,
          Rate: 3.75,
          Currency: "USD",
          Freight: 0,
          Surcharge: 0,
          Fumigation: 0,
          Discount: 0,
          Document_Charges: 0
        },
        {
          PO_Number: "PO-2024-002",
          Container_Number: "CONT-2024-001",
          Supplier_Code: "SUP-001",
          Item_Barcode: "BC004",
          Item_Name: "Men's Shirts Mix - Premium",
          Quantity: 120,
          Rate: 6,
          Currency: "USD",
          Freight: 0,
          Surcharge: 0,
          Fumigation: 0,
          Discount: 0,
          Document_Charges: 0
        },
        {
          PO_Number: "PO-2024-002",
          Container_Number: "CONT-2024-001",
          Supplier_Code: "SUP-001",
          Item_Barcode: "BC005",
          Item_Name: "Women's Dresses Mix - Grade A",
          Quantity: 90,
          Rate: 7.5,
          Currency: "USD",
          Freight: 0,
          Surcharge: 0,
          Fumigation: 0,
          Discount: 50,
          Document_Charges: 0
        }
      ];
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "PO Import");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=PO_Import_Template.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/pos-import/parse",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        if (rawData.length === 0) {
          return res.status(400).json({ message: "Excel file is empty" });
        }
        const rows = rawData;
        const items = [];
        let totalValue = 0;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;
          const barcode = row.Barcode || row.barcode || row.Code || row.code;
          const quantity = parseFloat(
            row.Quantity || row.quantity || row.Qty || row.qty || "0"
          );
          const rate = parseFloat(
            row.Rate || row.rate || row.Price || row.price || "0"
          );
          if (!barcode) {
            continue;
          }
          if (quantity <= 0 || rate <= 0) {
            continue;
          }
          const itemValue = quantity * rate;
          totalValue += itemValue;
          items.push({
            rowNum,
            barcode: barcode.toString().trim(),
            quantity,
            rate,
            value: itemValue
          });
        }
        res.json({
          items,
          totalValue,
          fileName: req.file.originalname
        });
      } catch (error) {
        console.error("POS Import parse error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post("/api/pos-import/validate", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { locationId, items } = req.body;
      if (!locationId || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const errors = [];
      const warnings = [];
      const validatedItems = [];
      const location = await storage.getLocationById(locationId);
      if (!location) {
        errors.push("Selected location not found");
        return res.json({ errors, warnings, validatedItems });
      }
      const allStockItems = await storage.getAllStockItems(
        req.session.currentCompanyId
      );
      for (const item of items) {
        const validatedItem = { ...item };
        let stockItem = await storage.getStockItemByCodeOrAlias(
          item.barcode,
          req.session.currentCompanyId
        );
        if (!stockItem) {
          validatedItem.error = `Barcode '${item.barcode}' not found in stock items`;
          errors.push(
            `Row ${item.rowNum}: Barcode '${item.barcode}' not found`
          );
        } else {
          validatedItem.stockItemId = stockItem.id;
          validatedItem.stockItemName = stockItem.name;
          validatedItem.stockItemUom = stockItem.uom;
          const inventoryItem = await db.select().from(inventory).where(
            and2(
              eq2(inventory.stockItemId, stockItem.id),
              eq2(inventory.locationId, locationId)
            )
          ).limit(1);
          if (inventoryItem.length > 0) {
            validatedItem.costPrice = parseFloat(
              inventoryItem[0].averageRate || "0"
            );
            const currentQty = parseFloat(inventoryItem[0].quantity || "0");
            const saleQty = parseFloat(item.quantity);
            const remainingQty = currentQty - saleQty;
            validatedItem.currentStock = currentQty;
            validatedItem.remainingStock = remainingQty;
            if (remainingQty < 0) {
              validatedItem.warning = `Stock will go negative (${remainingQty.toFixed(2)} ${stockItem.uom})`;
              warnings.push(
                `${stockItem.name}: Stock will go negative (Current: ${currentQty.toFixed(2)}, Selling: ${saleQty.toFixed(2)}, Remaining: ${remainingQty.toFixed(2)} ${stockItem.uom})`
              );
            } else if (remainingQty === 0) {
              validatedItem.warning = `Stock will reach zero`;
              warnings.push(
                `${stockItem.name}: Stock will reach zero (Current: ${currentQty.toFixed(2)}, Selling: ${saleQty.toFixed(2)} ${stockItem.uom})`
              );
            }
          } else {
            validatedItem.currentStock = 0;
            validatedItem.remainingStock = -parseFloat(item.quantity);
            validatedItem.warning = `No stock at this location, will go negative`;
            warnings.push(
              `${stockItem.name}: No stock at this location (Selling: ${item.quantity} ${stockItem.uom})`
            );
          }
        }
        validatedItems.push(validatedItem);
      }
      res.json({
        errors,
        warnings,
        validatedItems
      });
    } catch (error) {
      console.error("POS Import validation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/pos-import/import", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { locationId, saleDate, items, cashAccountId } = req.body;
      if (!locationId || !saleDate || !items || !Array.isArray(items) || !cashAccountId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const location = await storage.getLocationById(locationId);
      if (!location) {
        return res.status(400).json({ message: "Location not found" });
      }
      const cashAccount = await storage.getLedgerAccountById(cashAccountId);
      if (!cashAccount || cashAccount.companyId !== req.session.currentCompanyId) {
        return res.status(400).json({ message: "Invalid cash account" });
      }
      let salesRevenueAccount = await storage.getLedgerAccountByCode("SALES_REV", req.session.currentCompanyId);
      if (!salesRevenueAccount) {
        salesRevenueAccount = await storage.createLedgerAccount({
          companyId: req.session.currentCompanyId,
          code: "SALES_REV",
          name: "Sales Revenue",
          accountType: "Income",
          subType: "Direct Income",
          openingBalance: "0",
          openingBalanceSide: "Cr",
          active: true
        });
      }
      let cogsAccount = await storage.getLedgerAccountByCode("COGS", req.session.currentCompanyId);
      if (!cogsAccount) {
        cogsAccount = await storage.createLedgerAccount({
          companyId: req.session.currentCompanyId,
          code: "COGS",
          name: "Cost of Goods Sold",
          accountType: "Expense",
          subType: "Direct Expense",
          openingBalance: "0",
          openingBalanceSide: "Dr",
          active: true
        });
      }
      let totalSales = 0;
      await db.transaction(async (tx) => {
        const voucherNumber = `SALES-${Date.now()}`;
        const [voucher] = await tx.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          locationId,
          locationName: location.name,
          voucherNumber,
          voucherType: "Sales",
          voucherDate: saleDate,
          description: `POS Import - ${items.length} items`,
          totalAmount: "0",
          // Will be updated with actual total
          optional: false
        }).returning();
        for (const item of items) {
          const stockItem = await storage.getStockItemByCodeOrAlias(
            item.barcode,
            req.session.currentCompanyId
          );
          if (!stockItem) {
            throw new Error(
              `Stock item not found for barcode: ${item.barcode}`
            );
          }
          const [inventoryRecord] = await tx.select().from(inventory).where(
            and2(
              eq2(inventory.stockItemId, stockItem.id),
              eq2(inventory.locationId, locationId)
            )
          ).limit(1);
          let costPrice = 0;
          let currentQty = 0;
          if (inventoryRecord) {
            costPrice = parseFloat(inventoryRecord.averageRate || "0");
            currentQty = parseFloat(inventoryRecord.quantity);
          }
          const itemSales = item.quantity * item.rate;
          const itemCost = item.quantity * costPrice;
          const profit = itemSales - itemCost;
          totalSales += itemSales;
          await tx.insert(salesItems).values({
            voucherId: voucher.id,
            stockItemId: stockItem.id,
            quantity: item.quantity.toString(),
            sellingPrice: item.rate.toString(),
            costPrice: costPrice.toString(),
            totalSales: itemSales.toString(),
            totalCost: itemCost.toString(),
            profit: profit.toString()
          });
          if (inventoryRecord) {
            await tx.update(inventory).set({
              quantity: (currentQty - item.quantity).toString()
            }).where(
              and2(
                eq2(inventory.stockItemId, stockItem.id),
                eq2(inventory.locationId, locationId)
              )
            );
          } else {
            await tx.insert(inventory).values({
              companyId: req.session.currentCompanyId,
              locationId,
              stockItemId: stockItem.id,
              quantity: (-item.quantity).toString(),
              averageRate: "0",
              totalValue: "0"
            });
          }
        }
        await tx.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: cashAccountId,
          debitAmount: totalSales.toString(),
          creditAmount: "0",
          narration: `Cash from POS Sales - ${items.length} items`
        });
        await tx.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: salesRevenueAccount.id,
          debitAmount: "0",
          creditAmount: totalSales.toString(),
          narration: `Sales Revenue - ${items.length} items`
        });
        await tx.update(vouchers).set({
          totalAmount: totalSales.toString()
        }).where(eq2(vouchers.id, voucher.id));
      });
      res.json({
        success: true,
        itemsCount: items.length,
        totalSales: totalSales.toFixed(2)
      });
    } catch (error) {
      console.error("POS Import error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/pos-import/template", (_req, res) => {
    try {
      const sampleData = [
        {
          Barcode: "BC001",
          Quantity: 5,
          Rate: 25
        },
        {
          Barcode: "BC002",
          Quantity: 3,
          Rate: 35.5
        },
        {
          Barcode: "BC003",
          Quantity: 10,
          Rate: 15.75
        }
      ];
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "POS Import");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=POS_Import_Template.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/stock-transfer-import/parse",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        if (rawData.length === 0) {
          return res.status(400).json({ message: "Excel file is empty" });
        }
        const rows = rawData;
        const items = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;
          const barcode = row.Barcode || row.barcode || row.Code || row.code;
          const quantity = parseFloat(
            row.Quantity || row.quantity || row.Qty || row.qty || "0"
          );
          if (!barcode) {
            continue;
          }
          if (quantity <= 0) {
            continue;
          }
          items.push({
            rowNum,
            barcode: barcode.toString().trim(),
            quantity
          });
        }
        res.json({
          items,
          totalItems: items.length,
          fileName: req.file.originalname
        });
      } catch (error) {
        console.error("Stock Transfer Import parse error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post("/api/stock-transfer-import/validate", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { sourceLocationId, destinationLocationId, items } = req.body;
      if (!sourceLocationId || !destinationLocationId || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (sourceLocationId === destinationLocationId) {
        return res.status(400).json({ message: "Source and destination must be different" });
      }
      const errors = [];
      const warnings = [];
      const validatedItems = [];
      const sourceLocation = await storage.getLocationById(sourceLocationId);
      const destLocation = await storage.getLocationById(destinationLocationId);
      if (!sourceLocation) {
        errors.push("Source location not found");
        return res.json({ errors, warnings, validatedItems });
      }
      if (!destLocation) {
        errors.push("Destination location not found");
        return res.json({ errors, warnings, validatedItems });
      }
      for (const item of items) {
        const validatedItem = { ...item };
        let stockItem = await storage.getStockItemByCodeOrAlias(
          item.barcode,
          req.session.currentCompanyId
        );
        if (!stockItem) {
          validatedItem.error = `Barcode '${item.barcode}' not found in stock items`;
          errors.push(
            `Row ${item.rowNum}: Barcode '${item.barcode}' not found`
          );
        } else {
          validatedItem.stockItemId = stockItem.id;
          validatedItem.stockItemName = stockItem.name;
          validatedItem.stockItemUom = stockItem.uom;
          const [inventoryItem] = await db.select().from(inventory).where(
            and2(
              eq2(inventory.stockItemId, stockItem.id),
              eq2(inventory.locationId, sourceLocationId)
            )
          ).limit(1);
          if (inventoryItem) {
            const currentQty = parseFloat(inventoryItem.quantity || "0");
            const transferQty = parseFloat(item.quantity);
            const remainingQty = currentQty - transferQty;
            validatedItem.currentStock = currentQty;
            validatedItem.remainingStock = remainingQty;
            validatedItem.averageRate = inventoryItem.averageRate;
            if (remainingQty < 0) {
              validatedItem.warning = `Stock will go negative (Available: ${currentQty.toFixed(2)})`;
              warnings.push(
                `${stockItem.name}: Stock will go negative (Available: ${currentQty.toFixed(2)}, Requested: ${transferQty.toFixed(2)})`
              );
            }
          } else {
            validatedItem.currentStock = 0;
            validatedItem.remainingStock = -parseFloat(item.quantity);
            validatedItem.averageRate = "0";
            validatedItem.warning = `No stock at source location, will go negative`;
            warnings.push(
              `${stockItem.name}: No stock at source location`
            );
          }
        }
        validatedItems.push(validatedItem);
      }
      res.json({
        errors,
        warnings,
        validatedItems
      });
    } catch (error) {
      console.error("Stock Transfer Import validation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/stock-transfer-import/import", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { sourceLocationId, destinationLocationId, transferDate, items, notes } = req.body;
      if (!sourceLocationId || !destinationLocationId || !transferDate || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const sourceLocation = await storage.getLocationById(sourceLocationId);
      const destLocation = await storage.getLocationById(destinationLocationId);
      if (!sourceLocation) {
        return res.status(400).json({ message: "Source location not found" });
      }
      if (!destLocation) {
        return res.status(400).json({ message: "Destination location not found" });
      }
      let totalValue = 0;
      const transferItems = [];
      for (const item of items) {
        const stockItem = await storage.getStockItemByCodeOrAlias(
          item.barcode,
          req.session.currentCompanyId
        );
        if (!stockItem) {
          return res.status(400).json({ message: `Stock item not found: ${item.barcode}` });
        }
        const [inventoryItem] = await db.select().from(inventory).where(
          and2(
            eq2(inventory.stockItemId, stockItem.id),
            eq2(inventory.locationId, sourceLocationId)
          )
        ).limit(1);
        const rate = inventoryItem ? parseFloat(inventoryItem.averageRate || "0") : parseFloat(stockItem.sellingPrice || "0");
        const quantity = parseFloat(item.quantity);
        totalValue += rate * quantity;
        transferItems.push({
          stockItemId: stockItem.id,
          quantity: quantity.toString(),
          rate: rate.toString()
        });
      }
      await db.transaction(async (tx) => {
        const voucherNumber = `ST-${Date.now()}`;
        const [voucher] = await tx.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          locationId: sourceLocationId,
          locationName: sourceLocation.name,
          voucherNumber,
          voucherType: "Stock Transfer",
          voucherDate: transferDate,
          description: notes || `Excel Import - ${items.length} items from ${sourceLocation.name} to ${destLocation.name}`,
          totalAmount: totalValue.toString(),
          optional: false
        }).returning();
        const [transferRecord] = await tx.insert(stockTransferVouchers).values({
          voucherId: voucher.id,
          sourceLocationId,
          destinationLocationId
        }).returning();
        for (const item of transferItems) {
          const itemTotal = parseFloat(item.quantity) * parseFloat(item.rate);
          await tx.insert(stockTransferItems).values({
            transferId: transferRecord.id,
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            rate: item.rate,
            totalAmount: itemTotal.toString()
          });
          const [sourceInventory] = await tx.select().from(inventory).where(
            and2(
              eq2(inventory.stockItemId, item.stockItemId),
              eq2(inventory.locationId, sourceLocationId)
            )
          ).limit(1);
          if (sourceInventory) {
            const newQty = parseFloat(sourceInventory.quantity) - parseFloat(item.quantity);
            const newValue = newQty * parseFloat(sourceInventory.averageRate || "0");
            await tx.update(inventory).set({
              quantity: newQty.toString(),
              totalValue: newValue.toString()
            }).where(eq2(inventory.id, sourceInventory.id));
          } else {
            const negativeQty = -parseFloat(item.quantity);
            await tx.insert(inventory).values({
              companyId: req.session.currentCompanyId,
              locationId: sourceLocationId,
              stockItemId: item.stockItemId,
              quantity: negativeQty.toString(),
              averageRate: item.rate,
              totalValue: (negativeQty * parseFloat(item.rate)).toString()
            });
          }
          const [destInventory] = await tx.select().from(inventory).where(
            and2(
              eq2(inventory.stockItemId, item.stockItemId),
              eq2(inventory.locationId, destinationLocationId)
            )
          ).limit(1);
          if (destInventory) {
            const existingQty = parseFloat(destInventory.quantity);
            const existingRate = parseFloat(destInventory.averageRate || "0");
            const addQty = parseFloat(item.quantity);
            const addRate = parseFloat(item.rate);
            const newQty = existingQty + addQty;
            const newAvgRate = newQty > 0 ? (existingQty * existingRate + addQty * addRate) / newQty : 0;
            const newValue = newQty * newAvgRate;
            await tx.update(inventory).set({
              quantity: newQty.toString(),
              averageRate: newAvgRate.toString(),
              totalValue: newValue.toString()
            }).where(eq2(inventory.id, destInventory.id));
          } else {
            const qty = parseFloat(item.quantity);
            const rate = parseFloat(item.rate);
            await tx.insert(inventory).values({
              companyId: req.session.currentCompanyId,
              locationId: destinationLocationId,
              stockItemId: item.stockItemId,
              quantity: item.quantity,
              averageRate: item.rate,
              totalValue: (qty * rate).toString()
            });
          }
        }
      });
      res.json({
        success: true,
        itemsCount: items.length,
        totalValue: totalValue.toFixed(2)
      });
    } catch (error) {
      console.error("Stock Transfer Import error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stock-transfer-import/template", (_req, res) => {
    try {
      const sampleData = [
        {
          Barcode: "BC001",
          Quantity: 5
        },
        {
          Barcode: "BC002",
          Quantity: 10
        },
        {
          Barcode: "BC003",
          Quantity: 15
        }
      ];
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Transfer");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Stock_Transfer_Import_Template.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stock-transfer-import/template-multi-source", (_req, res) => {
    try {
      const sampleData = [
        {
          "Source Location": "Warehouse A",
          Barcode: "BC001",
          Quantity: 5
        },
        {
          "Source Location": "Warehouse B",
          Barcode: "BC002",
          Quantity: 10
        },
        {
          "Source Location": "Warehouse A",
          Barcode: "BC003",
          Quantity: 15
        }
      ];
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Transfer");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Stock_Transfer_Multi_Source_Template.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/stock-transfer-import/parse-multi-source",
    requireAuth,
    requireNonPOS,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        if (rawData.length === 0) {
          return res.status(400).json({ message: "Excel file is empty" });
        }
        const rows = rawData;
        const items = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;
          const sourceLocation = row["Source Location"] || row.SourceLocation || row.sourceLocation || row.source || "";
          const barcode = row.Barcode || row.barcode || row.Code || row.code;
          const quantity = parseFloat(
            row.Quantity || row.quantity || row.Qty || row.qty || "0"
          );
          if (!barcode) {
            continue;
          }
          if (quantity <= 0) {
            continue;
          }
          items.push({
            rowNum,
            sourceLocation: sourceLocation.toString().trim(),
            barcode: barcode.toString().trim(),
            quantity
          });
        }
        if (items.length === 0) {
          return res.status(400).json({
            message: "No valid items found in Excel file. Expected columns: Source Location, Barcode, Quantity"
          });
        }
        res.json({
          success: true,
          items
        });
      } catch (error) {
        console.error("Stock Transfer Parse error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post("/api/stock-transfer-import/validate-multi-source", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { destinationLocationId, items } = req.body;
      if (!destinationLocationId || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const errors = [];
      const warnings = [];
      const validatedItems = [];
      const destLocation = await storage.getLocationById(destinationLocationId);
      if (!destLocation) {
        errors.push("Destination location not found");
        return res.json({ errors, warnings, validatedItems });
      }
      const allLocations = await storage.getAllLocations(req.session.currentCompanyId);
      const locationsByName = {};
      allLocations.forEach((loc) => {
        locationsByName[loc.name.toLowerCase().trim()] = loc.id;
      });
      for (const item of items) {
        const validatedItem = { ...item };
        const sourceLocationName = item.sourceLocation?.toLowerCase().trim();
        if (!sourceLocationName) {
          validatedItem.error = "Source location is required";
          errors.push(`Row ${item.rowNum}: Source location is required`);
          validatedItems.push(validatedItem);
          continue;
        }
        const sourceLocationId = locationsByName[sourceLocationName];
        if (!sourceLocationId) {
          validatedItem.error = `Source location '${item.sourceLocation}' not found`;
          errors.push(`Row ${item.rowNum}: Source location '${item.sourceLocation}' not found`);
          validatedItems.push(validatedItem);
          continue;
        }
        if (sourceLocationId === destinationLocationId) {
          validatedItem.error = "Source and destination cannot be the same";
          errors.push(`Row ${item.rowNum}: Source and destination cannot be the same`);
          validatedItems.push(validatedItem);
          continue;
        }
        validatedItem.sourceLocationId = sourceLocationId;
        let stockItem = await storage.getStockItemByCodeOrAlias(
          item.barcode,
          req.session.currentCompanyId
        );
        if (!stockItem) {
          validatedItem.error = `Barcode '${item.barcode}' not found in stock items`;
          errors.push(`Row ${item.rowNum}: Barcode '${item.barcode}' not found`);
        } else {
          validatedItem.stockItemId = stockItem.id;
          validatedItem.stockItemName = stockItem.name;
          const inventoryResult = await db.select().from(inventory).where(
            and2(
              eq2(inventory.companyId, req.session.currentCompanyId),
              eq2(inventory.locationId, sourceLocationId),
              eq2(inventory.stockItemId, stockItem.id)
            )
          ).limit(1);
          const invRecord = inventoryResult[0];
          if (!invRecord) {
            validatedItem.warning = `No inventory at source location '${item.sourceLocation}', will go negative`;
            validatedItem.currentStock = 0;
            validatedItem.rate = "0";
            warnings.push(
              `Row ${item.rowNum}: '${stockItem.name}' has no inventory at '${item.sourceLocation}'`
            );
          } else {
            const currentQty = parseFloat(invRecord.quantity);
            validatedItem.currentStock = currentQty;
            validatedItem.rate = invRecord.averageRate;
            if (item.quantity > currentQty) {
              validatedItem.warning = `Stock will go negative (available: ${currentQty.toFixed(2)})`;
              warnings.push(
                `Row ${item.rowNum}: '${stockItem.name}' - requested ${item.quantity}, available ${currentQty.toFixed(2)}`
              );
            }
          }
        }
        validatedItems.push(validatedItem);
      }
      res.json({
        success: errors.length === 0,
        errors,
        warnings,
        validatedItems
      });
    } catch (error) {
      console.error("Stock Transfer Validate error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/stock-transfer-import/import-multi-source", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { destinationLocationId, transferDate, notes, items } = req.body;
      if (!destinationLocationId || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      for (const item of items) {
        if (!item.stockItemId || !item.sourceLocationId || !item.quantity || item.error) {
          return res.status(400).json({
            message: "Some items have validation errors. Please validate and fix before importing."
          });
        }
      }
      const destLocation = await storage.getLocationById(destinationLocationId);
      if (!destLocation || destLocation.companyId !== req.session.currentCompanyId) {
        return res.status(400).json({ message: "Destination location not found or access denied" });
      }
      const allLocations = await storage.getAllLocations(req.session.currentCompanyId);
      const locationsById = {};
      const validLocationIds = /* @__PURE__ */ new Set();
      allLocations.forEach((loc) => {
        locationsById[loc.id] = loc.name;
        validLocationIds.add(loc.id);
      });
      const processedItems = [];
      for (const item of items) {
        if (!validLocationIds.has(item.sourceLocationId)) {
          return res.status(400).json({
            message: `Source location ${item.sourceLocationId} not found or access denied`
          });
        }
        const stockItem = await storage.getStockItemById(item.stockItemId);
        if (!stockItem || stockItem.companyId !== req.session.currentCompanyId) {
          return res.status(400).json({
            message: `Stock item ${item.stockItemId} not found or access denied`
          });
        }
        if (item.sourceLocationId === destinationLocationId) {
          return res.status(400).json({
            message: "Source and destination locations cannot be the same"
          });
        }
        const sourceInv = await db.select().from(inventory).where(
          and2(
            eq2(inventory.companyId, req.session.currentCompanyId),
            eq2(inventory.locationId, item.sourceLocationId),
            eq2(inventory.stockItemId, item.stockItemId)
          )
        ).limit(1);
        const serverRate = sourceInv[0] ? parseFloat(sourceInv[0].averageRate || "0") : parseFloat(stockItem.sellingPrice || "0");
        const requestedQty = parseFloat(item.quantity);
        processedItems.push({
          stockItemId: item.stockItemId,
          sourceLocationId: item.sourceLocationId,
          quantity: requestedQty,
          rate: serverRate
        });
      }
      let totalValue = 0;
      for (const item of processedItems) {
        totalValue += item.rate * item.quantity;
      }
      await db.transaction(async (tx) => {
        const existingVouchers = await tx.select({ voucherNumber: vouchers.voucherNumber }).from(vouchers).where(
          and2(
            eq2(vouchers.companyId, req.session.currentCompanyId),
            eq2(vouchers.voucherType, "Stock Transfer")
          )
        ).orderBy(desc2(vouchers.id)).limit(1);
        let nextNumber = 1;
        if (existingVouchers.length > 0) {
          const lastNum = existingVouchers[0].voucherNumber;
          const numMatch = lastNum.match(/(\d+)$/);
          if (numMatch) {
            nextNumber = parseInt(numMatch[1]) + 1;
          }
        }
        const voucherNumber = `STI-${String(nextNumber).padStart(4, "0")}`;
        const [voucher] = await tx.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          voucherType: "Stock Transfer",
          voucherNumber,
          voucherDate: transferDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          description: notes || `Multi-source Stock Transfer Import (${processedItems.length} items)`,
          totalAmount: totalValue.toString(),
          optional: false,
          locationId: destinationLocationId,
          locationName: destLocation.name
        }).returning();
        const firstSourceId = processedItems[0]?.sourceLocationId || 0;
        const [transferRecord] = await tx.insert(stockTransferVouchers).values({
          voucherId: voucher.id,
          sourceLocationId: firstSourceId,
          destinationLocationId
        }).returning();
        for (const item of processedItems) {
          const sourceLocationId = item.sourceLocationId;
          const qty = item.quantity;
          const rate = item.rate;
          const itemTotal = qty * rate;
          await tx.insert(stockTransferItems).values({
            transferId: transferRecord.id,
            stockItemId: item.stockItemId,
            sourceLocationId,
            quantity: qty.toString(),
            rate: rate.toString(),
            totalAmount: itemTotal.toString()
          });
          const sourceInventory = await tx.select().from(inventory).where(
            and2(
              eq2(inventory.companyId, req.session.currentCompanyId),
              eq2(inventory.locationId, sourceLocationId),
              eq2(inventory.stockItemId, item.stockItemId)
            )
          ).limit(1);
          if (sourceInventory[0]) {
            const currentQty = parseFloat(sourceInventory[0].quantity);
            const currentValue = parseFloat(sourceInventory[0].totalValue);
            const deductValue = qty * rate;
            const newQty = currentQty - qty;
            const newValue = currentValue - deductValue;
            const newAvgRate = newQty > 0 ? newValue / newQty : newQty < 0 ? rate : 0;
            await tx.update(inventory).set({
              quantity: newQty.toString(),
              averageRate: newAvgRate.toString(),
              totalValue: newValue.toString()
            }).where(eq2(inventory.id, sourceInventory[0].id));
          } else {
            const negativeQty = -qty;
            await tx.insert(inventory).values({
              companyId: req.session.currentCompanyId,
              locationId: sourceLocationId,
              stockItemId: item.stockItemId,
              quantity: negativeQty.toString(),
              averageRate: rate.toString(),
              totalValue: (negativeQty * rate).toString()
            });
          }
          const destInventory = await tx.select().from(inventory).where(
            and2(
              eq2(inventory.companyId, req.session.currentCompanyId),
              eq2(inventory.locationId, destinationLocationId),
              eq2(inventory.stockItemId, item.stockItemId)
            )
          ).limit(1);
          if (destInventory[0]) {
            const currentQty = parseFloat(destInventory[0].quantity);
            const currentValue = parseFloat(destInventory[0].totalValue);
            const addValue = qty * rate;
            const newQty = currentQty + qty;
            const newValue = currentValue + addValue;
            const newAvgRate = newQty > 0 ? newValue / newQty : rate;
            await tx.update(inventory).set({
              quantity: newQty.toString(),
              averageRate: newAvgRate.toString(),
              totalValue: newValue.toString()
            }).where(eq2(inventory.id, destInventory[0].id));
          } else {
            await tx.insert(inventory).values({
              companyId: req.session.currentCompanyId,
              locationId: destinationLocationId,
              stockItemId: item.stockItemId,
              quantity: qty.toString(),
              averageRate: rate.toString(),
              totalValue: (qty * rate).toString()
            });
          }
        }
      });
      res.json({
        success: true,
        itemsCount: processedItems.length,
        totalValue: totalValue.toFixed(2)
      });
    } catch (error) {
      console.error("Stock Transfer Import error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/containers", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const containers2 = await storage.getAllContainers(
        req.session.currentCompanyId
      );
      res.json(containers2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/containers/active", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const containers2 = await storage.getActiveContainers(
        req.session.currentCompanyId
      );
      res.json(containers2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/containers/sold", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const soldContainers = await storage.getSoldContainers(
        req.session.currentCompanyId
      );
      res.json(soldContainers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/containers", requireAuth, requireNonPOS, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const data = insertContainerSchema.parse({
        ...req.body,
        companyId: req.session.currentCompanyId
      });
      const itemName = req.body.itemName?.trim();
      const ratePerKg = req.body.ratePerKg ? parseFloat(req.body.ratePerKg) : 0;
      const totalKg = req.body.totalKg ? parseFloat(req.body.totalKg) : 0;
      const hasManualCostData = itemName && ratePerKg > 0 && totalKg > 0;
      if (hasManualCostData && !data.supplierId) {
        return res.status(400).json({
          message: "Supplier is required for manual containers with cost information"
        });
      }
      const container = await storage.createContainer(data);
      if (hasManualCostData) {
        try {
          const totalAmount = ratePerKg * totalKg;
          const voucherDate = data.importDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
          let purchasesAccount = await storage.getLedgerAccountByCode(
            "PURCHASES",
            req.session.currentCompanyId
          );
          if (!purchasesAccount) {
            purchasesAccount = await storage.createLedgerAccount({
              companyId: req.session.currentCompanyId,
              code: "PURCHASES",
              name: "Purchases",
              accountType: "Expense",
              openingBalance: "0",
              openingBalanceSide: "Dr",
              active: true
            });
          }
          const voucher = await storage.createVoucher({
            companyId: req.session.currentCompanyId,
            voucherNumber: `CONT-${container.containerNumber}-${Date.now()}`,
            voucherType: "Purchase",
            voucherDate,
            description: `Container ${container.containerNumber} - ${itemName}`,
            totalAmount: totalAmount.toFixed(2),
            optional: false
          });
          await storage.createVoucherEntry({
            voucherId: voucher.id,
            ledgerAccountId: purchasesAccount.id,
            debitAmount: totalAmount.toFixed(2),
            creditAmount: "0",
            narration: `Container ${container.containerNumber} - ${itemName} (${totalKg}kg @ $${ratePerKg}/kg)`
          });
          await storage.createVoucherEntry({
            voucherId: voucher.id,
            supplierId: data.supplierId,
            debitAmount: "0",
            creditAmount: totalAmount.toFixed(2),
            narration: `Container ${container.containerNumber} - ${itemName} (${totalKg}kg @ $${ratePerKg}/kg)`
          });
        } catch (voucherError) {
          await storage.deleteContainer(container.id);
          throw new Error(`Failed to create purchase voucher: ${voucherError.message}`);
        }
      }
      res.status(201).json(container);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({ message: error.message });
    }
  });
  app2.get(
    "/api/containers/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const containerId = parseInt(req.params.id);
        const container = await storage.getContainerById(containerId);
        if (!container) {
          return res.status(404).json({ message: "Container not found" });
        }
        const pos = await storage.getPurchaseOrdersByContainer(containerId);
        const charges = await storage.getChargesByContainer(containerId);
        const allLineItems = await Promise.all(
          pos.map((po) => storage.getLineItemsByPO(po.id))
        );
        const posWithItems = pos.map((po, index2) => ({
          ...po,
          items: allLineItems[index2]
        }));
        res.json({
          container,
          pos: posWithItems,
          charges
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/containers/:id/offload",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const containerId = parseInt(req.params.id);
        const validation = offloadRequestSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Validation failed",
            errors: validation.error.errors
          });
        }
        const {
          locationId,
          offloadDate,
          duties,
          dutiesAccountId,
          officeCharges,
          officeChargesAccountId,
          officeChargesCashAccountId,
          transferCharges,
          transportFees,
          transportAccountId,
          additionalCharges = []
        } = validation.data;
        const container = await storage.getContainerById(containerId);
        if (!container) {
          return res.status(404).json({ message: "Container not found" });
        }
        const isEdit = container.status === "OFFLOADED";
        if (isEdit) {
          const [existingOffload] = await db.select().from(containerOffloads).where(eq2(containerOffloads.containerId, containerId)).limit(1);
          if (existingOffload) {
            const pos = await storage.getPurchaseOrdersByContainer(containerId);
            for (const po of pos) {
              const lineItems = await storage.getLineItemsByPO(po.id);
              for (const item of lineItems) {
                const [inv] = await db.select().from(inventory).where(
                  and2(
                    eq2(inventory.stockItemId, item.stockItemId),
                    eq2(inventory.locationId, existingOffload.locationId)
                  )
                ).limit(1);
                if (inv) {
                  const newQty = parseFloat(inv.quantity) - parseFloat(item.quantity);
                  if (newQty <= 0) {
                    await db.delete(inventory).where(eq2(inventory.id, inv.id));
                  } else {
                    await db.update(inventory).set({ quantity: newQty.toString() }).where(eq2(inventory.id, inv.id));
                  }
                }
              }
            }
            const oldVouchers = await db.select().from(vouchers).where(
              and2(
                eq2(vouchers.companyId, container.companyId),
                sql3`LOWER(${vouchers.description}) LIKE LOWER('%container ${container.containerNumber}%')`
              )
            );
            for (const voucher of oldVouchers) {
              await db.delete(voucherEntries).where(eq2(voucherEntries.voucherId, voucher.id));
              await db.delete(vouchers).where(eq2(vouchers.id, voucher.id));
            }
            await db.delete(containerOffloads).where(eq2(containerOffloads.id, existingOffload.id));
          }
          await storage.updateContainer(containerId, { status: "IN_TRANSIT" });
        }
        const offload = await storage.offloadContainer(
          containerId,
          locationId,
          duties,
          dutiesAccountId,
          officeCharges,
          officeChargesAccountId,
          officeChargesCashAccountId,
          transferCharges,
          transportFees,
          transportAccountId,
          additionalCharges,
          offloadDate
        );
        res.json(offload);
      } catch (error) {
        console.error("Container offload error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/containers/:id/reverse-offload",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const containerId = parseInt(req.params.id);
        if (isNaN(containerId)) {
          return res.status(400).json({ message: "Invalid container ID" });
        }
        const container = await storage.getContainerById(containerId);
        if (!container) {
          return res.status(404).json({ message: "Container not found" });
        }
        if (container.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Container belongs to a different company"
          });
        }
        if (container.status !== "OFFLOADED") {
          return res.status(400).json({ message: "Container is not offloaded" });
        }
        const [offloadRecord] = await db.select().from(containerOffloads).where(eq2(containerOffloads.containerId, containerId)).limit(1);
        if (!offloadRecord) {
          await db.update(containers).set({ status: "IN_TRANSIT" }).where(eq2(containers.id, containerId));
          return res.json({
            message: "Container status reversed to IN_TRANSIT (no offload record to clean up)"
          });
        }
        await db.transaction(async (tx) => {
          const pos = await storage.getPurchaseOrdersByContainer(containerId);
          for (const po of pos) {
            const lineItems = await storage.getLineItemsByPO(po.id);
            for (const item of lineItems) {
              const [inv] = await tx.select().from(inventory).where(
                and2(
                  eq2(inventory.stockItemId, item.stockItemId),
                  eq2(inventory.locationId, offloadRecord.locationId)
                )
              ).limit(1);
              if (inv) {
                const newQty = parseFloat(inv.quantity) - parseFloat(item.quantity);
                if (newQty <= 0) {
                  await tx.delete(inventory).where(eq2(inventory.id, inv.id));
                } else {
                  await tx.update(inventory).set({ quantity: newQty.toString() }).where(eq2(inventory.id, inv.id));
                }
              }
            }
          }
          const containerVouchers = await tx.select().from(vouchers).where(
            and2(
              eq2(vouchers.companyId, req.session.currentCompanyId),
              like(sql3`LOWER(${vouchers.description})`, `%container ${container.containerNumber.toLowerCase()}%`)
            )
          );
          for (const voucher of containerVouchers) {
            await tx.delete(voucherEntries).where(eq2(voucherEntries.voucherId, voucher.id));
            await tx.delete(vouchers).where(eq2(vouchers.id, voucher.id));
          }
          await tx.delete(containerOffloads).where(eq2(containerOffloads.id, offloadRecord.id));
          await tx.update(containers).set({
            status: "IN_TRANSIT"
          }).where(eq2(containers.id, containerId));
        });
        res.json({
          success: true,
          message: "Container offload reversed successfully"
        });
      } catch (error) {
        console.error("Reverse offload error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.patch(
    "/api/containers/:id/offload",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const containerId = parseInt(req.params.id);
        if (isNaN(containerId)) {
          return res.status(400).json({ message: "Invalid container ID" });
        }
        const container = await storage.getContainerById(containerId);
        if (!container) {
          return res.status(404).json({ message: "Container not found" });
        }
        if (container.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Container belongs to a different company"
          });
        }
        if (container.status !== "OFFLOADED") {
          return res.status(400).json({ message: "Container must be offloaded to edit" });
        }
        const validation = offloadRequestSchema.extend({
          dutiesAccountId: z2.number().optional(),
          officeChargesAccountId: z2.number().optional(),
          officeChargesCashAccountId: z2.number().optional(),
          transportAccountId: z2.number().optional(),
          additionalCharges: z2.array(z2.object({
            description: z2.string(),
            amount: z2.number(),
            ledgerAccountId: z2.number()
          })).optional()
        }).safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ errors: validation.error.errors });
        }
        const {
          locationId,
          offloadDate,
          duties,
          dutiesAccountId,
          officeCharges,
          officeChargesAccountId,
          officeChargesCashAccountId,
          transferCharges,
          transportFees,
          transportAccountId,
          additionalCharges = []
        } = validation.data;
        const [currentOffload] = await db.select().from(containerOffloads).where(eq2(containerOffloads.containerId, containerId)).limit(1);
        if (!currentOffload) {
          return res.status(404).json({ message: "Offload record not found" });
        }
        await db.transaction(async (tx) => {
          if (locationId !== currentOffload.locationId) {
            const pos = await storage.getPurchaseOrdersByContainer(containerId);
            for (const po of pos) {
              const lineItems = await storage.getLineItemsByPO(po.id);
              for (const item of lineItems) {
                const [oldInv] = await tx.select().from(inventory).where(
                  and2(
                    eq2(inventory.stockItemId, item.stockItemId),
                    eq2(inventory.locationId, currentOffload.locationId)
                  )
                ).limit(1);
                if (oldInv) {
                  await tx.delete(inventory).where(eq2(inventory.id, oldInv.id));
                  await tx.insert(inventory).values({
                    companyId: req.session.currentCompanyId,
                    locationId,
                    stockItemId: item.stockItemId,
                    quantity: oldInv.quantity,
                    averageRate: oldInv.averageRate
                  });
                }
              }
            }
          }
          const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
          const totalCharges = parseFloat(duties) + parseFloat(officeCharges) + parseFloat(transferCharges) + parseFloat(transportFees) + additionalChargesTotal;
          const totalBales = parseFloat(currentOffload.totalBales);
          const additionalCostPerBale = totalBales > 0 ? totalCharges / totalBales : 0;
          await tx.update(containerOffloads).set({
            locationId,
            duties,
            officeCharges,
            transferCharges,
            transportFees,
            totalCharges: totalCharges.toString(),
            additionalCostPerBale: additionalCostPerBale.toString(),
            offloadedAt: offloadDate ? new Date(offloadDate) : currentOffload.offloadedAt
          }).where(eq2(containerOffloads.id, currentOffload.id));
          const containerVouchers = await tx.select().from(vouchers).where(
            and2(
              eq2(vouchers.companyId, req.session.currentCompanyId),
              sql3`${vouchers.description} LIKE '%Container ${container.containerNumber}%'`
            )
          );
          for (const voucher of containerVouchers) {
            await tx.delete(voucherEntries).where(eq2(voucherEntries.voucherId, voucher.id));
            await tx.delete(vouchers).where(eq2(vouchers.id, voucher.id));
          }
        });
        res.json({
          success: true,
          message: "Container offload updated successfully"
        });
      } catch (error) {
        console.error("Edit offload error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase order ID" });
      }
      const userRole = req.session.currentRole;
      if (!userRole || userRole !== "Admin" && userRole !== "Owner") {
        return res.status(403).json({ message: "Only Admin and Owner can view purchase orders" });
      }
      const po = await db.query.purchaseOrders.findFirst({
        where: eq2(purchaseOrders.id, id)
      });
      if (!po) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      if (po.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Purchase order belongs to a different company"
        });
      }
      const lineItems = await db.query.poLineItems.findMany({
        where: eq2(poLineItems.poId, id)
      });
      const supplier = await db.query.suppliers.findFirst({
        where: eq2(suppliers.id, po.supplierId)
      });
      const container = await db.query.containers.findFirst({
        where: eq2(containers.id, po.containerId)
      });
      res.json({
        ...po,
        items: lineItems,
        supplierName: supplier?.legalName || "Unknown Supplier",
        supplierCode: supplier?.code || "",
        containerNumber: container?.containerNumber || ""
      });
    } catch (error) {
      console.error("Get PO error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase order ID" });
      }
      const existingPO = await storage.getPurchaseOrderById(id);
      if (!existingPO) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      if (existingPO.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Purchase order belongs to a different company"
        });
      }
      const userRole = req.session.currentRole;
      if (!userRole) {
        return res.status(403).json({ message: "User role not found" });
      }
      if (userRole !== "Admin" && userRole !== "Owner") {
        return res.status(403).json({ message: "Only Admin and Owner can edit purchase orders" });
      }
      if (req.body.items && Array.isArray(req.body.items)) {
        let itemsTotal = 0;
        const newItems = req.body.items.map((item) => {
          const lineTotal = parseFloat(item.quantity || "0") * parseFloat(item.rate || "0");
          itemsTotal += lineTotal;
          return {
            poId: id,
            stockItemId: item.stockItemId,
            itemName: item.itemName,
            quantity: item.quantity?.toString() || "0",
            rate: item.rate?.toString() || "0",
            lineTotal: lineTotal.toFixed(2)
          };
        });
        await db.transaction(async (tx) => {
          await tx.delete(poLineItems).where(eq2(poLineItems.poId, id));
          if (newItems.length > 0) {
            await tx.insert(poLineItems).values(newItems);
          }
          const freight = parseFloat(req.body.freight || existingPO.freight || "0");
          const otherCharges = parseFloat(req.body.otherCharges || existingPO.otherCharges || "0");
          await tx.update(purchaseOrders).set({
            itemsTotal: itemsTotal.toFixed(2),
            freight: freight.toFixed(2),
            otherCharges: otherCharges.toFixed(2),
            poNumber: req.body.poNumber || existingPO.poNumber,
            currency: req.body.currency || existingPO.currency,
            status: req.body.status || existingPO.status
          }).where(eq2(purchaseOrders.id, id));
          const container2 = await storage.getContainerById(existingPO.containerId);
          if (container2) {
            const allPOs = await storage.getAllPurchaseOrders(existingPO.companyId);
            const containerPOs = allPOs.filter((po) => po.containerId === existingPO.containerId);
            let totalItemsCost = 0;
            let totalFreight = 0;
            let totalOtherCharges = 0;
            for (const po of containerPOs) {
              if (po.id === id) {
                totalItemsCost += itemsTotal;
                totalFreight += freight;
                totalOtherCharges += otherCharges;
              } else {
                totalItemsCost += parseFloat(po.itemsTotal || "0");
                totalFreight += parseFloat(po.freight || "0");
                totalOtherCharges += parseFloat(po.otherCharges || "0");
              }
            }
            const chargesTotal = totalFreight + totalOtherCharges;
            await tx.update(containers).set({
              itemsTotal: totalItemsCost.toFixed(2),
              chargesTotal: chargesTotal.toFixed(2),
              grandTotal: (totalItemsCost + chargesTotal).toFixed(2)
            }).where(eq2(containers.id, existingPO.containerId));
          }
          if (existingPO.voucherId) {
            const poGrandTotal = itemsTotal + freight + otherCharges;
            await tx.update(vouchers).set({ totalAmount: poGrandTotal.toFixed(2) }).where(eq2(vouchers.id, existingPO.voucherId));
            const existingEntries = await tx.select().from(voucherEntries).where(eq2(voucherEntries.voucherId, existingPO.voucherId));
            for (const entry of existingEntries) {
              if (parseFloat(entry.debitAmount || "0") > 0) {
                await tx.update(voucherEntries).set({ debitAmount: poGrandTotal.toFixed(2) }).where(eq2(voucherEntries.id, entry.id));
              } else if (parseFloat(entry.creditAmount || "0") > 0) {
                await tx.update(voucherEntries).set({ creditAmount: poGrandTotal.toFixed(2) }).where(eq2(voucherEntries.id, entry.id));
              }
            }
          }
        });
        const updatedPO = await storage.getPurchaseOrderById(id);
        const lineItems = await storage.getLineItemsByPO(id);
        const supplier = await storage.getSupplierById(existingPO.supplierId);
        const container = await storage.getContainerById(existingPO.containerId);
        return res.json({
          ...updatedPO,
          items: lineItems,
          supplierName: supplier?.legalName || "Unknown Supplier",
          supplierCode: supplier?.code || "",
          containerNumber: container?.containerNumber || ""
        });
      }
      const allowedUpdates = {};
      if (req.body.poNumber !== void 0)
        allowedUpdates.poNumber = req.body.poNumber;
      if (req.body.itemsTotal !== void 0)
        allowedUpdates.itemsTotal = req.body.itemsTotal;
      if (req.body.currency !== void 0)
        allowedUpdates.currency = req.body.currency;
      if (req.body.status !== void 0)
        allowedUpdates.status = req.body.status;
      if (req.body.freight !== void 0)
        allowedUpdates.freight = req.body.freight;
      if (req.body.otherCharges !== void 0)
        allowedUpdates.otherCharges = req.body.otherCharges;
      const updated = await storage.updatePurchaseOrder(id, allowedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.delete(
    "/api/purchase-orders/:id",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid purchase order ID" });
        }
        const existingPO = await storage.getPurchaseOrderById(id);
        if (!existingPO) {
          return res.status(404).json({ message: "Purchase order not found" });
        }
        if (existingPO.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Purchase order belongs to a different company"
          });
        }
        await storage.deletePurchaseOrder(id);
        res.json({ message: "Purchase order deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.delete(
    "/api/containers/:id",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid container ID" });
        }
        const existingContainer = await storage.getContainerById(id);
        if (!existingContainer) {
          return res.status(404).json({ message: "Container not found" });
        }
        if (existingContainer.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Container belongs to a different company"
          });
        }
        await storage.deleteContainer(id);
        res.json({ message: "Container deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post("/api/po-import/backfill", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const allPOs = await storage.getAllPurchaseOrders(
        req.session.currentCompanyId
      );
      const posWithoutVouchers = allPOs.filter((po) => !po.voucherId);
      if (posWithoutVouchers.length === 0) {
        return res.json({
          message: "No POs need backfilling",
          count: 0
        });
      }
      let purchasesAccount = await storage.getLedgerAccountByCode("PURCHASES", req.session.currentCompanyId);
      if (!purchasesAccount) {
        purchasesAccount = await storage.createLedgerAccount({
          companyId: req.session.currentCompanyId,
          code: "PURCHASES",
          name: "Purchases",
          accountType: "Expense",
          openingBalance: "0",
          openingBalanceSide: "Dr",
          active: true
        });
      }
      const allContainers = await storage.getAllContainers(
        req.session.currentCompanyId
      );
      const containerMap = new Map(allContainers.map((c) => [c.id, c]));
      let backfilledCount = 0;
      for (const po of posWithoutVouchers) {
        const container = containerMap.get(po.containerId);
        if (!container) continue;
        const voucher = await storage.createVoucher({
          companyId: req.session.currentCompanyId,
          voucherNumber: `PO-${po.poNumber}-BACKFILL-${Date.now()}`,
          voucherType: "Purchase",
          voucherDate: container.importDate,
          description: `Purchase Order ${po.poNumber} - Container ${container.containerNumber} (Backfilled)`,
          totalAmount: po.itemsTotal || "0",
          optional: false
        });
        await storage.createVoucherEntry({
          voucherId: voucher.id,
          ledgerAccountId: purchasesAccount.id,
          debitAmount: po.itemsTotal || "0",
          creditAmount: "0",
          narration: `PO ${po.poNumber} - Container ${container.containerNumber} (Backfilled)`
        });
        await storage.createVoucherEntry({
          voucherId: voucher.id,
          supplierId: po.supplierId,
          debitAmount: "0",
          creditAmount: po.itemsTotal || "0",
          narration: `PO ${po.poNumber} - Container ${container.containerNumber} (Backfilled)`
        });
        await storage.updatePurchaseOrder(po.id, {
          voucherId: voucher.id
        });
        backfilledCount++;
      }
      res.json({
        message: "Backfill completed successfully",
        count: backfilledCount
      });
    } catch (error) {
      console.error("Backfill error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/sales-import/backfill", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { locationCashAccountMap } = req.body;
      if (!locationCashAccountMap || typeof locationCashAccountMap !== "object") {
        return res.status(400).json({
          message: "Location-to-cash-account mapping is required. Please specify which cash account to use for each location's sales."
        });
      }
      const cashAccountIds = Object.values(locationCashAccountMap);
      for (const cashAccountId of cashAccountIds) {
        const cashAccount = await storage.getLedgerAccountById(cashAccountId);
        if (!cashAccount || cashAccount.companyId !== req.session.currentCompanyId) {
          return res.status(400).json({ message: `Invalid cash account ID: ${cashAccountId}` });
        }
      }
      let salesRevenueAccount = await storage.getLedgerAccountByCode("SALES_REV", req.session.currentCompanyId);
      if (!salesRevenueAccount) {
        salesRevenueAccount = await storage.createLedgerAccount({
          companyId: req.session.currentCompanyId,
          code: "SALES_REV",
          name: "Sales Revenue",
          accountType: "Income",
          subType: "Direct Income",
          openingBalance: "0",
          openingBalanceSide: "Cr",
          active: true
        });
      }
      const allVouchers = await db.select().from(vouchers).where(
        and2(
          eq2(vouchers.companyId, req.session.currentCompanyId),
          eq2(vouchers.voucherType, "Sales")
        )
      ).execute();
      if (allVouchers.length === 0) {
        return res.json({
          message: "No sales vouchers found",
          count: 0
        });
      }
      const voucherIds = allVouchers.map((v) => v.id);
      const existingEntries = await db.select().from(voucherEntries).where(inArray2(voucherEntries.voucherId, voucherIds)).execute();
      const voucherLedgerMap = /* @__PURE__ */ new Map();
      for (const entry of existingEntries) {
        if (!voucherLedgerMap.has(entry.voucherId)) {
          voucherLedgerMap.set(entry.voucherId, /* @__PURE__ */ new Set());
        }
        if (entry.ledgerAccountId) {
          voucherLedgerMap.get(entry.voucherId).add(entry.ledgerAccountId);
        }
      }
      const vouchersNeedingBackfill = allVouchers.filter((v) => {
        const ledgerIds = voucherLedgerMap.get(v.id) || /* @__PURE__ */ new Set();
        const entryCount = ledgerIds.size;
        const hasSalesRev = ledgerIds.has(salesRevenueAccount.id);
        return entryCount === 0 || !hasSalesRev || entryCount !== 2;
      });
      if (vouchersNeedingBackfill.length === 0) {
        return res.json({
          message: "All sales vouchers already have complete accounting entries",
          count: 0
        });
      }
      let backfilledCount = 0;
      let skippedCount = 0;
      for (const voucher of vouchersNeedingBackfill) {
        await db.transaction(async (tx) => {
          const items = await tx.select().from(salesItems).where(eq2(salesItems.voucherId, voucher.id)).execute();
          if (items.length === 0) {
            console.warn(`No sales items found for voucher ${voucher.id}, skipping`);
            skippedCount++;
            return;
          }
          const totalSales = items.reduce((sum, item) => sum + parseFloat(item.totalSales || "0"), 0);
          if (totalSales === 0) {
            console.warn(`Voucher ${voucher.id} has zero sales, skipping`);
            skippedCount++;
            return;
          }
          const firstItem = items[0];
          const stockItem = await tx.select().from(stockItems).where(eq2(stockItems.id, firstItem.stockItemId)).limit(1);
          if (stockItem.length === 0) {
            console.warn(`Could not find stock item ${firstItem.stockItemId} for voucher ${voucher.id}, skipping`);
            skippedCount++;
            return;
          }
          const inventoryRecords = await tx.select().from(inventory).where(eq2(inventory.stockItemId, stockItem[0].id)).limit(1);
          if (inventoryRecords.length === 0) {
            console.warn(`Could not determine location for voucher ${voucher.id}, skipping`);
            skippedCount++;
            return;
          }
          const locationId = inventoryRecords[0].locationId;
          const cashAccountId = locationCashAccountMap[locationId];
          if (!cashAccountId) {
            console.warn(`No cash account mapped for location ${locationId}, skipping voucher ${voucher.id}`);
            skippedCount++;
            return;
          }
          await tx.delete(voucherEntries).where(eq2(voucherEntries.voucherId, voucher.id));
          await tx.insert(voucherEntries).values({
            voucherId: voucher.id,
            ledgerAccountId: cashAccountId,
            debitAmount: totalSales.toFixed(2),
            creditAmount: "0",
            narration: `Cash from POS Sales - ${items.length} items (Backfilled)`
          });
          await tx.insert(voucherEntries).values({
            voucherId: voucher.id,
            ledgerAccountId: salesRevenueAccount.id,
            debitAmount: "0",
            creditAmount: totalSales.toFixed(2),
            narration: `Sales Revenue - ${items.length} items (Backfilled)`
          });
          backfilledCount++;
        });
      }
      res.json({
        message: `Sales backfill completed. ${backfilledCount} vouchers updated, ${skippedCount} skipped.`,
        backfilledCount,
        skippedCount,
        totalSalesVouchers: allVouchers.length
      });
    } catch (error) {
      console.error("Sales backfill error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/accounts/all", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const companyId = req.session.currentCompanyId;
      const ledgers = await storage.getAllLedgerAccounts(companyId);
      const banks = await storage.getAllBankAccounts(companyId);
      const assets = await storage.getAllFixedAssets(companyId);
      const suppliers2 = await storage.getAllSuppliers();
      const companyVouchers = await db.select({ id: vouchers.id }).from(vouchers).where(and2(eq2(vouchers.companyId, companyId), eq2(vouchers.optional, false))).execute();
      const companyVoucherIds = companyVouchers.map((v) => v.id);
      const allEntries = companyVoucherIds.length > 0 ? await db.select().from(voucherEntries).where(inArray2(voucherEntries.voucherId, companyVoucherIds)).execute() : [];
      const ledgerBalances = /* @__PURE__ */ new Map();
      const bankBalances = /* @__PURE__ */ new Map();
      const assetBalances = /* @__PURE__ */ new Map();
      const supplierBalances = /* @__PURE__ */ new Map();
      for (const entry of allEntries) {
        const debit = parseFloat(entry.debitAmount || "0");
        const credit = parseFloat(entry.creditAmount || "0");
        if (entry.ledgerAccountId) {
          const existing = ledgerBalances.get(entry.ledgerAccountId) || {
            debits: 0,
            credits: 0
          };
          ledgerBalances.set(entry.ledgerAccountId, {
            debits: existing.debits + debit,
            credits: existing.credits + credit
          });
        }
        if (entry.bankAccountId) {
          const existing = bankBalances.get(entry.bankAccountId) || {
            debits: 0,
            credits: 0
          };
          bankBalances.set(entry.bankAccountId, {
            debits: existing.debits + debit,
            credits: existing.credits + credit
          });
        }
        if (entry.fixedAssetId) {
          const existing = assetBalances.get(entry.fixedAssetId) || {
            debits: 0,
            credits: 0
          };
          assetBalances.set(entry.fixedAssetId, {
            debits: existing.debits + debit,
            credits: existing.credits + credit
          });
        }
        if (entry.supplierId) {
          const existing = supplierBalances.get(entry.supplierId) || {
            debits: 0,
            credits: 0
          };
          if (credit > 0 && debit === 0) {
            supplierBalances.set(entry.supplierId, {
              debits: existing.debits,
              credits: existing.credits + credit
            });
          } else if (debit > 0 && credit === 0) {
            supplierBalances.set(entry.supplierId, {
              debits: existing.debits + debit,
              credits: existing.credits
            });
          }
        }
      }
      const calculateBalance = (openingBalance, openingBalanceSide, debits, credits) => {
        let balance = parseFloat(openingBalance || "0");
        if (openingBalanceSide === "Cr") {
          balance = -balance;
        }
        balance += debits - credits;
        const balanceSide = balance >= 0 ? "Dr" : "Cr";
        const absoluteBalance = Math.abs(balance);
        return { balance: absoluteBalance, balanceSide };
      };
      const accounts = [
        ...ledgers.map((account) => {
          const movements = ledgerBalances.get(account.id) || {
            debits: 0,
            credits: 0
          };
          const { balance, balanceSide } = calculateBalance(
            account.openingBalance || "0",
            account.openingBalanceSide,
            movements.debits,
            movements.credits
          );
          return {
            id: `ledger-${account.id}`,
            accountId: account.id,
            type: "ledger",
            code: account.code,
            name: account.name,
            accountType: account.accountType,
            subType: account.subType,
            balance: balance.toFixed(2),
            balanceSide,
            openingBalance: parseFloat(account.openingBalance || "0"),
            openingBalanceSide: account.openingBalanceSide || "Dr",
            active: account.active,
            parentId: account.parentId
          };
        }),
        ...banks.map((account) => {
          const movements = bankBalances.get(account.id) || {
            debits: 0,
            credits: 0
          };
          const { balance, balanceSide } = calculateBalance(
            account.openingBalance || "0",
            account.openingBalanceSide,
            movements.debits,
            movements.credits
          );
          return {
            id: `bank-${account.id}`,
            accountId: account.id,
            type: "bank",
            code: account.code,
            name: `${account.name} (${account.bankName})`,
            balance: balance.toFixed(2),
            balanceSide,
            openingBalance: parseFloat(account.openingBalance || "0"),
            openingBalanceSide: account.openingBalanceSide || "Dr",
            active: account.active,
            parentId: null
          };
        }),
        ...assets.map((asset) => {
          const movements = assetBalances.get(asset.id) || {
            debits: 0,
            credits: 0
          };
          const { balance, balanceSide } = calculateBalance(
            asset.openingBalance || "0",
            "Dr",
            // Fixed assets are always debit balance
            movements.debits,
            movements.credits
          );
          return {
            id: `asset-${asset.id}`,
            accountId: asset.id,
            type: "fixedAsset",
            code: asset.code,
            name: asset.name,
            balance: balance.toFixed(2),
            balanceSide,
            openingBalance: parseFloat(asset.openingBalance || "0"),
            openingBalanceSide: "Dr",
            // Fixed assets are always debit balance
            active: asset.active,
            parentId: null
          };
        }),
        ...suppliers2.map((supplier) => {
          const movements = supplierBalances.get(supplier.id) || {
            debits: 0,
            credits: 0
          };
          const openingBalance = parseFloat(supplier.openingBalance || "0");
          const calculatedBalance = openingBalance + movements.credits - movements.debits;
          const balanceSide = calculatedBalance >= 0 ? "Cr" : "Dr";
          const absoluteBalance = Math.abs(calculatedBalance);
          return {
            id: `supplier-${supplier.id}`,
            accountId: supplier.id,
            type: "supplier",
            code: supplier.code,
            name: supplier.legalName,
            balance: absoluteBalance.toFixed(2),
            balanceSide,
            openingBalance,
            openingBalanceSide: "Cr",
            // Suppliers are always credit balance (payable)
            active: supplier.active,
            parentId: null
          };
        })
      ];
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/accounts/payables", requireAuth, async (req, res) => {
    try {
      const suppliers2 = await storage.getAllSuppliers();
      const payableAccounts = suppliers2.map((supplier) => {
        const openingBalance = parseFloat(supplier.openingBalance || "0");
        return {
          id: supplier.id,
          accountId: supplier.id,
          code: supplier.code,
          name: supplier.legalName,
          balance: openingBalance
        };
      }).filter((account) => account.balance > 0).sort((a, b) => b.balance - a.balance);
      res.json(payableAccounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/accounts/voucher-sidebar", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const companyId = req.session.currentCompanyId;
      const ledgers = await storage.getAllLedgerAccounts(companyId);
      const banks = await storage.getAllBankAccounts(companyId);
      const assets = await storage.getAllFixedAssets(companyId);
      const suppliers2 = await storage.getAllSuppliers();
      const employeesData = await storage.getAllEmployees(companyId);
      const companyVouchers = await db.select({ id: vouchers.id }).from(vouchers).where(and2(eq2(vouchers.companyId, companyId), eq2(vouchers.optional, false))).execute();
      const companyVoucherIds = companyVouchers.map((v) => v.id);
      const allEntries = companyVoucherIds.length > 0 ? await db.select().from(voucherEntries).where(inArray2(voucherEntries.voucherId, companyVoucherIds)).execute() : [];
      const ledgerBalances = /* @__PURE__ */ new Map();
      const bankBalances = /* @__PURE__ */ new Map();
      const assetBalances = /* @__PURE__ */ new Map();
      for (const entry of allEntries) {
        const debit = parseFloat(entry.debitAmount || "0");
        const credit = parseFloat(entry.creditAmount || "0");
        if (entry.ledgerAccountId) {
          const existing = ledgerBalances.get(entry.ledgerAccountId) || { debits: 0, credits: 0 };
          ledgerBalances.set(entry.ledgerAccountId, {
            debits: existing.debits + debit,
            credits: existing.credits + credit
          });
        }
        if (entry.bankAccountId) {
          const existing = bankBalances.get(entry.bankAccountId) || { debits: 0, credits: 0 };
          bankBalances.set(entry.bankAccountId, {
            debits: existing.debits + debit,
            credits: existing.credits + credit
          });
        }
        if (entry.fixedAssetId) {
          const existing = assetBalances.get(entry.fixedAssetId) || { debits: 0, credits: 0 };
          assetBalances.set(entry.fixedAssetId, {
            debits: existing.debits + debit,
            credits: existing.credits + credit
          });
        }
      }
      const supplierBalances = /* @__PURE__ */ new Map();
      for (const supplier of suppliers2) {
        const entries = await storage.getVoucherEntriesBySupplier(supplier.id);
        const openingBalance = parseFloat(supplier.openingBalance || "0");
        const balance = entries.reduce((sum, entry) => {
          const credit = parseFloat(entry.creditAmount || "0");
          const debit = parseFloat(entry.debitAmount || "0");
          if (credit > 0 && debit === 0) {
            return sum + credit;
          } else if (debit > 0 && credit === 0) {
            return sum - debit;
          }
          return sum;
        }, openingBalance);
        supplierBalances.set(supplier.id, balance);
      }
      const calculateSignedBalance = (openingBalance, openingBalanceSide, debits, credits) => {
        let balance = parseFloat(openingBalance || "0");
        if (openingBalanceSide === "Cr") {
          balance = -balance;
        }
        return balance + debits - credits;
      };
      const accounts = [
        // Bank accounts
        ...banks.map((account) => {
          const movements = bankBalances.get(account.id) || { debits: 0, credits: 0 };
          const balance = calculateSignedBalance(
            account.openingBalance || "0",
            account.openingBalanceSide,
            movements.debits,
            movements.credits
          );
          return {
            id: account.id,
            type: "bank",
            name: account.name,
            code: account.code,
            balance
          };
        }),
        // Ledger accounts
        ...ledgers.map((account) => {
          const movements = ledgerBalances.get(account.id) || { debits: 0, credits: 0 };
          const balance = calculateSignedBalance(
            account.openingBalance || "0",
            account.openingBalanceSide,
            movements.debits,
            movements.credits
          );
          return {
            id: account.id,
            type: "ledger",
            name: account.name,
            code: account.code,
            balance
          };
        }),
        // Suppliers (balance already calculated across all companies)
        // Negate balance so positive (we owe them) shows as credit in sidebar
        ...suppliers2.map((supplier) => {
          const rawBalance = supplierBalances.get(supplier.id) || 0;
          const balance = -rawBalance;
          return {
            id: supplier.id,
            type: "supplier",
            name: supplier.legalName,
            code: supplier.code,
            balance
          };
        }),
        // Employees
        ...employeesData.map((employee) => {
          const balance = parseFloat(employee.currentBalance || "0");
          return {
            id: employee.id,
            type: "employee",
            name: `${employee.firstName} ${employee.lastName}`,
            code: employee.code,
            balance
          };
        }),
        // Fixed Assets
        ...assets.map((asset) => {
          const movements = assetBalances.get(asset.id) || { debits: 0, credits: 0 };
          const balance = calculateSignedBalance(
            asset.openingBalance || "0",
            "Dr",
            // Fixed assets are always debit balance
            movements.debits,
            movements.credits
          );
          return {
            id: asset.id,
            type: "fixedAsset",
            name: asset.name,
            code: asset.code,
            balance
          };
        })
      ];
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/accounts/ledger/:id/balance", async (req, res) => {
    try {
      const ledgerAccountId = parseInt(req.params.id);
      if (isNaN(ledgerAccountId)) {
        return res.status(400).json({ message: "Invalid ledger account ID" });
      }
      const account = await storage.getLedgerAccountById(ledgerAccountId);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      const transactions = await storage.getVoucherEntriesByLedger(ledgerAccountId);
      let debits = 0;
      let credits = 0;
      for (const tx of transactions) {
        debits += parseFloat(tx.debitAmount || "0");
        credits += parseFloat(tx.creditAmount || "0");
      }
      const balance = parseFloat(account.openingBalance || "0") * (account.openingBalanceSide === "Cr" ? -1 : 1) + debits - credits;
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/accounts/ledger/:id/transactions", async (req, res) => {
    try {
      const ledgerAccountId = parseInt(req.params.id);
      if (isNaN(ledgerAccountId)) {
        return res.status(400).json({ message: "Invalid ledger account ID" });
      }
      const { startDate, endDate } = req.query;
      const transactions = await storage.getVoucherEntriesByLedger(
        ledgerAccountId,
        startDate,
        endDate
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/accounts/bank/:id/transactions", async (req, res) => {
    try {
      const bankAccountId = parseInt(req.params.id);
      if (isNaN(bankAccountId)) {
        return res.status(400).json({ message: "Invalid bank account ID" });
      }
      const { startDate, endDate } = req.query;
      const transactions = await storage.getVoucherEntriesByBankAccount(
        bankAccountId,
        startDate,
        endDate
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/accounts/fixed-asset/:id/transactions", async (req, res) => {
    try {
      const fixedAssetId = parseInt(req.params.id);
      if (isNaN(fixedAssetId)) {
        return res.status(400).json({ message: "Invalid fixed asset ID" });
      }
      const { startDate, endDate } = req.query;
      const transactions = await storage.getVoucherEntriesByFixedAsset(
        fixedAssetId,
        startDate,
        endDate
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get(
    "/api/accounts/supplier/:id/transactions",
    requireAuth,
    async (req, res) => {
      try {
        const supplierId = parseInt(req.params.id);
        if (isNaN(supplierId)) {
          return res.status(400).json({ message: "Invalid supplier ID" });
        }
        const { startDate, endDate, companyId } = req.query;
        const filterCompanyId = companyId ? parseInt(companyId) : req.session.currentCompanyId;
        const transactions = await storage.getVoucherEntriesBySupplier(
          supplierId,
          filterCompanyId,
          startDate,
          endDate
        );
        res.json(transactions);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/accounts/employee/:id/transactions",
    requireAuth,
    async (req, res) => {
      try {
        const employeeId = parseInt(req.params.id);
        if (isNaN(employeeId)) {
          return res.status(400).json({ message: "Invalid employee ID" });
        }
        const { startDate, endDate, companyId } = req.query;
        const filterCompanyId = companyId ? parseInt(companyId) : req.session.currentCompanyId;
        const transactions = await storage.getVoucherEntriesByEmployee(
          employeeId,
          filterCompanyId,
          startDate,
          endDate
        );
        res.json(transactions);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/vouchers", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { startDate, endDate } = req.query;
      const isPOS = req.session.currentRole?.startsWith("POS");
      let vouchers2;
      if (startDate && endDate) {
        vouchers2 = await storage.getVouchersByDateRange(
          startDate,
          endDate
        );
      } else {
        vouchers2 = await storage.getAllVouchers(req.session.currentCompanyId);
      }
      const sanitizedVouchers = isPOS ? vouchers2.map((v) => {
        const isStockTransfer = v.voucherType === "Stock Transfer" || v.voucherType === "StockTransfer" || v.voucherType?.toLowerCase().includes("stock transfer");
        if (isStockTransfer) {
          const { totalAmount, ...rest } = v;
          return { ...rest, totalAmount: "0" };
        }
        return v;
      }) : vouchers2;
      res.json(sanitizedVouchers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get(
    "/api/suppliers/:supplierId/unified-ledger",
    requireAuth,
    async (req, res) => {
      try {
        const supplierId = parseInt(req.params.supplierId);
        if (isNaN(supplierId)) {
          return res.status(400).json({ message: "Invalid supplier ID" });
        }
        const { companyId, startDate, endDate } = req.query;
        const filterCompanyId = companyId ? parseInt(companyId) : void 0;
        const voucherEntries2 = await storage.getVoucherEntriesBySupplier(
          supplierId,
          filterCompanyId,
          startDate,
          endDate
        );
        const companies2 = await storage.getAllCompanies();
        const companyMap = new Map(companies2.map((c) => [c.id, c]));
        const transactions = [];
        for (const entry of voucherEntries2) {
          const company = companyMap.get(entry.companyId);
          transactions.push({
            type: "voucher",
            date: entry.voucherDate,
            companyId: entry.companyId,
            companyName: company?.name || "Unknown",
            docNumber: entry.voucherNumber,
            voucherId: entry.voucherId,
            description: entry.narration || entry.voucherDescription || "",
            voucherType: entry.voucherType,
            debit: parseFloat(entry.debitAmount || "0"),
            credit: parseFloat(entry.creditAmount || "0")
          });
        }
        transactions.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
        let balance = 0;
        const transactionsWithBalance = transactions.map((t) => {
          balance += t.credit - t.debit;
          return {
            ...t,
            balance
          };
        });
        res.json(transactionsWithBalance.reverse());
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/suppliers/:supplierId/purchase-orders",
    requireAuth,
    async (req, res) => {
      try {
        const supplierId = parseInt(req.params.supplierId);
        if (isNaN(supplierId)) {
          return res.status(400).json({ message: "Invalid supplier ID" });
        }
        const { companyId } = req.query;
        const filterCompanyId = companyId ? parseInt(companyId) : void 0;
        if (!filterCompanyId) {
          const companies2 = await storage.getAllCompanies();
          const allPOs = [];
          for (const company2 of companies2) {
            const pos = await storage.getPurchaseOrdersBySupplier(
              supplierId,
              company2.id
            );
            allPOs.push(
              ...pos.map((po) => ({ ...po, companyName: company2.name }))
            );
          }
          return res.json(allPOs);
        }
        const purchaseOrders2 = await storage.getPurchaseOrdersBySupplier(
          supplierId,
          filterCompanyId
        );
        const company = await storage.getCompanyById(filterCompanyId);
        const posWithCompanyName = purchaseOrders2.map((po) => ({
          ...po,
          companyName: company?.name
        }));
        res.json(posWithCompanyName);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post("/api/vouchers", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const voucher = await storage.createVoucher(req.body);
      res.json(voucher);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post(
    "/api/vouchers/with-entries",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const { voucher, entries } = req.body;
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        if (!voucher || !entries || !Array.isArray(entries) || entries.length === 0) {
          return res.status(400).json({ message: "Voucher and entries are required" });
        }
        const totalDebits = entries.reduce(
          (sum, entry) => sum + parseFloat(entry.debitAmount || "0"),
          0
        );
        const totalCredits = entries.reduce(
          (sum, entry) => sum + parseFloat(entry.creditAmount || "0"),
          0
        );
        if (!voucher.optional && Math.abs(totalDebits - totalCredits) >= 0.01) {
          return res.status(400).json({
            message: "Total debits must equal total credits for active vouchers"
          });
        }
        let createdVoucher;
        let createdEntries = [];
        try {
          [createdVoucher] = await db.insert(vouchers).values({
            companyId: req.session.currentCompanyId,
            locationId: voucher.locationId || null,
            voucherNumber: voucher.voucherNumber,
            voucherType: voucher.voucherType,
            voucherDate: voucher.voucherDate,
            description: voucher.description || null,
            totalAmount: Math.max(totalDebits, totalCredits).toFixed(2),
            optional: voucher.optional ?? false
          }).returning();
          for (const entry of entries) {
            const [createdEntry] = await db.insert(voucherEntries).values({
              voucherId: createdVoucher.id,
              ledgerAccountId: entry.ledgerAccountId || null,
              bankAccountId: entry.bankAccountId || null,
              fixedAssetId: entry.fixedAssetId || null,
              supplierId: entry.supplierId || null,
              employeeId: entry.employeeId || null,
              debitAmount: entry.debitAmount || "0",
              creditAmount: entry.creditAmount || "0",
              narration: entry.narration || null
            }).returning();
            createdEntries.push(createdEntry);
          }
        } catch (error) {
          if (createdVoucher?.id) {
            await db.delete(voucherEntries).where(eq2(voucherEntries.voucherId, createdVoucher.id)).catch(() => {
            });
            await db.delete(vouchers).where(eq2(vouchers.id, createdVoucher.id)).catch(() => {
            });
          }
          throw error;
        }
        if (!createdVoucher.optional) {
          await syncEmployeeBalancesFromEntries(
            createdEntries.map((e) => ({
              ledgerAccountId: e.ledgerAccountId,
              employeeId: e.employeeId,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount
            })),
            req.session.currentCompanyId
          );
        }
        const result = { voucher: createdVoucher, entries: createdEntries };
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/vouchers/payment-receipt",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const {
          voucherType,
          // "Payment" or "Receipt"
          voucherDate,
          paymentAccountType,
          // "ledger", "bank", "supplier", "employee", "fixedAsset"
          paymentAccountId,
          paymentAccountName,
          entries,
          // Array of { accountType, accountId, accountName, amount }
          notes,
          optional
        } = req.body;
        if (!voucherType || !voucherDate || !paymentAccountId || !entries || !Array.isArray(entries) || entries.length === 0) {
          return res.status(400).json({ message: "Missing required fields" });
        }
        if (voucherType !== "Payment" && voucherType !== "Receipt") {
          return res.status(400).json({ message: "voucherType must be 'Payment' or 'Receipt'" });
        }
        const total = entries.reduce((sum, entry) => sum + parseFloat(entry.amount || "0"), 0);
        const voucherNumber = `${voucherType.toUpperCase()}-${Date.now()}`;
        const result = await db.transaction(async (tx) => {
          const [createdVoucher] = await tx.insert(vouchers).values({
            companyId: req.session.currentCompanyId,
            voucherNumber,
            voucherType,
            voucherDate,
            description: notes || null,
            totalAmount: total.toFixed(2),
            optional: optional ?? false
          }).returning();
          const voucherEntriesToCreate = [];
          for (const entry of entries) {
            const amount = entry.amount;
            const narration = `${voucherType} - ${entry.accountName}`;
            const entryAccountField = {};
            if (entry.accountType === "ledger") {
              entryAccountField.ledgerAccountId = entry.accountId;
            } else if (entry.accountType === "bank") {
              entryAccountField.bankAccountId = entry.accountId;
            } else if (entry.accountType === "supplier") {
              entryAccountField.supplierId = entry.accountId;
            } else if (entry.accountType === "employee") {
              entryAccountField.employeeId = entry.accountId;
            } else if (entry.accountType === "fixedAsset") {
              entryAccountField.fixedAssetId = entry.accountId;
            }
            const paymentAccountField = {};
            if (paymentAccountType === "ledger") {
              paymentAccountField.ledgerAccountId = paymentAccountId;
            } else if (paymentAccountType === "bank") {
              paymentAccountField.bankAccountId = paymentAccountId;
            } else if (paymentAccountType === "supplier") {
              paymentAccountField.supplierId = paymentAccountId;
            } else if (paymentAccountType === "employee") {
              paymentAccountField.employeeId = paymentAccountId;
            } else if (paymentAccountType === "fixedAsset") {
              paymentAccountField.fixedAssetId = paymentAccountId;
            }
            if (voucherType === "Payment") {
              voucherEntriesToCreate.push({
                voucherId: createdVoucher.id,
                ...entryAccountField,
                debitAmount: amount,
                creditAmount: "0",
                narration
              });
              voucherEntriesToCreate.push({
                voucherId: createdVoucher.id,
                ...paymentAccountField,
                debitAmount: "0",
                creditAmount: amount,
                narration
              });
            } else {
              voucherEntriesToCreate.push({
                voucherId: createdVoucher.id,
                ...paymentAccountField,
                debitAmount: amount,
                creditAmount: "0",
                narration
              });
              voucherEntriesToCreate.push({
                voucherId: createdVoucher.id,
                ...entryAccountField,
                debitAmount: "0",
                creditAmount: amount,
                narration
              });
            }
          }
          const createdEntries = await tx.insert(voucherEntries).values(voucherEntriesToCreate).returning();
          return { voucher: createdVoucher, entries: createdEntries };
        });
        if (!result.voucher.optional) {
          await syncEmployeeBalancesFromEntries(
            result.entries.map((e) => ({
              ledgerAccountId: e.ledgerAccountId,
              employeeId: e.employeeId,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount
            })),
            req.session.currentCompanyId
          );
        }
        res.json(result);
      } catch (error) {
        console.error("Error creating payment/receipt voucher:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.patch(
    "/api/vouchers/:id/payment-receipt",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const voucherId = parseInt(req.params.id);
        if (isNaN(voucherId)) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const {
          voucherType,
          // "Payment" or "Receipt"
          voucherDate,
          paymentAccountType,
          paymentAccountId,
          paymentAccountName,
          entries,
          notes,
          optional
        } = req.body;
        if (!voucherType || !voucherDate || !paymentAccountId || !entries || !Array.isArray(entries) || entries.length === 0) {
          return res.status(400).json({ message: "Missing required fields" });
        }
        if (voucherType !== "Payment" && voucherType !== "Receipt") {
          return res.status(400).json({ message: "voucherType must be 'Payment' or 'Receipt'" });
        }
        const total = entries.reduce((sum, entry) => sum + parseFloat(entry.amount || "0"), 0);
        const result = await db.transaction(async (tx) => {
          const [existingVoucher] = await tx.select().from(vouchers).where(eq2(vouchers.id, voucherId));
          if (!existingVoucher) {
            throw new Error("Voucher not found");
          }
          if (existingVoucher.companyId !== req.session.currentCompanyId) {
            throw new Error("Access denied: Voucher belongs to a different company");
          }
          const oldEntries = await tx.select().from(voucherEntries).where(eq2(voucherEntries.voucherId, voucherId));
          const [updatedVoucher] = await tx.update(vouchers).set({
            voucherType,
            voucherDate,
            description: notes || null,
            totalAmount: total.toFixed(2),
            optional: optional ?? false
          }).where(eq2(vouchers.id, voucherId)).returning();
          await tx.delete(voucherEntries).where(eq2(voucherEntries.voucherId, voucherId));
          const voucherEntriesToCreate = [];
          for (const entry of entries) {
            const amount = entry.amount;
            const narration = `${voucherType} - ${entry.accountName}`;
            const entryAccountField = {};
            if (entry.accountType === "ledger") {
              entryAccountField.ledgerAccountId = entry.accountId;
            } else if (entry.accountType === "bank") {
              entryAccountField.bankAccountId = entry.accountId;
            } else if (entry.accountType === "supplier") {
              entryAccountField.supplierId = entry.accountId;
            } else if (entry.accountType === "employee") {
              entryAccountField.employeeId = entry.accountId;
            } else if (entry.accountType === "fixedAsset") {
              entryAccountField.fixedAssetId = entry.accountId;
            }
            const paymentAccountField = {};
            if (paymentAccountType === "ledger") {
              paymentAccountField.ledgerAccountId = paymentAccountId;
            } else if (paymentAccountType === "bank") {
              paymentAccountField.bankAccountId = paymentAccountId;
            } else if (paymentAccountType === "supplier") {
              paymentAccountField.supplierId = paymentAccountId;
            } else if (paymentAccountType === "employee") {
              paymentAccountField.employeeId = paymentAccountId;
            } else if (paymentAccountType === "fixedAsset") {
              paymentAccountField.fixedAssetId = paymentAccountId;
            }
            if (voucherType === "Payment") {
              voucherEntriesToCreate.push({
                voucherId: updatedVoucher.id,
                ...entryAccountField,
                debitAmount: amount,
                creditAmount: "0",
                narration
              });
              voucherEntriesToCreate.push({
                voucherId: updatedVoucher.id,
                ...paymentAccountField,
                debitAmount: "0",
                creditAmount: amount,
                narration
              });
            } else {
              voucherEntriesToCreate.push({
                voucherId: updatedVoucher.id,
                ...paymentAccountField,
                debitAmount: amount,
                creditAmount: "0",
                narration
              });
              voucherEntriesToCreate.push({
                voucherId: updatedVoucher.id,
                ...entryAccountField,
                debitAmount: "0",
                creditAmount: amount,
                narration
              });
            }
          }
          const createdEntries = await tx.insert(voucherEntries).values(voucherEntriesToCreate).returning();
          return { voucher: updatedVoucher, entries: createdEntries, oldEntries, wasOptional: existingVoucher.optional };
        });
        if (!result.wasOptional) {
          await syncEmployeeBalancesFromEntries(
            result.oldEntries.map((e) => ({
              ledgerAccountId: e.ledgerAccountId,
              employeeId: e.employeeId,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount
            })),
            req.session.currentCompanyId,
            true
            // reverse
          );
        }
        if (!result.voucher.optional) {
          await syncEmployeeBalancesFromEntries(
            result.entries.map((e) => ({
              ledgerAccountId: e.ledgerAccountId,
              employeeId: e.employeeId,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount
            })),
            req.session.currentCompanyId
          );
        }
        res.json({ voucher: result.voucher, entries: result.entries });
      } catch (error) {
        console.error("Error updating payment/receipt voucher:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/vouchers/journal",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const {
          voucherDate,
          entries,
          // Array of { type: "DR" | "CR", accountType, accountId, accountName, amount }
          notes,
          optional
        } = req.body;
        if (!voucherDate || !entries || !Array.isArray(entries) || entries.length === 0) {
          return res.status(400).json({ message: "Missing required fields" });
        }
        let totalDebits = 0;
        let totalCredits = 0;
        entries.forEach((entry) => {
          const amount = parseFloat(entry.amount || "0");
          if (entry.type === "DR") {
            totalDebits += amount;
          } else if (entry.type === "CR") {
            totalCredits += amount;
          }
        });
        if (!optional && Math.abs(totalDebits - totalCredits) >= 0.01) {
          return res.status(400).json({ message: "Total debits must equal total credits" });
        }
        const voucherNumber = `JOURNAL-${Date.now()}`;
        const result = await db.transaction(async (tx) => {
          const [createdVoucher] = await tx.insert(vouchers).values({
            companyId: req.session.currentCompanyId,
            voucherNumber,
            voucherType: "Journal",
            voucherDate,
            description: notes || null,
            totalAmount: Math.max(totalDebits, totalCredits).toFixed(2),
            optional: optional ?? false
          }).returning();
          const voucherEntriesToCreate = [];
          for (const entry of entries) {
            const amount = entry.amount;
            const narration = `Journal - ${entry.accountName}`;
            const accountField = {};
            if (entry.accountType === "ledger") {
              accountField.ledgerAccountId = entry.accountId;
            } else if (entry.accountType === "bank") {
              accountField.bankAccountId = entry.accountId;
            } else if (entry.accountType === "supplier") {
              accountField.supplierId = entry.accountId;
            } else if (entry.accountType === "employee") {
              accountField.employeeId = entry.accountId;
            } else if (entry.accountType === "fixedAsset") {
              accountField.fixedAssetId = entry.accountId;
            }
            voucherEntriesToCreate.push({
              voucherId: createdVoucher.id,
              ...accountField,
              debitAmount: entry.type === "DR" ? amount : "0",
              creditAmount: entry.type === "CR" ? amount : "0",
              narration
            });
          }
          const createdEntries = await tx.insert(voucherEntries).values(voucherEntriesToCreate).returning();
          return { voucher: createdVoucher, entries: createdEntries };
        });
        if (!result.voucher.optional) {
          await syncEmployeeBalancesFromEntries(
            result.entries.map((e) => ({
              ledgerAccountId: e.ledgerAccountId,
              employeeId: e.employeeId,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount
            })),
            req.session.currentCompanyId
          );
        }
        res.json(result);
      } catch (error) {
        console.error("Error creating journal voucher:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.patch(
    "/api/vouchers/:id/journal",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const voucherId = parseInt(req.params.id);
        if (isNaN(voucherId)) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const {
          voucherDate,
          entries,
          notes,
          optional
        } = req.body;
        if (!voucherDate || !entries || !Array.isArray(entries) || entries.length === 0) {
          return res.status(400).json({ message: "Missing required fields" });
        }
        let totalDebits = 0;
        let totalCredits = 0;
        entries.forEach((entry) => {
          const amount = parseFloat(entry.amount || "0");
          if (entry.type === "DR") {
            totalDebits += amount;
          } else if (entry.type === "CR") {
            totalCredits += amount;
          }
        });
        if (!optional && Math.abs(totalDebits - totalCredits) >= 0.01) {
          return res.status(400).json({ message: "Total debits must equal total credits" });
        }
        const result = await db.transaction(async (tx) => {
          const [existingVoucher] = await tx.select().from(vouchers).where(eq2(vouchers.id, voucherId));
          if (!existingVoucher) {
            throw new Error("Voucher not found");
          }
          if (existingVoucher.companyId !== req.session.currentCompanyId) {
            throw new Error("Access denied: Voucher belongs to a different company");
          }
          const oldEntries = await tx.select().from(voucherEntries).where(eq2(voucherEntries.voucherId, voucherId));
          const [updatedVoucher] = await tx.update(vouchers).set({
            voucherDate,
            description: notes || null,
            totalAmount: Math.max(totalDebits, totalCredits).toFixed(2),
            optional: optional ?? false
          }).where(eq2(vouchers.id, voucherId)).returning();
          await tx.delete(voucherEntries).where(eq2(voucherEntries.voucherId, voucherId));
          const voucherEntriesToCreate = [];
          for (const entry of entries) {
            const amount = entry.amount;
            const narration = `Journal - ${entry.accountName}`;
            const accountField = {};
            if (entry.accountType === "ledger") {
              accountField.ledgerAccountId = entry.accountId;
            } else if (entry.accountType === "bank") {
              accountField.bankAccountId = entry.accountId;
            } else if (entry.accountType === "supplier") {
              accountField.supplierId = entry.accountId;
            } else if (entry.accountType === "employee") {
              accountField.employeeId = entry.accountId;
            } else if (entry.accountType === "fixedAsset") {
              accountField.fixedAssetId = entry.accountId;
            }
            voucherEntriesToCreate.push({
              voucherId: updatedVoucher.id,
              ...accountField,
              debitAmount: entry.type === "DR" ? amount : "0",
              creditAmount: entry.type === "CR" ? amount : "0",
              narration
            });
          }
          const createdEntries = await tx.insert(voucherEntries).values(voucherEntriesToCreate).returning();
          return { voucher: updatedVoucher, entries: createdEntries, oldEntries, wasOptional: existingVoucher.optional };
        });
        if (!result.wasOptional) {
          await syncEmployeeBalancesFromEntries(
            result.oldEntries.map((e) => ({
              ledgerAccountId: e.ledgerAccountId,
              employeeId: e.employeeId,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount
            })),
            req.session.currentCompanyId,
            true
            // reverse
          );
        }
        if (!result.voucher.optional) {
          await syncEmployeeBalancesFromEntries(
            result.entries.map((e) => ({
              ledgerAccountId: e.ledgerAccountId,
              employeeId: e.employeeId,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount
            })),
            req.session.currentCompanyId
          );
        }
        res.json({ voucher: result.voucher, entries: result.entries });
      } catch (error) {
        console.error("Error updating journal voucher:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/vouchers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid voucher ID" });
      }
      const voucher = await storage.getVoucherById(id);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      if (voucher.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Voucher belongs to a different company"
        });
      }
      const entries = await storage.getVoucherEntriesByVoucher(id);
      let purchaseOrder = null;
      if (voucher.voucherType === "Purchase") {
        const allPOs = await storage.getAllPurchaseOrders(voucher.companyId);
        const linkedPO = allPOs.find((po) => po.voucherId === id);
        if (linkedPO) {
          const lineItems = await storage.getLineItemsByPO(linkedPO.id);
          purchaseOrder = {
            ...linkedPO,
            items: lineItems
          };
        }
      }
      let salesItemsList = null;
      if (voucher.voucherType === "Sales") {
        const items = await db.select().from(salesItems).where(eq2(salesItems.voucherId, id));
        if (items.length > 0) {
          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              const stockItem = await storage.getStockItemById(
                item.stockItemId
              );
              return {
                ...item,
                stockItemCode: stockItem?.code || "",
                stockItemName: stockItem?.name || "",
                stockItemUom: stockItem?.uom || ""
              };
            })
          );
          salesItemsList = itemsWithDetails;
        }
      }
      let adjustmentData = null;
      if (voucher.voucherType === "Consumption" || voucher.voucherType === "Mixed" || voucher.voucherType === "Production") {
        const adjustment = await db.select().from(stockAdjustmentVouchers).where(eq2(stockAdjustmentVouchers.voucherId, id)).limit(1);
        if (adjustment.length > 0) {
          const items = await db.select().from(stockAdjustmentItems).where(eq2(stockAdjustmentItems.adjustmentId, adjustment[0].id));
          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              const stockItem = await storage.getStockItemById(
                item.stockItemId
              );
              return {
                ...item,
                stockItemCode: stockItem?.code || "",
                stockItemName: stockItem?.name || "",
                stockItemUom: stockItem?.uom || ""
              };
            })
          );
          const location = await storage.getLocationById(
            adjustment[0].locationId
          );
          adjustmentData = {
            ...adjustment[0],
            locationName: location?.name || "",
            items: itemsWithDetails
          };
        } else {
          let adjustmentType = "production";
          if (voucher.voucherType === "Consumption")
            adjustmentType = "consumption";
          else if (voucher.voucherType === "Mixed") adjustmentType = "mixed";
          adjustmentData = {
            id: 0,
            voucherId: id,
            locationId: voucher.locationId || 1,
            locationName: "",
            adjustmentType,
            notes: voucher.description || "",
            items: [],
            createdAt: /* @__PURE__ */ new Date()
          };
        }
      }
      let transferData = null;
      if (voucher.voucherType === "Stock Transfer") {
        const transfer = await db.select().from(stockTransferVouchers).where(eq2(stockTransferVouchers.voucherId, id)).limit(1);
        if (transfer.length > 0) {
          const items = await db.select().from(stockTransferItems).where(eq2(stockTransferItems.transferId, transfer[0].id));
          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              const stockItem = await storage.getStockItemById(
                item.stockItemId
              );
              return {
                ...item,
                stockItemCode: stockItem?.code || "",
                stockItemName: stockItem?.name || "",
                stockItemUom: stockItem?.uom || ""
              };
            })
          );
          const sourceLocation = await storage.getLocationById(
            transfer[0].sourceLocationId
          );
          const destLocation = await storage.getLocationById(
            transfer[0].destinationLocationId
          );
          transferData = {
            ...transfer[0],
            sourceLocationName: sourceLocation?.name || "",
            destinationLocationName: destLocation?.name || "",
            items: itemsWithDetails
          };
        } else {
          transferData = {
            id: 0,
            voucherId: id,
            sourceLocationId: voucher.locationId || 1,
            destinationLocationId: voucher.locationId || 1,
            sourceLocationName: "",
            destinationLocationName: "",
            notes: voucher.description || "",
            items: [],
            createdAt: /* @__PURE__ */ new Date()
          };
        }
      }
      res.json({
        ...voucher,
        entries,
        purchaseOrder,
        salesItems: salesItemsList,
        adjustmentData,
        transferData
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch(
    "/api/vouchers/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const existingVoucher = await storage.getVoucherById(id);
        if (!existingVoucher) {
          return res.status(404).json({ message: "Voucher not found" });
        }
        if (existingVoucher.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Voucher belongs to a different company"
          });
        }
        const userRole = req.session.currentRole;
        if (!userRole) {
          return res.status(403).json({ message: "User role not found" });
        }
        if (userRole !== "Admin" && userRole !== "Owner") {
          if (userRole === "Manager") {
            const voucherDate = new Date(existingVoucher.voucherDate);
            const today = /* @__PURE__ */ new Date();
            today.setHours(0, 0, 0, 0);
            voucherDate.setHours(0, 0, 0, 0);
            if (voucherDate.getTime() !== today.getTime()) {
              return res.status(403).json({ message: "Managers can only edit today's vouchers" });
            }
          } else {
            return res.status(403).json({ message: "Insufficient permissions to edit vouchers" });
          }
        }
        const oldEntries = await storage.getVoucherEntriesByVoucher(id);
        const wasOptional = existingVoucher.optional;
        await db.transaction(async (tx) => {
          const voucherUpdates = {};
          if (req.body.voucherDate !== void 0)
            voucherUpdates.voucherDate = req.body.voucherDate;
          if (req.body.description !== void 0)
            voucherUpdates.description = req.body.description;
          if (req.body.optional !== void 0)
            voucherUpdates.optional = req.body.optional;
          if (req.body.optional !== void 0 && existingVoucher.optional !== req.body.optional) {
            const wasOptional2 = existingVoucher.optional;
            const willBeOptional = req.body.optional;
            const hasStockTransfer = await tx.select().from(stockTransferVouchers).where(eq2(stockTransferVouchers.voucherId, id)).limit(1);
            const hasStockAdjustment = await tx.select().from(stockAdjustmentVouchers).where(eq2(stockAdjustmentVouchers.voucherId, id)).limit(1);
            if (hasStockTransfer.length > 0) {
              const transfer = hasStockTransfer[0];
              const items = await tx.select().from(stockTransferItems).where(eq2(stockTransferItems.transferId, transfer.id));
              const itemsWithoutSource = items.filter((item) => !item.sourceLocationId);
              if (itemsWithoutSource.length > 0) {
                throw new Error(`Cannot toggle optional status: This stock transfer has ${itemsWithoutSource.length} items missing source location data.`);
              }
              for (const item of items) {
                const quantity = parseFloat(item.quantity);
                const rate = parseFloat(item.rate);
                const totalAmount = quantity * rate;
                if (willBeOptional) {
                  const [sourceInv] = await tx.select().from(inventory).where(and2(
                    eq2(inventory.locationId, item.sourceLocationId),
                    eq2(inventory.stockItemId, item.stockItemId)
                  ));
                  if (sourceInv) {
                    const currentQty = parseFloat(sourceInv.quantity);
                    const currentValue = parseFloat(sourceInv.totalValue);
                    const newQty = currentQty + quantity;
                    const newValue = currentValue + totalAmount;
                    const newRate = newQty > 0 ? newValue / newQty : 0;
                    await tx.update(inventory).set({
                      quantity: newQty.toFixed(3),
                      averageRate: newRate.toFixed(2),
                      totalValue: newValue.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    }).where(eq2(inventory.id, sourceInv.id));
                  }
                  const [destInv] = await tx.select().from(inventory).where(and2(
                    eq2(inventory.locationId, transfer.destinationLocationId),
                    eq2(inventory.stockItemId, item.stockItemId)
                  ));
                  if (destInv) {
                    const currentQty = parseFloat(destInv.quantity);
                    const currentRate = parseFloat(destInv.averageRate);
                    const newQty = currentQty - quantity;
                    const newValue = newQty > 0 ? newQty * currentRate : 0;
                    await tx.update(inventory).set({
                      quantity: newQty.toFixed(3),
                      averageRate: currentRate.toFixed(2),
                      totalValue: newValue.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    }).where(eq2(inventory.id, destInv.id));
                  }
                } else {
                  const [sourceInv] = await tx.select().from(inventory).where(and2(
                    eq2(inventory.locationId, item.sourceLocationId),
                    eq2(inventory.stockItemId, item.stockItemId)
                  ));
                  if (sourceInv) {
                    const currentQty = parseFloat(sourceInv.quantity);
                    const currentRate = parseFloat(sourceInv.averageRate);
                    const newQty = currentQty - quantity;
                    const newValue = newQty > 0 ? newQty * currentRate : 0;
                    await tx.update(inventory).set({
                      quantity: newQty.toFixed(3),
                      averageRate: currentRate.toFixed(2),
                      totalValue: newValue.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    }).where(eq2(inventory.id, sourceInv.id));
                  }
                  const [destInv] = await tx.select().from(inventory).where(and2(
                    eq2(inventory.locationId, transfer.destinationLocationId),
                    eq2(inventory.stockItemId, item.stockItemId)
                  ));
                  if (destInv) {
                    const currentQty = parseFloat(destInv.quantity);
                    const currentValue = parseFloat(destInv.totalValue);
                    const newQty = currentQty + quantity;
                    const newValue = currentValue + totalAmount;
                    const newRate = newQty > 0 ? newValue / newQty : 0;
                    await tx.update(inventory).set({
                      quantity: newQty.toFixed(3),
                      averageRate: newRate.toFixed(2),
                      totalValue: newValue.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    }).where(eq2(inventory.id, destInv.id));
                  } else {
                    const [destLocation] = await tx.select().from(locations).where(eq2(locations.id, transfer.destinationLocationId));
                    if (destLocation) {
                      await tx.insert(inventory).values({
                        companyId: destLocation.companyId,
                        locationId: transfer.destinationLocationId,
                        stockItemId: item.stockItemId,
                        quantity: quantity.toFixed(3),
                        averageRate: rate.toFixed(2),
                        totalValue: totalAmount.toFixed(2),
                        lastUpdated: /* @__PURE__ */ new Date()
                      });
                    }
                  }
                }
              }
            }
            if (hasStockAdjustment.length > 0) {
              const adjustment = hasStockAdjustment[0];
              const items = await tx.select().from(stockAdjustmentItems).where(eq2(stockAdjustmentItems.adjustmentId, adjustment.id));
              for (const item of items) {
                const quantity = parseFloat(item.quantity);
                const rate = parseFloat(item.rate);
                const totalAmount = Math.abs(quantity) * rate;
                const [currentInv] = await tx.select().from(inventory).where(and2(
                  eq2(inventory.locationId, adjustment.locationId),
                  eq2(inventory.stockItemId, item.stockItemId)
                ));
                if (currentInv) {
                  const currentQty = parseFloat(currentInv.quantity);
                  const currentValue = parseFloat(currentInv.totalValue);
                  const currentRate = parseFloat(currentInv.averageRate);
                  let newQty;
                  let newValue;
                  let newRate;
                  if (willBeOptional) {
                    if (adjustment.adjustmentType === "Production") {
                      newQty = currentQty - quantity;
                      newValue = newQty > 0 ? newQty * currentRate : 0;
                      newRate = currentRate;
                    } else {
                      newQty = currentQty + Math.abs(quantity);
                      newValue = currentValue + totalAmount;
                      newRate = newQty > 0 ? newValue / newQty : 0;
                    }
                  } else {
                    if (adjustment.adjustmentType === "Production") {
                      newQty = currentQty + quantity;
                      newValue = currentValue + totalAmount;
                      newRate = newQty > 0 ? newValue / newQty : 0;
                    } else {
                      newQty = currentQty - Math.abs(quantity);
                      newValue = newQty > 0 ? newQty * currentRate : 0;
                      newRate = currentRate;
                    }
                  }
                  await tx.update(inventory).set({
                    quantity: newQty.toFixed(3),
                    averageRate: newRate.toFixed(2),
                    totalValue: newValue.toFixed(2),
                    lastUpdated: /* @__PURE__ */ new Date()
                  }).where(eq2(inventory.id, currentInv.id));
                } else if (!willBeOptional && adjustment.adjustmentType === "Production") {
                  const [loc] = await tx.select().from(locations).where(eq2(locations.id, adjustment.locationId));
                  if (loc) {
                    await tx.insert(inventory).values({
                      companyId: loc.companyId,
                      locationId: adjustment.locationId,
                      stockItemId: item.stockItemId,
                      quantity: quantity.toFixed(3),
                      averageRate: rate.toFixed(2),
                      totalValue: totalAmount.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    });
                  }
                }
              }
            }
          }
          await tx.update(vouchers).set(voucherUpdates).where(eq2(vouchers.id, id));
          await tx.delete(voucherEntries).where(eq2(voucherEntries.voucherId, id));
          if (req.body.entries && Array.isArray(req.body.entries)) {
            for (const entry of req.body.entries) {
              await tx.insert(voucherEntries).values({
                voucherId: id,
                ledgerAccountId: entry.ledgerAccountId || null,
                bankAccountId: entry.bankAccountId || null,
                supplierId: entry.supplierId || null,
                employeeId: entry.employeeId || null,
                fixedAssetId: entry.fixedAssetId || null,
                debitAmount: entry.debitAmount || "0",
                creditAmount: entry.creditAmount || "0",
                narration: entry.narration || ""
              });
            }
          }
        });
        const updated = await storage.getVoucherById(id);
        const newEntries = await storage.getVoucherEntriesByVoucher(id);
        if (!wasOptional && req.session.currentCompanyId) {
          await syncEmployeeBalancesFromEntries(
            oldEntries.map((e) => ({
              ledgerAccountId: e.ledgerAccountId,
              employeeId: e.employeeId,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount
            })),
            req.session.currentCompanyId,
            true
            // reverse
          );
        }
        const isNowOptional = req.body.optional !== void 0 ? req.body.optional : wasOptional;
        if (!isNowOptional && req.session.currentCompanyId) {
          await syncEmployeeBalancesFromEntries(
            newEntries.map((e) => ({
              ledgerAccountId: e.ledgerAccountId,
              employeeId: e.employeeId,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount
            })),
            req.session.currentCompanyId
          );
        }
        res.json({ ...updated, entries: newEntries });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = "ValidationError";
    }
  }
  app2.patch(
    "/api/vouchers/:id/optional",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const { optional } = req.body;
        if (typeof optional !== "boolean") {
          return res.status(400).json({ message: "Optional must be a boolean value" });
        }
        const existingVoucher = await storage.getVoucherById(id);
        if (!existingVoucher) {
          return res.status(404).json({ message: "Voucher not found" });
        }
        if (existingVoucher.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Voucher belongs to a different company"
          });
        }
        const userRole = req.session.currentRole;
        if (userRole !== "Admin" && userRole !== "Owner") {
          return res.status(403).json({
            message: "Only Admin and Owner can toggle optional status"
          });
        }
        const wasOptional = existingVoucher.optional;
        const willBeOptional = optional;
        await db.transaction(async (tx) => {
          const hasStockTransfer = await tx.select().from(stockTransferVouchers).where(eq2(stockTransferVouchers.voucherId, id)).limit(1);
          const hasStockAdjustment = await tx.select().from(stockAdjustmentVouchers).where(eq2(stockAdjustmentVouchers.voucherId, id)).limit(1);
          if (wasOptional !== willBeOptional) {
            if (hasStockTransfer.length > 0) {
              const transfer = hasStockTransfer[0];
              const items = await tx.select().from(stockTransferItems).where(eq2(stockTransferItems.transferId, transfer.id));
              const itemsWithoutSource = items.filter((item) => !item.sourceLocationId);
              if (itemsWithoutSource.length > 0) {
                throw new ValidationError(`Cannot toggle optional status: This stock transfer has ${itemsWithoutSource.length} items missing source location data. It was created before per-item source locations were tracked.`);
              }
              for (const item of items) {
                const quantity = parseFloat(item.quantity);
                const rate = parseFloat(item.rate);
                const totalAmount = quantity * rate;
                if (willBeOptional) {
                  const [sourceInv] = await tx.select().from(inventory).where(and2(
                    eq2(inventory.locationId, item.sourceLocationId),
                    eq2(inventory.stockItemId, item.stockItemId)
                  ));
                  if (sourceInv) {
                    const currentQty = parseFloat(sourceInv.quantity);
                    const currentValue = parseFloat(sourceInv.totalValue);
                    const newQty = currentQty + quantity;
                    const newValue = currentValue + totalAmount;
                    const newRate = newQty > 0 ? newValue / newQty : 0;
                    await tx.update(inventory).set({
                      quantity: newQty.toFixed(3),
                      averageRate: newRate.toFixed(2),
                      totalValue: newValue.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    }).where(eq2(inventory.id, sourceInv.id));
                  }
                  const [destInv] = await tx.select().from(inventory).where(and2(
                    eq2(inventory.locationId, transfer.destinationLocationId),
                    eq2(inventory.stockItemId, item.stockItemId)
                  ));
                  if (destInv) {
                    const currentQty = parseFloat(destInv.quantity);
                    const currentRate = parseFloat(destInv.averageRate);
                    const newQty = currentQty - quantity;
                    const newValue = newQty > 0 ? newQty * currentRate : 0;
                    await tx.update(inventory).set({
                      quantity: newQty.toFixed(3),
                      averageRate: currentRate.toFixed(2),
                      totalValue: newValue.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    }).where(eq2(inventory.id, destInv.id));
                  }
                } else {
                  const [sourceInv] = await tx.select().from(inventory).where(and2(
                    eq2(inventory.locationId, item.sourceLocationId),
                    eq2(inventory.stockItemId, item.stockItemId)
                  ));
                  if (sourceInv) {
                    const currentQty = parseFloat(sourceInv.quantity);
                    const currentRate = parseFloat(sourceInv.averageRate);
                    const newQty = currentQty - quantity;
                    const newValue = newQty > 0 ? newQty * currentRate : 0;
                    await tx.update(inventory).set({
                      quantity: newQty.toFixed(3),
                      averageRate: currentRate.toFixed(2),
                      totalValue: newValue.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    }).where(eq2(inventory.id, sourceInv.id));
                  }
                  const [destInv] = await tx.select().from(inventory).where(and2(
                    eq2(inventory.locationId, transfer.destinationLocationId),
                    eq2(inventory.stockItemId, item.stockItemId)
                  ));
                  if (destInv) {
                    const currentQty = parseFloat(destInv.quantity);
                    const currentValue = parseFloat(destInv.totalValue);
                    const newQty = currentQty + quantity;
                    const newValue = currentValue + totalAmount;
                    const newRate = newQty > 0 ? newValue / newQty : 0;
                    await tx.update(inventory).set({
                      quantity: newQty.toFixed(3),
                      averageRate: newRate.toFixed(2),
                      totalValue: newValue.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    }).where(eq2(inventory.id, destInv.id));
                  } else {
                    const [destLocation] = await tx.select().from(locations).where(eq2(locations.id, transfer.destinationLocationId));
                    if (destLocation) {
                      await tx.insert(inventory).values({
                        companyId: destLocation.companyId,
                        locationId: transfer.destinationLocationId,
                        stockItemId: item.stockItemId,
                        quantity: quantity.toFixed(3),
                        averageRate: rate.toFixed(2),
                        totalValue: totalAmount.toFixed(2),
                        lastUpdated: /* @__PURE__ */ new Date()
                      });
                    }
                  }
                }
              }
            }
            if (hasStockAdjustment.length > 0) {
              const adjustment = hasStockAdjustment[0];
              const items = await tx.select().from(stockAdjustmentItems).where(eq2(stockAdjustmentItems.adjustmentId, adjustment.id));
              for (const item of items) {
                const quantity = parseFloat(item.quantity);
                const rate = parseFloat(item.rate);
                const totalAmount = Math.abs(quantity) * rate;
                const [currentInv] = await tx.select().from(inventory).where(and2(
                  eq2(inventory.locationId, adjustment.locationId),
                  eq2(inventory.stockItemId, item.stockItemId)
                ));
                if (currentInv) {
                  const currentQty = parseFloat(currentInv.quantity);
                  const currentValue = parseFloat(currentInv.totalValue);
                  const currentRate = parseFloat(currentInv.averageRate);
                  let newQty;
                  let newValue;
                  let newRate;
                  if (willBeOptional) {
                    if (adjustment.adjustmentType === "Production") {
                      newQty = currentQty - quantity;
                      newValue = newQty > 0 ? newQty * currentRate : 0;
                      newRate = currentRate;
                    } else {
                      newQty = currentQty + Math.abs(quantity);
                      newValue = currentValue + totalAmount;
                      newRate = newQty > 0 ? newValue / newQty : 0;
                    }
                  } else {
                    if (adjustment.adjustmentType === "Production") {
                      newQty = currentQty + quantity;
                      newValue = currentValue + totalAmount;
                      newRate = newQty > 0 ? newValue / newQty : 0;
                    } else {
                      newQty = currentQty - Math.abs(quantity);
                      newValue = newQty > 0 ? newQty * currentRate : 0;
                      newRate = currentRate;
                    }
                  }
                  await tx.update(inventory).set({
                    quantity: newQty.toFixed(3),
                    averageRate: newRate.toFixed(2),
                    totalValue: newValue.toFixed(2),
                    lastUpdated: /* @__PURE__ */ new Date()
                  }).where(eq2(inventory.id, currentInv.id));
                } else if (!willBeOptional && adjustment.adjustmentType === "Production") {
                  const [loc] = await tx.select().from(locations).where(eq2(locations.id, adjustment.locationId));
                  if (loc) {
                    await tx.insert(inventory).values({
                      companyId: loc.companyId,
                      locationId: adjustment.locationId,
                      stockItemId: item.stockItemId,
                      quantity: quantity.toFixed(3),
                      averageRate: rate.toFixed(2),
                      totalValue: totalAmount.toFixed(2),
                      lastUpdated: /* @__PURE__ */ new Date()
                    });
                  }
                }
              }
            }
          }
          await tx.update(vouchers).set({ optional }).where(eq2(vouchers.id, id));
        });
        if (wasOptional !== willBeOptional && req.session.currentCompanyId) {
          const entries = await storage.getVoucherEntriesByVoucher(id);
          if (willBeOptional) {
            await syncEmployeeBalancesFromEntries(
              entries.map((e) => ({
                ledgerAccountId: e.ledgerAccountId,
                employeeId: e.employeeId,
                debitAmount: e.debitAmount,
                creditAmount: e.creditAmount
              })),
              req.session.currentCompanyId,
              true
              // reverse
            );
          } else {
            await syncEmployeeBalancesFromEntries(
              entries.map((e) => ({
                ledgerAccountId: e.ledgerAccountId,
                employeeId: e.employeeId,
                debitAmount: e.debitAmount,
                creditAmount: e.creditAmount
              })),
              req.session.currentCompanyId
            );
          }
        }
        const updated = await storage.getVoucherById(id);
        res.json(updated);
      } catch (error) {
        if (error.name === "ValidationError") {
          return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.patch("/api/vouchers/:id/sales", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid voucher ID" });
      }
      const {
        voucherDate,
        description,
        locationId,
        items,
        paymentAccountType,
        paymentAccountId,
        isCreditSale
      } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }
      const existingVoucher = await storage.getVoucherById(id);
      if (!existingVoucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      if (existingVoucher.voucherType !== "Sales") {
        return res.status(400).json({ message: "This endpoint only updates Sales vouchers" });
      }
      if (existingVoucher.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Voucher belongs to a different company"
        });
      }
      const userRole = req.session.currentRole;
      if (!userRole) {
        return res.status(403).json({ message: "User role not found" });
      }
      if (userRole !== "Admin" && userRole !== "Owner") {
        if (userRole === "Manager") {
          const today = /* @__PURE__ */ new Date();
          today.setHours(0, 0, 0, 0);
          const voucherDate2 = new Date(existingVoucher.voucherDate);
          voucherDate2.setHours(0, 0, 0, 0);
          if (voucherDate2.getTime() !== today.getTime()) {
            return res.status(403).json({ message: "Managers can only edit today's vouchers" });
          }
        } else {
          const canEditDaybook = req.user?.canEditDaybook || false;
          if (!canEditDaybook) {
            return res.status(403).json({ message: "Insufficient permissions to edit vouchers" });
          }
          const today = /* @__PURE__ */ new Date();
          today.setHours(0, 0, 0, 0);
          const voucherDate2 = new Date(existingVoucher.voucherDate);
          voucherDate2.setHours(0, 0, 0, 0);
          if (voucherDate2.getTime() !== today.getTime()) {
            return res.status(403).json({ message: "You can only edit today's vouchers" });
          }
        }
      }
      let validatedLocationId = null;
      if (locationId !== void 0 && locationId !== null) {
        const parsedLocationId = parseInt(locationId);
        if (isNaN(parsedLocationId) || parsedLocationId <= 0) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
        const [targetLocation] = await db.select().from(locations).where(eq2(locations.id, parsedLocationId));
        if (!targetLocation) {
          return res.status(404).json({ message: "Location not found" });
        }
        if (targetLocation.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Location belongs to a different company"
          });
        }
        validatedLocationId = parsedLocationId;
      }
      const stockItemIds = items.map((item) => item.stockItemId);
      const stockItemsData = await db.select().from(stockItems).where(inArray2(stockItems.id, stockItemIds));
      const stockItemsMap = new Map(
        stockItemsData.map((item) => [item.id, item])
      );
      let totalSalesAmount = 0;
      const salesItemsData = items.map((item) => {
        const stockItem = stockItemsMap.get(item.stockItemId);
        if (!stockItem) {
          throw new Error(`Stock item ${item.stockItemId} not found`);
        }
        const quantity = parseFloat(item.quantity);
        const sellingPrice = parseFloat(item.sellingPrice);
        const costPrice = parseFloat(stockItem.openingRate || "0");
        const totalSales = quantity * sellingPrice;
        const totalCost = quantity * costPrice;
        const profit = totalSales - totalCost;
        totalSalesAmount += totalSales;
        return {
          voucherId: id,
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          costPrice: costPrice.toFixed(2),
          totalSales: totalSales.toFixed(2),
          totalCost: totalCost.toFixed(2),
          profit: profit.toFixed(2)
        };
      });
      const oldSalesItems = await db.select().from(salesItems).where(eq2(salesItems.voucherId, id));
      if (existingVoucher.locationId) {
        for (const oldItem of oldSalesItems) {
          const quantity = parseFloat(oldItem.quantity);
          const costPrice = parseFloat(oldItem.costPrice);
          const [currentInventory] = await db.select().from(inventory).where(
            and2(
              eq2(inventory.locationId, existingVoucher.locationId),
              eq2(inventory.stockItemId, oldItem.stockItemId)
            )
          );
          if (currentInventory) {
            const newQuantity = parseFloat(currentInventory.quantity) + quantity;
            const currentTotalValue = parseFloat(currentInventory.totalValue);
            const newTotalValue = currentTotalValue + quantity * costPrice;
            const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
            await db.update(inventory).set({
              quantity: newQuantity.toFixed(3),
              averageRate: newAverageRate.toFixed(2),
              totalValue: newTotalValue.toFixed(2)
            }).where(eq2(inventory.id, currentInventory.id));
          } else {
            await db.insert(inventory).values({
              companyId: existingVoucher.companyId,
              locationId: existingVoucher.locationId,
              stockItemId: oldItem.stockItemId,
              quantity: quantity.toFixed(3),
              averageRate: costPrice.toFixed(2),
              totalValue: (quantity * costPrice).toFixed(2)
            });
          }
        }
      }
      await db.delete(salesItems).where(eq2(salesItems.voucherId, id));
      const targetLocationId = validatedLocationId !== null ? validatedLocationId : existingVoucher.locationId;
      if (targetLocationId) {
        for (const newItem of salesItemsData) {
          const quantity = parseFloat(newItem.quantity);
          const costPrice = parseFloat(newItem.costPrice);
          const [currentInventory] = await db.select().from(inventory).where(
            and2(
              eq2(inventory.locationId, targetLocationId),
              eq2(inventory.stockItemId, newItem.stockItemId)
            )
          );
          if (currentInventory) {
            const newQuantity = Math.max(
              0,
              parseFloat(currentInventory.quantity) - quantity
            );
            const currentTotalValue = parseFloat(currentInventory.totalValue);
            const newTotalValue = Math.max(
              0,
              currentTotalValue - quantity * costPrice
            );
            const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
            await db.update(inventory).set({
              quantity: newQuantity.toFixed(3),
              averageRate: newAverageRate.toFixed(2),
              totalValue: newTotalValue.toFixed(2)
            }).where(eq2(inventory.id, currentInventory.id));
          }
        }
      }
      await db.insert(salesItems).values(salesItemsData);
      let finalPaymentAccountId = paymentAccountId;
      let finalPaymentAccountType = paymentAccountType;
      let finalIsCreditSale = isCreditSale;
      if (!finalPaymentAccountId || !finalPaymentAccountType) {
        const existingEntries = await db.select().from(voucherEntries).where(eq2(voucherEntries.voucherId, id));
        const debitEntries = existingEntries.filter(
          (entry) => parseFloat(entry.debitAmount || "0") > 0
        );
        let existingDebitEntry = debitEntries.find(
          (entry) => entry.bankAccountId !== null
        );
        if (existingDebitEntry) {
          finalPaymentAccountId = String(existingDebitEntry.bankAccountId);
          finalPaymentAccountType = "bank";
          finalIsCreditSale = false;
        } else {
          for (const entry of debitEntries) {
            if (entry.ledgerAccountId) {
              const [ledgerAccount] = await db.select().from(ledgerAccounts).where(eq2(ledgerAccounts.id, entry.ledgerAccountId)).limit(1);
              if (ledgerAccount) {
                if (ledgerAccount.accountType === "Cash") {
                  finalPaymentAccountId = String(entry.ledgerAccountId);
                  finalPaymentAccountType = "cash";
                  finalIsCreditSale = false;
                  existingDebitEntry = entry;
                  break;
                } else if (ledgerAccount.accountType === "Asset" || entry.narration?.includes("Credit Sale")) {
                  finalPaymentAccountId = String(entry.ledgerAccountId);
                  finalPaymentAccountType = "credit";
                  finalIsCreditSale = true;
                  existingDebitEntry = entry;
                  break;
                }
              }
            }
          }
        }
      }
      if (finalPaymentAccountId && finalPaymentAccountType) {
        await db.delete(voucherEntries).where(eq2(voucherEntries.voucherId, id));
        const accountId = parseInt(finalPaymentAccountId);
        const accountType = finalPaymentAccountType;
        const debitEntry = {
          voucherId: id,
          debitAmount: totalSalesAmount.toFixed(2),
          creditAmount: "0",
          narration: finalIsCreditSale ? `Credit Sale - ${existingVoucher.voucherNumber}` : `POS Sale - ${existingVoucher.voucherNumber}`
        };
        if (finalIsCreditSale || accountType === "cash" || accountType === "credit") {
          debitEntry.ledgerAccountId = accountId;
        } else {
          debitEntry.bankAccountId = accountId;
        }
        await db.insert(voucherEntries).values(debitEntry);
        const allAccounts = await storage.getAllLedgerAccounts(existingVoucher.companyId);
        let salesAccount = allAccounts.find((a) => a.code === "SALES");
        if (!salesAccount) {
          salesAccount = await storage.createLedgerAccount({
            companyId: existingVoucher.companyId,
            code: "SALES",
            name: "Sales Revenue",
            accountType: "Income",
            openingBalance: "0",
            active: true
          });
        }
        await db.insert(voucherEntries).values({
          voucherId: id,
          ledgerAccountId: salesAccount.id,
          debitAmount: "0",
          creditAmount: totalSalesAmount.toFixed(2),
          narration: `POS Sale - ${existingVoucher.voucherNumber}`
        });
      } else {
        throw new Error(
          "Unable to determine payment account for voucher update"
        );
      }
      const voucherUpdates = {
        totalAmount: totalSalesAmount.toFixed(2)
      };
      if (voucherDate !== void 0) voucherUpdates.voucherDate = voucherDate;
      if (description !== void 0) voucherUpdates.description = description;
      if (validatedLocationId !== null) {
        voucherUpdates.locationId = validatedLocationId;
        const location = await storage.getLocationById(validatedLocationId);
        if (location) {
          voucherUpdates.locationName = location.name;
        }
      }
      const updated = await db.update(vouchers).set(voucherUpdates).where(eq2(vouchers.id, id)).returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch(
    "/api/vouchers/:id/purchase",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const { voucherDate, description, items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: "At least one item is required" });
        }
        const existingVoucher = await storage.getVoucherById(id);
        if (!existingVoucher) {
          return res.status(404).json({ message: "Voucher not found" });
        }
        if (existingVoucher.voucherType !== "Purchase") {
          return res.status(400).json({ message: "This endpoint only updates Purchase vouchers" });
        }
        if (existingVoucher.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Voucher belongs to a different company"
          });
        }
        const userRole = req.session.currentRole;
        if (!userRole) {
          return res.status(403).json({ message: "User role not found" });
        }
        if (userRole !== "Admin" && userRole !== "Owner") {
          if (userRole === "Manager") {
            const today = /* @__PURE__ */ new Date();
            today.setHours(0, 0, 0, 0);
            const voucherDate2 = new Date(existingVoucher.voucherDate);
            voucherDate2.setHours(0, 0, 0, 0);
            if (voucherDate2.getTime() !== today.getTime()) {
              return res.status(403).json({ message: "Managers can only edit today's vouchers" });
            }
          } else {
            return res.status(403).json({ message: "Insufficient permissions to edit vouchers" });
          }
        }
        const [po] = await db.select().from(purchaseOrders).where(eq2(purchaseOrders.voucherId, id)).limit(1);
        if (!po) {
          return res.status(404).json({ message: "Associated purchase order not found" });
        }
        const oldPOTotal = parseFloat(po.itemsTotal || "0");
        let totalAmount = 0;
        const poItemsData = items.map((item) => {
          const quantity = parseFloat(item.quantity);
          const rate = parseFloat(item.rate);
          const lineTotal = quantity * rate;
          totalAmount += lineTotal;
          return {
            poId: po.id,
            stockItemId: item.stockItemId || 0,
            // Default to 0 if not provided
            itemName: item.itemName,
            quantity: item.quantity,
            rate: item.rate,
            lineTotal: lineTotal.toFixed(2)
          };
        });
        await db.delete(poLineItems).where(eq2(poLineItems.poId, po.id));
        await db.insert(poLineItems).values(poItemsData);
        await db.update(purchaseOrders).set({ itemsTotal: totalAmount.toFixed(2) }).where(eq2(purchaseOrders.id, po.id));
        const [container] = await db.select().from(containers).where(eq2(containers.id, po.containerId)).limit(1);
        if (container) {
          const containerItemsTotal = parseFloat(container.itemsTotal || "0");
          const containerChargesTotal = parseFloat(
            container.chargesTotal || "0"
          );
          const difference = totalAmount - oldPOTotal;
          const newContainerItemsTotal = containerItemsTotal + difference;
          const newContainerGrandTotal = newContainerItemsTotal + containerChargesTotal;
          await db.update(containers).set({
            itemsTotal: newContainerItemsTotal.toFixed(2),
            grandTotal: newContainerGrandTotal.toFixed(2)
          }).where(eq2(containers.id, po.containerId));
        }
        const voucherUpdates = {
          totalAmount: totalAmount.toFixed(2)
        };
        if (voucherDate !== void 0) voucherUpdates.voucherDate = voucherDate;
        if (description !== void 0) voucherUpdates.description = description;
        const updated = await db.update(vouchers).set(voucherUpdates).where(eq2(vouchers.id, id)).returning();
        res.json(updated[0]);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.patch(
    "/api/vouchers/:id/adjustment",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const { voucherDate, description, locationId, items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: "At least one item is required" });
        }
        if (!locationId) {
          return res.status(400).json({ message: "Location ID is required" });
        }
        const existingVoucher = await storage.getVoucherById(id);
        if (!existingVoucher) {
          return res.status(404).json({ message: "Voucher not found" });
        }
        if (existingVoucher.voucherType !== "Consumption" && existingVoucher.voucherType !== "Production" && existingVoucher.voucherType !== "Mixed") {
          return res.status(400).json({
            message: "This endpoint only updates Consumption, Production, or Mixed vouchers"
          });
        }
        if (existingVoucher.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Voucher belongs to a different company"
          });
        }
        const userRole = req.session.currentRole;
        if (!userRole) {
          return res.status(403).json({ message: "User role not found" });
        }
        if (userRole !== "Admin" && userRole !== "Owner") {
          if (userRole === "Manager") {
            const today = /* @__PURE__ */ new Date();
            today.setHours(0, 0, 0, 0);
            const voucherDate2 = new Date(existingVoucher.voucherDate);
            voucherDate2.setHours(0, 0, 0, 0);
            if (voucherDate2.getTime() !== today.getTime()) {
              return res.status(403).json({ message: "Managers can only edit today's vouchers" });
            }
          } else {
            return res.status(403).json({ message: "Insufficient permissions to edit vouchers" });
          }
        }
        let adjustmentVoucher = await db.select().from(stockAdjustmentVouchers).where(eq2(stockAdjustmentVouchers.voucherId, id)).limit(1).then((rows) => rows[0]);
        if (!adjustmentVoucher) {
          let adjustmentType = "production";
          if (existingVoucher.voucherType === "Consumption")
            adjustmentType = "consumption";
          else if (existingVoucher.voucherType === "Mixed")
            adjustmentType = "mixed";
          const [newAdjustment] = await db.insert(stockAdjustmentVouchers).values({
            voucherId: id,
            locationId: parseInt(locationId),
            adjustmentType,
            notes: description || ""
          }).returning();
          adjustmentVoucher = newAdjustment;
        }
        let totalAmount = 0;
        const adjustmentItemsData = items.map((item) => {
          const quantity = parseFloat(item.quantity);
          const rate = parseFloat(item.rate);
          const itemTotal = quantity * rate;
          totalAmount += itemTotal;
          return {
            adjustmentId: adjustmentVoucher.id,
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            rate: item.rate,
            totalAmount: itemTotal.toFixed(2)
          };
        });
        const oldAdjustmentItems = await db.select().from(stockAdjustmentItems).where(eq2(stockAdjustmentItems.adjustmentId, adjustmentVoucher.id));
        const oldLocationId = adjustmentVoucher.locationId;
        for (const oldItem of oldAdjustmentItems) {
          const quantity = parseFloat(oldItem.quantity);
          const rate = parseFloat(oldItem.rate);
          const reversedQuantity = -quantity;
          const [currentInventory] = await db.select().from(inventory).where(
            and2(
              eq2(inventory.locationId, oldLocationId),
              eq2(inventory.stockItemId, oldItem.stockItemId)
            )
          );
          if (currentInventory) {
            const newQuantity = Math.max(
              0,
              parseFloat(currentInventory.quantity) + reversedQuantity
            );
            const currentTotalValue = parseFloat(currentInventory.totalValue);
            const newTotalValue = Math.max(
              0,
              currentTotalValue + reversedQuantity * rate
            );
            const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
            await db.update(inventory).set({
              quantity: newQuantity.toFixed(3),
              averageRate: newAverageRate.toFixed(2),
              totalValue: newTotalValue.toFixed(2)
            }).where(eq2(inventory.id, currentInventory.id));
          }
        }
        await db.delete(stockAdjustmentItems).where(eq2(stockAdjustmentItems.adjustmentId, adjustmentVoucher.id));
        const newLocationId = parseInt(locationId);
        for (const newItem of adjustmentItemsData) {
          const quantity = parseFloat(newItem.quantity);
          const rate = parseFloat(newItem.rate);
          const [currentInventory] = await db.select().from(inventory).where(
            and2(
              eq2(inventory.locationId, newLocationId),
              eq2(inventory.stockItemId, newItem.stockItemId)
            )
          );
          if (currentInventory) {
            const newQuantity = Math.max(
              0,
              parseFloat(currentInventory.quantity) + quantity
            );
            const currentTotalValue = parseFloat(currentInventory.totalValue);
            const newTotalValue = Math.max(
              0,
              currentTotalValue + quantity * rate
            );
            const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
            await db.update(inventory).set({
              quantity: newQuantity.toFixed(3),
              averageRate: newAverageRate.toFixed(2),
              totalValue: newTotalValue.toFixed(2)
            }).where(eq2(inventory.id, currentInventory.id));
          } else {
            await db.insert(inventory).values({
              companyId: existingVoucher.companyId,
              locationId: newLocationId,
              stockItemId: newItem.stockItemId,
              quantity: Math.max(0, quantity).toFixed(3),
              averageRate: rate.toFixed(2),
              totalValue: Math.max(0, quantity * rate).toFixed(2)
            });
          }
        }
        await db.insert(stockAdjustmentItems).values(adjustmentItemsData);
        await db.update(stockAdjustmentVouchers).set({ locationId: parseInt(locationId), notes: description || "" }).where(eq2(stockAdjustmentVouchers.id, adjustmentVoucher.id));
        const parsedLocationId = parseInt(locationId);
        const voucherUpdates = {
          totalAmount: totalAmount.toFixed(2),
          locationId: parsedLocationId
        };
        const location = await storage.getLocationById(parsedLocationId);
        if (location) {
          voucherUpdates.locationName = location.name;
        }
        if (voucherDate !== void 0) voucherUpdates.voucherDate = voucherDate;
        if (description !== void 0) voucherUpdates.description = description;
        const updated = await db.update(vouchers).set(voucherUpdates).where(eq2(vouchers.id, id)).returning();
        res.json(updated[0]);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.patch(
    "/api/vouchers/:id/transfer",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const {
          voucherDate,
          description,
          sourceLocationId,
          destinationLocationId,
          items
        } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: "At least one item is required" });
        }
        if (!sourceLocationId || !destinationLocationId) {
          return res.status(400).json({ message: "Source and destination locations are required" });
        }
        const existingVoucher = await storage.getVoucherById(id);
        if (!existingVoucher) {
          return res.status(404).json({ message: "Voucher not found" });
        }
        if (existingVoucher.voucherType !== "Stock Transfer") {
          return res.status(400).json({
            message: "This endpoint only updates Stock Transfer vouchers"
          });
        }
        if (existingVoucher.companyId !== req.session.currentCompanyId) {
          return res.status(403).json({
            message: "Access denied: Voucher belongs to a different company"
          });
        }
        const userRole = req.session.currentRole;
        if (!userRole) {
          return res.status(403).json({ message: "User role not found" });
        }
        if (userRole !== "Admin" && userRole !== "Owner") {
          if (userRole === "Manager") {
            const today = /* @__PURE__ */ new Date();
            today.setHours(0, 0, 0, 0);
            const voucherDate2 = new Date(existingVoucher.voucherDate);
            voucherDate2.setHours(0, 0, 0, 0);
            if (voucherDate2.getTime() !== today.getTime()) {
              return res.status(403).json({ message: "Managers can only edit today's vouchers" });
            }
          } else {
            return res.status(403).json({ message: "Insufficient permissions to edit vouchers" });
          }
        }
        console.log(`[Stock Transfer Edit] Starting update for voucher ${id}`);
        const updated = await db.transaction(async (tx) => {
          let transferVoucher = await tx.select().from(stockTransferVouchers).where(eq2(stockTransferVouchers.voucherId, id)).limit(1).then((rows) => rows[0]);
          if (!transferVoucher) {
            const [newTransfer] = await tx.insert(stockTransferVouchers).values({
              voucherId: id,
              sourceLocationId: parseInt(sourceLocationId),
              destinationLocationId: parseInt(destinationLocationId),
              notes: description || ""
            }).returning();
            transferVoucher = newTransfer;
          }
          let totalAmount = 0;
          const transferItemsData = items.map((item) => {
            const quantity = parseFloat(item.quantity);
            const rate = parseFloat(item.rate);
            const itemTotal = quantity * rate;
            totalAmount += itemTotal;
            return {
              transferId: transferVoucher.id,
              stockItemId: item.stockItemId,
              quantity: item.quantity,
              rate: item.rate,
              totalAmount: itemTotal.toFixed(2)
            };
          });
          const oldTransferItems = await tx.select().from(stockTransferItems).where(eq2(stockTransferItems.transferId, transferVoucher.id));
          const oldSourceLocationId = transferVoucher.sourceLocationId;
          const oldDestinationLocationId = transferVoucher.destinationLocationId;
          for (const oldItem of oldTransferItems) {
            const quantity = parseFloat(oldItem.quantity);
            const rate = parseFloat(oldItem.rate);
            const [sourceInventory] = await tx.select().from(inventory).where(
              and2(
                eq2(inventory.locationId, oldSourceLocationId),
                eq2(inventory.stockItemId, oldItem.stockItemId)
              )
            );
            if (sourceInventory) {
              const newQuantity = parseFloat(sourceInventory.quantity) + quantity;
              const newTotalValue = parseFloat(sourceInventory.totalValue) + quantity * rate;
              const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
              await tx.update(inventory).set({
                quantity: newQuantity.toFixed(3),
                averageRate: newAverageRate.toFixed(2),
                totalValue: newTotalValue.toFixed(2)
              }).where(eq2(inventory.id, sourceInventory.id));
            } else {
              await tx.insert(inventory).values({
                companyId: existingVoucher.companyId,
                locationId: oldSourceLocationId,
                stockItemId: oldItem.stockItemId,
                quantity: quantity.toFixed(3),
                averageRate: rate.toFixed(2),
                totalValue: (quantity * rate).toFixed(2)
              });
            }
            const [destInventory] = await tx.select().from(inventory).where(
              and2(
                eq2(inventory.locationId, oldDestinationLocationId),
                eq2(inventory.stockItemId, oldItem.stockItemId)
              )
            );
            if (destInventory) {
              const newQuantity = Math.max(
                0,
                parseFloat(destInventory.quantity) - quantity
              );
              const newTotalValue = Math.max(
                0,
                parseFloat(destInventory.totalValue) - quantity * rate
              );
              const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
              await tx.update(inventory).set({
                quantity: newQuantity.toFixed(3),
                averageRate: newAverageRate.toFixed(2),
                totalValue: newTotalValue.toFixed(2)
              }).where(eq2(inventory.id, destInventory.id));
            }
          }
          await tx.delete(stockTransferItems).where(eq2(stockTransferItems.transferId, transferVoucher.id));
          const newSourceLocationId = parseInt(sourceLocationId);
          const newDestinationLocationId = parseInt(destinationLocationId);
          for (const newItem of transferItemsData) {
            const quantity = parseFloat(newItem.quantity);
            const rate = parseFloat(newItem.rate);
            const [sourceInventory] = await tx.select().from(inventory).where(
              and2(
                eq2(inventory.locationId, newSourceLocationId),
                eq2(inventory.stockItemId, newItem.stockItemId)
              )
            );
            if (sourceInventory) {
              const newQuantity = Math.max(
                0,
                parseFloat(sourceInventory.quantity) - quantity
              );
              const newTotalValue = Math.max(
                0,
                parseFloat(sourceInventory.totalValue) - quantity * rate
              );
              const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
              await tx.update(inventory).set({
                quantity: newQuantity.toFixed(3),
                averageRate: newAverageRate.toFixed(2),
                totalValue: newTotalValue.toFixed(2)
              }).where(eq2(inventory.id, sourceInventory.id));
            }
            const [destInventory] = await tx.select().from(inventory).where(
              and2(
                eq2(inventory.locationId, newDestinationLocationId),
                eq2(inventory.stockItemId, newItem.stockItemId)
              )
            );
            if (destInventory) {
              const newQuantity = parseFloat(destInventory.quantity) + quantity;
              const newTotalValue = parseFloat(destInventory.totalValue) + quantity * rate;
              const newAverageRate = newQuantity > 0 ? newTotalValue / newQuantity : 0;
              await tx.update(inventory).set({
                quantity: newQuantity.toFixed(3),
                averageRate: newAverageRate.toFixed(2),
                totalValue: newTotalValue.toFixed(2)
              }).where(eq2(inventory.id, destInventory.id));
            } else {
              await tx.insert(inventory).values({
                companyId: existingVoucher.companyId,
                locationId: newDestinationLocationId,
                stockItemId: newItem.stockItemId,
                quantity: quantity.toFixed(3),
                averageRate: rate.toFixed(2),
                totalValue: (quantity * rate).toFixed(2)
              });
            }
          }
          await tx.insert(stockTransferItems).values(transferItemsData);
          await tx.update(stockTransferVouchers).set({
            sourceLocationId: parseInt(sourceLocationId),
            destinationLocationId: parseInt(destinationLocationId),
            notes: description || ""
          }).where(eq2(stockTransferVouchers.id, transferVoucher.id));
          const parsedSourceLocationId = parseInt(sourceLocationId);
          const voucherUpdates = {
            totalAmount: totalAmount.toFixed(2),
            locationId: parsedSourceLocationId
            // Use source location as the primary location for the voucher
          };
          const sourceLocation = await storage.getLocationById(parsedSourceLocationId);
          if (sourceLocation) {
            voucherUpdates.locationName = sourceLocation.name;
          }
          if (voucherDate !== void 0)
            voucherUpdates.voucherDate = voucherDate;
          if (description !== void 0)
            voucherUpdates.description = description;
          const [updatedVoucher] = await tx.update(vouchers).set(voucherUpdates).where(eq2(vouchers.id, id)).returning();
          return updatedVoucher;
        });
        console.log(`[Stock Transfer Edit] Successfully updated voucher ${id}`);
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.put("/api/vouchers/:id/with-entries", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid voucher ID" });
      }
      const { voucher, entries } = req.body;
      if (!voucher || !entries || !Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ message: "Voucher and entries are required" });
      }
      const existingVoucher = await storage.getVoucherById(id);
      if (!existingVoucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      if (existingVoucher.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Voucher belongs to a different company"
        });
      }
      const userRole = req.session.currentRole;
      if (!userRole) {
        return res.status(403).json({ message: "User role not found" });
      }
      if (userRole !== "Admin" && userRole !== "Owner") {
        if (userRole === "Manager") {
          const voucherDate = new Date(existingVoucher.voucherDate);
          const today = /* @__PURE__ */ new Date();
          today.setHours(0, 0, 0, 0);
          voucherDate.setHours(0, 0, 0, 0);
          if (voucherDate.getTime() !== today.getTime()) {
            return res.status(403).json({ message: "Managers can only edit today's vouchers" });
          }
        } else {
          return res.status(403).json({ message: "Insufficient permissions to edit vouchers" });
        }
      }
      const totalDebits = entries.reduce(
        (sum, entry) => sum + parseFloat(entry.debitAmount || "0"),
        0
      );
      const totalCredits = entries.reduce(
        (sum, entry) => sum + parseFloat(entry.creditAmount || "0"),
        0
      );
      if (!voucher.optional && Math.abs(totalDebits - totalCredits) >= 0.01) {
        return res.status(400).json({
          message: "Total debits must equal total credits for active vouchers"
        });
      }
      let updatedVoucher;
      let createdEntries = [];
      let oldEntries = [];
      try {
        oldEntries = await db.select().from(voucherEntries).where(eq2(voucherEntries.voucherId, id));
        const voucherUpdates = {
          voucherType: voucher.voucherType,
          voucherDate: voucher.voucherDate,
          description: voucher.description || null,
          optional: voucher.optional ?? false,
          totalAmount: Math.max(totalDebits, totalCredits).toFixed(2)
        };
        if (voucher.locationId !== void 0) {
          voucherUpdates.locationId = voucher.locationId;
          if (voucher.locationId) {
            const location = await storage.getLocationById(voucher.locationId);
            if (location) {
              voucherUpdates.locationName = location.name;
            }
          } else {
            voucherUpdates.locationName = null;
          }
        }
        [updatedVoucher] = await db.update(vouchers).set(voucherUpdates).where(eq2(vouchers.id, id)).returning();
        await db.delete(voucherEntries).where(eq2(voucherEntries.voucherId, id));
        for (const entry of entries) {
          const [createdEntry] = await db.insert(voucherEntries).values({
            voucherId: id,
            ledgerAccountId: entry.ledgerAccountId || null,
            bankAccountId: entry.bankAccountId || null,
            fixedAssetId: entry.fixedAssetId || null,
            supplierId: entry.supplierId || null,
            employeeId: entry.employeeId || null,
            debitAmount: entry.debitAmount || "0",
            creditAmount: entry.creditAmount || "0",
            narration: entry.narration || null
          }).returning();
          createdEntries.push(createdEntry);
        }
      } catch (error) {
        if (oldEntries.length > 0 && createdEntries.length === 0) {
          for (const oldEntry of oldEntries) {
            await db.insert(voucherEntries).values({
              voucherId: oldEntry.voucherId,
              ledgerAccountId: oldEntry.ledgerAccountId,
              bankAccountId: oldEntry.bankAccountId,
              fixedAssetId: oldEntry.fixedAssetId,
              supplierId: oldEntry.supplierId,
              employeeId: oldEntry.employeeId,
              debitAmount: oldEntry.debitAmount,
              creditAmount: oldEntry.creditAmount,
              narration: oldEntry.narration
            }).catch(() => {
            });
          }
        }
        throw error;
      }
      const result = { voucher: updatedVoucher, entries: createdEntries };
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/vouchers/:id/entries", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid voucher ID" });
      }
      const voucher = await storage.getVoucherById(id);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      if (voucher.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Voucher belongs to a different company"
        });
      }
      const entries = await storage.getVoucherEntriesByVoucher(id);
      const transformedEntries = entries.map((entry) => {
        let accountType = "ledger";
        let accountId = entry.ledgerAccountId;
        if (entry.bankAccountId) {
          accountType = "bank";
          accountId = entry.bankAccountId;
        } else if (entry.supplierId) {
          accountType = "supplier";
          accountId = entry.supplierId;
        } else if (entry.employeeId) {
          accountType = "employee";
          accountId = entry.employeeId;
        } else if (entry.fixedAssetId) {
          accountType = "fixedAsset";
          accountId = entry.fixedAssetId;
        }
        return {
          ...entry,
          accountType,
          accountId: accountId || 0
        };
      });
      res.json(transformedEntries);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/vouchers/:id/view-entries", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid voucher ID" });
      }
      const voucher = await storage.getVoucherById(id);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      if (voucher.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Voucher belongs to a different company"
        });
      }
      const entries = await storage.getVoucherEntriesByVoucher(id);
      if (voucher.voucherType === "Sales") {
        const salesItemsList = await db.select({
          id: salesItems.id,
          voucherId: salesItems.voucherId,
          stockItemId: salesItems.stockItemId,
          quantity: salesItems.quantity,
          sellingPrice: salesItems.sellingPrice,
          totalSales: salesItems.totalSales,
          stockItemName: stockItems.name,
          stockItemCode: stockItems.code
        }).from(salesItems).leftJoin(stockItems, eq2(salesItems.stockItemId, stockItems.id)).where(eq2(salesItems.voucherId, id));
        if (salesItemsList.length > 0) {
          const itemsWithDetails = salesItemsList.map((item) => ({
            id: item.id,
            voucherId: item.voucherId,
            stockItemId: item.stockItemId,
            stockItemName: item.stockItemName || "Unknown Item",
            stockItemCode: item.stockItemCode || "-",
            quantity: item.quantity,
            rate: item.sellingPrice,
            sellingPrice: item.sellingPrice,
            totalSales: item.totalSales,
            debitAmount: "0",
            creditAmount: item.totalSales,
            narration: `Sale of ${item.quantity} x ${item.stockItemName || "Unknown Item"} @ $${item.sellingPrice}`,
            accountName: item.stockItemName || "Unknown Item",
            accountCode: item.stockItemCode || "-",
            isStockItem: true
          }));
          return res.json([...entries, ...itemsWithDetails]);
        }
      }
      const userRole = req.session.currentRole;
      const isPOSUser = userRole?.startsWith("POS");
      if (voucher.voucherType === "Purchase") {
        const allPOs = await storage.getAllPurchaseOrders(voucher.companyId);
        const purchaseOrder = allPOs.find((po) => po.voucherId === id);
        if (purchaseOrder) {
          const lineItems = await storage.getLineItemsByPO(purchaseOrder.id);
          if (lineItems.length > 0) {
            const supplier = await storage.getSupplierById(purchaseOrder.supplierId);
            const supplierName = supplier?.legalName || "Unknown Supplier";
            const supplierCode = supplier?.code || "";
            const container = await storage.getContainerById(purchaseOrder.containerId);
            const containerNumber = container?.containerNumber || "";
            const itemsWithDetails = lineItems.map((item) => ({
              id: item.id,
              voucherId: id,
              purchaseOrderId: purchaseOrder.id,
              stockItemId: item.stockItemId,
              stockItemName: item.stockItemName || item.itemName || "Unknown Item",
              stockItemCode: item.stockItemCode || "-",
              quantity: item.quantity,
              // SECURITY: Redact cost prices for POS users
              rate: isPOSUser ? null : item.rate,
              totalAmount: isPOSUser ? null : item.lineTotal || item.totalCost,
              debitAmount: isPOSUser ? "0" : item.lineTotal || item.totalCost,
              creditAmount: "0",
              narration: isPOSUser ? `${item.quantity} x ${item.stockItemName || item.itemName}` : `${item.quantity} x ${item.stockItemName || item.itemName} @ $${item.rate}`,
              accountName: item.stockItemName || item.itemName || "Unknown Item",
              accountCode: item.stockItemCode || "-",
              isStockItem: true,
              isPurchaseItem: true
            }));
            const redactedEntries = isPOSUser ? entries.map((entry) => ({
              ...entry,
              debitAmount: "0",
              creditAmount: "0",
              narration: entry.accountName || "Account entry"
            })) : entries;
            const result = [
              ...redactedEntries,
              ...itemsWithDetails
            ];
            return res.json({
              entries: result,
              purchaseOrder: {
                id: purchaseOrder.id,
                poNumber: purchaseOrder.poNumber,
                supplierId: purchaseOrder.supplierId,
                supplierName,
                supplierCode,
                containerId: purchaseOrder.containerId,
                containerNumber,
                currency: purchaseOrder.currency,
                itemsTotal: isPOSUser ? null : purchaseOrder.itemsTotal,
                status: purchaseOrder.status
              }
            });
          }
        }
      }
      if (voucher.voucherType === "Production" || voucher.voucherType === "Consumption" || voucher.voucherType === "Mixed") {
        const adjustmentVoucher = await db.query.stockAdjustmentVouchers.findFirst({
          where: eq2(stockAdjustmentVouchers.voucherId, id)
        });
        if (adjustmentVoucher) {
          const adjustmentItemsList = await db.select({
            id: stockAdjustmentItems.id,
            adjustmentId: stockAdjustmentItems.adjustmentId,
            stockItemId: stockAdjustmentItems.stockItemId,
            quantity: stockAdjustmentItems.quantity,
            rate: stockAdjustmentItems.rate,
            totalAmount: stockAdjustmentItems.totalAmount,
            stockItemName: stockItems.name,
            stockItemCode: stockItems.code
          }).from(stockAdjustmentItems).leftJoin(stockItems, eq2(stockAdjustmentItems.stockItemId, stockItems.id)).where(eq2(stockAdjustmentItems.adjustmentId, adjustmentVoucher.id));
          if (adjustmentItemsList.length > 0) {
            const itemsWithDetails = adjustmentItemsList.map((item) => {
              const qty = parseFloat(item.quantity || "0");
              const isProduction = voucher.voucherType === "Production" || voucher.voucherType === "Mixed" && qty > 0;
              const adjustmentLabel = voucher.voucherType === "Mixed" ? qty > 0 ? "Production" : "Consumption" : voucher.voucherType;
              return {
                id: item.id,
                voucherId: id,
                stockItemId: item.stockItemId,
                stockItemName: item.stockItemName || "Unknown Item",
                stockItemCode: item.stockItemCode || "-",
                quantity: item.quantity,
                rate: isPOSUser ? null : item.rate,
                debitAmount: isPOSUser ? "0" : isProduction ? item.totalAmount : "0",
                creditAmount: isPOSUser ? "0" : isProduction ? "0" : item.totalAmount,
                narration: isPOSUser ? `${adjustmentLabel} of ${Math.abs(qty)} x ${item.stockItemName || "Unknown Item"}` : `${adjustmentLabel} of ${Math.abs(qty)} x ${item.stockItemName || "Unknown Item"} @ $${item.rate}`,
                accountName: item.stockItemName || "Unknown Item",
                accountCode: item.stockItemCode || "-",
                isStockItem: true,
                totalAmount: isPOSUser ? null : item.totalAmount,
                adjustmentType: adjustmentLabel
              };
            });
            return res.json(itemsWithDetails);
          }
        }
      }
      if (voucher.voucherType === "Stock Transfer" || voucher.voucherType === "StockTransfer") {
        const transferVoucher = await db.query.stockTransferVouchers.findFirst({
          where: eq2(stockTransferVouchers.voucherId, id)
        });
        if (transferVoucher) {
          const transferItemsList = await db.select({
            id: stockTransferItems.id,
            transferId: stockTransferItems.transferId,
            stockItemId: stockTransferItems.stockItemId,
            quantity: stockTransferItems.quantity,
            rate: stockTransferItems.rate,
            totalAmount: stockTransferItems.totalAmount,
            stockItemName: stockItems.name,
            stockItemCode: stockItems.code
          }).from(stockTransferItems).leftJoin(stockItems, eq2(stockTransferItems.stockItemId, stockItems.id)).where(eq2(stockTransferItems.transferId, transferVoucher.id));
          if (transferItemsList.length > 0) {
            const itemsWithDetails = transferItemsList.map((item) => ({
              id: item.id,
              voucherId: id,
              stockItemId: item.stockItemId,
              stockItemName: item.stockItemName || "Unknown Item",
              stockItemCode: item.stockItemCode || "-",
              quantity: item.quantity,
              rate: isPOSUser ? null : item.rate,
              debitAmount: "0",
              creditAmount: isPOSUser ? "0" : item.totalAmount,
              narration: isPOSUser ? `Transfer of ${item.quantity} x ${item.stockItemName || "Unknown Item"}` : `Transfer of ${item.quantity} x ${item.stockItemName || "Unknown Item"} @ $${item.rate}`,
              accountName: item.stockItemName || "Unknown Item",
              accountCode: item.stockItemCode || "-",
              isStockItem: true,
              totalAmount: isPOSUser ? null : item.totalAmount
            }));
            return res.json(itemsWithDetails);
          }
        }
      }
      if (isPOSUser) {
        const redactedFallbackEntries = entries.map((entry) => ({
          ...entry,
          debitAmount: "0",
          creditAmount: "0",
          narration: entry.accountName || "Account entry"
        }));
        return res.json(redactedFallbackEntries);
      }
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/voucher-entries", requireAuth, async (req, res) => {
    try {
      if (!req.body.voucherId) {
        return res.status(400).json({ message: "Voucher ID is required" });
      }
      const voucher = await storage.getVoucherById(req.body.voucherId);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      if (voucher.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Voucher belongs to a different company"
        });
      }
      const userRole = req.session.currentRole;
      if (!userRole) {
        return res.status(403).json({ message: "User role not found" });
      }
      if (userRole !== "Admin" && userRole !== "Owner") {
        if (userRole === "Manager") {
          const voucherDate = new Date(voucher.voucherDate);
          const today = /* @__PURE__ */ new Date();
          today.setHours(0, 0, 0, 0);
          voucherDate.setHours(0, 0, 0, 0);
          if (voucherDate.getTime() !== today.getTime()) {
            return res.status(403).json({
              message: "Managers can only create entries for today's vouchers"
            });
          }
        } else {
          return res.status(403).json({
            message: "Insufficient permissions to create voucher entries"
          });
        }
      }
      const entry = await storage.createVoucherEntry(req.body);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch("/api/voucher-entries/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid voucher entry ID" });
      }
      const existingEntry = await db.query.voucherEntries.findFirst({
        where: eq2(voucherEntries.id, id)
      });
      if (!existingEntry) {
        return res.status(404).json({ message: "Voucher entry not found" });
      }
      const voucher = await storage.getVoucherById(existingEntry.voucherId);
      if (!voucher) {
        return res.status(404).json({ message: "Associated voucher not found" });
      }
      if (voucher.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Access denied: Voucher belongs to a different company"
        });
      }
      const userRole = req.session.currentRole;
      if (!userRole) {
        return res.status(403).json({ message: "User role not found" });
      }
      if (userRole !== "Admin" && userRole !== "Owner") {
        if (userRole === "Manager") {
          const voucherDate = new Date(voucher.voucherDate);
          const today = /* @__PURE__ */ new Date();
          today.setHours(0, 0, 0, 0);
          voucherDate.setHours(0, 0, 0, 0);
          if (voucherDate.getTime() !== today.getTime()) {
            return res.status(403).json({ message: "Managers can only edit today's vouchers" });
          }
        } else {
          return res.status(403).json({
            message: "Insufficient permissions to edit voucher entries"
          });
        }
      }
      const allowedUpdates = {};
      if (req.body.debitAmount !== void 0)
        allowedUpdates.debitAmount = req.body.debitAmount;
      if (req.body.creditAmount !== void 0)
        allowedUpdates.creditAmount = req.body.creditAmount;
      if (req.body.narration !== void 0)
        allowedUpdates.narration = req.body.narration;
      const updated = await storage.updateVoucherEntry(id, allowedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.delete(
    "/api/vouchers/:id",
    requireAuth,
    requireRole("Admin"),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const voucher = await storage.getVoucherById(id);
        if (!voucher) {
          return res.status(404).json({ message: "Voucher not found" });
        }
        await db.transaction(async (tx) => {
          if ((voucher.voucherType === "Stock Transfer" || voucher.voucherType === "StockTransfer") && !voucher.optional) {
            const [transferVoucher] = await tx.select().from(stockTransferVouchers).where(eq2(stockTransferVouchers.voucherId, id)).limit(1);
            if (transferVoucher) {
              const transferItemsList = await tx.select().from(stockTransferItems).where(eq2(stockTransferItems.transferId, transferVoucher.id));
              for (const item of transferItemsList) {
                const qty = parseFloat(item.quantity);
                const transferRate = parseFloat(item.rate);
                const [sourceInv] = await tx.select().from(inventory).where(
                  and2(
                    eq2(inventory.stockItemId, item.stockItemId),
                    eq2(inventory.locationId, transferVoucher.sourceLocationId)
                  )
                ).limit(1);
                if (sourceInv) {
                  const existingQty = parseFloat(sourceInv.quantity);
                  const existingRate = parseFloat(sourceInv.averageRate || "0");
                  const newQty = existingQty + qty;
                  const newValue = newQty * existingRate;
                  await tx.update(inventory).set({
                    quantity: newQty.toString(),
                    totalValue: newValue.toString()
                  }).where(eq2(inventory.id, sourceInv.id));
                } else {
                  await tx.insert(inventory).values({
                    companyId: req.session.currentCompanyId,
                    locationId: transferVoucher.sourceLocationId,
                    stockItemId: item.stockItemId,
                    quantity: qty.toString(),
                    averageRate: transferRate.toString(),
                    totalValue: (qty * transferRate).toString()
                  });
                }
                const [destInv] = await tx.select().from(inventory).where(
                  and2(
                    eq2(inventory.stockItemId, item.stockItemId),
                    eq2(inventory.locationId, transferVoucher.destinationLocationId)
                  )
                ).limit(1);
                if (destInv) {
                  const existingQty = parseFloat(destInv.quantity);
                  const existingValue = parseFloat(destInv.totalValue || "0");
                  const newQty = existingQty - qty;
                  if (newQty <= 0) {
                    await tx.delete(inventory).where(eq2(inventory.id, destInv.id));
                  } else {
                    const valueToRemove = qty * transferRate;
                    let newValue = existingValue - valueToRemove;
                    if (newValue < 0) newValue = 0;
                    const newAvgRate = newQty > 0 && newValue > 0 ? newValue / newQty : 0;
                    await tx.update(inventory).set({
                      quantity: newQty.toString(),
                      averageRate: newAvgRate.toString(),
                      totalValue: newValue.toString()
                    }).where(eq2(inventory.id, destInv.id));
                  }
                }
              }
              await tx.delete(stockTransferItems).where(eq2(stockTransferItems.transferId, transferVoucher.id));
              await tx.delete(stockTransferVouchers).where(eq2(stockTransferVouchers.id, transferVoucher.id));
            }
          }
          if ((voucher.voucherType === "Production" || voucher.voucherType === "Consumption") && !voucher.optional) {
            const [adjustmentVoucher] = await tx.select().from(stockAdjustmentVouchers).where(eq2(stockAdjustmentVouchers.voucherId, id)).limit(1);
            if (adjustmentVoucher) {
              const adjustmentItemsList = await tx.select().from(stockAdjustmentItems).where(eq2(stockAdjustmentItems.adjustmentId, adjustmentVoucher.id));
              for (const item of adjustmentItemsList) {
                const qty = parseFloat(item.quantity);
                const adjustmentRate = parseFloat(item.rate);
                const adjustmentValue = qty * adjustmentRate;
                const [inv] = await tx.select().from(inventory).where(
                  and2(
                    eq2(inventory.stockItemId, item.stockItemId),
                    eq2(inventory.locationId, adjustmentVoucher.locationId)
                  )
                ).limit(1);
                if (adjustmentVoucher.adjustmentType === "Production") {
                  if (inv) {
                    const existingQty = parseFloat(inv.quantity);
                    const existingValue = parseFloat(inv.totalValue || "0");
                    const newQty = existingQty - qty;
                    if (newQty <= 0) {
                      await tx.delete(inventory).where(eq2(inventory.id, inv.id));
                    } else {
                      let newValue = existingValue - adjustmentValue;
                      if (newValue < 0) newValue = 0;
                      const newRate = newQty > 0 && newValue > 0 ? newValue / newQty : 0;
                      await tx.update(inventory).set({
                        quantity: newQty.toString(),
                        averageRate: newRate.toString(),
                        totalValue: newValue.toString()
                      }).where(eq2(inventory.id, inv.id));
                    }
                  }
                } else {
                  if (inv) {
                    const existingQty = parseFloat(inv.quantity);
                    const existingRate = parseFloat(inv.averageRate || "0");
                    const newQty = existingQty + qty;
                    const newValue = newQty * existingRate;
                    await tx.update(inventory).set({
                      quantity: newQty.toString(),
                      totalValue: newValue.toString()
                    }).where(eq2(inventory.id, inv.id));
                  } else {
                    await tx.insert(inventory).values({
                      companyId: req.session.currentCompanyId,
                      locationId: adjustmentVoucher.locationId,
                      stockItemId: item.stockItemId,
                      quantity: qty.toString(),
                      averageRate: adjustmentRate.toString(),
                      totalValue: (qty * adjustmentRate).toString()
                    });
                  }
                }
              }
              await tx.delete(stockAdjustmentItems).where(eq2(stockAdjustmentItems.adjustmentId, adjustmentVoucher.id));
              await tx.delete(stockAdjustmentVouchers).where(eq2(stockAdjustmentVouchers.id, adjustmentVoucher.id));
            }
          }
          if ((voucher.voucherType === "Receipt" || voucher.voucherType === "Sales") && !voucher.optional) {
            const saleItems = await tx.select().from(salesItems).where(eq2(salesItems.voucherId, id));
            if (saleItems.length > 0) {
              if (voucher.locationId) {
                const targetLocationId = voucher.locationId;
                for (const item of saleItems) {
                  const qty = parseFloat(item.quantity);
                  const costPrice = parseFloat(item.costPrice || "0");
                  const [inv] = await tx.select().from(inventory).where(
                    and2(
                      eq2(inventory.stockItemId, item.stockItemId),
                      eq2(inventory.locationId, targetLocationId)
                    )
                  ).limit(1);
                  if (inv) {
                    const existingQty = parseFloat(inv.quantity);
                    const existingRate = parseFloat(inv.averageRate || "0");
                    const newQty = existingQty + qty;
                    const newValue = newQty * existingRate;
                    await tx.update(inventory).set({
                      quantity: newQty.toString(),
                      totalValue: newValue.toString()
                    }).where(eq2(inventory.id, inv.id));
                  } else {
                    await tx.insert(inventory).values({
                      companyId: req.session.currentCompanyId,
                      locationId: targetLocationId,
                      stockItemId: item.stockItemId,
                      quantity: qty.toString(),
                      averageRate: costPrice.toString(),
                      totalValue: (qty * costPrice).toString()
                    });
                  }
                }
              } else {
                console.warn(`Voucher ${id} deletion: Cannot reverse inventory - no locationId on voucher`);
              }
              await tx.delete(salesItems).where(eq2(salesItems.voucherId, id));
            }
          }
          if (!voucher.optional) {
            const entries = await tx.select().from(voucherEntries).where(eq2(voucherEntries.voucherId, id));
            await syncEmployeeBalancesFromEntries(
              entries.map((e) => ({
                ledgerAccountId: e.ledgerAccountId,
                employeeId: e.employeeId,
                debitAmount: e.debitAmount,
                creditAmount: e.creditAmount
              })),
              req.session.currentCompanyId,
              true
              // reverse
            );
          }
          await tx.delete(voucherEntries).where(eq2(voucherEntries.voucherId, id));
          await tx.delete(vouchers).where(eq2(vouchers.id, id));
        });
        res.json({ message: "Voucher deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post("/api/fiscal-period/close", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.currentRole;
      if (userRole !== "Admin" && userRole !== "Owner") {
        return res.status(403).json({
          message: "Only Admins and Owners can close fiscal periods"
        });
      }
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const {
        periodStartDate,
        periodEndDate,
        retainedEarningsAccountId,
        notes
      } = req.body;
      if (!periodStartDate || !periodEndDate || !retainedEarningsAccountId) {
        return res.status(400).json({
          message: "Period start date, end date, and retained earnings account are required"
        });
      }
      const accountId = parseInt(retainedEarningsAccountId);
      if (isNaN(accountId)) {
        return res.status(400).json({
          message: "Invalid retained earnings account ID"
        });
      }
      const startDate = new Date(periodStartDate);
      const endDate = new Date(periodEndDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format. Use YYYY-MM-DD"
        });
      }
      if (startDate > endDate) {
        return res.status(400).json({
          message: "Period start date must be before or equal to end date"
        });
      }
      const retainedEarningsAccount = await storage.getLedgerAccountById(accountId);
      if (!retainedEarningsAccount) {
        return res.status(400).json({
          message: "Retained earnings account not found"
        });
      }
      if (retainedEarningsAccount.accountType !== "Equity") {
        return res.status(400).json({
          message: "Retained earnings account must be an Equity account"
        });
      }
      if (retainedEarningsAccount.companyId !== req.session.currentCompanyId) {
        return res.status(403).json({
          message: "Retained earnings account belongs to a different company"
        });
      }
      const closure = await storage.closeFiscalPeriod(
        req.session.currentCompanyId,
        periodStartDate,
        periodEndDate,
        accountId,
        req.session.userId,
        notes
      );
      res.json(closure);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/fiscal-period/closures", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const closures = await storage.getFiscalPeriodClosures(req.session.currentCompanyId);
      res.json(closures);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/financial/sales", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { startDate, endDate } = req.query;
      const conditions = [
        eq2(vouchers.companyId, req.session.currentCompanyId),
        eq2(vouchers.voucherType, "Sales")
      ];
      if (startDate) {
        conditions.push(sql3`${vouchers.voucherDate} >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql3`${vouchers.voucherDate} <= ${endDate}`);
      }
      const salesVouchers = await db.select({
        voucherId: vouchers.id,
        locationId: vouchers.locationId,
        locationName: locations.name,
        locationCode: locations.code,
        voucherDate: vouchers.voucherDate,
        totalAmount: vouchers.totalAmount
      }).from(vouchers).leftJoin(locations, eq2(vouchers.locationId, locations.id)).where(and2(...conditions));
      const salesByLocation = /* @__PURE__ */ new Map();
      for (const sale of salesVouchers) {
        if (!sale.locationId) continue;
        const existing = salesByLocation.get(sale.locationId);
        const amount = parseFloat(sale.totalAmount || "0");
        if (existing) {
          existing.totalSales += amount;
          existing.totalTransactions += 1;
        } else {
          salesByLocation.set(sale.locationId, {
            locationId: sale.locationId,
            locationName: sale.locationName || "Unknown",
            locationCode: sale.locationCode || "",
            totalSales: amount,
            totalTransactions: 1
          });
        }
      }
      res.json(Array.from(salesByLocation.values()));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get(
    "/api/financial/sales/:locationId/details",
    requireAuth,
    checkPOSLocation,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const locationId = parseInt(req.params.locationId);
        if (isNaN(locationId)) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
        const { startDate, endDate } = req.query;
        const conditions = [
          eq2(vouchers.companyId, req.session.currentCompanyId),
          eq2(vouchers.voucherType, "Sales"),
          eq2(vouchers.locationId, locationId)
        ];
        if (startDate) {
          conditions.push(sql3`${vouchers.voucherDate} >= ${startDate}`);
        }
        if (endDate) {
          conditions.push(sql3`${vouchers.voucherDate} <= ${endDate}`);
        }
        const salesVouchers = await db.select().from(vouchers).where(and2(...conditions));
        let totalQuantity = 0;
        let totalAmount = 0;
        for (const voucher of salesVouchers) {
          totalAmount += parseFloat(voucher.totalAmount || "0");
          totalQuantity += 1;
        }
        res.json({
          locationId,
          totalQuantity,
          totalAmount,
          totalTransactions: salesVouchers.length
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/financial/sales/:locationId/transactions",
    requireAuth,
    checkPOSLocation,
    async (req, res) => {
      try {
        if (!req.session.currentCompanyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const locationId = parseInt(req.params.locationId);
        if (isNaN(locationId)) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
        const { startDate, endDate } = req.query;
        const conditions = [
          eq2(vouchers.companyId, req.session.currentCompanyId),
          eq2(vouchers.voucherType, "Sales"),
          eq2(vouchers.locationId, locationId)
        ];
        if (startDate) {
          conditions.push(sql3`${vouchers.voucherDate} >= ${startDate}`);
        }
        if (endDate) {
          conditions.push(sql3`${vouchers.voucherDate} <= ${endDate}`);
        }
        const salesVouchers = await db.select().from(vouchers).where(and2(...conditions)).orderBy(sql3`${vouchers.voucherDate} DESC, ${vouchers.createdAt} DESC`);
        const transactions = await Promise.all(
          salesVouchers.map(async (voucher) => {
            const items = await db.select({
              id: salesItems.id,
              stockItemId: salesItems.stockItemId,
              stockItemName: stockItems.name,
              quantity: salesItems.quantity,
              sellingPrice: salesItems.sellingPrice,
              totalSales: salesItems.totalSales
            }).from(salesItems).leftJoin(stockItems, eq2(salesItems.stockItemId, stockItems.id)).where(eq2(salesItems.voucherId, voucher.id));
            const totalQty = items.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
            const totalAmt = parseFloat(voucher.totalAmount || "0");
            return {
              id: voucher.id,
              voucherNumber: voucher.voucherNumber,
              voucherDate: voucher.voucherDate,
              createdAt: voucher.createdAt,
              description: voucher.description,
              totalAmount: totalAmt,
              totalQuantity: totalQty,
              itemCount: items.length,
              items
            };
          })
        );
        res.json(transactions);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post("/api/pos/sales", requireAuth, async (req, res) => {
    try {
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const {
        locationId,
        cashAccountId,
        paymentAccountType,
        paymentAccountId,
        items,
        notes,
        isCreditSale,
        voucherDate: providedVoucherDate
      } = req.body;
      let accountType;
      let accountId;
      if (isCreditSale) {
        if (!paymentAccountId) {
          return res.status(400).json({
            message: "Customer account is required for credit sales"
          });
        }
        const [customerAccount2] = await db.select().from(ledgerAccounts).where(
          and2(
            eq2(ledgerAccounts.id, paymentAccountId),
            eq2(ledgerAccounts.companyId, req.session.currentCompanyId)
          )
        ).limit(1);
        if (!customerAccount2) {
          return res.status(400).json({
            message: "Invalid customer account - account not found or does not belong to this company"
          });
        }
        if (customerAccount2.accountType !== "Asset") {
          return res.status(400).json({
            message: `Invalid customer account type: ${customerAccount2.accountType}. Credit sales require Asset-type accounts (customer receivables).`
          });
        }
        accountType = "credit";
        accountId = paymentAccountId;
      } else if (cashAccountId) {
        const [cashLedger] = await db.select().from(ledgerAccounts).where(
          and2(
            eq2(ledgerAccounts.id, cashAccountId),
            eq2(ledgerAccounts.companyId, req.session.currentCompanyId)
          )
        ).limit(1);
        if (!cashLedger) {
          return res.status(400).json({
            message: "Invalid cash account - account not found or does not belong to this company"
          });
        }
        if (cashLedger.accountType !== "Cash") {
          return res.status(400).json({
            message: `Invalid cash account type: ${cashLedger.accountType}. The cashAccountId parameter must refer to a Cash-type ledger account.`
          });
        }
        accountType = "cash";
        accountId = cashAccountId;
      } else if (paymentAccountId) {
        const [ledgerAccount] = await db.select().from(ledgerAccounts).where(
          and2(
            eq2(ledgerAccounts.id, paymentAccountId),
            eq2(ledgerAccounts.companyId, req.session.currentCompanyId)
          )
        ).limit(1);
        if (ledgerAccount) {
          if (ledgerAccount.accountType === "Cash") {
            accountType = "cash";
            accountId = paymentAccountId;
          } else if (ledgerAccount.accountType === "Asset") {
            return res.status(400).json({
              message: "Asset accounts (customer receivables) can only be used for credit sales. Please enable 'Credit Sale' or select a Cash/Bank account."
            });
          } else {
            return res.status(400).json({
              message: `Invalid payment account type: ${ledgerAccount.accountType}. POS sales require Cash accounts or Bank accounts for cash/bank payments, or Asset accounts for credit sales.`
            });
          }
        } else {
          const [bankAccount] = await db.select().from(bankAccounts).where(
            and2(
              eq2(bankAccounts.id, paymentAccountId),
              eq2(bankAccounts.companyId, req.session.currentCompanyId)
            )
          ).limit(1);
          if (bankAccount) {
            accountType = "bank";
            accountId = paymentAccountId;
          } else {
            return res.status(400).json({
              message: "Invalid payment account ID - account not found or does not belong to this company"
            });
          }
        }
      } else {
        return res.status(400).json({
          message: "Payment account is required"
        });
      }
      console.log("[POS Sale] Payment info:", {
        provided: { paymentAccountType, paymentAccountId, cashAccountId, isCreditSale },
        resolved: { accountType, accountId }
      });
      if (!locationId) {
        return res.status(400).json({ message: "Location is required" });
      }
      if (!accountId) {
        return res.status(400).json({
          message: isCreditSale ? "Customer is required" : "Payment account is required"
        });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }
      let grandTotal = 0;
      for (const item of items) {
        if (!item.stockItemId) {
          return res.status(400).json({ message: "Stock item ID is required for all items" });
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          return res.status(400).json({ message: "Quantity must be positive for all items" });
        }
        if (!item.rate || parseFloat(item.rate) < 0) {
          return res.status(400).json({ message: "Rate must be non-negative for all items" });
        }
        grandTotal += parseFloat(item.quantity) * parseFloat(item.rate);
      }
      const allAccounts = await storage.getAllLedgerAccounts(
        req.session.currentCompanyId
      );
      let salesAccount = allAccounts.find((a) => a.code === "SALES");
      if (!salesAccount) {
        salesAccount = await storage.createLedgerAccount({
          companyId: req.session.currentCompanyId,
          code: "SALES",
          name: "Sales Revenue",
          accountType: "Income",
          openingBalance: "0",
          active: true
        });
      }
      const location = await storage.getLocationById(locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      const voucherNumber = `SALES-${Date.now()}`;
      const voucherDate = providedVoucherDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const inventoryValidation = [];
      for (const item of items) {
        const [inventoryRecord] = await db.select().from(inventory).where(
          and2(
            eq2(inventory.locationId, locationId),
            eq2(inventory.stockItemId, item.stockItemId)
          )
        );
        if (!inventoryRecord) {
          throw new Error(
            `Inventory not found for item ${item.stockItemId} at location ${locationId}`
          );
        }
        const currentQty = parseFloat(inventoryRecord.quantity);
        const saleQty = parseFloat(item.quantity);
        const canSellNegativeStock = req.user?.canSellNegativeStock || false;
        if (currentQty < saleQty && !canSellNegativeStock) {
          throw new Error(
            `Insufficient stock for item ${item.stockItemId}. Available: ${currentQty}, Requested: ${saleQty}`
          );
        }
        inventoryValidation.push({
          item,
          inventoryRecord,
          currentQty,
          saleQty,
          newQty: currentQty - saleQty,
          currentRate: parseFloat(inventoryRecord.averageRate)
        });
      }
      let voucher;
      let saleItems = [];
      const updatedInventoryIds = [];
      try {
        [voucher] = await db.insert(vouchers).values({
          companyId: req.session.currentCompanyId,
          locationId,
          locationName: location.name,
          voucherNumber,
          voucherType: "Sales",
          voucherDate,
          description: notes || `POS Sale at ${location.name}`,
          totalAmount: grandTotal.toFixed(2),
          optional: false
        }).returning();
        const debitEntry = {
          voucherId: voucher.id,
          debitAmount: grandTotal.toFixed(2),
          creditAmount: "0",
          narration: isCreditSale ? `Credit Sale - ${voucherNumber}` : `POS Sale - ${voucherNumber}`
        };
        if (isCreditSale || accountType === "cash" || accountType === "credit") {
          debitEntry.ledgerAccountId = accountId;
          console.log("[POS Sale] Using ledgerAccountId for cash/credit:", accountId);
        } else {
          debitEntry.bankAccountId = accountId;
          console.log("[POS Sale] Using bankAccountId for bank:", accountId);
        }
        console.log("[POS Sale] Debit entry:", debitEntry);
        await db.insert(voucherEntries).values(debitEntry);
        await db.insert(voucherEntries).values({
          voucherId: voucher.id,
          ledgerAccountId: salesAccount.id,
          debitAmount: "0",
          creditAmount: grandTotal.toFixed(2),
          narration: `POS Sale - ${voucherNumber}`
        });
        for (const validatedItem of inventoryValidation) {
          const { item, newQty, currentRate, inventoryRecord, currentQty } = validatedItem;
          const newTotalValue = (newQty * currentRate).toFixed(2);
          await db.update(inventory).set({
            quantity: newQty.toString(),
            averageRate: currentRate.toFixed(2),
            totalValue: newTotalValue,
            lastUpdated: /* @__PURE__ */ new Date()
          }).where(eq2(inventory.id, inventoryRecord.id));
          updatedInventoryIds.push(inventoryRecord.id);
          const [stockItem] = await db.select().from(stockItems).where(eq2(stockItems.id, item.stockItemId));
          const qty = parseFloat(item.quantity);
          const configuredPrice = stockItem?.sellingPrice ? parseFloat(stockItem.sellingPrice) : 0;
          const sellingPrice = configuredPrice > 0 ? configuredPrice : parseFloat(item.rate);
          const costPrice = currentRate;
          const totalSales = qty * sellingPrice;
          const totalCost = qty * costPrice;
          const profit = totalSales - totalCost;
          await db.insert(salesItems).values({
            voucherId: voucher.id,
            stockItemId: item.stockItemId,
            quantity: qty.toString(),
            sellingPrice: sellingPrice.toFixed(2),
            costPrice: costPrice.toFixed(2),
            totalSales: totalSales.toFixed(2),
            totalCost: totalCost.toFixed(2),
            profit: profit.toFixed(2)
          });
          saleItems.push({
            ...item,
            stockItemName: stockItem?.name || "",
            stockItemCode: stockItem?.code || "",
            amount: totalSales.toFixed(2)
          });
        }
      } catch (error) {
        if (voucher?.id) {
          await db.delete(salesItems).where(eq2(salesItems.voucherId, voucher.id)).catch(() => {
          });
          await db.delete(voucherEntries).where(eq2(voucherEntries.voucherId, voucher.id)).catch(() => {
          });
          await db.delete(vouchers).where(eq2(vouchers.id, voucher.id)).catch(() => {
          });
        }
        for (let i = 0; i < updatedInventoryIds.length; i++) {
          const validatedItem = inventoryValidation[i];
          const originalQty = validatedItem.currentQty;
          const originalTotalValue = (originalQty * validatedItem.currentRate).toFixed(2);
          await db.update(inventory).set({
            quantity: originalQty.toString(),
            totalValue: originalTotalValue,
            lastUpdated: /* @__PURE__ */ new Date()
          }).where(eq2(inventory.id, updatedInventoryIds[i])).catch(() => {
          });
        }
        throw error;
      }
      const result = { voucher, saleItems };
      let customerAccount = null;
      if (isCreditSale) {
        customerAccount = await storage.getLedgerAccountById(accountId);
      }
      res.json({
        voucher: result.voucher,
        location,
        items: result.saleItems,
        grandTotal: grandTotal.toFixed(2),
        voucherNumber,
        saleDate: voucherDate,
        isCreditSale,
        customer: customerAccount ? {
          id: customerAccount.id,
          code: customerAccount.code,
          name: customerAccount.name
        } : null
      });
    } catch (error) {
      if (error.message.includes("Inventory not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Insufficient stock")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });
  app2.put("/api/vouchers/:id/sales", requireAuth, async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      if (isNaN(voucherId)) {
        return res.status(400).json({ message: "Invalid voucher ID" });
      }
      if (!req.session.currentCompanyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { description, items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }
      for (const item of items) {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.sellingPrice);
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Invalid quantity: ${item.quantity}. Must be greater than 0.`);
        }
        if (isNaN(price) || price <= 0) {
          throw new Error(`Invalid price: ${item.sellingPrice}. Must be greater than 0.`);
        }
      }
      const [existingVoucher] = await db.select().from(vouchers).where(
        and2(
          eq2(vouchers.id, voucherId),
          eq2(vouchers.companyId, req.session.currentCompanyId)
        )
      ).limit(1);
      if (!existingVoucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      if (existingVoucher.voucherType !== "Sales") {
        return res.status(400).json({ message: "Only Sales vouchers can be updated with this endpoint" });
      }
      const oldSalesItems = await db.select().from(salesItems).where(eq2(salesItems.voucherId, voucherId));
      const oldItemsMap = new Map(
        oldSalesItems.map((item) => [item.id, item])
      );
      const oldEntries = await db.select().from(voucherEntries).where(eq2(voucherEntries.voucherId, voucherId));
      await db.transaction(async (tx) => {
        for (const oldItem of oldSalesItems) {
          const oldQty = parseFloat(oldItem.quantity);
          const [existingInventory] = await tx.select().from(inventory).where(
            and2(
              eq2(inventory.locationId, existingVoucher.locationId),
              eq2(inventory.stockItemId, oldItem.stockItemId)
            )
          ).limit(1);
          if (existingInventory) {
            const currentQty = parseFloat(existingInventory.quantity);
            const newQty = currentQty + oldQty;
            await tx.update(inventory).set({ quantity: newQty.toString() }).where(eq2(inventory.id, existingInventory.id));
          }
        }
        await tx.delete(salesItems).where(eq2(salesItems.voucherId, voucherId));
        await tx.delete(voucherEntries).where(eq2(voucherEntries.voucherId, voucherId));
        let grandTotal = 0;
        for (const item of items) {
          const { id, stockItemId, quantity, sellingPrice } = item;
          const [inventoryRecord] = await tx.select().from(inventory).where(
            and2(
              eq2(inventory.locationId, existingVoucher.locationId),
              eq2(inventory.stockItemId, stockItemId)
            )
          ).limit(1);
          if (!inventoryRecord) {
            throw new Error(`Inventory not found for stock item ${stockItemId}`);
          }
          const currentQty = parseFloat(inventoryRecord.quantity);
          const sellQty = parseFloat(quantity);
          if (currentQty < sellQty) {
            throw new Error(`Insufficient stock for item ${stockItemId}. Available: ${currentQty}, Requested: ${sellQty}`);
          }
          const oldItem = id !== void 0 && id > 0 ? oldItemsMap.get(id) : null;
          const costPrice = oldItem ? parseFloat(oldItem.costPrice || "0") : parseFloat(inventoryRecord.averageRate || "0");
          const [stockItemData] = await tx.select().from(stockItems).where(eq2(stockItems.id, stockItemId)).limit(1);
          const configuredPrice = stockItemData?.sellingPrice ? parseFloat(stockItemData.sellingPrice) : 0;
          const effectiveSellingPrice = configuredPrice > 0 ? configuredPrice : parseFloat(sellingPrice);
          const totalSales = sellQty * effectiveSellingPrice;
          const totalCost = sellQty * costPrice;
          const profit = totalSales - totalCost;
          await tx.insert(salesItems).values({
            voucherId,
            stockItemId,
            quantity,
            sellingPrice: effectiveSellingPrice.toFixed(2),
            costPrice: costPrice.toString(),
            totalSales: totalSales.toFixed(2),
            totalCost: totalCost.toFixed(2),
            profit: profit.toFixed(2)
          });
          const newQty = currentQty - sellQty;
          await tx.update(inventory).set({ quantity: newQty.toString() }).where(eq2(inventory.id, inventoryRecord.id));
          grandTotal += totalSales;
        }
        await tx.update(vouchers).set({
          description: description || null,
          totalAmount: grandTotal.toString()
        }).where(eq2(vouchers.id, voucherId));
        const paymentEntry = oldEntries.find((e) => parseFloat(e.debitAmount || "0") > 0);
        const revenueEntry = oldEntries.find((e) => parseFloat(e.creditAmount || "0") > 0);
        if (!paymentEntry || !revenueEntry) {
          throw new Error("Original voucher entries not found");
        }
        await tx.insert(voucherEntries).values({
          voucherId,
          ledgerAccountId: paymentEntry.ledgerAccountId,
          bankAccountId: paymentEntry.bankAccountId,
          supplierId: paymentEntry.supplierId,
          employeeId: paymentEntry.employeeId,
          fixedAssetId: paymentEntry.fixedAssetId,
          debitAmount: grandTotal.toString(),
          creditAmount: "0",
          narration: paymentEntry.narration || ""
        });
        await tx.insert(voucherEntries).values({
          voucherId,
          ledgerAccountId: revenueEntry.ledgerAccountId,
          bankAccountId: revenueEntry.bankAccountId,
          supplierId: revenueEntry.supplierId,
          employeeId: revenueEntry.employeeId,
          fixedAssetId: revenueEntry.fixedAssetId,
          debitAmount: "0",
          creditAmount: grandTotal.toString(),
          narration: revenueEntry.narration || ""
        });
      });
      res.json({ message: "Sales voucher updated successfully" });
    } catch (error) {
      if (error.message.includes("Inventory not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Insufficient stock")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/pos/drafts", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : void 0;
      const drafts = await storage.getAllDraftPosSales(userId, locationId);
      res.json(drafts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/pos/drafts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const draft = await storage.getDraftPosSaleById(id);
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      if (draft.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(draft);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/pos/drafts", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const { locationId, paymentAccountType, paymentAccountId, isCreditSale, notes, items } = req.body;
      if (!locationId) {
        return res.status(400).json({ message: "Location is required" });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }
      const draftData = {
        userId,
        locationId,
        paymentAccountType: paymentAccountType || null,
        paymentAccountId: paymentAccountId || null,
        isCreditSale: isCreditSale || false,
        notes: notes || null
      };
      const draft = await storage.createDraftPosSale(draftData, items);
      res.status(201).json(draft);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch("/api/pos/drafts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const existingDraft = await storage.getDraftPosSaleById(id);
      if (!existingDraft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      if (existingDraft.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { locationId, paymentAccountType, paymentAccountId, isCreditSale, notes, items } = req.body;
      const updateData = {};
      if (locationId !== void 0) updateData.locationId = locationId;
      if (paymentAccountType !== void 0) updateData.paymentAccountType = paymentAccountType;
      if (paymentAccountId !== void 0) updateData.paymentAccountId = paymentAccountId;
      if (isCreditSale !== void 0) updateData.isCreditSale = isCreditSale;
      if (notes !== void 0) updateData.notes = notes;
      const draft = await storage.updateDraftPosSale(id, updateData, items);
      res.json(draft);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.delete("/api/pos/drafts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const existingDraft = await storage.getDraftPosSaleById(id);
      if (!existingDraft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      if (existingDraft.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteDraftPosSale(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get(
    "/api/stock-transfers",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const voucherId = req.query.voucherId ? parseInt(req.query.voucherId) : null;
        if (!voucherId) {
          return res.status(400).json({ message: "voucherId query parameter is required" });
        }
        const transfer = await storage.getStockTransferByVoucherId(voucherId);
        res.json(transfer);
      } catch (error) {
        console.error("[Stock Transfer GET] Error:", error.message);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/stock-transfers",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const { voucherId, destinationLocationId, notes, items } = req.body;
        if (!voucherId) {
          return res.status(400).json({ message: "Voucher ID is required" });
        }
        if (!destinationLocationId) {
          return res.status(400).json({ message: "Destination location is required" });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: "Items are required" });
        }
        const destLocation = await storage.getLocationById(
          destinationLocationId
        );
        if (!destLocation) {
          return res.status(404).json({ message: "Destination location not found" });
        }
        const voucher = await storage.getVoucherById(voucherId);
        if (!voucher) {
          return res.status(404).json({ message: "Voucher not found" });
        }
        for (const item of items) {
          if (!item.sourceLocationId) {
            return res.status(400).json({ message: "Source location is required for all items" });
          }
          if (!item.stockItemId) {
            return res.status(400).json({ message: "Stock item ID is required for all items" });
          }
          if (!item.quantity || parseFloat(item.quantity) <= 0) {
            return res.status(400).json({ message: "Quantity must be positive for all items" });
          }
          if (!item.rate || parseFloat(item.rate) < 0) {
            return res.status(400).json({ message: "Rate must be non-negative for all items" });
          }
          if (item.sourceLocationId === destinationLocationId) {
            return res.status(400).json({
              message: "Source and destination locations must be different for each item"
            });
          }
          const sourceLocation = await storage.getLocationById(
            item.sourceLocationId
          );
          if (!sourceLocation) {
            return res.status(404).json({
              message: `Source location with ID ${item.sourceLocationId} not found`
            });
          }
        }
        console.log("[Stock Transfer] Creating transfer:", {
          voucherId,
          destinationLocationId,
          itemCount: items.length
        });
        const transfer = await storage.createStockTransfer(
          voucherId,
          destinationLocationId,
          notes || "",
          items
        );
        console.log("[Stock Transfer] Transfer created successfully:", {
          transferId: transfer.transfer.id,
          itemsCount: transfer.items.length
        });
        res.status(201).json(transfer);
      } catch (error) {
        console.error(
          "[Stock Transfer] Error creating transfer:",
          error.message,
          error.stack
        );
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.put(
    "/api/stock-transfers/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (!id) {
          return res.status(400).json({ message: "Transfer ID is required" });
        }
        const parseResult = updateStockTransferSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            message: "Invalid request data",
            errors: parseResult.error.errors
          });
        }
        const { destinationLocationId, notes, items } = parseResult.data;
        const invalidItem = items.find((item) => item.sourceLocationId === destinationLocationId);
        if (invalidItem) {
          return res.status(400).json({ message: "Source and destination locations must be different for each item" });
        }
        const itemsForStorage = items.map((item) => ({
          sourceLocationId: item.sourceLocationId,
          stockItemId: item.stockItemId,
          quantity: item.quantity.toFixed(3),
          rate: item.rate.toFixed(2)
        }));
        const updated = await storage.updateStockTransfer(id, destinationLocationId, notes || "", itemsForStorage);
        const newTotalAmount = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
        await db.update(vouchers).set({ totalAmount: newTotalAmount.toFixed(2) }).where(eq2(vouchers.id, updated.transfer.voucherId));
        res.json(updated);
      } catch (error) {
        console.error("[Stock Transfer PUT] Error:", error.message);
        if (error.message && error.message.includes("missing source location data")) {
          return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/stock-adjustments",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const voucherId = req.query.voucherId ? parseInt(req.query.voucherId) : null;
        if (!voucherId) {
          return res.status(400).json({ message: "voucherId query parameter is required" });
        }
        const adjustment = await storage.getStockAdjustmentByVoucherId(voucherId);
        res.json(adjustment);
      } catch (error) {
        console.error("[Stock Adjustment GET] Error:", error.message);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.post(
    "/api/stock-adjustments",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const { voucherId, locationId, adjustmentType, notes, items } = req.body;
        if (!voucherId) {
          return res.status(400).json({ message: "Voucher ID is required" });
        }
        if (!locationId) {
          return res.status(400).json({ message: "Location is required" });
        }
        if (!adjustmentType) {
          return res.status(400).json({ message: "Adjustment type is required" });
        }
        if (adjustmentType !== "Production" && adjustmentType !== "Consumption") {
          return res.status(400).json({
            message: "Adjustment type must be either 'Production' or 'Consumption'"
          });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: "Items are required" });
        }
        const location = await storage.getLocationById(locationId);
        if (!location) {
          return res.status(404).json({ message: "Location not found" });
        }
        const voucher = await storage.getVoucherById(voucherId);
        if (!voucher) {
          return res.status(404).json({ message: "Voucher not found" });
        }
        for (const item of items) {
          if (!item.stockItemId) {
            return res.status(400).json({ message: "Stock item ID is required for all items" });
          }
          if (!item.quantity || parseFloat(item.quantity) === 0) {
            return res.status(400).json({ message: "Quantity cannot be zero for any items" });
          }
          if (!item.rate || parseFloat(item.rate) < 0) {
            return res.status(400).json({ message: "Rate must be non-negative for all items" });
          }
        }
        console.log("[Stock Adjustment] Creating adjustment:", {
          voucherId,
          locationId,
          adjustmentType,
          itemCount: items.length
        });
        const adjustment = await storage.createStockAdjustment(
          voucherId,
          locationId,
          adjustmentType,
          notes || "",
          items
        );
        console.log("[Stock Adjustment] Adjustment created successfully:", {
          adjustmentId: adjustment.adjustment.id,
          itemsCount: adjustment.items.length
        });
        res.status(201).json(adjustment);
      } catch (error) {
        console.error(
          "[Stock Adjustment] Error creating adjustment:",
          error.message,
          error.stack
        );
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.put(
    "/api/stock-adjustments/:id",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (!id) {
          return res.status(400).json({ message: "Adjustment ID is required" });
        }
        const parseResult = updateStockAdjustmentSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            message: "Invalid request data",
            errors: parseResult.error.errors
          });
        }
        const { locationId, adjustmentType, notes, items } = parseResult.data;
        const itemsForStorage = items.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: item.quantity.toFixed(3),
          rate: item.rate.toFixed(2)
        }));
        const updated = await storage.updateStockAdjustment(id, locationId, adjustmentType, notes || "", itemsForStorage);
        const newTotalAmount = items.reduce((sum, item) => sum + Math.abs(item.quantity) * item.rate, 0);
        await db.update(vouchers).set({ totalAmount: newTotalAmount.toFixed(2) }).where(eq2(vouchers.id, updated.adjustment.voucherId));
        res.json(updated);
      } catch (error) {
        console.error("[Stock Adjustment PUT] Error:", error.message);
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/stats/net-profit", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const companyAccounts = await storage.getAllLedgerAccounts(companyId);
      const incomeAccountIds = companyAccounts.filter((acc) => acc.accountType === "Income").map((acc) => acc.id);
      const excludedExpenseCodes = [
        "PURCHASES",
        // Direct inventory purchases (capitalized)
        "IMPORTCHARGES",
        // Old consolidated import charges (deprecated, capitalized)
        "DUTIES",
        // Container import duties (capitalized)
        "TRANSPORTCHARGES",
        // Container transport costs (capitalized)
        "TRANSPORT",
        // Alternative transport account name (capitalized)
        "CONTAINERLICENSES",
        // Container license fees (capitalized)
        "LICENSES"
        // Alternative license account name (capitalized)
      ];
      const normalizeCode = (code) => code.toUpperCase().replace(/[\s_-]/g, "");
      const expenseAccounts = companyAccounts.filter((acc) => {
        const isExpenseAccount = acc.accountType === "Expense" || acc.accountType === "Indirect Expense" || acc.accountType === "Direct Expense";
        if (!isExpenseAccount) return false;
        const normalizedCode = normalizeCode(acc.code);
        return !excludedExpenseCodes.some(
          (excluded) => normalizeCode(excluded) === normalizedCode
        );
      });
      const expenseAccountIds = expenseAccounts.map((acc) => acc.id);
      const companyVouchers = await db.select({ id: vouchers.id }).from(vouchers).where(and2(eq2(vouchers.companyId, companyId), eq2(vouchers.optional, false))).execute();
      const companyVoucherIds = companyVouchers.map((v) => v.id);
      const companyEntries = companyVoucherIds.length > 0 ? await db.select().from(voucherEntries).where(inArray2(voucherEntries.voucherId, companyVoucherIds)).execute() : [];
      let totalIncome = 0;
      for (const entry of companyEntries) {
        if (entry.ledgerAccountId && incomeAccountIds.includes(entry.ledgerAccountId)) {
          totalIncome += parseFloat(entry.creditAmount || "0") - parseFloat(entry.debitAmount || "0");
        }
      }
      let totalExpenses = 0;
      for (const entry of companyEntries) {
        if (entry.ledgerAccountId && expenseAccountIds.includes(entry.ledgerAccountId)) {
          totalExpenses += parseFloat(entry.debitAmount || "0") - parseFloat(entry.creditAmount || "0");
        }
      }
      const netProfit = totalIncome - totalExpenses;
      res.json({
        totalIncome,
        totalExpenses,
        netProfit
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stats/monthly-data", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const salesVouchers = await db.select().from(vouchers).where(
        and2(
          eq2(vouchers.companyId, companyId),
          eq2(vouchers.voucherType, "Sales"),
          eq2(vouchers.optional, false)
        )
      ).execute();
      const companyAccounts = await storage.getAllLedgerAccounts(companyId);
      const incomeAccountIds = companyAccounts.filter((acc) => acc.accountType === "Income").map((acc) => acc.id);
      const excludedExpenseCodes = [
        "PURCHASES",
        // Direct inventory purchases (capitalized)
        "IMPORTCHARGES",
        // Old consolidated import charges (deprecated, capitalized)
        "DUTIES",
        // Container import duties (capitalized)
        "TRANSPORTCHARGES",
        // Container transport costs (capitalized)
        "TRANSPORT",
        // Alternative transport account name (capitalized)
        "CONTAINERLICENSES",
        // Container license fees (capitalized)
        "LICENSES"
        // Alternative license account name (capitalized)
      ];
      const normalizeCode = (code) => code.toUpperCase().replace(/[\s_-]/g, "");
      const expenseAccounts = companyAccounts.filter((acc) => {
        const isExpenseAccount = acc.accountType === "Expense" || acc.accountType === "Indirect Expense" || acc.accountType === "Direct Expense";
        if (!isExpenseAccount) return false;
        const normalizedCode = normalizeCode(acc.code);
        return !excludedExpenseCodes.some(
          (excluded) => normalizeCode(excluded) === normalizedCode
        );
      });
      const expenseAccountIds = expenseAccounts.map((acc) => acc.id);
      const companyVouchers = await db.select({ id: vouchers.id, voucherDate: vouchers.voucherDate }).from(vouchers).where(and2(eq2(vouchers.companyId, companyId), eq2(vouchers.optional, false))).execute();
      const companyVoucherIds = companyVouchers.map((v) => v.id);
      const voucherDateMap = new Map(
        companyVouchers.map((v) => [v.id, v.voucherDate])
      );
      const companyEntries = companyVoucherIds.length > 0 ? await db.select().from(voucherEntries).where(inArray2(voucherEntries.voucherId, companyVoucherIds)).execute() : [];
      const monthlyData = /* @__PURE__ */ new Map();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ];
      const currentDate = /* @__PURE__ */ new Date();
      for (let i = 5; i >= 0; i--) {
        const date2 = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const monthKey = monthNames[date2.getMonth()];
        monthlyData.set(monthKey, { sales: 0, profit: 0 });
      }
      for (const voucher of salesVouchers) {
        const voucherDate = new Date(voucher.voucherDate);
        const monthKey = monthNames[voucherDate.getMonth()];
        const amount = parseFloat(voucher.totalAmount || "0");
        if (monthlyData.has(monthKey)) {
          const data = monthlyData.get(monthKey);
          data.sales += amount;
        }
      }
      for (const entry of companyEntries) {
        const voucherDate = voucherDateMap.get(entry.voucherId);
        if (!voucherDate) continue;
        const date2 = new Date(voucherDate);
        const monthKey = monthNames[date2.getMonth()];
        if (!monthlyData.has(monthKey)) continue;
        const data = monthlyData.get(monthKey);
        if (entry.ledgerAccountId && incomeAccountIds.includes(entry.ledgerAccountId)) {
          data.profit += parseFloat(entry.creditAmount || "0") - parseFloat(entry.debitAmount || "0");
        }
        if (entry.ledgerAccountId && expenseAccountIds.includes(entry.ledgerAccountId)) {
          data.profit -= parseFloat(entry.debitAmount || "0") - parseFloat(entry.creditAmount || "0");
        }
      }
      const result = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        sales: data.sales,
        profit: data.profit
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stats/stock-summary", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const stockItems2 = await storage.getAllStockItems(companyId);
      const totalStockItems = stockItems2.length;
      const inventory2 = await storage.getCompanyInventory(companyId);
      const lowStockThreshold = 20;
      const lowStockItems = inventory2.filter(
        (item) => parseFloat(item.quantity) < lowStockThreshold && parseFloat(item.quantity) > 0
      ).map((item) => ({
        name: item.stockItemName,
        stock: parseFloat(item.quantity),
        location: item.locationName || "Unknown"
      })).sort((a, b) => a.stock - b.stock).slice(0, 10);
      const criticalThreshold = 5;
      const criticalCount = inventory2.filter(
        (item) => parseFloat(item.quantity) < criticalThreshold && parseFloat(item.quantity) > 0
      ).length;
      res.json({
        totalStockItems,
        lowStockCount: lowStockItems.length,
        criticalCount,
        lowStockItems
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/sales-report", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { startDate, endDate, locationId, stockItemId } = req.query;
      const conditions = [eq2(vouchers.companyId, companyId)];
      if (startDate) {
        conditions.push(sql3`${vouchers.voucherDate} >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql3`${vouchers.voucherDate} <= ${endDate}`);
      }
      if (locationId) {
        conditions.push(
          eq2(vouchers.locationId, parseInt(locationId))
        );
      }
      if (stockItemId) {
        conditions.push(
          eq2(salesItems.stockItemId, parseInt(stockItemId))
        );
      }
      const salesData = await db.select({
        id: salesItems.id,
        voucherId: salesItems.voucherId,
        voucherNumber: vouchers.voucherNumber,
        voucherDate: vouchers.voucherDate,
        locationId: vouchers.locationId,
        locationName: sql3`COALESCE(${locations.name}, ${vouchers.locationName})`.as("location_name"),
        stockItemId: salesItems.stockItemId,
        stockItemCode: stockItems.code,
        stockItemName: stockItems.name,
        quantity: salesItems.quantity,
        actualSellingPrice: salesItems.sellingPrice,
        // Price item was actually sold at
        configuredSellingPrice: stockItemLocationPrices.sellingPrice,
        // Location-specific price
        costPrice: salesItems.costPrice,
        totalSales: salesItems.totalSales,
        totalCost: salesItems.totalCost,
        costProfit: salesItems.profit,
        // Actual selling price - cost price
        createdAt: salesItems.createdAt
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).innerJoin(stockItems, eq2(salesItems.stockItemId, stockItems.id)).leftJoin(locations, eq2(vouchers.locationId, locations.id)).leftJoin(
        stockItemLocationPrices,
        and2(
          eq2(stockItemLocationPrices.stockItemId, salesItems.stockItemId),
          eq2(stockItemLocationPrices.locationId, vouchers.locationId)
        )
      ).where(and2(...conditions)).orderBy(vouchers.voucherDate);
      const enhancedSalesData = salesData.map((item) => {
        const configuredPrice = parseFloat(item.configuredSellingPrice || "0") > 0 ? parseFloat(item.configuredSellingPrice || "0") : parseFloat(item.actualSellingPrice || "0");
        const actualPrice = parseFloat(item.actualSellingPrice || "0");
        const totalSales = parseFloat(item.totalSales || "0");
        const costProfit = parseFloat(item.costProfit || "0");
        const quantity = parseFloat(item.quantity || "0");
        const configuredProfit = (actualPrice - configuredPrice) * quantity;
        const totalConfiguredCost = configuredPrice * quantity;
        const costProfitPercentage = totalSales > 0 ? costProfit / totalSales * 100 : 0;
        const configuredProfitPercentage = totalConfiguredCost > 0 ? configuredProfit / totalConfiguredCost * 100 : 0;
        if (item.stockItemName.includes("Men T Shirt")) {
          console.log(`DEBUG: ${item.stockItemName}`, {
            quantity,
            actualPrice,
            configuredPrice,
            rawConfiguredPrice: item.configuredSellingPrice,
            configuredProfit,
            totalConfiguredCost
          });
        }
        return {
          ...item,
          configuredSellingPrice: configuredPrice.toString(),
          configuredProfit,
          totalConfiguredCost,
          costProfitPercentage,
          configuredProfitPercentage
        };
      });
      res.json(enhancedSalesData);
    } catch (error) {
      console.error("Sales report error:", error);
      res.status(500).json({ message: error.message, details: error.toString() });
    }
  });
  app2.post(
    "/api/sales-report/recalculate-costs",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const companyId = req.session.currentCompanyId;
        if (!companyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { startDate, endDate, stockItemId, locationId } = req.body;
        const conditions = [eq2(vouchers.companyId, companyId)];
        if (startDate) {
          conditions.push(sql3`${vouchers.voucherDate} >= ${startDate}`);
        }
        if (endDate) {
          conditions.push(sql3`${vouchers.voucherDate} <= ${endDate}`);
        }
        if (stockItemId) {
          conditions.push(eq2(salesItems.stockItemId, stockItemId));
        }
        if (locationId) {
          conditions.push(eq2(vouchers.locationId, locationId));
        }
        const itemsToUpdate = await db.select({
          salesItemId: salesItems.id,
          stockItemId: salesItems.stockItemId,
          quantity: salesItems.quantity,
          sellingPrice: salesItems.sellingPrice,
          oldCostPrice: salesItems.costPrice,
          locationId: vouchers.locationId
        }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).where(and2(...conditions));
        let updatedCount = 0;
        const updates = [];
        for (const item of itemsToUpdate) {
          let newCostPrice = 0;
          if (item.locationId) {
            const [invRecord] = await db.select({
              averageRate: inventory.averageRate
            }).from(inventory).where(
              and2(
                eq2(inventory.stockItemId, item.stockItemId),
                eq2(inventory.locationId, item.locationId)
              )
            ).limit(1);
            if (invRecord) {
              newCostPrice = parseFloat(invRecord.averageRate || "0");
            }
          }
          if (newCostPrice === 0) {
            const [anyInvRecord] = await db.select({
              averageRate: inventory.averageRate
            }).from(inventory).where(eq2(inventory.stockItemId, item.stockItemId)).limit(1);
            if (anyInvRecord) {
              newCostPrice = parseFloat(anyInvRecord.averageRate || "0");
            }
          }
          const oldCostPrice = parseFloat(item.oldCostPrice || "0");
          if (Math.abs(newCostPrice - oldCostPrice) > 0.01) {
            const qty = parseFloat(item.quantity || "0");
            const sellingPrice = parseFloat(item.sellingPrice || "0");
            const totalSales = qty * sellingPrice;
            const totalCost = qty * newCostPrice;
            const profit = totalSales - totalCost;
            await db.update(salesItems).set({
              costPrice: newCostPrice.toFixed(2),
              totalCost: totalCost.toFixed(2),
              profit: profit.toFixed(2)
            }).where(eq2(salesItems.id, item.salesItemId));
            const [stockItem] = await db.select({ name: stockItems.name }).from(stockItems).where(eq2(stockItems.id, item.stockItemId)).limit(1);
            updates.push({
              id: item.salesItemId,
              oldCost: oldCostPrice,
              newCost: newCostPrice,
              itemName: stockItem?.name || "Unknown"
            });
            updatedCount++;
          }
        }
        res.json({
          message: `Updated cost prices for ${updatedCount} sales items`,
          totalChecked: itemsToUpdate.length,
          updatedCount,
          updates: updates.slice(0, 50)
          // Limit response to first 50 updates
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/reports/profit-loss",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const companyId = req.session.currentCompanyId;
        if (!companyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { startDate, endDate } = req.query;
        const companyAccounts = await storage.getAllLedgerAccounts(companyId);
        const incomeAccounts = companyAccounts.filter(
          (acc) => acc.accountType === "Income"
        );
        const expenseAccounts = companyAccounts.filter(
          (acc) => acc.accountType === "Expense" || acc.accountType === "Indirect Expense" || acc.accountType === "Direct Expense"
        );
        const incomeAccountIds = incomeAccounts.map((acc) => acc.id);
        const expenseAccountIds = expenseAccounts.map((acc) => acc.id);
        let companyVouchersQuery = db.select({ id: vouchers.id, voucherDate: vouchers.voucherDate }).from(vouchers).where(eq2(vouchers.companyId, companyId));
        const conditions = [eq2(vouchers.companyId, companyId), eq2(vouchers.optional, false)];
        if (startDate) {
          conditions.push(sql3`${vouchers.voucherDate} >= ${startDate}`);
        }
        if (endDate) {
          conditions.push(sql3`${vouchers.voucherDate} <= ${endDate}`);
        }
        const companyVouchers = await db.select({ id: vouchers.id }).from(vouchers).where(and2(...conditions)).execute();
        const companyVoucherIds = companyVouchers.map((v) => v.id);
        const companyEntries = companyVoucherIds.length > 0 ? await db.select().from(voucherEntries).where(inArray2(voucherEntries.voucherId, companyVoucherIds)).execute() : [];
        const accountBalances = /* @__PURE__ */ new Map();
        for (const entry of companyEntries) {
          if (entry.ledgerAccountId) {
            const debit = parseFloat(entry.debitAmount || "0");
            const credit = parseFloat(entry.creditAmount || "0");
            const currentBalance = accountBalances.get(entry.ledgerAccountId) || 0;
            accountBalances.set(
              entry.ledgerAccountId,
              currentBalance + credit - debit
            );
          }
        }
        const incomeItems = incomeAccounts.map((acc) => ({
          id: acc.id,
          code: acc.code,
          name: acc.name,
          accountType: acc.accountType,
          balance: accountBalances.get(acc.id) || 0
        })).filter((item) => item.balance !== 0);
        const expenseItems = expenseAccounts.map((acc) => ({
          id: acc.id,
          code: acc.code,
          name: acc.name,
          accountType: acc.accountType,
          balance: accountBalances.get(acc.id) || 0
        })).filter((item) => item.balance !== 0);
        const totalIncome = incomeItems.reduce(
          (sum, item) => sum + item.balance,
          0
        );
        const totalExpenses = expenseItems.reduce(
          (sum, item) => sum + item.balance,
          0
        );
        const netProfit = totalIncome - totalExpenses;
        res.json({
          incomeItems,
          expenseItems,
          totalIncome,
          totalExpenses,
          netProfit,
          startDate: startDate || null,
          endDate: endDate || null
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get(
    "/api/reports/balance-sheet",
    requireAuth,
    requireNonPOS,
    async (req, res) => {
      try {
        const companyId = req.session.currentCompanyId;
        if (!companyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const { asOfDate } = req.query;
        const ledgers = await storage.getAllLedgerAccounts(companyId);
        const banks = await storage.getAllBankAccounts(companyId);
        const assets = await storage.getAllFixedAssets(companyId);
        const suppliers2 = await storage.getAllSuppliers();
        const conditions = [eq2(vouchers.companyId, companyId)];
        if (asOfDate) {
          conditions.push(sql3`${vouchers.voucherDate} <= ${asOfDate}`);
        }
        const companyVouchers = await db.select({ id: vouchers.id }).from(vouchers).where(and2(...conditions)).execute();
        const companyVoucherIds = companyVouchers.map((v) => v.id);
        const allEntries = companyVoucherIds.length > 0 ? await db.select().from(voucherEntries).where(inArray2(voucherEntries.voucherId, companyVoucherIds)).execute() : [];
        const ledgerBalances = /* @__PURE__ */ new Map();
        const bankBalances = /* @__PURE__ */ new Map();
        const assetBalances = /* @__PURE__ */ new Map();
        const supplierBalances = /* @__PURE__ */ new Map();
        for (const entry of allEntries) {
          const debit = parseFloat(entry.debitAmount || "0");
          const credit = parseFloat(entry.creditAmount || "0");
          if (entry.ledgerAccountId) {
            const existing = ledgerBalances.get(entry.ledgerAccountId) || {
              debits: 0,
              credits: 0
            };
            ledgerBalances.set(entry.ledgerAccountId, {
              debits: existing.debits + debit,
              credits: existing.credits + credit
            });
          }
          if (entry.bankAccountId) {
            const existing = bankBalances.get(entry.bankAccountId) || {
              debits: 0,
              credits: 0
            };
            bankBalances.set(entry.bankAccountId, {
              debits: existing.debits + debit,
              credits: existing.credits + credit
            });
          }
          if (entry.fixedAssetId) {
            const existing = assetBalances.get(entry.fixedAssetId) || {
              debits: 0,
              credits: 0
            };
            assetBalances.set(entry.fixedAssetId, {
              debits: existing.debits + debit,
              credits: existing.credits + credit
            });
          }
          if (entry.supplierId) {
            const existing = supplierBalances.get(entry.supplierId) || {
              debits: 0,
              credits: 0
            };
            if (credit > 0 && debit === 0) {
              supplierBalances.set(entry.supplierId, {
                debits: existing.debits,
                credits: existing.credits + credit
              });
            } else if (debit > 0 && credit === 0) {
              supplierBalances.set(entry.supplierId, {
                debits: existing.debits + debit,
                credits: existing.credits
              });
            }
          }
        }
        const assetAccounts = ledgers.filter((l) => l.accountType === "Asset").map((acc) => {
          const bal = ledgerBalances.get(acc.id) || { debits: 0, credits: 0 };
          const openingBalance = parseFloat(acc.openingBalance || "0");
          return {
            id: acc.id,
            code: acc.code,
            name: acc.name,
            balance: openingBalance + bal.debits - bal.credits
          };
        });
        const bankAccounts2 = banks.map((bank) => {
          const bal = bankBalances.get(bank.id) || { debits: 0, credits: 0 };
          const openingBalance = parseFloat(bank.openingBalance || "0");
          return {
            id: bank.id,
            code: bank.accountNumber,
            name: bank.bankName,
            balance: openingBalance + bal.debits - bal.credits
          };
        });
        const fixedAssetAccounts = assets.map((asset) => {
          const bal = assetBalances.get(asset.id) || { debits: 0, credits: 0 };
          const purchaseValue = parseFloat(asset.purchaseAmount || "0");
          return {
            id: asset.id,
            code: asset.code,
            name: asset.name,
            balance: purchaseValue + bal.debits - bal.credits
          };
        });
        const liabilityAccounts = ledgers.filter((l) => l.accountType === "Liability").map((acc) => {
          const bal = ledgerBalances.get(acc.id) || { debits: 0, credits: 0 };
          const openingBalance = parseFloat(acc.openingBalance || "0");
          return {
            id: acc.id,
            code: acc.code,
            name: acc.name,
            balance: openingBalance + bal.credits - bal.debits
          };
        });
        const supplierAccounts = suppliers2.map((supplier) => {
          const bal = supplierBalances.get(supplier.id) || {
            debits: 0,
            credits: 0
          };
          return {
            id: supplier.id,
            code: supplier.code,
            name: supplier.legalName,
            balance: bal.credits - bal.debits
          };
        }).filter((s) => s.balance !== 0);
        const equityAccounts = ledgers.filter((l) => l.accountType === "Equity").map((acc) => {
          const bal = ledgerBalances.get(acc.id) || { debits: 0, credits: 0 };
          const openingBalance = parseFloat(acc.openingBalance || "0");
          return {
            id: acc.id,
            code: acc.code,
            name: acc.name,
            balance: openingBalance + bal.credits - bal.debits
          };
        });
        const totalAssets = [
          ...assetAccounts,
          ...bankAccounts2,
          ...fixedAssetAccounts
        ].reduce((sum, item) => sum + item.balance, 0);
        const totalLiabilities = [
          ...liabilityAccounts,
          ...supplierAccounts
        ].reduce((sum, item) => sum + item.balance, 0);
        const totalEquity = equityAccounts.reduce(
          (sum, item) => sum + item.balance,
          0
        );
        res.json({
          assets: {
            ledgers: assetAccounts.filter((a) => a.balance !== 0),
            banks: bankAccounts2.filter((b) => b.balance !== 0),
            fixedAssets: fixedAssetAccounts.filter((f) => f.balance !== 0),
            total: totalAssets
          },
          liabilities: {
            ledgers: liabilityAccounts.filter((l) => l.balance !== 0),
            suppliers: supplierAccounts,
            total: totalLiabilities
          },
          equity: {
            accounts: equityAccounts.filter((e) => e.balance !== 0),
            total: totalEquity
          },
          asOfDate: asOfDate || null
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  app2.get("/api/reports/sales", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { startDate, endDate, locationId, stockGroupId } = req.query;
      const conditions = [eq2(vouchers.companyId, companyId)];
      if (startDate) {
        conditions.push(sql3`${vouchers.voucherDate} >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql3`${vouchers.voucherDate} <= ${endDate}`);
      }
      if (locationId) {
        conditions.push(
          eq2(vouchers.locationId, parseInt(locationId))
        );
      }
      let salesQuery = db.select({
        id: salesItems.id,
        voucherNumber: vouchers.voucherNumber,
        voucherDate: vouchers.voucherDate,
        locationName: locations.name,
        stockItemCode: stockItems.code,
        stockItemName: stockItems.name,
        stockGroupId: stockItems.stockGroupId,
        quantity: salesItems.quantity,
        sellingPrice: salesItems.sellingPrice,
        costPrice: salesItems.costPrice,
        totalSales: salesItems.totalSales,
        totalCost: salesItems.totalCost,
        profit: salesItems.profit
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).innerJoin(stockItems, eq2(salesItems.stockItemId, stockItems.id)).leftJoin(locations, eq2(vouchers.locationId, locations.id)).where(and2(...conditions)).orderBy(vouchers.voucherDate);
      let salesData = await salesQuery.execute();
      if (stockGroupId) {
        salesData = salesData.filter(
          (s) => s.stockGroupId === parseInt(stockGroupId)
        );
      }
      const totalQuantity = salesData.reduce(
        (sum, item) => sum + parseFloat(item.quantity),
        0
      );
      const totalSales = salesData.reduce(
        (sum, item) => sum + parseFloat(item.totalSales),
        0
      );
      const totalCost = salesData.reduce(
        (sum, item) => sum + parseFloat(item.totalCost),
        0
      );
      const totalProfit = salesData.reduce(
        (sum, item) => sum + parseFloat(item.profit),
        0
      );
      res.json({
        items: salesData,
        summary: {
          totalQuantity,
          totalSales,
          totalCost,
          totalProfit,
          grossProfitMargin: totalSales > 0 ? totalProfit / totalSales * 100 : 0
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          locationId: locationId || null,
          stockGroupId: stockGroupId || null
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/reports/stock-movement", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { startDate, endDate, locationId, stockGroupId } = req.query;
      const allStockItems = await storage.getAllStockItems(companyId);
      const stockItemsToReport = stockGroupId ? allStockItems.filter(
        (item) => item.stockGroupId === parseInt(stockGroupId)
      ) : allStockItems;
      const inventoryConditions = [eq2(locations.companyId, companyId)];
      if (locationId) {
        inventoryConditions.push(
          eq2(inventory.locationId, parseInt(locationId))
        );
      }
      const inventoryRecords = await db.select({
        stockItemId: inventory.stockItemId,
        locationId: inventory.locationId,
        locationName: locations.name,
        quantity: inventory.quantity,
        averageRate: inventory.averageRate,
        totalValue: inventory.totalValue
      }).from(inventory).innerJoin(locations, eq2(inventory.locationId, locations.id)).where(and2(...inventoryConditions)).execute();
      const movementData = stockItemsToReport.map((item) => {
        const itemInventory = inventoryRecords.filter(
          (inv) => inv.stockItemId === item.id
        );
        const totalQuantity = itemInventory.reduce(
          (sum, inv) => sum + parseFloat(inv.quantity),
          0
        );
        const totalValue = itemInventory.reduce(
          (sum, inv) => sum + parseFloat(inv.totalValue),
          0
        );
        return {
          stockItemId: item.id,
          stockItemCode: item.code,
          stockItemName: item.name,
          locations: itemInventory.map((inv) => ({
            locationId: inv.locationId,
            locationName: inv.locationName,
            quantity: parseFloat(inv.quantity),
            averageRate: parseFloat(inv.averageRate),
            totalValue: parseFloat(inv.totalValue)
          })),
          totalQuantity,
          totalValue
        };
      }).filter((item) => item.totalQuantity > 0);
      const grandTotalQuantity = movementData.reduce(
        (sum, item) => sum + item.totalQuantity,
        0
      );
      const grandTotalValue = movementData.reduce(
        (sum, item) => sum + item.totalValue,
        0
      );
      res.json({
        items: movementData,
        summary: {
          totalItems: movementData.length,
          grandTotalQuantity,
          grandTotalValue
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          locationId: locationId || null,
          stockGroupId: stockGroupId || null
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/reports/containers", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { status, supplierId, startDate, endDate } = req.query;
      const conditions = [eq2(containers.companyId, companyId)];
      if (status) {
        conditions.push(eq2(containers.status, status));
      }
      if (supplierId) {
        conditions.push(
          eq2(containers.supplierId, parseInt(supplierId))
        );
      }
      if (startDate) {
        conditions.push(sql3`${containers.importDate} >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql3`${containers.importDate} <= ${endDate}`);
      }
      const containerData = await db.select({
        id: containers.id,
        containerNumber: containers.containerNumber,
        supplierName: suppliers.legalName,
        status: containers.status,
        importDate: containers.importDate,
        itemsTotal: containers.itemsTotal,
        chargesTotal: containers.chargesTotal,
        grandTotal: containers.grandTotal
      }).from(containers).innerJoin(suppliers, eq2(containers.supplierId, suppliers.id)).where(and2(...conditions)).orderBy(containers.importDate);
      const totalItemsTotal = containerData.reduce(
        (sum, c) => sum + parseFloat(c.itemsTotal || "0"),
        0
      );
      const totalChargesTotal = containerData.reduce(
        (sum, c) => sum + parseFloat(c.chargesTotal || "0"),
        0
      );
      const totalGrandTotal = containerData.reduce(
        (sum, c) => sum + parseFloat(c.grandTotal || "0"),
        0
      );
      res.json({
        containers: containerData,
        summary: {
          totalContainers: containerData.length,
          totalItemsTotal,
          totalChargesTotal,
          totalGrandTotal
        },
        filters: {
          status: status || null,
          supplierId: supplierId || null,
          startDate: startDate || null,
          endDate: endDate || null
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/reports/ratios", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { startDate, endDate } = req.query;
      const companyAccounts = await storage.getAllLedgerAccounts(companyId);
      const incomeAccountIds = companyAccounts.filter((acc) => acc.accountType === "Income").map((acc) => acc.id);
      const expenseAccountIds = companyAccounts.filter((acc) => acc.accountType === "Expense").map((acc) => acc.id);
      const assetAccountIds = companyAccounts.filter((acc) => acc.accountType === "Asset").map((acc) => acc.id);
      const liabilityAccountIds = companyAccounts.filter((acc) => acc.accountType === "Liability").map((acc) => acc.id);
      const conditions = [eq2(vouchers.companyId, companyId)];
      if (startDate) {
        conditions.push(sql3`${vouchers.voucherDate} >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql3`${vouchers.voucherDate} <= ${endDate}`);
      }
      const companyVouchers = await db.select({ id: vouchers.id }).from(vouchers).where(and2(...conditions)).execute();
      const companyVoucherIds = companyVouchers.map((v) => v.id);
      const companyEntries = companyVoucherIds.length > 0 ? await db.select().from(voucherEntries).where(inArray2(voucherEntries.voucherId, companyVoucherIds)).execute() : [];
      let totalIncome = 0;
      let totalExpenses = 0;
      let totalAssets = 0;
      let totalLiabilities = 0;
      for (const entry of companyEntries) {
        const debit = parseFloat(entry.debitAmount || "0");
        const credit = parseFloat(entry.creditAmount || "0");
        if (entry.ledgerAccountId) {
          if (incomeAccountIds.includes(entry.ledgerAccountId)) {
            totalIncome += credit - debit;
          }
          if (expenseAccountIds.includes(entry.ledgerAccountId)) {
            totalExpenses += debit - credit;
          }
          if (assetAccountIds.includes(entry.ledgerAccountId)) {
            totalAssets += debit - credit;
          }
          if (liabilityAccountIds.includes(entry.ledgerAccountId)) {
            totalLiabilities += credit - debit;
          }
        }
      }
      const salesConditions = [eq2(vouchers.companyId, companyId)];
      if (startDate) {
        salesConditions.push(sql3`${vouchers.voucherDate} >= ${startDate}`);
      }
      if (endDate) {
        salesConditions.push(sql3`${vouchers.voucherDate} <= ${endDate}`);
      }
      const salesData = await db.select({
        totalSales: salesItems.totalSales,
        totalCost: salesItems.totalCost
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).where(and2(...salesConditions)).execute();
      const totalSales = salesData.reduce(
        (sum, s) => sum + parseFloat(s.totalSales),
        0
      );
      const totalCost = salesData.reduce(
        (sum, s) => sum + parseFloat(s.totalCost),
        0
      );
      const grossProfit = totalSales - totalCost;
      const netProfit = totalIncome - totalExpenses;
      const grossProfitMargin = totalSales > 0 ? grossProfit / totalSales * 100 : 0;
      const netProfitMargin = totalIncome > 0 ? netProfit / totalIncome * 100 : 0;
      const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 0;
      const debtToEquity = totalAssets - totalLiabilities > 0 ? totalLiabilities / (totalAssets - totalLiabilities) : 0;
      res.json({
        ratios: {
          grossProfitMargin,
          netProfitMargin,
          currentRatio,
          debtToEquity
        },
        underlying: {
          totalIncome,
          totalExpenses,
          totalSales,
          totalCost,
          grossProfit,
          netProfit,
          totalAssets,
          totalLiabilities,
          totalEquity: totalAssets - totalLiabilities
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/dashboard-cash-accounts", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { dashboardCashAccounts: dashboardCashAccounts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const accounts = await db.select().from(dashboardCashAccounts2).where(eq2(dashboardCashAccounts2.companyId, companyId)).orderBy(dashboardCashAccounts2.displayOrder).execute();
      const enrichedAccounts = await Promise.all(
        accounts.map(async (account) => {
          let accountDetails = null;
          if (account.accountType === "ledger") {
            const { ledgerAccounts: ledgerAccounts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
            const [ledger] = await db.select().from(ledgerAccounts2).where(eq2(ledgerAccounts2.id, account.accountId)).execute();
            accountDetails = ledger ? { ...ledger, type: "Ledger" } : null;
          } else if (account.accountType === "bank") {
            const { bankAccounts: bankAccounts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
            const [bank] = await db.select().from(bankAccounts2).where(eq2(bankAccounts2.id, account.accountId)).execute();
            accountDetails = bank ? { ...bank, type: "Bank" } : null;
          }
          return {
            id: account.id,
            accountType: account.accountType,
            accountId: account.accountId,
            displayOrder: account.displayOrder,
            account: accountDetails
          };
        })
      );
      const validAccounts = enrichedAccounts.filter((a) => a.account !== null);
      res.json(validAccounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/dashboard-cash-accounts", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { dashboardCashAccounts: dashboardCashAccounts2, insertDashboardCashAccountSchema: insertDashboardCashAccountSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertDashboardCashAccountSchema2.parse({
        ...req.body,
        companyId
      });
      const [account] = await db.insert(dashboardCashAccounts2).values(data).returning().execute();
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/dashboard-cash-accounts/:id", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { dashboardCashAccounts: dashboardCashAccounts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const id = parseInt(req.params.id);
      await db.delete(dashboardCashAccounts2).where(
        and2(
          eq2(dashboardCashAccounts2.id, id),
          eq2(dashboardCashAccounts2.companyId, companyId)
        )
      ).execute();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/dashboard-payable-accounts", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { dashboardPayableAccounts: dashboardPayableAccounts2, ledgerAccounts: ledgerAccounts2, vouchers: vouchersTable, voucherEntries: voucherEntries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const accounts = await db.select().from(dashboardPayableAccounts2).where(eq2(dashboardPayableAccounts2.companyId, companyId)).orderBy(dashboardPayableAccounts2.displayOrder).execute();
      const enrichedAccounts = await Promise.all(
        accounts.map(async (account) => {
          const [ledgerAccount] = await db.select().from(ledgerAccounts2).where(eq2(ledgerAccounts2.id, account.accountId)).execute();
          if (!ledgerAccount) {
            return null;
          }
          let balance = parseFloat(ledgerAccount?.openingBalance || "0");
          const entries = await db.select().from(voucherEntries2).leftJoin(vouchersTable, eq2(vouchersTable.id, voucherEntries2.voucherId)).where(and2(
            eq2(voucherEntries2.ledgerAccountId, account.accountId),
            eq2(vouchersTable.companyId, companyId)
          )).execute();
          entries.forEach((entry) => {
            const amount = parseFloat(String(entry.voucher_entries.amount || 0));
            const side = entry.voucher_entries.side;
            if (side === "Dr") {
              balance -= amount;
            } else if (side === "Cr") {
              balance += amount;
            }
          });
          return {
            id: account.accountId,
            accountId: account.accountId,
            code: ledgerAccount?.code || "",
            name: ledgerAccount?.name || "",
            balance
          };
        })
      );
      const validAccounts = enrichedAccounts.filter((a) => a !== null);
      res.json(validAccounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/dashboard-payable-accounts", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { dashboardPayableAccounts: dashboardPayableAccounts2, insertDashboardPayableAccountSchema: insertDashboardPayableAccountSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertDashboardPayableAccountSchema2.parse({
        ...req.body,
        companyId
      });
      const [account] = await db.insert(dashboardPayableAccounts2).values(data).returning().execute();
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/dashboard-payable-accounts/:id", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { dashboardPayableAccounts: dashboardPayableAccounts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const accountId = parseInt(req.params.id);
      await db.delete(dashboardPayableAccounts2).where(
        and2(
          eq2(dashboardPayableAccounts2.accountId, accountId),
          eq2(dashboardPayableAccounts2.companyId, companyId)
        )
      ).execute();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/bales", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const bales2 = await storage.getAllBales(companyId);
      res.json(bales2);
    } catch (error) {
      console.error("Error fetching bales:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/bales/:id", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      const bale = await storage.getBaleById(id);
      if (!bale) {
        return res.status(404).json({ message: "Bale not found" });
      }
      if (bale.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(bale);
    } catch (error) {
      console.error("Error fetching bale:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/bales/barcode/:barcode", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const barcode = req.params.barcode;
      const bale = await storage.getBaleByBarcode(barcode, companyId);
      if (!bale) {
        return res.status(404).json({ message: "Bale not found" });
      }
      res.json(bale);
    } catch (error) {
      console.error("Error fetching bale by barcode:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/bales", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { insertBaleSchema: insertBaleSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertBaleSchema2.parse({ ...req.body, companyId });
      const existing = await storage.getBaleByBarcode(data.barcode, companyId);
      if (existing) {
        return res.status(409).json({ message: "Barcode already exists" });
      }
      const bale = await storage.createBale(data);
      res.json(bale);
    } catch (error) {
      console.error("Error creating bale:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/bales/:id", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      const existing = await storage.getBaleById(id);
      if (!existing) {
        return res.status(404).json({ message: "Bale not found" });
      }
      if (existing.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { companyId: _, ...updateData } = req.body;
      const bale = await storage.updateBale(id, updateData);
      res.json(bale);
    } catch (error) {
      console.error("Error updating bale:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/bales/:id", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      const existing = await storage.getBaleById(id);
      if (!existing) {
        return res.status(404).json({ message: "Bale not found" });
      }
      if (existing.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteBale(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bale:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/bales/import", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { insertBaleSchema: insertBaleSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const balesData = req.body.bales || [];
      if (!Array.isArray(balesData)) {
        return res.status(400).json({ message: "Invalid data format" });
      }
      const validatedBales = balesData.map(
        (b) => insertBaleSchema2.parse({ ...b, companyId })
      );
      const created = await storage.bulkCreateBales(validatedBales);
      res.json({ success: true, count: created.length, bales: created });
    } catch (error) {
      console.error("Error importing bales:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/bale-products", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const products = await storage.getAllBaleProducts(companyId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching bale products:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/bale-products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const product = await storage.getBaleProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching bale product:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/bale-products", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { insertBaleProductSchema: insertBaleProductSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertBaleProductSchema2.parse({ ...req.body, companyId });
      const existing = await storage.getBaleProductByCode(data.code, companyId);
      if (existing) {
        return res.status(409).json({ message: "Product code already exists" });
      }
      const product = await storage.createBaleProduct(data);
      res.json(product);
    } catch (error) {
      console.error("Error creating bale product:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/bale-products/:id", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const existing = await storage.getBaleProductById(id);
      if (!existing) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (existing.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { insertBaleProductSchema: insertBaleProductSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertBaleProductSchema2.partial().parse(req.body);
      const product = await storage.updateBaleProduct(id, data);
      res.json(product);
    } catch (error) {
      console.error("Error updating bale product:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/bale-products/:id", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const existing = await storage.getBaleProductById(id);
      if (!existing) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (existing.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteBaleProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bale product:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/bale-products/import-excel", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);
      const { insertBaleProductSchema: insertBaleProductSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const productsData = rows.map((row) => {
        return insertBaleProductSchema2.parse({
          companyId,
          // Always use authenticated company
          code: row.code || row.Code || row.product_code || "",
          name: row.name || row.Name || row.product_name || "",
          description: row.description || row.Description || "",
          active: row.active === void 0 ? true : Boolean(row.active)
        });
      });
      const codes = productsData.map((p) => p.code);
      for (const code of codes) {
        const existing = await storage.getBaleProductByCode(code, companyId);
        if (existing) {
          return res.status(409).json({
            message: `Product code "${code}" already exists in your company`
          });
        }
      }
      const created = await storage.bulkCreateBaleProducts(productsData);
      res.json({ success: true, count: created.length, products: created });
    } catch (error) {
      console.error("Error importing bale products from Excel:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/company-settings", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const settings = await storage.getCompanySettings(companyId);
      res.json(settings || { companyId });
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/company-settings", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { insertCompanySettingsSchema: insertCompanySettingsSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertCompanySettingsSchema2.parse({ ...req.body, companyId });
      const settings = await storage.upsertCompanySettings(data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/mix-batches", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const batches = await storage.getAllMixBatches(companyId);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching mix batches:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/mix-batches/:id", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mix batch ID" });
      }
      const batch = await storage.getMixBatchById(id, companyId);
      if (!batch) {
        return res.status(404).json({ message: "Mix batch not found" });
      }
      res.json(batch);
    } catch (error) {
      console.error("Error fetching mix batch:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/mix-batches", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      const userId = req.session.userId;
      if (!companyId || !userId) {
        return res.status(400).json({ message: "No company or user session" });
      }
      const { insertMixBatchSchema: insertMixBatchSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { sources, ...batchData } = req.body;
      const data = insertMixBatchSchema2.parse({
        ...batchData,
        companyId,
        createdBy: userId
      });
      const batch = await storage.createMixBatch(data);
      if (sources && Array.isArray(sources) && sources.length > 0) {
        const { insertMixBatchSourceSchema: insertMixBatchSourceSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        for (const source of sources) {
          const sourceData = insertMixBatchSourceSchema2.parse({
            ...source,
            mixBatchId: batch.id
          });
          const container = await storage.getContainerById(sourceData.containerId);
          if (!container || container.companyId !== companyId) {
            throw new Error(`Container ${sourceData.containerId} not found or doesn't belong to this company`);
          }
          await storage.addMixBatchSource(sourceData);
        }
      }
      res.json(batch);
    } catch (error) {
      console.error("Error creating mix batch:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/mix-batches/:id/sources", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mix batch ID" });
      }
      const sources = await storage.getMixBatchSources(id, companyId);
      res.json(sources);
    } catch (error) {
      console.error("Error fetching mix batch sources:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/mix-batches/:id/sources", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const mixBatchId = parseInt(req.params.id);
      if (isNaN(mixBatchId)) {
        return res.status(400).json({ message: "Invalid mix batch ID" });
      }
      const batch = await storage.getMixBatchById(mixBatchId, companyId);
      if (!batch) {
        return res.status(404).json({ message: "Mix batch not found" });
      }
      const { insertMixBatchSourceSchema: insertMixBatchSourceSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertMixBatchSourceSchema2.parse({
        ...req.body,
        mixBatchId
      });
      const source = await storage.addMixBatchSource(data);
      res.json(source);
    } catch (error) {
      console.error("Error adding mix batch source:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/production-bales", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const filters = {};
      if (req.query.mixBatchId) filters.mixBatchId = parseInt(req.query.mixBatchId);
      if (req.query.status) filters.status = req.query.status;
      if (req.query.category) filters.category = req.query.category;
      if (req.query.grade) filters.grade = req.query.grade;
      const bales2 = await storage.getAllProductionBales(companyId, filters);
      res.json(bales2);
    } catch (error) {
      console.error("Error fetching production bales:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/production-bales/barcode/:barcode", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const bale = await storage.getProductionBaleByBarcode(req.params.barcode, companyId);
      if (!bale) {
        return res.status(404).json({ message: "Bale not found" });
      }
      res.json(bale);
    } catch (error) {
      console.error("Error fetching bale by barcode:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/production-bales/create-batch", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { mixBatchId, productId, locationId, quantity, weightPerBale } = req.body;
      if (!mixBatchId || !productId || !locationId || !quantity || !weightPerBale) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const numBales = parseInt(quantity);
      const weight = parseFloat(weightPerBale);
      if (isNaN(numBales) || numBales < 1 || numBales > 1e3) {
        return res.status(400).json({ message: "Quantity must be between 1 and 1000" });
      }
      if (isNaN(weight) || weight <= 0 || weight > 500) {
        return res.status(400).json({ message: "Weight must be between 1 and 500 kg" });
      }
      const batch = await storage.getMixBatchById(mixBatchId, companyId);
      if (!batch) {
        return res.status(404).json({ message: "Mix batch not found" });
      }
      const { baleProducts: baleProducts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const [product] = await db.select().from(baleProducts2).where(eq2(baleProducts2.id, productId));
      if (!product || product.companyId !== companyId) {
        return res.status(404).json({ message: "Product not found" });
      }
      const totalWeight = weight * numBales;
      const costPerKg = parseFloat(batch.costPerKg);
      const totalCostPerBale = (weight * costPerKg).toFixed(2);
      const bales2 = await db.transaction(async (tx) => {
        const createdBales = [];
        const { baleSequences: baleSequences2, productionBales: productionBales2, mixBatches: mixBatches2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        for (let i = 0; i < numBales; i++) {
          const [sequence] = await tx.select().from(baleSequences2).where(eq2(baleSequences2.companyId, companyId)).for("update");
          let barcode;
          if (!sequence) {
            const [newSeq] = await tx.insert(baleSequences2).values({ companyId, nextNumber: 2 }).returning();
            barcode = `HD${String(newSeq.nextNumber - 1).padStart(5, "0")}`;
          } else {
            barcode = `HD${String(sequence.nextNumber).padStart(5, "0")}`;
            await tx.update(baleSequences2).set({ nextNumber: sequence.nextNumber + 1 }).where(eq2(baleSequences2.id, sequence.id));
          }
          const baleData = {
            companyId,
            mixBatchId,
            productId,
            locationId,
            baleCode: product.code,
            barcodeValue: barcode,
            quantity: 1,
            weightKg: weight.toString(),
            costPerKg: batch.costPerKg,
            totalCost: totalCostPerBale,
            status: "IN_STOCK",
            pressedAt: /* @__PURE__ */ new Date()
          };
          const [bale] = await tx.insert(productionBales2).values(baleData).returning();
          createdBales.push(bale);
        }
        await tx.update(mixBatches2).set({
          totalActualWeight: sql3`COALESCE(${mixBatches2.totalActualWeight}, 0) + ${totalWeight}`,
          updatedAt: sql3`now()`
        }).where(eq2(mixBatches2.id, mixBatchId));
        return createdBales;
      });
      res.json({ bales: bales2, success: true, count: bales2.length });
    } catch (error) {
      console.error("Error creating production bales:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/production-bales", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { insertProductionBaleSchema: insertProductionBaleSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertProductionBaleSchema2.parse({ ...req.body, companyId });
      const bale = await storage.createProductionBale(data);
      res.json(bale);
    } catch (error) {
      console.error("Error creating production bale:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/production-bales/bulk", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { insertProductionBaleSchema: insertProductionBaleSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const balesData = req.body.bales || [];
      if (!Array.isArray(balesData)) {
        return res.status(400).json({ message: "Invalid data format" });
      }
      const validatedBales = balesData.map(
        (b) => insertProductionBaleSchema2.parse({ ...b, companyId })
      );
      const created = await storage.bulkCreateProductionBales(validatedBales);
      res.json({ success: true, count: created.length, bales: created });
    } catch (error) {
      console.error("Error bulk creating bales:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/production-bales/next-barcode", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const barcode = await storage.getNextBaleBarcode(companyId);
      res.json({ barcode });
    } catch (error) {
      console.error("Error generating barcode:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/production-bales/scan", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const { barcodeValue, weightKg, category, grade, warehouseLocation } = req.body;
      if (!barcodeValue || !weightKg || !category || !grade) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const bale = await storage.updateProductionBaleFromScan(
        barcodeValue,
        companyId,
        { weightKg, category, grade, warehouseLocation }
      );
      res.json(bale);
    } catch (error) {
      console.error("Error updating bale from scan:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/generate-barcode", requireAuth, async (req, res) => {
    try {
      const { text: text2 } = req.body;
      if (!text2) {
        return res.status(400).json({ message: "Barcode text is required" });
      }
      const bwipjs = await import("bwip-js");
      const png = await bwipjs.toBuffer({
        bcid: "code128",
        text: text2,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: "center"
      });
      const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
      res.json({ dataUrl });
    } catch (error) {
      console.error("Error generating barcode:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.delete("/api/production-bales/:id", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const id = parseInt(req.params.id);
      await storage.deleteProductionBale(id, companyId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting production bale:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/production-bales/import-excel", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);
      const { insertProductionBaleSchema: insertProductionBaleSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const mixBatchId = req.body.mixBatchId ? parseInt(req.body.mixBatchId) : void 0;
      const balesData = rows.map((row) => {
        return insertProductionBaleSchema2.parse({
          companyId,
          mixBatchId,
          baleCode: row.bale_code || row.baleCode || "",
          barcodeValue: row.barcode_value || row.barcodeValue || row.barcode || row.bale_code || row.baleCode || "",
          category: row.category || "",
          grade: row.grade || "",
          weightKg: row.weight_kg?.toString() || row.weightKg?.toString() || row.weight?.toString() || "0",
          costPerKg: row.cost_per_kg?.toString() || row.costPerKg?.toString() || "0",
          totalCost: row.total_cost?.toString() || row.totalCost?.toString() || "0",
          warehouseLocation: row.warehouse_location || row.warehouseLocation || "",
          status: row.status || "LABEL_PRINTED"
        });
      });
      const created = await storage.bulkCreateProductionBales(balesData);
      res.json({ success: true, count: created.length, bales: created });
    } catch (error) {
      console.error("Error importing Excel:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/customers/:id/balance", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const customerId = parseInt(req.params.id);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      const balance = await storage.getCustomerBalance(customerId, companyId);
      res.json({ customerId, balance });
    } catch (error) {
      console.error("Error fetching customer balance:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/customers/:id/statement", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const customerId = parseInt(req.params.id);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      const statement = await storage.getCustomerStatement(customerId, companyId, startDate, endDate);
      res.json(statement);
    } catch (error) {
      console.error("Error fetching customer statement:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stock-transfers", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const isPOS = req.session.currentRole?.startsWith("POS");
      const voucherIdParam = req.query.voucherId ? parseInt(req.query.voucherId) : null;
      let query = db.select({
        id: stockTransferVouchers.id,
        voucherId: stockTransferVouchers.voucherId,
        sourceLocationId: stockTransferVouchers.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId,
        notes: stockTransferVouchers.notes,
        createdAt: stockTransferVouchers.createdAt
      }).from(stockTransferVouchers).innerJoin(vouchers, eq2(stockTransferVouchers.voucherId, vouchers.id)).where(
        voucherIdParam ? and2(eq2(vouchers.companyId, companyId), eq2(stockTransferVouchers.voucherId, voucherIdParam)) : eq2(vouchers.companyId, companyId)
      ).orderBy(sql3`${stockTransferVouchers.createdAt} DESC`);
      const transfers = await query;
      if (voucherIdParam && transfers.length > 0) {
        const transfer = transfers[0];
        const items = await db.select({
          id: stockTransferItems.id,
          stockItemId: stockTransferItems.stockItemId,
          quantity: stockTransferItems.quantity,
          rate: stockTransferItems.rate,
          totalAmount: stockTransferItems.totalAmount,
          stockItemName: stockItems.name,
          stockItemCode: stockItems.code
        }).from(stockTransferItems).innerJoin(stockItems, eq2(stockTransferItems.stockItemId, stockItems.id)).where(eq2(stockTransferItems.transferId, transfer.id));
        if (isPOS) {
          const sanitizedItems = items.map(({ rate, totalAmount, ...rest }) => rest);
          const { totalAmount: _, ...sanitizedTransfer } = transfer;
          return res.json({ ...sanitizedTransfer, items: sanitizedItems });
        }
        return res.json({ ...transfer, items });
      }
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stock-transfers/:id", requireAuth, async (req, res) => {
    try {
      const transferId = parseInt(req.params.id);
      if (isNaN(transferId)) return res.status(400).json({ message: "Invalid transfer ID" });
      const [transfer] = await db.select().from(stockTransferVouchers).where(eq2(stockTransferVouchers.id, transferId)).limit(1);
      if (!transfer) return res.status(404).json({ message: "Transfer not found" });
      const items = await db.select({
        id: stockTransferItems.id,
        stockItemId: stockTransferItems.stockItemId,
        quantity: stockTransferItems.quantity,
        rate: stockTransferItems.rate,
        totalAmount: stockTransferItems.totalAmount,
        stockItemName: stockItems.name,
        stockItemCode: stockItems.code
      }).from(stockTransferItems).innerJoin(stockItems, eq2(stockTransferItems.stockItemId, stockItems.id)).where(eq2(stockTransferItems.transferId, transferId));
      res.json({ ...transfer, items });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/stock-transfers", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const { sourceLocationId, destinationLocationId, items, notes } = req.body;
      if (!sourceLocationId || !destinationLocationId || !items || items.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const voucherNumber = `ST-${Date.now()}`;
      const [voucher] = await db.insert(vouchers).values({
        companyId,
        voucherType: "Stock Transfer",
        voucherNumber,
        voucherDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
        description: notes || null,
        totalAmount: "0"
      }).returning();
      let totalAmount = 0;
      const transferItems = [];
      for (const item of items) {
        const quantity = parseFloat(item.quantity);
        const [sourceInvForRate] = await db.select({ averageRate: inventory.averageRate }).from(inventory).where(
          and2(
            eq2(inventory.locationId, sourceLocationId),
            eq2(inventory.stockItemId, item.stockItemId)
          )
        ).limit(1);
        const rate = parseFloat(sourceInvForRate?.averageRate || "0");
        const totalItemAmount = quantity * rate;
        totalAmount += totalItemAmount;
        const [insertedItem] = await db.insert(stockTransferItems).values({
          transferId: 0,
          // Will set after creating transfer record
          stockItemId: item.stockItemId,
          sourceLocationId,
          quantity: quantity.toString(),
          rate: rate.toFixed(2),
          totalAmount: totalItemAmount.toFixed(2)
        }).returning();
        transferItems.push(insertedItem);
      }
      const [transfer] = await db.insert(stockTransferVouchers).values({
        voucherId: voucher.id,
        sourceLocationId,
        destinationLocationId,
        notes: notes || null
      }).returning();
      for (const item of transferItems) {
        await db.update(stockTransferItems).set({ transferId: transfer.id }).where(eq2(stockTransferItems.id, item.id));
      }
      await db.update(vouchers).set({ totalAmount: totalAmount.toFixed(2) }).where(eq2(vouchers.id, voucher.id));
      for (const item of items) {
        const quantity = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const [sourceInv] = await db.select().from(inventory).where(
          and2(
            eq2(inventory.locationId, sourceLocationId),
            eq2(inventory.stockItemId, item.stockItemId)
          )
        ).limit(1);
        if (sourceInv) {
          const newQty = parseFloat(sourceInv.quantity) - quantity;
          if (newQty < 0) {
            throw new Error(`Insufficient stock for item ${item.stockItemId}`);
          }
          await db.update(inventory).set({
            quantity: newQty.toString(),
            lastUpdated: /* @__PURE__ */ new Date()
          }).where(eq2(inventory.id, sourceInv.id));
        }
        const [destInv] = await db.select().from(inventory).where(
          and2(
            eq2(inventory.locationId, destinationLocationId),
            eq2(inventory.stockItemId, item.stockItemId)
          )
        ).limit(1);
        if (destInv) {
          const currentQty = parseFloat(destInv.quantity);
          const newQty = currentQty + quantity;
          const newAvgRate = (parseFloat(destInv.averageRate || "0") * currentQty + rate * quantity) / newQty;
          await db.update(inventory).set({
            quantity: newQty.toString(),
            averageRate: newAvgRate.toFixed(2),
            totalValue: (newQty * newAvgRate).toFixed(2),
            lastUpdated: /* @__PURE__ */ new Date()
          }).where(eq2(inventory.id, destInv.id));
        } else {
          await db.insert(inventory).values({
            companyId,
            locationId: destinationLocationId,
            stockItemId: item.stockItemId,
            quantity: quantity.toString(),
            averageRate: rate.toFixed(2),
            totalValue: (quantity * rate).toFixed(2),
            lastUpdated: /* @__PURE__ */ new Date()
          });
        }
      }
      res.json({ success: true, transferId: transfer.id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/inventory-by-location/:locationId", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const isPOS = req.session.currentRole?.startsWith("POS");
      const locationId = parseInt(req.params.locationId);
      if (isNaN(locationId)) return res.status(400).json({ message: "Invalid location ID" });
      const items = await db.select({
        id: inventory.id,
        stockItemId: inventory.stockItemId,
        quantity: inventory.quantity,
        averageRate: inventory.averageRate,
        stockItemName: stockItems.name,
        stockItemCode: stockItems.code
      }).from(inventory).innerJoin(stockItems, eq2(inventory.stockItemId, stockItems.id)).where(
        and2(
          eq2(inventory.locationId, locationId),
          sql3`CAST(${inventory.quantity} AS NUMERIC) > 0`
        )
      );
      const sanitizedItems = isPOS ? items.map(({ averageRate, ...rest }) => rest) : items;
      res.json(sanitizedItems);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/bale-transfers", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const transfers = await storage.getAllBaleTransfers(companyId);
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/bale-transfers/:id", requireAuth, async (req, res) => {
    try {
      const transfer = await storage.getBaleTransferById(parseInt(req.params.id));
      if (!transfer) return res.status(404).json({ message: "Transfer not found" });
      const items = await storage.getBaleTransferItems(transfer.id);
      res.json({ ...transfer, items });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/bale-transfers", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const { sourceLocationId, destinationLocationId, transferDate, notes, items } = req.body;
      const transfer = await storage.createBaleTransfer({
        companyId,
        sourceLocationId,
        destinationLocationId,
        transferDate,
        notes,
        createdBy: req.session.userId,
        status: "PENDING"
      });
      for (const item of items) {
        await storage.createBaleTransferItem({
          transferId: transfer.id,
          productionBaleId: item.productionBaleId,
          quantity: item.quantity,
          weightKg: item.weightKg.toString(),
          costPerKg: item.costPerKg.toString(),
          totalCost: item.totalCost.toString()
        });
      }
      res.json({ success: true, transferId: transfer.id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch("/api/bale-transfers/:id", requireAuth, async (req, res) => {
    try {
      const { items, status, notes } = req.body;
      const transferId = parseInt(req.params.id);
      await storage.updateBaleTransfer(transferId, {
        status,
        notes,
        updatedBy: req.session.userId
      });
      if (items) {
        for (const item of items) {
          if (item.id) {
            await storage.updateBaleTransferItem(item.id, {
              weightKg: item.weightKg.toString(),
              costPerKg: item.costPerKg.toString(),
              totalCost: item.totalCost.toString()
            });
          } else {
            await storage.createBaleTransferItem({
              transferId,
              productionBaleId: item.productionBaleId,
              quantity: item.quantity,
              weightKg: item.weightKg.toString(),
              costPerKg: item.costPerKg.toString(),
              totalCost: item.totalCost.toString()
            });
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/bales-by-location/:locationId", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const bales2 = await storage.getProductionBalesByLocation(companyId, parseInt(req.params.locationId));
      res.json(bales2.map((b) => ({
        id: b.id,
        baleCode: b.baleCode,
        category: b.category,
        grade: b.grade,
        weightKg: b.weightKg,
        costPerKg: b.costPerKg,
        totalCost: b.totalCost
      })));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/orphaned-records", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const orphanedVouchers = await db.select({
        id: vouchers.id,
        voucherNumber: vouchers.voucherNumber,
        voucherType: vouchers.voucherType,
        voucherDate: vouchers.voucherDate,
        locationId: vouchers.locationId,
        locationName: vouchers.locationName,
        totalAmount: vouchers.totalAmount,
        description: vouchers.description,
        createdAt: vouchers.createdAt
      }).from(vouchers).leftJoin(locations, eq2(vouchers.locationId, locations.id)).where(
        and2(
          eq2(vouchers.companyId, companyId),
          sql3`${vouchers.locationId} IS NOT NULL`,
          sql3`${locations.id} IS NULL`
        )
      ).orderBy(sql3`${vouchers.createdAt} DESC`);
      res.json(orphanedVouchers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/orphaned-records/reassign", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const { voucherIds, newLocationId } = req.body;
      if (!voucherIds || !Array.isArray(voucherIds) || voucherIds.length === 0) {
        return res.status(400).json({ message: "No vouchers selected" });
      }
      if (!newLocationId) {
        return res.status(400).json({ message: "New location is required" });
      }
      const newLocation = await storage.getLocationById(newLocationId);
      if (!newLocation || newLocation.companyId !== companyId) {
        return res.status(400).json({ message: "Invalid location" });
      }
      const vouchersToUpdate = await db.select().from(vouchers).where(
        and2(
          eq2(vouchers.companyId, companyId),
          inArray2(vouchers.id, voucherIds)
        )
      );
      if (vouchersToUpdate.length !== voucherIds.length) {
        return res.status(400).json({ message: "Some vouchers not found or belong to different company" });
      }
      await db.update(vouchers).set({
        locationId: newLocationId,
        locationName: newLocation.name
      }).where(inArray2(vouchers.id, voucherIds));
      res.json({ success: true, updated: voucherIds.length, newLocationName: newLocation.name });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stock-items/:id/monthly-summary", requireAuth, async (req, res) => {
    try {
      const stockItemId = parseInt(req.params.id);
      const year = parseInt(req.query.year) || (/* @__PURE__ */ new Date()).getFullYear();
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const stockItem = await storage.getStockItemById(stockItemId);
      if (!stockItem) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      const monthlyData = [];
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      const poInwards = await db.select({
        month: sql3`EXTRACT(MONTH FROM ${purchaseOrders.createdAt})`,
        quantity: poLineItems.quantity,
        rate: poLineItems.rate,
        lineTotal: poLineItems.lineTotal
      }).from(poLineItems).innerJoin(purchaseOrders, eq2(poLineItems.poId, purchaseOrders.id)).where(and2(
        eq2(poLineItems.stockItemId, stockItemId),
        eq2(purchaseOrders.companyId, companyId),
        sql3`EXTRACT(YEAR FROM ${purchaseOrders.createdAt}) = ${year}`
      ));
      const stockTransfers = await db.select({
        month: sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate})`,
        quantity: stockTransferItems.quantity,
        rate: stockTransferItems.rate,
        totalAmount: stockTransferItems.totalAmount,
        sourceLocationId: stockTransferItems.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId,
        optional: vouchers.optional
      }).from(stockTransferItems).innerJoin(stockTransferVouchers, eq2(stockTransferItems.transferId, stockTransferVouchers.id)).innerJoin(vouchers, eq2(stockTransferVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockTransferItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`
      ));
      const stockAdjustments = await db.select({
        month: sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate})`,
        quantity: stockAdjustmentItems.quantity,
        rate: stockAdjustmentItems.rate,
        totalAmount: stockAdjustmentItems.totalAmount,
        adjustmentType: stockAdjustmentVouchers.adjustmentType,
        optional: vouchers.optional
      }).from(stockAdjustmentItems).innerJoin(stockAdjustmentVouchers, eq2(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id)).innerJoin(vouchers, eq2(stockAdjustmentVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockAdjustmentItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`
      ));
      const salesData = await db.select({
        month: sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate})`,
        quantity: salesItems.quantity,
        costPrice: salesItems.costPrice,
        totalCost: salesItems.totalCost,
        optional: vouchers.optional
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).where(and2(
        eq2(salesItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`
      ));
      const monthBuckets = {};
      for (let m = 1; m <= 12; m++) {
        monthBuckets[m] = { inQty: 0, inVal: 0, outQty: 0, outVal: 0 };
      }
      for (const row of poInwards) {
        const month = Number(row.month);
        monthBuckets[month].inQty += parseFloat(row.quantity);
        monthBuckets[month].inVal += parseFloat(row.lineTotal);
      }
      for (const row of stockTransfers) {
        const month = Number(row.month);
        const qty = parseFloat(row.quantity);
        const val = parseFloat(row.totalAmount);
        monthBuckets[month].outQty += qty;
        monthBuckets[month].outVal += val;
        monthBuckets[month].inQty += qty;
        monthBuckets[month].inVal += val;
      }
      for (const row of stockAdjustments) {
        const month = Number(row.month);
        const qty = Math.abs(parseFloat(row.quantity));
        const val = parseFloat(row.totalAmount);
        if (row.adjustmentType === "Production" || parseFloat(row.quantity) > 0) {
          monthBuckets[month].inQty += qty;
          monthBuckets[month].inVal += val;
        } else {
          monthBuckets[month].outQty += qty;
          monthBuckets[month].outVal += val;
        }
      }
      for (const row of salesData) {
        const month = Number(row.month);
        monthBuckets[month].outQty += parseFloat(row.quantity);
        monthBuckets[month].outVal += parseFloat(row.totalCost);
      }
      let runningQty = 0;
      let runningVal = 0;
      for (let m = 1; m <= 12; m++) {
        const bucket = monthBuckets[m];
        runningQty += bucket.inQty - bucket.outQty;
        runningVal += bucket.inVal - bucket.outVal;
        monthlyData.push({
          month: m,
          monthName: monthNames[m - 1],
          inwardQty: bucket.inQty,
          inwardValue: bucket.inVal,
          outwardQty: bucket.outQty,
          outwardValue: bucket.outVal,
          closingQty: runningQty,
          closingValue: runningVal
        });
      }
      const grandTotal = {
        inwardQty: Object.values(monthBuckets).reduce((s, b) => s + b.inQty, 0),
        inwardValue: Object.values(monthBuckets).reduce((s, b) => s + b.inVal, 0),
        outwardQty: Object.values(monthBuckets).reduce((s, b) => s + b.outQty, 0),
        outwardValue: Object.values(monthBuckets).reduce((s, b) => s + b.outVal, 0),
        closingQty: runningQty,
        closingValue: runningVal
      };
      res.json({
        stockItem,
        year,
        monthlyData,
        grandTotal
      });
    } catch (error) {
      console.error("Stock item monthly summary error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stock-items/:id/vouchers/:year/:month", requireAuth, async (req, res) => {
    try {
      const stockItemId = parseInt(req.params.id);
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const stockItem = await storage.getStockItemById(stockItemId);
      if (!stockItem) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      const monthStart = new Date(year, month - 1, 1);
      const monthStartStr = monthStart.toISOString().split("T")[0];
      let openingQty = 0;
      let openingValue = 0;
      const priorPOItems = await db.select({
        quantity: poLineItems.quantity,
        lineTotal: poLineItems.lineTotal
      }).from(poLineItems).innerJoin(purchaseOrders, eq2(poLineItems.poId, purchaseOrders.id)).innerJoin(containers, eq2(purchaseOrders.containerId, containers.id)).where(and2(
        eq2(poLineItems.stockItemId, stockItemId),
        eq2(purchaseOrders.companyId, companyId),
        sql3`${purchaseOrders.createdAt} < ${monthStartStr}::date`
      ));
      for (const item of priorPOItems) {
        openingQty += parseFloat(item.quantity);
        openingValue += parseFloat(item.lineTotal);
      }
      const priorTransfers = await db.select({
        quantity: stockTransferItems.quantity,
        totalAmount: stockTransferItems.totalAmount,
        sourceLocationId: stockTransferItems.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId
      }).from(stockTransferItems).innerJoin(stockTransferVouchers, eq2(stockTransferItems.transferId, stockTransferVouchers.id)).innerJoin(vouchers, eq2(stockTransferVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockTransferItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`${vouchers.voucherDate}::date < ${monthStartStr}::date`
      ));
      for (const item of priorTransfers) {
        const qty = parseFloat(item.quantity);
        const val = parseFloat(item.totalAmount);
        openingQty -= qty;
        openingValue -= val;
        openingQty += qty;
        openingValue += val;
      }
      const priorAdjustments = await db.select({
        quantity: stockAdjustmentItems.quantity,
        totalAmount: stockAdjustmentItems.totalAmount
      }).from(stockAdjustmentItems).innerJoin(stockAdjustmentVouchers, eq2(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id)).innerJoin(vouchers, eq2(stockAdjustmentVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockAdjustmentItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`${vouchers.voucherDate}::date < ${monthStartStr}::date`
      ));
      for (const item of priorAdjustments) {
        openingQty += parseFloat(item.quantity);
        openingValue += parseFloat(item.totalAmount);
      }
      const priorSales = await db.select({
        quantity: salesItems.quantity,
        totalCost: salesItems.totalCost
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).where(and2(
        eq2(salesItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`${vouchers.voucherDate}::date < ${monthStartStr}::date`
      ));
      for (const item of priorSales) {
        openingQty -= parseFloat(item.quantity);
        openingValue -= parseFloat(item.totalCost);
      }
      const openingRate = openingQty > 0 ? openingValue / openingQty : 0;
      const transactions = [];
      const poItems = await db.select({
        date: purchaseOrders.createdAt,
        poId: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        containerNumber: containers.containerNumber,
        quantity: poLineItems.quantity,
        rate: poLineItems.rate,
        lineTotal: poLineItems.lineTotal
      }).from(poLineItems).innerJoin(purchaseOrders, eq2(poLineItems.poId, purchaseOrders.id)).innerJoin(containers, eq2(purchaseOrders.containerId, containers.id)).where(and2(
        eq2(poLineItems.stockItemId, stockItemId),
        eq2(purchaseOrders.companyId, companyId),
        sql3`EXTRACT(YEAR FROM ${purchaseOrders.createdAt}) = ${year}`,
        sql3`EXTRACT(MONTH FROM ${purchaseOrders.createdAt}) = ${month}`
      )).orderBy(purchaseOrders.createdAt);
      for (const item of poItems) {
        transactions.push({
          date: item.date.toISOString().split("T")[0],
          particulars: item.containerNumber,
          vchType: "PURCHASE IMPORT",
          voucherId: 0,
          poId: item.poId,
          inwardQty: parseFloat(item.quantity),
          inwardRate: parseFloat(item.rate),
          inwardValue: parseFloat(item.lineTotal),
          outwardQty: 0,
          outwardRate: 0,
          outwardValue: 0
        });
      }
      const transferItems = await db.select({
        voucherDate: vouchers.voucherDate,
        voucherNumber: vouchers.voucherNumber,
        voucherId: vouchers.id,
        quantity: stockTransferItems.quantity,
        rate: stockTransferItems.rate,
        totalAmount: stockTransferItems.totalAmount,
        sourceLocationId: stockTransferItems.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId,
        optional: vouchers.optional
      }).from(stockTransferItems).innerJoin(stockTransferVouchers, eq2(stockTransferItems.transferId, stockTransferVouchers.id)).innerJoin(vouchers, eq2(stockTransferVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockTransferItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`,
        sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate}) = ${month}`
      )).orderBy(vouchers.voucherDate);
      const locationIds = /* @__PURE__ */ new Set();
      for (const item of transferItems) {
        if (item.sourceLocationId) locationIds.add(item.sourceLocationId);
        if (item.destinationLocationId) locationIds.add(item.destinationLocationId);
      }
      const locationMap = {};
      for (const locId of Array.from(locationIds)) {
        const loc = await storage.getLocationById(locId);
        if (loc) locationMap[locId] = loc.name;
      }
      for (const item of transferItems) {
        const qty = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const val = parseFloat(item.totalAmount);
        const sourceName = item.sourceLocationId ? locationMap[item.sourceLocationId] || "Unknown" : "Unknown";
        const destName = locationMap[item.destinationLocationId] || "Unknown";
        transactions.push({
          date: item.voucherDate,
          particulars: `To ${destName}`,
          vchType: `Stock Transfer - ${sourceName}`,
          voucherId: item.voucherId,
          inwardQty: 0,
          inwardRate: 0,
          inwardValue: 0,
          outwardQty: qty,
          outwardRate: rate,
          outwardValue: val
        });
        transactions.push({
          date: item.voucherDate,
          particulars: `From ${sourceName}`,
          vchType: `Stock Transfer - ${destName}`,
          voucherId: item.voucherId,
          inwardQty: qty,
          inwardRate: rate,
          inwardValue: val,
          outwardQty: 0,
          outwardRate: 0,
          outwardValue: 0
        });
      }
      const adjustmentItems = await db.select({
        voucherDate: vouchers.voucherDate,
        voucherNumber: vouchers.voucherNumber,
        voucherId: vouchers.id,
        quantity: stockAdjustmentItems.quantity,
        rate: stockAdjustmentItems.rate,
        totalAmount: stockAdjustmentItems.totalAmount,
        adjustmentType: stockAdjustmentVouchers.adjustmentType,
        locationId: stockAdjustmentVouchers.locationId,
        optional: vouchers.optional
      }).from(stockAdjustmentItems).innerJoin(stockAdjustmentVouchers, eq2(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id)).innerJoin(vouchers, eq2(stockAdjustmentVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockAdjustmentItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`,
        sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate}) = ${month}`
      )).orderBy(vouchers.voucherDate);
      for (const item of adjustmentItems) {
        const rawQty = parseFloat(item.quantity);
        const rawValue = parseFloat(item.totalAmount);
        const qty = Math.abs(rawQty);
        const rate = parseFloat(item.rate);
        const value = Math.abs(rawValue);
        const locName = locationMap[item.locationId] || (await storage.getLocationById(item.locationId))?.name || "Unknown";
        const isProduction = rawQty > 0;
        transactions.push({
          date: item.voucherDate,
          particulars: locName,
          vchType: isProduction ? "Production" : "Consumption",
          voucherId: item.voucherId,
          inwardQty: isProduction ? qty : 0,
          inwardRate: isProduction ? rate : 0,
          inwardValue: isProduction ? rawValue : 0,
          // Use raw (positive) value for production
          outwardQty: isProduction ? 0 : qty,
          outwardRate: isProduction ? 0 : rate,
          outwardValue: isProduction ? 0 : value
          // Use absolute value for consumption
        });
      }
      const salesData = await db.select({
        voucherDate: vouchers.voucherDate,
        voucherNumber: vouchers.voucherNumber,
        voucherId: vouchers.id,
        locationId: vouchers.locationId,
        locationName: vouchers.locationName,
        quantity: salesItems.quantity,
        sellingPrice: salesItems.sellingPrice,
        totalSales: salesItems.totalSales,
        costPrice: salesItems.costPrice,
        totalCost: salesItems.totalCost,
        optional: vouchers.optional
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).where(and2(
        eq2(salesItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`,
        sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate}) = ${month}`
      )).orderBy(vouchers.voucherDate);
      for (const item of salesData) {
        const locName = item.locationName || (item.locationId ? (await storage.getLocationById(item.locationId))?.name : null) || "Cash";
        const qty = parseFloat(item.quantity);
        const sellingRate = parseFloat(item.sellingPrice);
        const totalSalesValue = parseFloat(item.totalSales);
        transactions.push({
          date: item.voucherDate,
          particulars: locName,
          vchType: `POS - ${locName}`,
          voucherId: item.voucherId,
          inwardQty: 0,
          inwardRate: 0,
          inwardValue: 0,
          outwardQty: qty,
          outwardRate: 0,
          // Will be set to weighted avg cost in running balance loop
          outwardValue: 0,
          // Will be set to weighted avg cost in running balance loop
          isPOS: true,
          posSellingRate: sellingRate,
          posSellingValue: totalSalesValue
        });
      }
      transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let runningQty = openingQty;
      let runningValue = openingValue;
      const transactionsWithBalance = [];
      if (openingQty !== 0 || openingValue !== 0) {
        transactionsWithBalance.push({
          date: monthStartStr,
          particulars: "Opening Balance",
          vchType: "",
          voucherId: 0,
          inwardQty: 0,
          // Tally shows nothing in Inwards for opening
          inwardRate: 0,
          inwardValue: 0,
          outwardQty: 0,
          outwardRate: 0,
          outwardValue: 0,
          closingQty: openingQty,
          // Only Closing columns show values
          closingRate: openingRate,
          closingValue: openingValue,
          isOpeningBalance: true
        });
      }
      for (const t of transactions) {
        const currentAvgRate = runningQty > 0 ? runningValue / runningQty : 0;
        runningQty += t.inwardQty - t.outwardQty;
        const actualOutwardCost = t.outwardQty * currentAvgRate;
        runningValue += t.inwardValue - actualOutwardCost;
        const avgClosingRate = runningQty > 0 ? runningValue / runningQty : 0;
        const displayOutwardRate = t.outwardQty !== 0 ? currentAvgRate : 0;
        const displayOutwardValue = t.outwardQty !== 0 ? actualOutwardCost : 0;
        transactionsWithBalance.push({
          ...t,
          outwardRate: displayOutwardRate,
          outwardValue: displayOutwardValue,
          closingQty: runningQty,
          closingRate: avgClosingRate,
          closingValue: runningValue
        });
      }
      const processedTransactions = transactionsWithBalance.filter((t) => !t.isOpeningBalance);
      const inwardQtyTotal = processedTransactions.reduce((s, t) => s + t.inwardQty, 0);
      const inwardValueTotal = processedTransactions.reduce((s, t) => s + t.inwardValue, 0);
      const outwardQtyTotal = processedTransactions.reduce((s, t) => s + t.outwardQty, 0);
      const outwardValueTotal = processedTransactions.reduce((s, t) => s + t.outwardValue, 0);
      const totals = {
        inwardQty: inwardQtyTotal,
        inwardRate: inwardQtyTotal > 0 ? inwardValueTotal / inwardQtyTotal : 0,
        inwardValue: inwardValueTotal,
        outwardQty: outwardQtyTotal,
        outwardRate: outwardQtyTotal > 0 ? outwardValueTotal / outwardQtyTotal : 0,
        outwardValue: outwardValueTotal,
        closingQty: runningQty,
        closingRate: runningQty > 0 ? runningValue / runningQty : 0,
        closingValue: runningValue
      };
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      res.json({
        stockItem,
        year,
        month,
        monthName: monthNames[month - 1],
        openingBalance: {
          qty: openingQty,
          rate: openingRate,
          value: openingValue
        },
        transactions: transactionsWithBalance,
        totals
      });
    } catch (error) {
      console.error("Stock item monthly vouchers error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/locations/:locationId/stock-items/:stockItemId/monthly-summary", requireAuth, async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      const stockItemId = parseInt(req.params.stockItemId);
      const year = parseInt(req.query.year) || (/* @__PURE__ */ new Date()).getFullYear();
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const stockItem = await storage.getStockItemById(stockItemId);
      if (!stockItem) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      const location = await storage.getLocationById(locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      const monthBuckets = {};
      for (let m = 1; m <= 12; m++) {
        monthBuckets[m] = { inQty: 0, inVal: 0, outQty: 0, outVal: 0 };
      }
      const stockTransfers = await db.select({
        month: sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate})`,
        quantity: stockTransferItems.quantity,
        totalAmount: stockTransferItems.totalAmount,
        sourceLocationId: stockTransferItems.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId
      }).from(stockTransferItems).innerJoin(stockTransferVouchers, eq2(stockTransferItems.transferId, stockTransferVouchers.id)).innerJoin(vouchers, eq2(stockTransferVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockTransferItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`,
        or2(
          eq2(stockTransferItems.sourceLocationId, locationId),
          eq2(stockTransferVouchers.destinationLocationId, locationId)
        )
      ));
      for (const row of stockTransfers) {
        const month = Number(row.month);
        const qty = parseFloat(row.quantity);
        const val = parseFloat(row.totalAmount);
        if (row.sourceLocationId === locationId) {
          monthBuckets[month].outQty += qty;
          monthBuckets[month].outVal += val;
        }
        if (row.destinationLocationId === locationId) {
          monthBuckets[month].inQty += qty;
          monthBuckets[month].inVal += val;
        }
      }
      const stockAdjustments = await db.select({
        month: sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate})`,
        quantity: stockAdjustmentItems.quantity,
        totalAmount: stockAdjustmentItems.totalAmount,
        adjustmentType: stockAdjustmentVouchers.adjustmentType
      }).from(stockAdjustmentItems).innerJoin(stockAdjustmentVouchers, eq2(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id)).innerJoin(vouchers, eq2(stockAdjustmentVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockAdjustmentItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        eq2(stockAdjustmentVouchers.locationId, locationId),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`
      ));
      for (const row of stockAdjustments) {
        const month = Number(row.month);
        const qty = Math.abs(parseFloat(row.quantity));
        const val = Math.abs(parseFloat(row.totalAmount));
        if (row.adjustmentType === "Production" || parseFloat(row.quantity) > 0) {
          monthBuckets[month].inQty += qty;
          monthBuckets[month].inVal += val;
        } else {
          monthBuckets[month].outQty += qty;
          monthBuckets[month].outVal += val;
        }
      }
      const salesData = await db.select({
        month: sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate})`,
        quantity: salesItems.quantity,
        totalCost: salesItems.totalCost
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).where(and2(
        eq2(salesItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        eq2(vouchers.locationId, locationId),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`
      ));
      for (const row of salesData) {
        const month = Number(row.month);
        monthBuckets[month].outQty += parseFloat(row.quantity);
        monthBuckets[month].outVal += parseFloat(row.totalCost);
      }
      const containerOffloadData = await db.select({
        month: sql3`EXTRACT(MONTH FROM ${containerOffloads.offloadedAt})`,
        quantity: poLineItems.quantity,
        lineTotal: poLineItems.lineTotal,
        additionalCostPerBale: containerOffloads.additionalCostPerBale
      }).from(containerOffloads).innerJoin(containers, eq2(containerOffloads.containerId, containers.id)).innerJoin(purchaseOrders, eq2(purchaseOrders.containerId, containers.id)).innerJoin(poLineItems, eq2(poLineItems.poId, purchaseOrders.id)).where(and2(
        eq2(poLineItems.stockItemId, stockItemId),
        eq2(containers.companyId, companyId),
        eq2(containerOffloads.locationId, locationId),
        sql3`EXTRACT(YEAR FROM ${containerOffloads.offloadedAt}) = ${year}`
      ));
      for (const row of containerOffloadData) {
        const month = Number(row.month);
        const qty = parseFloat(row.quantity);
        const baseValue = parseFloat(row.lineTotal);
        const additionalCost = parseFloat(row.additionalCostPerBale) * qty;
        const landedValue = baseValue + additionalCost;
        monthBuckets[month].inQty += qty;
        monthBuckets[month].inVal += landedValue;
      }
      const currentInventoryResult = await db.select({
        quantity: inventory.quantity,
        averageRate: inventory.averageRate,
        totalValue: inventory.totalValue
      }).from(inventory).where(and2(
        eq2(inventory.stockItemId, stockItemId),
        eq2(inventory.locationId, locationId)
      )).limit(1);
      const actualQty = currentInventoryResult.length > 0 ? parseFloat(currentInventoryResult[0].quantity) : 0;
      const actualRate = currentInventoryResult.length > 0 ? parseFloat(currentInventoryResult[0].averageRate) : 0;
      const actualValue = currentInventoryResult.length > 0 ? parseFloat(currentInventoryResult[0].totalValue) : 0;
      const totalYearInQty = Object.values(monthBuckets).reduce((s, b) => s + b.inQty, 0);
      const totalYearInVal = Object.values(monthBuckets).reduce((s, b) => s + b.inVal, 0);
      const totalYearOutQty = Object.values(monthBuckets).reduce((s, b) => s + b.outQty, 0);
      const totalYearOutVal = Object.values(monthBuckets).reduce((s, b) => s + b.outVal, 0);
      const totalYearNetQty = totalYearInQty - totalYearOutQty;
      const totalYearNetVal = totalYearInVal - totalYearOutVal;
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      let derivedOpeningQty;
      let derivedOpeningVal;
      if (year === currentYear) {
        derivedOpeningQty = actualQty - totalYearNetQty;
        derivedOpeningVal = actualValue - totalYearNetVal;
      } else {
        derivedOpeningQty = 0;
        derivedOpeningVal = 0;
      }
      let runningQty = derivedOpeningQty;
      let runningVal = derivedOpeningVal;
      const monthlyData = [];
      for (let m = 1; m <= 12; m++) {
        const bucket = monthBuckets[m];
        runningQty += bucket.inQty - bucket.outQty;
        runningVal += bucket.inVal - bucket.outVal;
        monthlyData.push({
          month: m,
          monthName: monthNames[m - 1],
          inwardQty: bucket.inQty,
          inwardValue: bucket.inVal,
          outwardQty: bucket.outQty,
          outwardValue: bucket.outVal,
          closingQty: Math.round(runningQty * 1e3) / 1e3,
          closingValue: runningVal
        });
      }
      if (year === currentYear) {
        monthlyData[11].closingQty = Math.round(actualQty * 1e3) / 1e3;
        monthlyData[11].closingValue = actualValue;
      }
      const grandTotal = {
        inwardQty: totalYearInQty,
        inwardValue: totalYearInVal,
        outwardQty: totalYearOutQty,
        outwardValue: totalYearOutVal,
        closingQty: year === currentYear ? Math.round(actualQty * 1e3) / 1e3 : Math.round(runningQty * 1e3) / 1e3,
        closingValue: year === currentYear ? actualValue : runningVal
      };
      res.json({
        stockItem,
        location,
        year,
        monthlyData,
        grandTotal
      });
    } catch (error) {
      console.error("Location stock item monthly summary error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/locations/:locationId/stock-items/:stockItemId/vouchers/:year/:month", requireAuth, async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      const stockItemId = parseInt(req.params.stockItemId);
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const companyId = req.session.currentCompanyId;
      if (!companyId) {
        return res.status(400).json({ message: "No company selected" });
      }
      const stockItem = await storage.getStockItemById(stockItemId);
      if (!stockItem) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      const location = await storage.getLocationById(locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      const monthStartStr = monthStart.toISOString().split("T")[0];
      const monthEndStr = monthEnd.toISOString().split("T")[0];
      let priorInwardQty = 0;
      let priorInwardValue = 0;
      let priorOutwardQty = 0;
      let priorOutwardValue = 0;
      const priorTransfers = await db.select({
        quantity: stockTransferItems.quantity,
        totalAmount: stockTransferItems.totalAmount,
        sourceLocationId: stockTransferItems.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId
      }).from(stockTransferItems).innerJoin(stockTransferVouchers, eq2(stockTransferItems.transferId, stockTransferVouchers.id)).innerJoin(vouchers, eq2(stockTransferVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockTransferItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`${vouchers.voucherDate}::date < ${monthStartStr}::date`,
        or2(
          eq2(stockTransferItems.sourceLocationId, locationId),
          eq2(stockTransferVouchers.destinationLocationId, locationId)
        )
      ));
      for (const item of priorTransfers) {
        const qty = parseFloat(item.quantity);
        const val = parseFloat(item.totalAmount);
        if (item.sourceLocationId === locationId) {
          priorOutwardQty += qty;
          priorOutwardValue += val;
        }
        if (item.destinationLocationId === locationId) {
          priorInwardQty += qty;
          priorInwardValue += val;
        }
      }
      const priorAdjustments = await db.select({
        quantity: stockAdjustmentItems.quantity,
        totalAmount: stockAdjustmentItems.totalAmount
      }).from(stockAdjustmentItems).innerJoin(stockAdjustmentVouchers, eq2(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id)).innerJoin(vouchers, eq2(stockAdjustmentVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockAdjustmentItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        eq2(stockAdjustmentVouchers.locationId, locationId),
        sql3`${vouchers.voucherDate}::date < ${monthStartStr}::date`
      ));
      for (const item of priorAdjustments) {
        const qty = parseFloat(item.quantity);
        const val = parseFloat(item.totalAmount);
        if (qty > 0) {
          priorInwardQty += qty;
          priorInwardValue += val;
        } else {
          priorOutwardQty += Math.abs(qty);
          priorOutwardValue += Math.abs(val);
        }
      }
      const priorSales = await db.select({
        quantity: salesItems.quantity,
        costPrice: salesItems.costPrice,
        totalCost: salesItems.totalCost
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).where(and2(
        eq2(salesItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        eq2(vouchers.locationId, locationId),
        sql3`${vouchers.voucherDate}::date < ${monthStartStr}::date`
      ));
      for (const item of priorSales) {
        priorOutwardQty += parseFloat(item.quantity);
        priorOutwardValue += parseFloat(item.totalCost);
      }
      const priorOffloads = await db.select({
        quantity: poLineItems.quantity,
        lineTotal: poLineItems.lineTotal,
        additionalCostPerBale: containerOffloads.additionalCostPerBale
      }).from(containerOffloads).innerJoin(containers, eq2(containerOffloads.containerId, containers.id)).innerJoin(purchaseOrders, eq2(purchaseOrders.containerId, containers.id)).innerJoin(poLineItems, eq2(poLineItems.poId, purchaseOrders.id)).where(and2(
        eq2(poLineItems.stockItemId, stockItemId),
        eq2(containers.companyId, companyId),
        eq2(containerOffloads.locationId, locationId),
        sql3`${containerOffloads.offloadedAt}::date < ${monthStartStr}::date`
      ));
      for (const item of priorOffloads) {
        const qty = parseFloat(item.quantity);
        const baseValue = parseFloat(item.lineTotal);
        const additionalCost = parseFloat(item.additionalCostPerBale) * qty;
        priorInwardQty += qty;
        priorInwardValue += baseValue + additionalCost;
      }
      const [currentInventory] = await db.select({
        quantity: inventory.quantity,
        averageRate: inventory.averageRate,
        totalValue: inventory.totalValue
      }).from(inventory).where(and2(
        eq2(inventory.locationId, locationId),
        eq2(inventory.stockItemId, stockItemId)
      ));
      const currentQty = currentInventory ? parseFloat(currentInventory.quantity) : 0;
      const currentValue = currentInventory ? parseFloat(currentInventory.totalValue) : 0;
      const currentRate = currentInventory ? parseFloat(currentInventory.averageRate) : 0;
      let voucherOpeningQty = priorInwardQty - priorOutwardQty;
      let voucherOpeningValue = priorInwardValue - priorOutwardValue;
      const voucherOpeningRate = voucherOpeningQty > 0 ? voucherOpeningValue / voucherOpeningQty : 0;
      let afterMonthNetQty = 0;
      let afterMonthNetValue = 0;
      const afterTransfers = await db.select({
        quantity: stockTransferItems.quantity,
        totalAmount: stockTransferItems.totalAmount,
        sourceLocationId: stockTransferItems.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId
      }).from(stockTransferItems).innerJoin(stockTransferVouchers, eq2(stockTransferItems.transferId, stockTransferVouchers.id)).innerJoin(vouchers, eq2(stockTransferVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockTransferItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`${vouchers.voucherDate}::date > ${monthEndStr}::date`,
        or2(
          eq2(stockTransferItems.sourceLocationId, locationId),
          eq2(stockTransferVouchers.destinationLocationId, locationId)
        )
      ));
      for (const item of afterTransfers) {
        const qty = parseFloat(item.quantity);
        const val = parseFloat(item.totalAmount);
        if (item.sourceLocationId === locationId) {
          afterMonthNetQty -= qty;
          afterMonthNetValue -= val;
        }
        if (item.destinationLocationId === locationId) {
          afterMonthNetQty += qty;
          afterMonthNetValue += val;
        }
      }
      const afterAdjustments = await db.select({
        quantity: stockAdjustmentItems.quantity,
        totalAmount: stockAdjustmentItems.totalAmount
      }).from(stockAdjustmentItems).innerJoin(stockAdjustmentVouchers, eq2(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id)).innerJoin(vouchers, eq2(stockAdjustmentVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockAdjustmentItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        eq2(stockAdjustmentVouchers.locationId, locationId),
        sql3`${vouchers.voucherDate}::date > ${monthEndStr}::date`
      ));
      for (const item of afterAdjustments) {
        afterMonthNetQty += parseFloat(item.quantity);
        afterMonthNetValue += parseFloat(item.totalAmount);
      }
      const afterSales = await db.select({
        quantity: salesItems.quantity,
        totalCost: salesItems.totalCost
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).where(and2(
        eq2(salesItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        eq2(vouchers.locationId, locationId),
        sql3`${vouchers.voucherDate}::date > ${monthEndStr}::date`
      ));
      for (const item of afterSales) {
        afterMonthNetQty -= parseFloat(item.quantity);
        afterMonthNetValue -= parseFloat(item.totalCost);
      }
      const afterOffloads = await db.select({
        quantity: poLineItems.quantity,
        lineTotal: poLineItems.lineTotal,
        additionalCostPerBale: containerOffloads.additionalCostPerBale
      }).from(containerOffloads).innerJoin(containers, eq2(containerOffloads.containerId, containers.id)).innerJoin(purchaseOrders, eq2(purchaseOrders.containerId, containers.id)).innerJoin(poLineItems, eq2(poLineItems.poId, purchaseOrders.id)).where(and2(
        eq2(poLineItems.stockItemId, stockItemId),
        eq2(containers.companyId, companyId),
        eq2(containerOffloads.locationId, locationId),
        sql3`${containerOffloads.offloadedAt}::date > ${monthEndStr}::date`
      ));
      for (const item of afterOffloads) {
        const qty = parseFloat(item.quantity);
        const baseValue = parseFloat(item.lineTotal);
        const additionalCost = parseFloat(item.additionalCostPerBale) * qty;
        afterMonthNetQty += qty;
        afterMonthNetValue += baseValue + additionalCost;
      }
      const expectedClosingQty = currentQty - afterMonthNetQty;
      const expectedClosingValue = currentValue - afterMonthNetValue;
      const expectedClosingRate = expectedClosingQty > 0 ? expectedClosingValue / expectedClosingQty : 0;
      const transactions = [];
      const transferItems = await db.select({
        voucherDate: vouchers.voucherDate,
        voucherId: vouchers.id,
        quantity: stockTransferItems.quantity,
        rate: stockTransferItems.rate,
        totalAmount: stockTransferItems.totalAmount,
        sourceLocationId: stockTransferItems.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId
      }).from(stockTransferItems).innerJoin(stockTransferVouchers, eq2(stockTransferItems.transferId, stockTransferVouchers.id)).innerJoin(vouchers, eq2(stockTransferVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockTransferItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`,
        sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate}) = ${month}`,
        or2(
          eq2(stockTransferItems.sourceLocationId, locationId),
          eq2(stockTransferVouchers.destinationLocationId, locationId)
        )
      )).orderBy(vouchers.voucherDate);
      const locationIds = /* @__PURE__ */ new Set();
      for (const item of transferItems) {
        if (item.sourceLocationId) locationIds.add(item.sourceLocationId);
        if (item.destinationLocationId) locationIds.add(item.destinationLocationId);
      }
      const locationMap = {};
      for (const locId of Array.from(locationIds)) {
        const loc = await storage.getLocationById(locId);
        if (loc) locationMap[locId] = loc.name;
      }
      for (const item of transferItems) {
        const qty = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const val = parseFloat(item.totalAmount);
        const sourceName = item.sourceLocationId ? locationMap[item.sourceLocationId] || "Unknown" : "Unknown";
        const destName = locationMap[item.destinationLocationId] || "Unknown";
        if (item.sourceLocationId === locationId) {
          transactions.push({
            date: item.voucherDate,
            particulars: `To ${destName}`,
            vchType: "Stock Transfer",
            voucherId: item.voucherId,
            inwardQty: 0,
            inwardRate: 0,
            inwardValue: 0,
            outwardQty: qty,
            outwardRate: rate,
            outwardValue: val
          });
        }
        if (item.destinationLocationId === locationId) {
          transactions.push({
            date: item.voucherDate,
            particulars: `From ${sourceName}`,
            vchType: "Stock Transfer",
            voucherId: item.voucherId,
            inwardQty: qty,
            inwardRate: rate,
            inwardValue: val,
            outwardQty: 0,
            outwardRate: 0,
            outwardValue: 0
          });
        }
      }
      const adjustmentItems = await db.select({
        voucherDate: vouchers.voucherDate,
        voucherId: vouchers.id,
        quantity: stockAdjustmentItems.quantity,
        rate: stockAdjustmentItems.rate,
        totalAmount: stockAdjustmentItems.totalAmount,
        adjustmentType: stockAdjustmentVouchers.adjustmentType
      }).from(stockAdjustmentItems).innerJoin(stockAdjustmentVouchers, eq2(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id)).innerJoin(vouchers, eq2(stockAdjustmentVouchers.voucherId, vouchers.id)).where(and2(
        eq2(stockAdjustmentItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        eq2(stockAdjustmentVouchers.locationId, locationId),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`,
        sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate}) = ${month}`
      )).orderBy(vouchers.voucherDate);
      for (const item of adjustmentItems) {
        const rawQty = parseFloat(item.quantity);
        const rawValue = parseFloat(item.totalAmount);
        const qty = Math.abs(rawQty);
        const rate = parseFloat(item.rate);
        const value = Math.abs(rawValue);
        const isProduction = rawQty > 0;
        transactions.push({
          date: item.voucherDate,
          particulars: isProduction ? "Production" : "Consumption",
          vchType: isProduction ? "Production" : "Consumption",
          voucherId: item.voucherId,
          inwardQty: isProduction ? qty : 0,
          inwardRate: isProduction ? rate : 0,
          inwardValue: isProduction ? rawValue : 0,
          outwardQty: isProduction ? 0 : qty,
          outwardRate: isProduction ? 0 : rate,
          outwardValue: isProduction ? 0 : value
        });
      }
      const salesData = await db.select({
        voucherDate: vouchers.voucherDate,
        voucherId: vouchers.id,
        quantity: salesItems.quantity,
        sellingPrice: salesItems.sellingPrice,
        totalSales: salesItems.totalSales,
        costPrice: salesItems.costPrice,
        totalCost: salesItems.totalCost
      }).from(salesItems).innerJoin(vouchers, eq2(salesItems.voucherId, vouchers.id)).where(and2(
        eq2(salesItems.stockItemId, stockItemId),
        eq2(vouchers.companyId, companyId),
        eq2(vouchers.optional, false),
        eq2(vouchers.locationId, locationId),
        sql3`EXTRACT(YEAR FROM ${vouchers.voucherDate}) = ${year}`,
        sql3`EXTRACT(MONTH FROM ${vouchers.voucherDate}) = ${month}`
      )).orderBy(vouchers.voucherDate);
      for (const item of salesData) {
        const qty = parseFloat(item.quantity);
        const sellingRate = parseFloat(item.sellingPrice);
        const totalSalesValue = parseFloat(item.totalSales);
        transactions.push({
          date: item.voucherDate,
          particulars: "Cash",
          vchType: "POS",
          voucherId: item.voucherId,
          inwardQty: 0,
          inwardRate: 0,
          inwardValue: 0,
          outwardQty: qty,
          outwardRate: 0,
          outwardValue: 0,
          isPOS: true,
          posSellingRate: sellingRate,
          posSellingValue: totalSalesValue
        });
      }
      const offloadData = await db.select({
        offloadedAt: containerOffloads.offloadedAt,
        containerId: containerOffloads.containerId,
        containerCode: containers.containerNumber,
        poId: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        quantity: poLineItems.quantity,
        rate: poLineItems.rate,
        lineTotal: poLineItems.lineTotal,
        additionalCostPerBale: containerOffloads.additionalCostPerBale
      }).from(containerOffloads).innerJoin(containers, eq2(containerOffloads.containerId, containers.id)).innerJoin(purchaseOrders, eq2(purchaseOrders.containerId, containers.id)).innerJoin(poLineItems, eq2(poLineItems.poId, purchaseOrders.id)).where(and2(
        eq2(poLineItems.stockItemId, stockItemId),
        eq2(containers.companyId, companyId),
        eq2(containerOffloads.locationId, locationId),
        sql3`EXTRACT(YEAR FROM ${containerOffloads.offloadedAt}) = ${year}`,
        sql3`EXTRACT(MONTH FROM ${containerOffloads.offloadedAt}) = ${month}`
      )).orderBy(containerOffloads.offloadedAt);
      for (const item of offloadData) {
        const qty = parseFloat(item.quantity);
        const baseRate = parseFloat(item.rate);
        const baseValue = parseFloat(item.lineTotal);
        const additionalCostPerBale = parseFloat(item.additionalCostPerBale);
        const additionalCost = additionalCostPerBale * qty;
        const landedValue = baseValue + additionalCost;
        const landedRate = landedValue / qty;
        const offloadDateStr = item.offloadedAt instanceof Date ? item.offloadedAt.toISOString().split("T")[0] : String(item.offloadedAt).split("T")[0];
        transactions.push({
          date: offloadDateStr,
          particulars: `Container: ${item.containerCode} / PO: ${item.poNumber}`,
          vchType: "PO Offload",
          voucherId: 0,
          poId: item.poId,
          inwardQty: qty,
          inwardRate: landedRate,
          inwardValue: landedValue,
          outwardQty: 0,
          outwardRate: 0,
          outwardValue: 0
        });
      }
      transactions.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        if (a.inwardQty > 0 && b.outwardQty > 0) return -1;
        if (a.outwardQty > 0 && b.inwardQty > 0) return 1;
        return 0;
      });
      let inMonthInwardQty = 0;
      let inMonthInwardValue = 0;
      let inMonthOutwardQty = 0;
      for (const t of transactions) {
        inMonthInwardQty += t.inwardQty;
        inMonthInwardValue += t.inwardValue;
        inMonthOutwardQty += t.outwardQty;
      }
      const expectedOpeningQty = expectedClosingQty - inMonthInwardQty + inMonthOutwardQty;
      const expectedOpeningRate = expectedClosingRate;
      const expectedOpeningValue = expectedOpeningQty * expectedOpeningRate;
      const importedQty = expectedOpeningQty - voucherOpeningQty;
      const importedValue = expectedOpeningValue - voucherOpeningValue;
      const importedRate = importedQty > 0 ? importedValue / importedQty : 0;
      let openingQty = Math.round(expectedOpeningQty * 1e3) / 1e3;
      let openingRate = expectedClosingRate;
      let openingValue = openingQty * openingRate;
      if (openingQty < 0) {
        openingQty = 0;
        openingValue = 0;
        openingRate = 0;
      }
      let runningQty = openingQty;
      let runningValue = openingValue;
      const transactionsWithBalance = [];
      if (openingQty > 0 || openingValue > 0) {
        transactionsWithBalance.push({
          date: monthStartStr,
          particulars: "Opening Balance",
          vchType: "",
          voucherId: 0,
          inwardQty: openingQty,
          inwardRate: openingRate,
          inwardValue: openingValue,
          outwardQty: 0,
          outwardRate: 0,
          outwardValue: 0,
          closingQty: openingQty,
          closingRate: openingRate,
          closingValue: openingValue,
          isOpeningBalance: true
        });
      }
      for (const t of transactions) {
        const currentAvgRate = runningQty > 0 ? runningValue / runningQty : 0;
        runningQty += t.inwardQty - t.outwardQty;
        const actualOutwardCost = t.outwardQty * currentAvgRate;
        runningValue += t.inwardValue - actualOutwardCost;
        const avgClosingRate = runningQty > 0 ? runningValue / runningQty : 0;
        const displayOutwardRate = t.outwardQty !== 0 ? currentAvgRate : 0;
        const displayOutwardValue = t.outwardQty !== 0 ? actualOutwardCost : 0;
        transactionsWithBalance.push({
          ...t,
          outwardRate: displayOutwardRate,
          outwardValue: displayOutwardValue,
          closingQty: runningQty,
          closingRate: avgClosingRate,
          closingValue: runningValue
        });
      }
      const finalClosingQty = Math.round(expectedClosingQty * 1e3) / 1e3;
      const finalClosingValue = expectedClosingValue;
      const finalClosingRate = finalClosingQty > 0 ? finalClosingValue / finalClosingQty : 0;
      if (transactionsWithBalance.length > 0) {
        const lastTx = transactionsWithBalance[transactionsWithBalance.length - 1];
        lastTx.closingQty = finalClosingQty;
        lastTx.closingRate = finalClosingRate;
        lastTx.closingValue = finalClosingValue;
      }
      const processedTransactions = transactionsWithBalance.filter((t) => !t.isOpeningBalance);
      const totals = {
        inwardQty: processedTransactions.reduce((s, t) => s + t.inwardQty, 0),
        inwardRate: 0,
        inwardValue: processedTransactions.reduce((s, t) => s + t.inwardValue, 0),
        outwardQty: processedTransactions.reduce((s, t) => s + t.outwardQty, 0),
        outwardRate: 0,
        outwardValue: processedTransactions.reduce((s, t) => s + t.outwardValue, 0),
        closingQty: finalClosingQty,
        closingRate: finalClosingRate,
        closingValue: finalClosingValue
      };
      totals.inwardRate = totals.inwardQty > 0 ? totals.inwardValue / totals.inwardQty : 0;
      totals.outwardRate = totals.outwardQty > 0 ? totals.outwardValue / totals.outwardQty : 0;
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      res.json({
        stockItem,
        location,
        year,
        month,
        monthName: monthNames[month - 1],
        openingBalance: {
          qty: openingQty,
          rate: openingRate,
          value: openingValue
        },
        transactions: transactionsWithBalance,
        totals
      });
    } catch (error) {
      console.error("Location stock item monthly vouchers error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/location-summary", requireAuth, async (req, res) => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId) : req.session.currentCompanyId;
      const locationIds = req.query.locationIds ? req.query.locationIds.split(",").map((id) => parseInt(id)) : [];
      const asOfDate = req.query.asOfDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      if (locationIds.length === 0) {
        return res.json({ stockGroups: [], grandTotals: {} });
      }
      const allStockGroups = await db.select().from(stockGroups).where(and2(eq2(stockGroups.companyId, companyId), eq2(stockGroups.active, true))).orderBy(stockGroups.name);
      const allStockItems = await db.select().from(stockItems).where(and2(eq2(stockItems.companyId, companyId), eq2(stockItems.active, true))).orderBy(stockItems.name);
      const inventoryData = await db.select({
        locationId: inventory.locationId,
        stockItemId: inventory.stockItemId,
        quantity: inventory.quantity,
        averageRate: inventory.averageRate,
        totalValue: inventory.totalValue
      }).from(inventory).where(
        and2(
          eq2(inventory.companyId, companyId),
          inArray2(inventory.locationId, locationIds)
        )
      );
      const inventoryMap = /* @__PURE__ */ new Map();
      for (const inv of inventoryData) {
        const key = `${inv.locationId}-${inv.stockItemId}`;
        inventoryMap.set(key, {
          quantity: parseFloat(inv.quantity || "0"),
          rate: parseFloat(inv.averageRate || "0"),
          value: parseFloat(inv.totalValue || "0")
        });
      }
      const result = [];
      const itemsByGroup = /* @__PURE__ */ new Map();
      const ungroupedItems = [];
      for (const item of allStockItems) {
        if (item.stockGroupId) {
          if (!itemsByGroup.has(item.stockGroupId)) {
            itemsByGroup.set(item.stockGroupId, []);
          }
          itemsByGroup.get(item.stockGroupId).push(item);
        } else {
          ungroupedItems.push(item);
        }
      }
      for (const group of allStockGroups) {
        const groupItems = itemsByGroup.get(group.id) || [];
        const groupHasInventory = groupItems.some(
          (item) => locationIds.some((locId) => {
            const key = `${locId}-${item.id}`;
            const inv = inventoryMap.get(key);
            return inv && inv.quantity !== 0;
          })
        );
        if (!groupHasInventory) continue;
        const groupLocationData = {};
        for (const locId of locationIds) {
          groupLocationData[locId] = { quantity: 0, rate: 0, value: 0 };
        }
        const itemsData = [];
        for (const item of groupItems) {
          const itemLocationData = {};
          let itemHasInventory = false;
          for (const locId of locationIds) {
            const key = `${locId}-${item.id}`;
            const inv = inventoryMap.get(key);
            if (inv && inv.quantity !== 0) {
              itemHasInventory = true;
              itemLocationData[locId] = inv;
              groupLocationData[locId].quantity += inv.quantity;
              groupLocationData[locId].value += inv.value;
            } else {
              itemLocationData[locId] = { quantity: 0, rate: 0, value: 0 };
            }
          }
          if (itemHasInventory) {
            itemsData.push({
              id: item.id,
              code: item.code,
              name: item.name,
              uom: item.uom,
              locationData: itemLocationData
            });
          }
        }
        for (const locId of locationIds) {
          if (groupLocationData[locId].quantity > 0) {
            groupLocationData[locId].rate = groupLocationData[locId].value / groupLocationData[locId].quantity;
          }
        }
        result.push({
          id: group.id,
          code: group.code,
          name: group.name,
          locationData: groupLocationData,
          items: itemsData
        });
      }
      if (ungroupedItems.length > 0) {
        const ungroupedLocationData = {};
        for (const locId of locationIds) {
          ungroupedLocationData[locId] = { quantity: 0, rate: 0, value: 0 };
        }
        const ungroupedItemsData = [];
        for (const item of ungroupedItems) {
          const itemLocationData = {};
          let itemHasInventory = false;
          for (const locId of locationIds) {
            const key = `${locId}-${item.id}`;
            const inv = inventoryMap.get(key);
            if (inv && inv.quantity !== 0) {
              itemHasInventory = true;
              itemLocationData[locId] = inv;
              ungroupedLocationData[locId].quantity += inv.quantity;
              ungroupedLocationData[locId].value += inv.value;
            } else {
              itemLocationData[locId] = { quantity: 0, rate: 0, value: 0 };
            }
          }
          if (itemHasInventory) {
            ungroupedItemsData.push({
              id: item.id,
              code: item.code,
              name: item.name,
              uom: item.uom,
              locationData: itemLocationData
            });
          }
        }
        if (ungroupedItemsData.length > 0) {
          for (const locId of locationIds) {
            if (ungroupedLocationData[locId].quantity > 0) {
              ungroupedLocationData[locId].rate = ungroupedLocationData[locId].value / ungroupedLocationData[locId].quantity;
            }
          }
          result.push({
            id: 0,
            code: "UNGROUPED",
            name: "Ungrouped Items",
            locationData: ungroupedLocationData,
            items: ungroupedItemsData
          });
        }
      }
      const grandTotals = {};
      for (const locId of locationIds) {
        grandTotals[locId] = { quantity: 0, rate: 0, value: 0 };
      }
      for (const group of result) {
        for (const locId of locationIds) {
          grandTotals[locId].quantity += group.locationData[locId]?.quantity || 0;
          grandTotals[locId].value += group.locationData[locId]?.value || 0;
        }
      }
      for (const locId of locationIds) {
        if (grandTotals[locId].quantity > 0) {
          grandTotals[locId].rate = grandTotals[locId].value / grandTotals[locId].quantity;
        }
      }
      res.json({
        stockGroups: result,
        grandTotals,
        asOfDate
      });
    } catch (error) {
      console.error("Location summary error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/cleanup/orphaned-charges", async (req, res) => {
    try {
      const chargeVouchers = await db.select().from(vouchers).where(sql3`${vouchers.voucherNumber} LIKE 'CHARGE-%'`);
      let deletedCount = 0;
      for (const chargeVoucher of chargeVouchers) {
        const containerNumber = chargeVoucher.voucherNumber.split("-")[1] + "-" + chargeVoucher.voucherNumber.split("-")[2];
        const remainingPOs = await db.select().from(purchaseOrders).leftJoin(containers, eq2(purchaseOrders.containerId, containers.id)).where(eq2(containers.containerNumber, containerNumber)).limit(1);
        if (remainingPOs.length === 0) {
          await db.delete(voucherEntries).where(eq2(voucherEntries.voucherId, chargeVoucher.id));
          await db.delete(vouchers).where(eq2(vouchers.id, chargeVoucher.id));
          deletedCount++;
        }
      }
      res.json({
        message: `Cleaned up ${deletedCount} orphaned charge vouchers`,
        deletedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
var BUILD_VERSION = process.env.BUILD_VERSION || process.env.RENDER_GIT_COMMIT?.substring(0, 8) || Date.now().toString();
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.set("trust proxy", 1);
var PgSession = connectPgSimple(session);
var sessionConfig = {
  name: "erp.session",
  // Explicit cookie name
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Replit serves over HTTPS even in dev mode, so we need secure cookies
    secure: process.env.NODE_ENV === "production" || !!process.env.REPL_ID,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1e3,
    // 24 hours
    path: "/",
    // Explicit path
    sameSite: "lax"
    // Lax allows same-site requests and top-level navigation
  }
};
if (process.env.DATABASE_URL || process.env.PGHOST) {
  const connectionString2 = process.env.DATABASE_URL || `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
  const isLocalReplitDB2 = process.env.PGHOST === "helium";
  const sslExplicitlyDisabled2 = process.env.PGSSLMODE === "disable";
  const requiresSSL2 = !isLocalReplitDB2 && !sslExplicitlyDisabled2;
  sessionConfig.store = new PgSession({
    conObject: {
      connectionString: connectionString2,
      ssl: requiresSSL2 ? { rejectUnauthorized: false } : false
    },
    createTableIfMissing: true
  });
  console.log(`\u2713 PostgreSQL session store configured (SSL: ${requiresSSL2 ? "enabled" : "disabled"})`);
}
app.use(session(sessionConfig));
app.use((_req, res, next) => {
  res.setHeader("X-Build-Version", BUILD_VERSION);
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  app.get("/api/build-info", (_req, res) => {
    res.json({ version: BUILD_VERSION });
  });
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    const distPath = path3.resolve(import.meta.dirname, "public");
    if (!fs2.existsSync(distPath)) {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`
      );
    }
    app.use(express2.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));
    app.use("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path3.resolve(distPath, "index.html"));
    });
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
