-- -------------------------------------------------------------
-- TablePlus 6.8.2(656)
--
-- https://tableplus.com/
--
-- Database: system_qv1v
-- Generation Time: 2026-03-21 17:36:21.3970
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."employee_groups";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS employee_groups_id_seq;

-- Table Definition
CREATE TABLE "public"."employee_groups" (
    "id" int4 NOT NULL DEFAULT nextval('employee_groups_id_seq'::regclass),
    "company_id" int4,
    "name" text NOT NULL,
    "description" text,
    "group_type" text DEFAULT 'Employee'::text,
    "active" bool DEFAULT true,
    "created_at" timestamp DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."employees";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS employees_id_seq;

-- Table Definition
CREATE TABLE "public"."employees" (
    "id" int4 NOT NULL DEFAULT nextval('employees_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "code" varchar(50) NOT NULL,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "email" text,
    "phone" text,
    "join_date" date NOT NULL,
    "department" text,
    "employee_type" text NOT NULL DEFAULT 'Employee'::text,
    "monthly_salary" numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    "opening_balance" numeric(15,2) DEFAULT '0'::numeric,
    "current_balance" numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    "total_deposits" numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    "total_withdrawals" numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    "active" bool NOT NULL DEFAULT true,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."fiscal_period_closures";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS fiscal_period_closures_id_seq;

-- Table Definition
CREATE TABLE "public"."fiscal_period_closures" (
    "id" int4 NOT NULL DEFAULT nextval('fiscal_period_closures_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "period_start_date" date NOT NULL,
    "period_end_date" date NOT NULL,
    "closure_date" timestamp NOT NULL DEFAULT now(),
    "closed_by_user_id" varchar NOT NULL,
    "closing_voucher_id" int4 NOT NULL,
    "retained_earnings_account_id" int4 NOT NULL,
    "total_income" numeric(15,2) NOT NULL,
    "total_expense" numeric(15,2) NOT NULL,
    "net_income" numeric(15,2) NOT NULL,
    "status" text NOT NULL DEFAULT 'CLOSED'::text,
    "notes" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."fixed_assets";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS fixed_assets_id_seq;

-- Table Definition
CREATE TABLE "public"."fixed_assets" (
    "id" int4 NOT NULL DEFAULT nextval('fixed_assets_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "code" varchar(50) NOT NULL,
    "name" text NOT NULL,
    "category" text NOT NULL,
    "purchase_date" date NOT NULL,
    "purchase_amount" numeric(15,2) NOT NULL,
    "depreciation_method" text NOT NULL DEFAULT 'None'::text,
    "useful_life" int4,
    "opening_balance" numeric(15,2),
    "active" bool NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."import_logs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS import_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."import_logs" (
    "id" int4 NOT NULL DEFAULT nextval('import_logs_id_seq'::regclass),
    "file_name" text NOT NULL,
    "file_hash" text NOT NULL,
    "row_count" int4 NOT NULL,
    "container_id" int4,
    "status" text NOT NULL,
    "error_message" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."bale_products";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS bale_products_id_seq;

-- Table Definition
CREATE TABLE "public"."bale_products" (
    "id" int4 NOT NULL DEFAULT nextval('bale_products_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "code" varchar(50) NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "active" bool NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."bale_sequences";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS bale_sequences_id_seq;

-- Table Definition
CREATE TABLE "public"."bale_sequences" (
    "id" int4 NOT NULL DEFAULT nextval('bale_sequences_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "next_number" int4 NOT NULL DEFAULT 1,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."bale_transfer_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS bale_transfer_items_id_seq;

-- Table Definition
CREATE TABLE "public"."bale_transfer_items" (
    "id" int4 NOT NULL DEFAULT nextval('bale_transfer_items_id_seq'::regclass),
    "transfer_id" int4 NOT NULL,
    "production_bale_id" int4 NOT NULL,
    "quantity" int4 NOT NULL DEFAULT 1,
    "weight_kg" numeric(15,3) NOT NULL,
    "cost_per_kg" numeric(20,2) NOT NULL,
    "total_cost" numeric(20,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."bale_transfers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS bale_transfers_id_seq;

-- Table Definition
CREATE TABLE "public"."bale_transfers" (
    "id" int4 NOT NULL DEFAULT nextval('bale_transfers_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "source_location_id" int4 NOT NULL,
    "destination_location_id" int4 NOT NULL,
    "transfer_date" date NOT NULL,
    "notes" text,
    "created_by" varchar NOT NULL,
    "updated_by" varchar,
    "status" text NOT NULL DEFAULT 'PENDING'::text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."bales";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS bales_id_seq;

-- Table Definition
CREATE TABLE "public"."bales" (
    "id" int4 NOT NULL DEFAULT nextval('bales_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "container_id" int4,
    "barcode" varchar(100) NOT NULL,
    "category" text NOT NULL,
    "grade" text NOT NULL,
    "origin" text NOT NULL,
    "weight" numeric(10,3) NOT NULL,
    "date_pressed" date NOT NULL,
    "price" numeric(12,2),
    "currency" varchar(3) DEFAULT 'USD'::character varying,
    "sold_at" timestamp,
    "sold_voucher_id" int4,
    "status" text NOT NULL DEFAULT 'AVAILABLE'::text,
    "active" bool NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."bank_accounts";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS bank_accounts_id_seq;

-- Table Definition
CREATE TABLE "public"."bank_accounts" (
    "id" int4 NOT NULL DEFAULT nextval('bank_accounts_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "code" varchar(50) NOT NULL,
    "name" text NOT NULL,
    "bank_name" text NOT NULL,
    "account_number" text NOT NULL,
    "routing_code" text,
    "linked_ledger_id" int4,
    "opening_balance" numeric(15,2) DEFAULT '0'::numeric,
    "opening_balance_side" text,
    "active" bool NOT NULL DEFAULT true,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."chat_messages";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS chat_messages_id_seq;

-- Table Definition
CREATE TABLE "public"."chat_messages" (
    "id" int4 NOT NULL DEFAULT nextval('chat_messages_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "user_id" varchar NOT NULL,
    "role" text NOT NULL,
    "content" text NOT NULL,
    "session_id" varchar NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."companies";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS companies_id_seq;

-- Table Definition
CREATE TABLE "public"."companies" (
    "id" int4 NOT NULL DEFAULT nextval('companies_id_seq'::regclass),
    "code" varchar(50) NOT NULL,
    "name" text NOT NULL,
    "active" bool NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."company_settings";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS company_settings_id_seq;

-- Table Definition
CREATE TABLE "public"."company_settings" (
    "id" int4 NOT NULL DEFAULT nextval('company_settings_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "logo_url" text,
    "logo_file_name" text,
    "logo_updated_at" timestamp,
    "invoice_footer" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."container_charges";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS container_charges_id_seq;

-- Table Definition
CREATE TABLE "public"."container_charges" (
    "id" int4 NOT NULL DEFAULT nextval('container_charges_id_seq'::regclass),
    "container_id" int4 NOT NULL,
    "charge_type" text NOT NULL,
    "amount" numeric(20,2) NOT NULL,
    "ledger_account_id" int4,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."container_offloads";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS container_offloads_id_seq;

-- Table Definition
CREATE TABLE "public"."container_offloads" (
    "id" int4 NOT NULL DEFAULT nextval('container_offloads_id_seq'::regclass),
    "container_id" int4 NOT NULL,
    "location_id" int4 NOT NULL,
    "duties" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "office_charges" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "transfer_charges" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "transport_fees" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "total_charges" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "total_bales" numeric(15,3) NOT NULL,
    "additional_cost_per_bale" numeric(20,2) NOT NULL,
    "offloaded_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."container_sales";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS container_sales_id_seq;

-- Table Definition
CREATE TABLE "public"."container_sales" (
    "id" int4 NOT NULL DEFAULT nextval('container_sales_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "container_id" int4 NOT NULL,
    "customer_id" int4 NOT NULL,
    "sale_date" date NOT NULL,
    "container_cost" numeric(15,2) NOT NULL,
    "commission" numeric(15,2) NOT NULL,
    "commission_account_id" int4,
    "total_amount" numeric(15,2) NOT NULL,
    "currency" text NOT NULL DEFAULT 'USD'::text,
    "invoice_number" varchar(100),
    "payment_status" text NOT NULL DEFAULT 'PENDING'::text,
    "paid_amount" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "voucher_id" int4,
    "notes" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."customer_balances";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS customer_balances_id_seq;

-- Table Definition
CREATE TABLE "public"."customer_balances" (
    "id" int4 NOT NULL DEFAULT nextval('customer_balances_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "customer_id" int4 NOT NULL,
    "transaction_date" date NOT NULL,
    "transaction_type" text NOT NULL,
    "reference_id" int4,
    "reference_type" text,
    "debit_amount" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "credit_amount" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "balance" numeric(20,2) NOT NULL,
    "currency" text NOT NULL DEFAULT 'USD'::text,
    "description" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."dashboard_account_selections";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS dashboard_account_selections_id_seq;

-- Table Definition
CREATE TABLE "public"."dashboard_account_selections" (
    "id" int4 NOT NULL DEFAULT nextval('dashboard_account_selections_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "selection_type" text NOT NULL,
    "account_ids" _int4 NOT NULL DEFAULT '{}'::integer[],
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."dashboard_cash_accounts";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS dashboard_cash_accounts_id_seq;

-- Table Definition
CREATE TABLE "public"."dashboard_cash_accounts" (
    "id" int4 NOT NULL DEFAULT nextval('dashboard_cash_accounts_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "account_type" text NOT NULL,
    "account_id" int4 NOT NULL,
    "display_order" int4 NOT NULL DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."dashboard_payable_accounts";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS dashboard_payable_accounts_id_seq;

-- Table Definition
CREATE TABLE "public"."dashboard_payable_accounts" (
    "id" int4 NOT NULL DEFAULT nextval('dashboard_payable_accounts_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "account_id" int4 NOT NULL,
    "display_order" int4 NOT NULL DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."draft_pos_sale_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS draft_pos_sale_items_id_seq;

-- Table Definition
CREATE TABLE "public"."draft_pos_sale_items" (
    "id" int4 NOT NULL DEFAULT nextval('draft_pos_sale_items_id_seq'::regclass),
    "draft_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "quantity" numeric(15,3) NOT NULL,
    "rate" numeric(15,2) NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."draft_pos_sales";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS draft_pos_sales_id_seq;

-- Table Definition
CREATE TABLE "public"."draft_pos_sales" (
    "id" int4 NOT NULL DEFAULT nextval('draft_pos_sales_id_seq'::regclass),
    "user_id" varchar(255) NOT NULL,
    "location_id" int4 NOT NULL,
    "payment_account_type" text,
    "payment_account_id" int4,
    "is_credit_sale" bool DEFAULT false,
    "notes" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."employee_group_members";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS employee_group_members_id_seq;

-- Table Definition
CREATE TABLE "public"."employee_group_members" (
    "id" int4 NOT NULL DEFAULT nextval('employee_group_members_id_seq'::regclass),
    "employee_group_id" int4 NOT NULL,
    "employee_id" int4 NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."inter_company_transfers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS inter_company_transfers_id_seq;

-- Table Definition
CREATE TABLE "public"."inter_company_transfers" (
    "id" int4 NOT NULL DEFAULT nextval('inter_company_transfers_id_seq'::regclass),
    "transfer_type" text NOT NULL,
    "from_company_id" int4 NOT NULL,
    "to_company_id" int4 NOT NULL,
    "transfer_date" date NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "from_ledger_account_id" int4 NOT NULL,
    "to_ledger_account_id" int4 NOT NULL,
    "from_voucher_id" int4,
    "to_voucher_id" int4,
    "description" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."ledger_accounts";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS ledger_accounts_id_seq;

-- Table Definition
CREATE TABLE "public"."ledger_accounts" (
    "id" int4 NOT NULL DEFAULT nextval('ledger_accounts_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "code" varchar(50) NOT NULL,
    "name" text NOT NULL,
    "account_type" text NOT NULL,
    "sub_type" text,
    "parent_id" int4,
    "opening_balance" numeric(20,2) DEFAULT '0'::numeric,
    "opening_balance_side" text,
    "active" bool NOT NULL DEFAULT true,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."locations";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS locations_id_seq;

-- Table Definition
CREATE TABLE "public"."locations" (
    "id" int4 NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "code" varchar(50) NOT NULL,
    "name" text NOT NULL,
    "city" text,
    "state" text,
    "country" text,
    "active" bool NOT NULL DEFAULT true,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."mix_batch_sources";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS mix_batch_sources_id_seq;

-- Table Definition
CREATE TABLE "public"."mix_batch_sources" (
    "id" int4 NOT NULL DEFAULT nextval('mix_batch_sources_id_seq'::regclass),
    "mix_batch_id" int4 NOT NULL,
    "container_id" int4 NOT NULL,
    "weight_kg" numeric(15,3) NOT NULL,
    "cost_per_kg" numeric(20,2) NOT NULL,
    "total_cost" numeric(20,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."mix_batches";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS mix_batches_id_seq;

-- Table Definition
CREATE TABLE "public"."mix_batches" (
    "id" int4 NOT NULL DEFAULT nextval('mix_batches_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "batch_code" varchar(50) NOT NULL,
    "target_category" text,
    "target_grade" text,
    "total_planned_weight" numeric(15,3) NOT NULL,
    "total_actual_weight" numeric(15,3) DEFAULT '0'::numeric,
    "total_cost" numeric(20,2) NOT NULL,
    "cost_per_kg" numeric(20,2) NOT NULL,
    "status" text NOT NULL DEFAULT 'PLANNING'::text,
    "created_by" varchar NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."moto_assemblies";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS moto_assemblies_id_seq;

-- Table Definition
CREATE TABLE "public"."moto_assemblies" (
    "id" int4 NOT NULL DEFAULT nextval('moto_assemblies_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "location_id" int4 NOT NULL,
    "assembly_code" varchar(50) NOT NULL,
    "vin" varchar(50),
    "moto_model" text NOT NULL,
    "status" text NOT NULL DEFAULT 'in_progress'::text,
    "total_parts_cost" numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    "labor_cost" numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    "total_cost" numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    "notes" text,
    "assembly_date" date NOT NULL,
    "completed_date" date,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."moto_assembly_parts";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS moto_assembly_parts_id_seq;

-- Table Definition
CREATE TABLE "public"."moto_assembly_parts" (
    "id" int4 NOT NULL DEFAULT nextval('moto_assembly_parts_id_seq'::regclass),
    "moto_assembly_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "quantity" numeric(15,3) NOT NULL,
    "unit_cost" numeric(15,2) NOT NULL,
    "total_cost" numeric(15,2) NOT NULL,
    "notes" text,
    "added_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."po_line_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS po_line_items_id_seq;

-- Table Definition
CREATE TABLE "public"."po_line_items" (
    "id" int4 NOT NULL DEFAULT nextval('po_line_items_id_seq'::regclass),
    "po_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "item_name" text NOT NULL,
    "quantity" numeric(15,3) NOT NULL,
    "rate" numeric(15,2) NOT NULL,
    "line_total" numeric(20,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."production_bales";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS production_bales_id_seq;

-- Table Definition
CREATE TABLE "public"."production_bales" (
    "id" int4 NOT NULL DEFAULT nextval('production_bales_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "mix_batch_id" int4,
    "product_id" int4,
    "location_id" int4,
    "bale_code" varchar(50) NOT NULL,
    "barcode_value" varchar(100) NOT NULL,
    "category" text,
    "grade" text,
    "quantity" int4 NOT NULL DEFAULT 1,
    "weight_kg" numeric(15,3) NOT NULL,
    "cost_per_kg" numeric(20,2) NOT NULL,
    "total_cost" numeric(20,2) NOT NULL,
    "warehouse_location" text,
    "status" text NOT NULL DEFAULT 'LABEL_PRINTED'::text,
    "pressed_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."purchase_orders";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS purchase_orders_id_seq;

-- Table Definition
CREATE TABLE "public"."purchase_orders" (
    "id" int4 NOT NULL DEFAULT nextval('purchase_orders_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "po_number" varchar(100) NOT NULL,
    "container_id" int4 NOT NULL,
    "supplier_id" int4 NOT NULL,
    "voucher_id" int4,
    "currency" text NOT NULL DEFAULT 'USD'::text,
    "items_total" numeric(20,2) DEFAULT '0'::numeric,
    "freight" numeric(20,2) DEFAULT '0'::numeric,
    "surcharge" numeric(20,2) DEFAULT '0'::numeric,
    "fumigation" numeric(20,2) DEFAULT '0'::numeric,
    "document_charges" numeric(20,2) DEFAULT '0'::numeric,
    "discount" numeric(20,2) DEFAULT '0'::numeric,
    "other_charges" numeric(20,2) DEFAULT '0'::numeric,
    "charges_edited" bool DEFAULT false,
    "status" text NOT NULL DEFAULT 'Open'::text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."role_feature_permissions";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS role_feature_permissions_id_seq;

-- Table Definition
CREATE TABLE "public"."role_feature_permissions" (
    "id" int4 NOT NULL DEFAULT nextval('role_feature_permissions_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "role" text NOT NULL,
    "feature_key" text NOT NULL,
    "enabled" bool NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."salary_advance_deductions";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS salary_advance_deductions_id_seq;

-- Table Definition
CREATE TABLE "public"."salary_advance_deductions" (
    "id" int4 NOT NULL DEFAULT nextval('salary_advance_deductions_id_seq'::regclass),
    "salary_advance_id" int4 NOT NULL,
    "payroll_month" text NOT NULL,
    "deduction_amount" numeric(15,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."salary_advances";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS salary_advances_id_seq;

-- Table Definition
CREATE TABLE "public"."salary_advances" (
    "id" int4 NOT NULL DEFAULT nextval('salary_advances_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "employee_id" int4 NOT NULL,
    "advance_date" date NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "remaining_balance" numeric(15,2) NOT NULL,
    "voucher_id" int4,
    "notes" text,
    "fully_paid" bool NOT NULL DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."sales_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS sales_items_id_seq;

-- Table Definition
CREATE TABLE "public"."sales_items" (
    "id" int4 NOT NULL DEFAULT nextval('sales_items_id_seq'::regclass),
    "voucher_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "quantity" numeric(15,3) NOT NULL,
    "selling_price" numeric(15,2) NOT NULL,
    "cost_price" numeric(15,2) NOT NULL,
    "total_sales" numeric(15,2) NOT NULL,
    "total_cost" numeric(15,2) NOT NULL,
    "profit" numeric(15,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."stock_adjustment_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS stock_adjustment_items_id_seq;

-- Table Definition
CREATE TABLE "public"."stock_adjustment_items" (
    "id" int4 NOT NULL DEFAULT nextval('stock_adjustment_items_id_seq'::regclass),
    "adjustment_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "quantity" numeric(15,3) NOT NULL,
    "rate" numeric(15,2) NOT NULL,
    "total_amount" numeric(15,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."stock_adjustment_vouchers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS stock_adjustment_vouchers_id_seq;

-- Table Definition
CREATE TABLE "public"."stock_adjustment_vouchers" (
    "id" int4 NOT NULL DEFAULT nextval('stock_adjustment_vouchers_id_seq'::regclass),
    "voucher_id" int4 NOT NULL,
    "location_id" int4 NOT NULL,
    "adjustment_type" text NOT NULL,
    "notes" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."stock_item_code_aliases";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS stock_item_code_aliases_id_seq;

-- Table Definition
CREATE TABLE "public"."stock_item_code_aliases" (
    "id" int4 NOT NULL DEFAULT nextval('stock_item_code_aliases_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "alias_code" varchar(50) NOT NULL,
    "description" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."stock_item_location_prices";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS stock_item_location_prices_id_seq;

-- Table Definition
CREATE TABLE "public"."stock_item_location_prices" (
    "id" int4 NOT NULL DEFAULT nextval('stock_item_location_prices_id_seq'::regclass),
    "stock_item_id" int4 NOT NULL,
    "location_id" int4 NOT NULL,
    "selling_price" numeric(15,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."stock_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS stock_items_id_seq;

-- Table Definition
CREATE TABLE "public"."stock_items" (
    "id" int4 NOT NULL DEFAULT nextval('stock_items_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "code" varchar(50) NOT NULL,
    "name" text NOT NULL,
    "stock_group_id" int4,
    "uom" text NOT NULL,
    "opening_qty" numeric(15,3) DEFAULT '0'::numeric,
    "opening_rate" numeric(15,2) DEFAULT '0'::numeric,
    "opening_value" numeric(15,2) DEFAULT '0'::numeric,
    "reorder_level" numeric(15,3) DEFAULT '0'::numeric,
    "selling_price" numeric(15,2) DEFAULT '0'::numeric,
    "active" bool NOT NULL DEFAULT true,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."stock_transfer_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS stock_transfer_items_id_seq;

-- Table Definition
CREATE TABLE "public"."stock_transfer_items" (
    "id" int4 NOT NULL DEFAULT nextval('stock_transfer_items_id_seq'::regclass),
    "transfer_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "source_location_id" int4,
    "quantity" numeric(15,3) NOT NULL,
    "rate" numeric(15,2) NOT NULL,
    "total_amount" numeric(15,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."stock_transfer_vouchers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS stock_transfer_vouchers_id_seq;

-- Table Definition
CREATE TABLE "public"."stock_transfer_vouchers" (
    "id" int4 NOT NULL DEFAULT nextval('stock_transfer_vouchers_id_seq'::regclass),
    "voucher_id" int4 NOT NULL,
    "source_location_id" int4 NOT NULL,
    "destination_location_id" int4 NOT NULL,
    "notes" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."suppliers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS suppliers_id_seq;

-- Table Definition
CREATE TABLE "public"."suppliers" (
    "id" int4 NOT NULL DEFAULT nextval('suppliers_id_seq'::regclass),
    "code" varchar(50) NOT NULL,
    "legal_name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "address" text,
    "tax_id" text,
    "payment_terms" text,
    "opening_balance" numeric(15,2) DEFAULT '0'::numeric,
    "active" bool NOT NULL DEFAULT true,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."user_company_roles";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS user_company_roles_id_seq;

-- Table Definition
CREATE TABLE "public"."user_company_roles" (
    "id" int4 NOT NULL DEFAULT nextval('user_company_roles_id_seq'::regclass),
    "user_id" varchar NOT NULL,
    "company_id" int4 NOT NULL,
    "role" text NOT NULL,
    "assigned_location_id" int4,
    "cash_account_id" int4,
    "pos_station" int4,
    "can_sell_negative_stock" bool NOT NULL DEFAULT false,
    "can_edit_daybook" bool NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."user_preferences";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS user_preferences_id_seq;

-- Table Definition
CREATE TABLE "public"."user_preferences" (
    "id" int4 NOT NULL DEFAULT nextval('user_preferences_id_seq'::regclass),
    "user_id" varchar NOT NULL,
    "date_format" text NOT NULL DEFAULT 'MM/DD/YYYY'::text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."voucher_entries";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS voucher_entries_id_seq;

-- Table Definition
CREATE TABLE "public"."voucher_entries" (
    "id" int4 NOT NULL DEFAULT nextval('voucher_entries_id_seq'::regclass),
    "voucher_id" int4 NOT NULL,
    "ledger_account_id" int4,
    "bank_account_id" int4,
    "fixed_asset_id" int4,
    "supplier_id" int4,
    "employee_id" int4,
    "debit_amount" numeric(20,2) DEFAULT '0'::numeric,
    "credit_amount" numeric(20,2) DEFAULT '0'::numeric,
    "narration" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."vouchers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS vouchers_id_seq;

-- Table Definition
CREATE TABLE "public"."vouchers" (
    "id" int4 NOT NULL DEFAULT nextval('vouchers_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "location_id" int4,
    "location_name" text,
    "voucher_number" varchar(100) NOT NULL,
    "voucher_type" text NOT NULL,
    "voucher_date" date NOT NULL,
    "description" text,
    "total_amount" numeric(20,2) NOT NULL,
    "optional" bool NOT NULL DEFAULT false,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."users";
-- Table Definition
CREATE TABLE "public"."users" (
    "id" varchar NOT NULL DEFAULT gen_random_uuid(),
    "username" text NOT NULL,
    "password" text NOT NULL,
    "active" bool NOT NULL DEFAULT true,
    "chatbot_enabled" bool NOT NULL DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "employee_inventory_access" bool DEFAULT false,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."session";
-- Table Definition
CREATE TABLE "public"."session" (
    "sid" varchar NOT NULL,
    "sess" json NOT NULL,
    "expire" timestamp NOT NULL,
    PRIMARY KEY ("sid")
);

DROP TABLE IF EXISTS "public"."container_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS container_items_id_seq;

-- Table Definition
CREATE TABLE "public"."container_items" (
    "id" int4 NOT NULL DEFAULT nextval('container_items_id_seq'::regclass),
    "container_id" int4 NOT NULL,
    "stock_item_id" int4,
    "item_name" text NOT NULL,
    "quantity" numeric(15,3) NOT NULL,
    "rate_per_kg" numeric(15,2) NOT NULL,
    "weight_kg" numeric(15,3) NOT NULL,
    "line_total" numeric(20,2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."stock_groups";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS stock_groups_id_seq;

-- Table Definition
CREATE TABLE "public"."stock_groups" (
    "id" int4 NOT NULL DEFAULT nextval('stock_groups_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "code" varchar(50) NOT NULL,
    "name" text NOT NULL,
    "parent_id" int4,
    "active" bool NOT NULL DEFAULT true,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "allocate_import_costs" bool DEFAULT false,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."containers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS containers_id_seq;

-- Table Definition
CREATE TABLE "public"."containers" (
    "id" int4 NOT NULL DEFAULT nextval('containers_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "container_number" varchar(100) NOT NULL,
    "supplier_id" int4 NOT NULL,
    "status" text NOT NULL DEFAULT 'OTW'::text,
    "import_date" date NOT NULL,
    "items_total" numeric(20,2) DEFAULT '0'::numeric,
    "charges_total" numeric(20,2) DEFAULT '0'::numeric,
    "grand_total" numeric(20,2) DEFAULT '0'::numeric,
    "item_name" text,
    "rate_per_kg" numeric(10,2),
    "total_kg" numeric(15,2),
    "carrier" text,
    "vessel_name" text,
    "origin_port" text,
    "destination_port" text,
    "departure_date" date,
    "estimated_arrival" date,
    "tracking_status" text,
    "last_location" text,
    "last_tracking_update" timestamp,
    "tracking_events" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "freight_total" numeric(20,2) DEFAULT 0,
    "other_charges_total" numeric(20,2) DEFAULT 0,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."assembly_inventory";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS assembly_inventory_id_seq;

-- Table Definition
CREATE TABLE "public"."assembly_inventory" (
    "id" int4 NOT NULL DEFAULT nextval('assembly_inventory_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "location_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "stage" text NOT NULL,
    "qty" int4 NOT NULL DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."assembly_tasks";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS assembly_tasks_id_seq;

-- Table Definition
CREATE TABLE "public"."assembly_tasks" (
    "id" int4 NOT NULL DEFAULT nextval('assembly_tasks_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "stock_item_name" text,
    "technician" text,
    "user" text,
    "action" text,
    "details" text,
    "qty" int4 DEFAULT 1,
    "status" text NOT NULL DEFAULT 'pending'::text,
    "completed" bool NOT NULL DEFAULT false,
    "date" date NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."customers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS customers_id_seq;

-- Table Definition
CREATE TABLE "public"."customers" (
    "id" int4 NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "ledger_account_id" int4,
    "code" varchar(50) NOT NULL,
    "legal_name" text NOT NULL,
    "phone" text,
    "opening_balance" numeric(15,2) DEFAULT '0'::numeric,
    "opening_balance_side" varchar(2) DEFAULT 'Dr'::character varying,
    "active" bool NOT NULL DEFAULT true,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "whatsapp" text,
    "email" text,
    "location_id" int4,
    "customer_type" text,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."assembly_history";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS assembly_history_id_seq;

-- Table Definition
CREATE TABLE "public"."assembly_history" (
    "id" int4 NOT NULL DEFAULT nextval('assembly_history_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "location_id" int4 NOT NULL,
    "user_id" varchar NOT NULL,
    "username" text,
    "stock_item_id" int4 NOT NULL,
    "stock_item_name" text,
    "action_type" text NOT NULL,
    "from_stage" text,
    "to_stage" text,
    "qty_changed" int4 NOT NULL,
    "description" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "technician" text,
    "status" text DEFAULT 'pending'::text,
    "completed" bool DEFAULT false,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."inventory";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS inventory_id_seq;

-- Table Definition
CREATE TABLE "public"."inventory" (
    "id" int4 NOT NULL DEFAULT nextval('inventory_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "location_id" int4 NOT NULL,
    "stock_item_id" int4 NOT NULL,
    "quantity" numeric(15,3) NOT NULL DEFAULT '0'::numeric,
    "average_rate" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "total_value" numeric(20,2) NOT NULL DEFAULT '0'::numeric,
    "last_updated" timestamp NOT NULL DEFAULT now(),
    "color" text,
    "assigned_status" text,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."bike_purchases";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS bike_purchases_id_seq;

-- Table Definition
CREATE TABLE "public"."bike_purchases" (
    "id" int4 NOT NULL DEFAULT nextval('bike_purchases_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "customer_id" int4 NOT NULL,
    "bike_model" text NOT NULL,
    "color" varchar(50),
    "sale_date" date NOT NULL,
    "invoice_number" varchar(100),
    "warranty_start_date" date,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."part_purchases";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS part_purchases_id_seq;

-- Table Definition
CREATE TABLE "public"."part_purchases" (
    "id" int4 NOT NULL DEFAULT nextval('part_purchases_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "customer_id" int4 NOT NULL,
    "part_name" text NOT NULL,
    "quantity" int4 NOT NULL DEFAULT 1,
    "price" numeric(15,2) NOT NULL,
    "purchase_date" date NOT NULL,
    "linked_invoice" varchar(100),
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."service_history";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS service_history_id_seq;

-- Table Definition
CREATE TABLE "public"."service_history" (
    "id" int4 NOT NULL DEFAULT nextval('service_history_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "customer_id" int4 NOT NULL,
    "service_date" date NOT NULL,
    "bike_model" text NOT NULL,
    "mileage" int4,
    "service_type" varchar(50) NOT NULL,
    "parts_used" text,
    "technician_name" varchar(100),
    "notes" text,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."warranties";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS warranties_id_seq;

-- Table Definition
CREATE TABLE "public"."warranties" (
    "id" int4 NOT NULL DEFAULT nextval('warranties_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "customer_id" int4 NOT NULL,
    "bike_model" text NOT NULL,
    "warranty_start_date" date NOT NULL,
    "warranty_duration" int4 NOT NULL,
    "warranty_status" varchar(20) NOT NULL DEFAULT 'Active'::character varying,
    "void_reason" text,
    "notes" text,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."communication_logs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS communication_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."communication_logs" (
    "id" int4 NOT NULL DEFAULT nextval('communication_logs_id_seq'::regclass),
    "company_id" int4 NOT NULL,
    "customer_id" int4 NOT NULL,
    "contact_date" date NOT NULL,
    "contact_type" varchar(20) NOT NULL,
    "notes" text,
    "deleted_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

INSERT INTO "public"."employees" ("id", "company_id", "code", "first_name", "last_name", "email", "phone", "join_date", "department", "employee_type", "monthly_salary", "opening_balance", "current_balance", "total_deposits", "total_withdrawals", "active", "deleted_at", "created_at") VALUES
(1, 1, 'Mon1', 'Montage ', 'One ', NULL, NULL, '2026-01-01', 'Montage', 'Employee', 100.00, 0.00, 0.00, 0.00, 0.00, 'f', '2026-01-01 19:36:21.504', '2026-01-01 17:28:47.120668'),
(2, 1, 'MONONE', 'Montage ', 'One ', NULL, NULL, '2026-01-01', 'Montage', 'Worker', 0.00, 0.00, 0.00, 0.00, 0.00, 'f', '2026-01-04 16:43:03.514', '2026-01-01 19:37:03.119453'),
(3, 1, 'RAPMON', 'Raphael', 'Montage', NULL, NULL, '2026-01-04', 'Montage', 'Worker', 0.00, 0.00, 0.00, 0.00, 0.00, 't', NULL, '2026-01-04 16:43:33.480535');

INSERT INTO "public"."companies" ("id", "code", "name", "active", "created_at") VALUES
(1, 'HHM', 'HuangHe Motors', 't', '2025-12-15 20:04:06.768537');

INSERT INTO "public"."container_charges" ("id", "container_id", "charge_type", "amount", "ledger_account_id", "created_at") VALUES
(5, 7, 'Freight', 6600.00, NULL, '2025-12-28 16:43:31.111975'),
(6, 8, 'Freight', 6600.00, NULL, '2025-12-28 17:41:00.239255');

INSERT INTO "public"."container_offloads" ("id", "container_id", "location_id", "duties", "office_charges", "transfer_charges", "transport_fees", "total_charges", "total_bales", "additional_cost_per_bale", "offloaded_at") VALUES
(1, 7, 1, 16500.00, 0.00, 0.00, 8400.00, 31500.00, 44.000, 715.91, '2025-12-27 00:00:00'),
(2, 8, 1, 16500.00, 0.00, 0.00, 8400.00, 31500.00, 30.000, 1050.00, '2025-12-27 00:00:00');

INSERT INTO "public"."ledger_accounts" ("id", "company_id", "code", "name", "account_type", "sub_type", "parent_id", "opening_balance", "opening_balance_side", "active", "deleted_at", "created_at") VALUES
(1, 1, 'PURCHASES', 'Container Cost FOB', 'Expense', NULL, NULL, 0.00, 'Dr', 't', NULL, '2025-12-16 21:09:03.233779'),
(2, 1, 'IMPORT_CHARGES', 'Import Charges', 'Expense', NULL, NULL, 0.00, 'Dr', 'f', '2026-01-01 18:18:40.013', '2025-12-16 21:09:03.238962'),
(3, 1, 'STACAP', 'Starting Capital', 'Equity', NULL, NULL, 200000.00, 'Dr', 't', NULL, '2025-12-28 16:02:43.82939'),
(4, 1, 'PATDJA', 'Patrick Djamba', 'Expense', NULL, NULL, 0.00, NULL, 't', NULL, '2025-12-28 16:34:11.768154'),
(5, 1, 'SUP', 'Superman', 'Expense', NULL, NULL, 0.00, NULL, 't', NULL, '2025-12-28 16:34:28.744201'),
(6, 1, 'EXPENSES', 'Duties + Transport ', 'Expense', '', NULL, 0.00, 'Dr', 't', NULL, '2025-12-28 17:21:14.67239'),
(7, 1, 'DUTIES', 'Duties', 'Expense', 'Direct Expense', 6, 0.00, 'Dr', 't', NULL, '2025-12-28 17:21:14.677961'),
(8, 1, 'TRANSPORT', 'Transport Charges', 'Expense', 'Direct Expense', 6, 0.00, 'Dr', 't', NULL, '2025-12-28 17:21:14.694598'),
(9, 1, 'SHOREN', 'Shop Rent', 'Operating Expenses', NULL, NULL, 0.00, NULL, 't', NULL, '2025-12-28 17:32:32.835854'),
(10, 1, 'SALREV', 'Sales Lubumbashi', 'Cash', NULL, NULL, 0.00, NULL, 't', NULL, '2025-12-28 17:48:00.796465'),
(11, 1, 'SALES', 'Sales Revenue', 'Income', NULL, NULL, 0.00, NULL, 'f', '2025-12-28 19:23:38.833', '2025-12-28 17:52:26.15931'),
(12, 1, 'SALES', 'Sales Revenue', 'Income', NULL, NULL, 0.00, NULL, 'f', '2025-12-28 19:38:52.699', '2025-12-28 19:37:17.661408'),
(13, 1, 'SALES', 'Sales Revenue - All Locations', 'Income', NULL, NULL, 0.00, NULL, 't', NULL, '2025-12-28 19:39:17.79642'),
(14, 1, 'DAIEXP', 'Daily Expenses', 'Expense', NULL, NULL, 0.00, NULL, 'f', '2026-01-01 17:55:55.172', '2026-01-01 17:24:42.17548'),
(15, 1, 'OPEEXP', 'Operating Expenses', 'Expense', NULL, NULL, 0.00, NULL, 'f', '2026-01-01 18:20:16.034', '2026-01-01 17:56:21.295902'),
(16, 1, 'EMPSAL', 'Employee Salaries ', 'Operating Expenses', NULL, NULL, 0.00, NULL, 'f', '2026-01-01 20:06:30.152', '2026-01-01 19:02:30.839487'),
(17, 1, 'SAL', 'Salaries', 'Operating Expenses', NULL, NULL, 0.00, NULL, 't', NULL, '2026-01-01 19:03:04.848794'),
(18, 1, 'WAREMP', 'Warehouse Employees', 'Operating Expenses', NULL, NULL, 0.00, NULL, 'f', '2026-01-01 20:06:47.012', '2026-01-01 19:04:02.870165'),
(19, 1, 'GENEXP', 'General Expenses ', 'Operating Expenses', NULL, NULL, 0.00, NULL, 'f', '2026-01-01 20:27:43.362', '2026-01-01 20:08:05.224919'),
(20, 1, 'WAREMP', 'Warehouse Employee Salaries', 'Expense', NULL, NULL, 0.00, NULL, 'f', '2026-01-01 20:10:49.44', '2026-01-01 20:09:13.603987'),
(21, 1, 'WAREMP', 'General Expenses', 'Operating Expenses', NULL, NULL, 0.00, NULL, 't', NULL, '2026-01-01 20:26:23.356125'),
(22, 1, 'GOVPAY', 'Government Payments', 'Operating Expenses', NULL, NULL, 0.00, NULL, 't', NULL, '2026-01-04 16:40:02.537812'),
(23, 1, 'WAREXP', 'Warehouse Expenses', 'Operating Expenses', NULL, NULL, 0.00, NULL, 'f', '2026-01-04 17:17:29.128', '2026-01-04 16:47:38.991663');

INSERT INTO "public"."locations" ("id", "company_id", "code", "name", "city", "state", "country", "active", "deleted_at", "created_at") VALUES
(1, 1, 'RTLK1', 'Depot Route Likasi', 'Lubumbashi', 'Katanga', 'DRC', 't', NULL, '2025-12-28 16:45:34.186596'),
(2, 1, 'SHOPBO', 'Shop Boulevard M''Siri', '', '', '', 'f', '2026-01-01 19:10:18.851', '2025-12-28 17:47:38.076325'),
(3, 1, 'HQBOUL', 'HQ Boulevard M''Siri', '', '', '', 't', NULL, '2026-01-01 19:24:20.811544');

INSERT INTO "public"."sales_items" ("id", "voucher_id", "stock_item_id", "quantity", "selling_price", "cost_price", "total_sales", "total_cost", "profit", "created_at") VALUES
(14, 43, 151, 1.000, 3000.00, 1955.91, 3000.00, 1955.91, 1044.09, '2026-03-21 22:22:55.39304'),
(15, 44, 151, 2.000, 2925.00, 1955.91, 5850.00, 3911.82, 1938.18, '2026-03-21 22:28:40.266139'),
(16, 45, 151, 1.000, 2950.00, 1955.91, 2950.00, 1955.91, 994.09, '2026-03-21 22:29:31.798935'),
(17, 46, 152, 2.000, 3850.00, 2565.00, 7700.00, 5130.00, 2570.00, '2026-03-21 22:32:41.146808'),
(18, 47, 152, 1.000, 3900.00, 2565.00, 3900.00, 2565.00, 1335.00, '2026-03-21 22:33:37.376992'),
(19, 48, 151, 2.000, 2900.00, 1955.91, 5800.00, 3911.82, 1888.18, '2026-03-21 22:35:43.741833'),
(20, 49, 151, 1.000, 2900.00, 1955.91, 2900.00, 1955.91, 944.09, '2026-03-21 22:36:33.896181');

INSERT INTO "public"."stock_items" ("id", "company_id", "code", "name", "stock_group_id", "uom", "opening_qty", "opening_rate", "opening_value", "reorder_level", "selling_price", "active", "deleted_at", "created_at") VALUES
(76, 1, 'M-01', 'Cylinder head assy', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.750358'),
(77, 1, 'M-02', 'Cylinder body', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.755995'),
(78, 1, 'M-03', 'L.cover.cylinder body', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.761114'),
(79, 1, 'M-04', 'R.cover.cylinder body', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.766551'),
(80, 1, 'M-05', 'Exhaust valve', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.771709'),
(81, 1, 'M-06', 'Inlet valve', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.778661'),
(82, 1, 'M-07', 'Oil guard comp', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.784232'),
(83, 1, 'M-08', 'Outer spring valve seat', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.789813'),
(84, 1, 'M-09', 'Rotor assy , magneto', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.795322'),
(85, 1, 'M-10', 'Stator assy , magneto', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.800619'),
(86, 1, 'M-11', 'Rub slice (Part 9 from Clutch)', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.805825'),
(87, 1, 'M-12', 'Clutch assy', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.810995'),
(88, 1, 'M-13', 'Circlip', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.815789'),
(89, 1, 'M-14', 'Piston', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.821105'),
(90, 1, 'M-15', 'Piston pin', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.829077'),
(91, 1, 'M-16', 'Piston ring comp', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.837488'),
(92, 1, 'M-17', 'Oil pump', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.842706'),
(93, 1, 'Z-01', 'rim,Rear wheel', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.847838'),
(94, 1, 'Z-02', 'Rim, Front wheel', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.853215'),
(95, 1, 'S-01', 'front shock absorber with axle', 6, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.858511'),
(96, 1, 'A-01', 'bracket,head light', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.863862'),
(97, 1, 'A-02', 'front mud guard', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.869158'),
(98, 1, 'A-03', 'head light', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.874472'),
(99, 1, 'A-04', 'turning light', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.879817'),
(100, 1, 'A-05', 'front shock absorber decorative cover', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.887687'),
(101, 1, 'A-06', 'Fr.brake cable', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.893259'),
(102, 1, 'A-07', 'clutch cable', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.898974'),
(103, 1, 'A-08', 'throttle cable', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.904676'),
(104, 1, 'A-09', 'water tank', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.910701'),
(105, 1, 'A-10', 'cover, water tank', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.916457'),
(106, 1, 'T-01', 'Gear Lever', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.921624'),
(107, 1, 'A-11', 'Rear Mirrors', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.926697'),
(108, 1, 'A-12', 'lock,cargo box with rubber', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.93236'),
(109, 1, 'B', 'battery with electrolyte', 7, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.937663'),
(110, 1, 'T-02', '11 Teeth', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.943007'),
(111, 1, 'T-03', '14 Teeth', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.948269'),
(112, 1, 'T-04', 'Angle teeth no. 13', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.953261'),
(113, 1, 'T-09', 'reduction box', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.958427'),
(114, 1, 'A-13', 'Brake shoes', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.963471'),
(115, 1, 'M-18', 'radiator with fan', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.96851'),
(116, 1, 'A-14', 'Side fenders', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.973671'),
(117, 1, 'Z-03', 'Front Drum assy', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.978662'),
(118, 1, 'X-01', 'raincoat', 8, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.984018'),
(119, 1, 'X-02', 'T-shirt', 8, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.989322'),
(120, 1, 'Z-04', 'Rear Tire for Super 300', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:04.995033'),
(121, 1, 'Z-05', 'Tire 5.00-12', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.001005'),
(122, 1, 'Z-06', 'Tire 5.50-13', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.006114'),
(123, 1, 'M-100', 'engine', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.011404'),
(124, 1, 'T-05', 'rear axle', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.017466'),
(125, 1, 'E-01', 'ignition lock', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.022517'),
(126, 1, 'T-06', 'Gear box', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.027531'),
(127, 1, 'A-15', 'front exhaust  pipe', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.033002'),
(128, 1, 'A-16', 'rear muffler', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.040746'),
(129, 1, 'T-07', 'transmission  shaft', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.046043'),
(130, 1, 'A-17', 'Nut  M14x1.5 L&R', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.051131'),
(131, 1, 'A-18', 'Bolt  M8x16', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.057454'),
(132, 1, 'E-02', 'Speedometer', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.063427'),
(133, 1, 'E-03', 'MP3', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.068937'),
(134, 1, 'A-19', 'steering bar', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.074121'),
(135, 1, 'E-04', 'handle switch', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.079225'),
(136, 1, 'E-05', 'L.&R. lever & connect seat', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.084375'),
(137, 1, 'A-20', 'grip, l&r', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.089475'),
(138, 1, 'E-06', 'wiring harness with accessories', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.09451'),
(139, 1, 'E-07', 'CDI', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.102626'),
(140, 1, 'E-08', 'ignition coils', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.108857'),
(141, 1, 'E-09', 'relay', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.115115'),
(142, 1, 'E-10', 'rectifier', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.122603'),
(143, 1, 'E-11', 'flasher', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.128361'),
(144, 1, 'E-12', 'horn', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.133838'),
(145, 1, 'E-13', 'reverse horn', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.139317'),
(146, 1, 'M-19', 'inlet pipe', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.144378'),
(147, 1, 'M-20', 'carburetor with oil pipe 300mm', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.149488'),
(148, 1, 'M-21', 'air cleaner', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.154488'),
(149, 1, 'T-08', 'Kick Starter', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.159506'),
(150, 1, 'A-21', 'Fuel tank cover', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:07:05.164513'),
(151, 1, 'EG200', 'Eagle 200 ', 11, 'QTY', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:15:19.259196'),
(152, 1, 'SP300', 'Super 300', 11, 'QTY', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:15:39.777592'),
(153, 1, 'TS200', 'Trans 200 ', 11, 'QTY', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-15 21:16:03.41318'),
(154, 1, 'M-501', 'Cylinder head assy', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.265405'),
(155, 1, 'M-502', 'Cylinder body', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.270225'),
(156, 1, 'M-503', 'L.cover.cylinder body', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.275512'),
(157, 1, 'M-504', 'R.cover.cylinder body', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.279432'),
(158, 1, 'M-505', 'Exhaust valve', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.28315'),
(159, 1, 'M-506', 'Inlet valve', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.287218'),
(160, 1, 'M-507', 'Oil guard comp', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.298336'),
(161, 1, 'M-508', 'Outer spring valve seat', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.302768'),
(162, 1, 'M-509', 'Rotor assy , magneto', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.307107'),
(163, 1, 'M-510', 'Stator assy , magneto', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.312062'),
(164, 1, 'M-511', 'Rub slice (Part 9 from Clutch)', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.316366'),
(165, 1, 'M-512', 'Clutch assy', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.36826'),
(166, 1, 'M-513', 'Circlip', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.375335'),
(167, 1, 'M-514', 'Piston', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.380313'),
(168, 1, 'M-515', 'Piston pin', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.384075'),
(169, 1, 'M-516', 'Piston ring comp', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.387681'),
(170, 1, 'M-517', 'Oil pump', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.391318'),
(171, 1, 'Z-501', 'rim,Rear wheel', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.394835'),
(172, 1, 'Z-502', 'Rim, Front wheel', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.398347'),
(173, 1, 'S-501', 'front shock absorber with axle', 6, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.401683'),
(174, 1, 'A-501', 'bracket,head light', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.405679'),
(175, 1, 'A-502', 'front mud guard', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.410991'),
(176, 1, 'A-503', 'head light', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.418951'),
(177, 1, 'A-504', 'turning light', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.426995'),
(178, 1, 'A-505', 'front shock absorber decorative cover', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.44378'),
(179, 1, 'A-506', 'Fr.brake cable', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.447738'),
(180, 1, 'A-507', 'clutch cable', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.451372'),
(181, 1, 'A-508', 'throttle cable', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.455436'),
(182, 1, 'A-509', 'water tank', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.459345'),
(183, 1, 'A-510', 'cover, water tank', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.463121'),
(184, 1, 'T-501', 'Gear Lever', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.466892'),
(185, 1, 'A-511', 'Rear Mirrors', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.470627'),
(186, 1, 'A-512', 'lock,cargo box with rubber', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.47455'),
(187, 1, 'B 300', 'battery with electrolyte', 7, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.478163'),
(188, 1, 'T-502', '11 Teeth', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.481658'),
(189, 1, 'T-503', '14 Teeth', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.486113'),
(190, 1, 'T-504', 'Angle teeth no. 13', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.490699'),
(191, 1, 'T-509', 'reduction box', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.494376'),
(192, 1, 'A-513', 'Brake shoes', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.49838'),
(193, 1, 'M-518', 'radiator with fan', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.50247'),
(194, 1, 'A-514', 'Side fenders', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.506332'),
(195, 1, 'Z-503', 'Front Drum assy', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.510282'),
(196, 1, 'X-501', 'raincoat', 8, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.514146'),
(197, 1, 'X-502', 'T-shirt', 8, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.517946'),
(198, 1, 'Z-504', 'Rear Tire for Super 300', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.522063'),
(199, 1, 'Z-505', 'Tire 5.00-12', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.528336'),
(200, 1, 'Z-506', 'Tire 5.50-13', 5, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.533611'),
(201, 1, 'M-5100', 'engine', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.537596'),
(202, 1, 'T-505', 'rear axle', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.543199'),
(203, 1, 'E-501', 'ignition lock', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.54781'),
(204, 1, 'T-506', 'Gear box', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.571596'),
(205, 1, 'A-515', 'front exhaust  pipe', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.576854'),
(206, 1, 'A-516', 'rear muffler', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.580749'),
(207, 1, 'T-507', 'transmission  shaft', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.584393'),
(208, 1, 'A-517', 'Nut  M14x1.5 L&R', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.588268'),
(209, 1, 'A-518', 'Bolt  M8x16', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.59182'),
(210, 1, 'E-502', 'Speedometer', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.595129'),
(211, 1, 'E-503', 'MP3', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.598665'),
(212, 1, 'A-519', 'steering bar', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.603145'),
(213, 1, 'E-504', 'handle switch', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.606605'),
(214, 1, 'E-505', 'L.&R. lever & connect seat', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.610112'),
(215, 1, 'A-520', 'grip, l&r', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.613648'),
(216, 1, 'E-506', 'wiring harness with accessories', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.618067'),
(217, 1, 'E-507', 'CDI', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.626501'),
(218, 1, 'E-508', 'ignition coils', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.665626'),
(219, 1, 'E-509', 'relay', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.692636'),
(220, 1, 'E-510', 'rectifier', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.696593'),
(221, 1, 'E-511', 'flasher', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.700472'),
(222, 1, 'E-512', 'horn', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.70415'),
(223, 1, 'E-513', 'reverse horn', 3, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.707948'),
(224, 1, 'M-519', 'inlet pipe', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.711647'),
(225, 1, 'M-520', 'carburetor with oil pipe 300mm', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.715577'),
(226, 1, 'M-521', 'air cleaner', 1, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.720229'),
(227, 1, 'T-508', 'Kick Starter', 2, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.723757'),
(228, 1, 'A-521', 'Fuel tank cover', 4, 'PCS', 0.000, 0.00, 0.00, 0.000, 0.00, 't', NULL, '2025-12-16 20:22:54.729346');

INSERT INTO "public"."stock_transfer_items" ("id", "transfer_id", "stock_item_id", "source_location_id", "quantity", "rate", "total_amount", "created_at") VALUES
(12, 5, 151, 1, 7.000, 1955.91, 13691.37, '2026-03-21 22:16:30.348568'),
(13, 6, 152, 1, 2.000, 2565.00, 5130.00, '2026-03-21 22:18:05.052735'),
(14, 7, 153, 1, 5.000, 2100.00, 10500.00, '2026-03-21 22:18:29.797121');

INSERT INTO "public"."stock_transfer_vouchers" ("id", "voucher_id", "source_location_id", "destination_location_id", "notes", "created_at") VALUES
(5, 40, 1, 3, '1 Steve, 2 Adi, 1 Kindu, 3 Amir connect ', '2026-03-21 22:16:30.348568'),
(6, 41, 1, 3, '', '2026-03-21 22:18:05.052735'),
(7, 42, 1, 3, '', '2026-03-21 22:18:29.797121');

INSERT INTO "public"."suppliers" ("id", "code", "legal_name", "email", "phone", "address", "tax_id", "payment_terms", "opening_balance", "active", "deleted_at", "created_at") VALUES
(1, 'HUANGHE', 'HuangHe China', '', '', '', '', '', 0.00, 't', NULL, '2025-12-15 21:08:04.533023');

INSERT INTO "public"."user_company_roles" ("id", "user_id", "company_id", "role", "assigned_location_id", "cash_account_id", "pos_station", "can_sell_negative_stock", "can_edit_daybook", "created_at") VALUES
(1, 'f1ff03f5-d693-4c7d-9b58-54d6f5b64143', 1, 'Admin', NULL, NULL, NULL, 'f', 't', '2025-12-15 20:04:26.099855'),
(2, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 1, 'Admin', NULL, NULL, NULL, 'f', 't', '2025-12-15 21:23:33.544785');

INSERT INTO "public"."voucher_entries" ("id", "voucher_id", "ledger_account_id", "bank_account_id", "fixed_asset_id", "supplier_id", "employee_id", "debit_amount", "credit_amount", "narration", "created_at") VALUES
(5, 3, NULL, NULL, NULL, 1, NULL, 120000.00, 0.00, 'Payment - HuangHe China', '2025-12-28 16:28:25.083607'),
(6, 3, 3, NULL, NULL, NULL, NULL, 0.00, 120000.00, 'Payment - HuangHe China', '2025-12-28 16:28:25.083607'),
(9, 5, 1, NULL, NULL, NULL, NULL, 61160.00, 0.00, 'Container OOLU 9409023 manual import', '2025-12-28 16:43:31.536651'),
(10, 5, NULL, NULL, NULL, 1, NULL, 0.00, 61160.00, 'Container OOLU 9409023 manual import', '2025-12-28 16:43:31.538845'),
(11, 6, 7, NULL, NULL, NULL, NULL, 16500.00, 0.00, 'Duties for container OOLU 9409023', '2025-12-28 17:21:14.684959'),
(12, 6, 4, NULL, NULL, NULL, NULL, 0.00, 16500.00, 'Duties for container OOLU 9409023', '2025-12-28 17:21:14.68804'),
(13, 7, 8, NULL, NULL, NULL, NULL, 8400.00, 0.00, 'Transport fees for container OOLU 9409023', '2025-12-28 17:21:14.701602'),
(14, 7, 5, NULL, NULL, NULL, NULL, 0.00, 8400.00, 'Transport fees for container OOLU 9409023', '2025-12-28 17:21:14.704458'),
(15, 8, 4, NULL, NULL, NULL, NULL, 33000.00, 0.00, 'Payment - Patrick Djamba', '2025-12-28 17:29:18.645816'),
(16, 8, 3, NULL, NULL, NULL, NULL, 0.00, 33000.00, 'Payment - Patrick Djamba', '2025-12-28 17:29:18.645816'),
(17, 9, 5, NULL, NULL, NULL, NULL, 13500.00, 0.00, 'Payment - Superman', '2025-12-28 17:31:31.628105'),
(18, 9, 3, NULL, NULL, NULL, NULL, 0.00, 13500.00, 'Payment - Superman', '2025-12-28 17:31:31.628105'),
(19, 10, 9, NULL, NULL, NULL, NULL, 24000.00, 0.00, 'Payment - Shop Rent', '2025-12-28 17:33:48.869673'),
(20, 10, 3, NULL, NULL, NULL, NULL, 0.00, 24000.00, 'Payment - Shop Rent', '2025-12-28 17:33:48.869673'),
(21, 11, 1, NULL, NULL, NULL, NULL, 42750.00, 0.00, 'Container FCIU 9583629 manual import', '2025-12-28 17:41:00.820554'),
(22, 11, NULL, NULL, NULL, 1, NULL, 0.00, 42750.00, 'Container FCIU 9583629 manual import', '2025-12-28 17:41:00.824259'),
(23, 12, 7, NULL, NULL, NULL, NULL, 16500.00, 0.00, 'Duties for container FCIU 9583629', '2025-12-28 17:43:41.152873'),
(24, 12, 4, NULL, NULL, NULL, NULL, 0.00, 16500.00, 'Duties for container FCIU 9583629', '2025-12-28 17:43:41.155414'),
(25, 13, 8, NULL, NULL, NULL, NULL, 8400.00, 0.00, 'Transport fees for container FCIU 9583629', '2025-12-28 17:43:41.162404'),
(26, 13, 5, NULL, NULL, NULL, NULL, 0.00, 8400.00, 'Transport fees for container FCIU 9583629', '2025-12-28 17:43:41.164877'),
(51, 29, 22, NULL, NULL, NULL, NULL, 2200.00, 0.00, 'Payment - Government Payments', '2026-01-04 16:41:32.26135'),
(52, 29, 3, NULL, NULL, NULL, NULL, 0.00, 2200.00, 'Payment - Government Payments', '2026-01-04 16:41:32.26135'),
(61, 33, 21, NULL, NULL, NULL, NULL, 500.00, 0.00, 'Payment - General Expenses', '2026-01-04 17:19:17.258365'),
(62, 33, 3, NULL, NULL, NULL, NULL, 0.00, 500.00, 'Payment - General Expenses', '2026-01-04 17:19:17.258365'),
(73, 43, 10, NULL, NULL, NULL, NULL, 3000.00, 0.00, 'POS Sale - SALES-1774131775378', '2026-03-21 22:22:55.383866'),
(74, 43, 13, NULL, NULL, NULL, NULL, 0.00, 3000.00, 'POS Sale - SALES-1774131775378', '2026-03-21 22:22:55.386153'),
(75, 44, 10, NULL, NULL, NULL, NULL, 5850.00, 0.00, 'POS Sale - SALES-1774132120247', '2026-03-21 22:28:40.25441'),
(76, 44, 13, NULL, NULL, NULL, NULL, 0.00, 5850.00, 'POS Sale - SALES-1774132120247', '2026-03-21 22:28:40.257373'),
(77, 45, 10, NULL, NULL, NULL, NULL, 2950.00, 0.00, 'POS Sale - SALES-1774132171778', '2026-03-21 22:29:31.786991'),
(78, 45, 13, NULL, NULL, NULL, NULL, 0.00, 2950.00, 'POS Sale - SALES-1774132171778', '2026-03-21 22:29:31.7902'),
(79, 46, 10, NULL, NULL, NULL, NULL, 7700.00, 0.00, 'POS Sale - SALES-1774132361124', '2026-03-21 22:32:41.133145'),
(80, 46, 13, NULL, NULL, NULL, NULL, 0.00, 7700.00, 'POS Sale - SALES-1774132361124', '2026-03-21 22:32:41.136164'),
(81, 47, 10, NULL, NULL, NULL, NULL, 3900.00, 0.00, 'POS Sale - SALES-1774132417359', '2026-03-21 22:33:37.366223'),
(82, 47, 13, NULL, NULL, NULL, NULL, 0.00, 3900.00, 'POS Sale - SALES-1774132417359', '2026-03-21 22:33:37.368983'),
(83, 48, 10, NULL, NULL, NULL, NULL, 5800.00, 0.00, 'POS Sale - SALES-1774132543729', '2026-03-21 22:35:43.7343'),
(84, 48, 13, NULL, NULL, NULL, NULL, 0.00, 5800.00, 'POS Sale - SALES-1774132543729', '2026-03-21 22:35:43.736277'),
(85, 49, 10, NULL, NULL, NULL, NULL, 2900.00, 0.00, 'POS Sale - SALES-1774132593883', '2026-03-21 22:36:33.888887'),
(86, 49, 13, NULL, NULL, NULL, NULL, 0.00, 2900.00, 'POS Sale - SALES-1774132593883', '2026-03-21 22:36:33.890888');

INSERT INTO "public"."vouchers" ("id", "company_id", "location_id", "location_name", "voucher_number", "voucher_type", "voucher_date", "description", "total_amount", "optional", "deleted_at", "created_at") VALUES
(3, 1, NULL, NULL, 'PAYMENT-1766939305082', 'Payment', '2025-08-01', 'First Transfer Through Ahmad Yehya Lubumbashi From Goma Account', 120000.00, 'f', NULL, '2025-12-28 16:28:25.083607'),
(5, 1, NULL, NULL, 'MCONT-7', 'Purchase', '2025-08-01', 'Manual Container OOLU 9409023 - Eagle 200 ', 61160.00, 'f', NULL, '2025-12-28 16:43:31.534129'),
(6, 1, NULL, NULL, 'DUTY-OOLU 9409023-1766942474680', 'Payment', '2025-12-27', 'Duties for container OOLU 9409023', 16500.00, 'f', NULL, '2025-12-28 17:21:14.681428'),
(7, 1, NULL, NULL, 'TRANS-OOLU 9409023-1766942474696', 'Payment', '2025-12-27', 'Transport fees for container OOLU 9409023', 8400.00, 'f', NULL, '2025-12-28 17:21:14.698381'),
(8, 1, NULL, NULL, 'PAYMENT-1766942958644', 'Payment', '2025-12-26', 'Duty Payment For OOLU 9409023 & FCIU 9583629', 33000.00, 'f', NULL, '2025-12-28 17:29:18.645816'),
(9, 1, NULL, NULL, 'PAYMENT-1766943091627', 'Payment', '2025-12-08', 'Part Payment for transport on Containers FCIU 9583629 & OOLU 9409023', 13500.00, 'f', NULL, '2025-12-28 17:31:31.628105'),
(10, 1, NULL, NULL, 'PAYMENT-1766943228869', 'Payment', '2025-12-15', 'Guarantee 3 Months & Rent 3 Months', 24000.00, 'f', NULL, '2025-12-28 17:33:48.869673'),
(11, 1, NULL, NULL, 'MCONT-8', 'Purchase', '2025-08-01', 'Manual Container FCIU 9583629 - Trans 200 , Super 300', 42750.00, 'f', NULL, '2025-12-28 17:41:00.816818'),
(12, 1, NULL, NULL, 'DUTY-FCIU 9583629-1766943821149', 'Payment', '2025-12-27', 'Duties for container FCIU 9583629', 16500.00, 'f', NULL, '2025-12-28 17:43:41.150149'),
(13, 1, NULL, NULL, 'TRANS-FCIU 9583629-1766943821159', 'Payment', '2025-12-27', 'Transport fees for container FCIU 9583629', 8400.00, 'f', NULL, '2025-12-28 17:43:41.159692'),
(29, 1, NULL, NULL, 'PAYMENT-1767544892255', 'Payment', '2026-01-04', 'All documents for 2026 and the company opening, including shop documents.', 2200.00, 'f', NULL, '2026-01-04 16:41:32.26135'),
(33, 1, NULL, NULL, 'PAYMENT-1767547157254', 'Payment', '2026-01-04', NULL, 500.00, 'f', NULL, '2026-01-04 17:19:17.258365'),
(40, 1, NULL, NULL, 'TRANSFER-1774131389430', 'StockTransfer', '2026-02-23', 'Stock transfer from Depot Route Likasi to HQ Boulevard M''Siri', 13691.37, 'f', NULL, '2026-03-21 22:16:29.898117'),
(41, 1, NULL, NULL, 'TRANSFER-1774131483762', 'StockTransfer', '2026-02-23', 'Stock transfer from Depot Route Likasi to HQ Boulevard M''Siri', 5130.00, 'f', NULL, '2026-03-21 22:18:04.241455'),
(42, 1, NULL, NULL, 'TRANSFER-1774131508947', 'StockTransfer', '2026-03-22', 'Stock transfer from Depot Route Likasi to HQ Boulevard M''Siri', 10500.00, 'f', NULL, '2026-03-21 22:18:29.430854'),
(43, 1, 3, 'HQ Boulevard M''Siri', 'SALES-1774131775378', 'Sales', '2026-02-25', 'Steve @ Forteresse International (FARDC)', 3000.00, 'f', NULL, '2026-03-21 22:22:55.381073'),
(44, 1, 3, 'HQ Boulevard M''Siri', 'SALES-1774132120247', 'Sales', '2026-02-27', 'POS Sale at HQ Boulevard M''Siri', 5850.00, 'f', NULL, '2026-03-21 22:28:40.250836'),
(45, 1, 3, 'HQ Boulevard M''Siri', 'SALES-1774132171778', 'Sales', '2026-02-26', 'POS Sale at HQ Boulevard M''Siri', 2950.00, 'f', NULL, '2026-03-21 22:29:31.782754'),
(46, 1, 3, 'HQ Boulevard M''Siri', 'SALES-1774132361124', 'Sales', '2026-03-03', 'FARDC Kinshasa lead', 7700.00, 'f', NULL, '2026-03-21 22:32:41.12959'),
(47, 1, 3, 'HQ Boulevard M''Siri', 'SALES-1774132417359', 'Sales', '2026-03-07', 'SDCC -Construction Company', 3900.00, 'f', NULL, '2026-03-21 22:33:37.362952'),
(48, 1, 3, 'HQ Boulevard M''Siri', 'SALES-1774132543729', 'Sales', '2026-03-18', 'Amir lead sale to indian guy 1/2', 5800.00, 'f', NULL, '2026-03-21 22:35:43.731664'),
(49, 1, 3, 'HQ Boulevard M''Siri', 'SALES-1774132593883', 'Sales', '2026-03-21', 'Amir Lead sale Indian 2/2', 2900.00, 'f', NULL, '2026-03-21 22:36:33.886403');

INSERT INTO "public"."users" ("id", "username", "password", "active", "chatbot_enabled", "created_at", "employee_inventory_access") VALUES
('bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', '$2b$12$VTl3jGg9fIIekyUh7G20tObqoGC0RFxNycv2G/2WDr.9TA/YbMXr.', 't', 'f', '2025-12-15 21:21:16.852773', 'f'),
('f1ff03f5-d693-4c7d-9b58-54d6f5b64143', 'admin', '$2b$12$pfX8lKibmTd13vo/Vb0W9OKgZmkF3BpwFOKTkpjutcFnH4IIhlsP2', 't', 'f', '2025-12-15 20:04:19.561063', 'f');

INSERT INTO "public"."session" ("sid", "sess", "expire") VALUES
('3LNRX-irzhqb2iIstgYe9qQl-BFmC0UJ', '{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-22T10:13:52.008Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"bcd26b0d-b3b0-4f95-8b01-c191140fe583","currentCompanyId":1,"currentRole":"Admin","currentLocationId":null,"currentPOSStation":null,"cashAccountId":null}', '2026-03-22 22:38:30'),
('FHLuF1wHjHqM0GHy4V-a9UiXnYZvI-dm', '{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-22T10:15:26.684Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"bcd26b0d-b3b0-4f95-8b01-c191140fe583","currentCompanyId":1,"currentRole":"Admin","currentLocationId":null,"currentPOSStation":null,"cashAccountId":null}', '2026-03-22 22:36:58');

INSERT INTO "public"."container_items" ("id", "container_id", "stock_item_id", "item_name", "quantity", "rate_per_kg", "weight_kg", "line_total", "created_at") VALUES
(1, 1, 151, 'Eagle 200 ', 44.000, 1240.00, 0.000, 54560.00, '2025-12-15 21:19:23.719264'),
(2, 2, 153, 'Trans 200 ', 25.000, 1050.00, 0.000, 26250.00, '2025-12-16 19:32:43.779336'),
(3, 2, 152, 'Super 300', 10.000, 1515.00, 0.000, 15150.00, '2025-12-16 19:32:44.225812'),
(4, 4, 151, 'Eagle 200 ', 44.000, 1240.00, 0.000, 54560.00, '2025-12-28 16:05:09.166865'),
(5, 5, 151, 'Eagle 200 ', 44.000, 1240.00, 0.000, 54560.00, '2025-12-28 16:26:15.340229'),
(6, 6, 151, 'Eagle 200 ', 44.000, 1240.00, 0.000, 54560.00, '2025-12-28 16:38:06.812658'),
(7, 7, 151, 'Eagle 200 ', 44.000, 1240.00, 0.000, 54560.00, '2025-12-28 16:43:30.710594'),
(8, 8, 153, 'Trans 200 ', 20.000, 1050.00, 0.000, 21000.00, '2025-12-28 17:40:58.842494'),
(9, 8, 152, 'Super 300', 10.000, 1515.00, 0.000, 15150.00, '2025-12-28 17:40:59.814059');

INSERT INTO "public"."stock_groups" ("id", "company_id", "code", "name", "parent_id", "active", "deleted_at", "created_at", "allocate_import_costs") VALUES
(1, 1, 'M', 'Mechanics', NULL, 't', NULL, '2025-12-15 20:56:42.186666', 'f'),
(2, 1, 'T', 'Transmission', NULL, 't', NULL, '2025-12-15 20:56:50.453995', 'f'),
(3, 1, 'E', 'Electronics', NULL, 't', NULL, '2025-12-15 20:56:57.692895', 'f'),
(4, 1, 'A', 'Accessories', NULL, 't', NULL, '2025-12-15 20:57:03.76976', 'f'),
(5, 1, 'Z', 'Tires & Rims', NULL, 't', NULL, '2025-12-15 20:57:12.105772', 'f'),
(6, 1, 'S', 'Suspension', NULL, 't', NULL, '2025-12-15 20:57:21.438744', 'f'),
(7, 1, 'B', 'Battery', NULL, 't', NULL, '2025-12-15 20:57:34.997238', 'f'),
(8, 1, 'X', 'Marketing', NULL, 't', NULL, '2025-12-15 20:57:56.320074', 'f'),
(9, 1, 'UNCATEGORIZED', 'Uncategorized', NULL, 't', NULL, '2025-12-15 20:58:13.873698', 'f'),
(10, 1, 'MOTO ', 'Eagle 200', NULL, 't', NULL, '2025-12-15 21:11:13.923455', 'f'),
(11, 1, 'MOTO', 'MOTO', NULL, 't', NULL, '2025-12-15 21:14:04.438765', 'f');

INSERT INTO "public"."containers" ("id", "company_id", "container_number", "supplier_id", "status", "import_date", "items_total", "charges_total", "grand_total", "item_name", "rate_per_kg", "total_kg", "carrier", "vessel_name", "origin_port", "destination_port", "departure_date", "estimated_arrival", "tracking_status", "last_location", "last_tracking_update", "tracking_events", "created_at", "freight_total", "other_charges_total") VALUES
(7, 1, 'OOLU 9409023', 1, 'OFFLOADED', '2025-08-01', 54560.00, 6600.00, 61160.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-28 16:43:30.307416', 0.00, 0.00),
(8, 1, 'FCIU 9583629', 1, 'OFFLOADED', '2025-08-01', 36150.00, 6600.00, 42750.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-28 17:40:58.346051', 0.00, 0.00);

INSERT INTO "public"."assembly_inventory" ("id", "company_id", "location_id", "stock_item_id", "stage", "qty", "created_at", "updated_at") VALUES
(8, 1, 1, 151, 'Full CKD', 28, '2026-01-01 18:27:05.915803', '2026-03-21 22:07:36.635'),
(9, 1, 1, 153, 'Full CKD', 0, '2026-01-01 18:27:18.942581', '2026-01-01 18:28:21.698'),
(10, 1, 1, 152, 'Full CKD', 0, '2026-01-01 18:27:28.312178', '2026-01-01 18:28:46.322'),
(11, 1, 1, 153, 'Welded', 0, '2026-01-01 18:28:21.704254', '2026-01-01 18:30:02.433'),
(12, 1, 1, 152, 'Welded', 0, '2026-01-01 18:28:46.330354', '2026-01-01 18:29:44.282'),
(13, 1, 1, 151, 'Welded', 0, '2026-01-01 18:29:07.036264', '2026-03-21 22:08:21.146'),
(14, 1, 1, 152, 'Painted', 2, '2026-01-01 18:29:44.28758', '2026-03-21 22:09:04.781'),
(15, 1, 1, 153, 'Painted', 2, '2026-01-01 18:30:02.437811', '2026-03-21 22:10:56.396'),
(16, 1, 1, 151, 'Painted', 2, '2026-01-01 18:30:35.154639', '2026-03-21 22:08:47.815'),
(17, 1, 1, 151, 'Final Product', 14, '2026-01-01 18:30:52.080771', '2026-03-21 22:08:47.822'),
(18, 1, 1, 152, 'Final Product', 8, '2026-01-01 18:31:26.223802', '2026-03-21 22:09:04.796'),
(19, 1, 1, 153, 'Final Product', 18, '2026-01-01 18:31:42.671367', '2026-03-21 22:10:56.402');

INSERT INTO "public"."assembly_history" ("id", "company_id", "location_id", "user_id", "username", "stock_item_id", "stock_item_name", "action_type", "from_stage", "to_stage", "qty_changed", "description", "created_at", "technician", "status", "completed") VALUES
(1, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 10, 'Eagle 200', 'SAVE', 'Full CKD', NULL, 44, 'Added Eagle 200 to Full CKD with qty: 44', '2025-12-28 18:55:12.873606', NULL, 'pending', 'f'),
(2, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'SAVE', 'Full CKD', NULL, 44, 'Added Eagle 200  to Full CKD with qty: 44', '2025-12-28 19:19:43.586952', NULL, 'pending', 'f'),
(3, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 152, 'Super 300', 'SAVE', 'Painted', NULL, 10, 'Added Super 300 to Painted with qty: 10', '2025-12-28 19:20:21.26486', NULL, 'pending', 'f'),
(4, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 153, 'Trans 200 ', 'SAVE', 'Painted', NULL, 20, 'Added Trans 200  to Painted with qty: 20', '2025-12-28 19:20:48.922007', NULL, 'pending', 'f'),
(5, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 153, 'Trans 200 ', 'TRANSFER', 'Painted', 'Final Product', 1, 'Transferred 1 Trans 200  from Painted to Final Product', '2025-12-28 19:21:17.35368', NULL, 'pending', 'f'),
(6, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 152, 'Super 300', 'SAVE', 'Welded', NULL, 10, 'Added Super 300 to Welded with qty: 10', '2026-01-01 16:49:59.880474', NULL, 'pending', 'f'),
(7, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 152, 'Super 300', 'TRANSFER', 'Welded', 'Painted', 10, 'Transferred 10 Super 300 from Welded to Painted', '2026-01-01 16:50:37.533085', NULL, 'pending', 'f'),
(8, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 152, 'Super 300', 'TRANSFER', 'Painted', 'Welded', 10, 'Reversed 10 Super 300 from Painted back to Welded', '2026-01-01 17:13:27.968943', NULL, 'pending', 'f'),
(9, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'SAVE', 'Full CKD', NULL, 44, 'Added Eagle 200  to Full CKD with qty: 44', '2026-01-01 18:27:05.918961', NULL, 'pending', 'f'),
(10, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 153, 'Trans 200 ', 'SAVE', 'Full CKD', NULL, 20, 'Added Trans 200  to Full CKD with qty: 20', '2026-01-01 18:27:18.945438', NULL, 'pending', 'f'),
(11, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 152, 'Super 300', 'SAVE', 'Full CKD', NULL, 10, 'Added Super 300 to Full CKD with qty: 10', '2026-01-01 18:27:28.3149', NULL, 'pending', 'f'),
(12, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 153, 'Trans 200 ', 'TRANSFER', 'Full CKD', 'Welded', 20, 'Transferred 20 Trans 200  from Full CKD to Welded', '2026-01-01 18:28:21.706869', NULL, 'pending', 'f'),
(13, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 152, 'Super 300', 'TRANSFER', 'Full CKD', 'Welded', 10, 'Transferred 10 Super 300 from Full CKD to Welded', '2026-01-01 18:28:46.333128', NULL, 'pending', 'f'),
(14, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Full CKD', 'Welded', 1, 'Transferred 1 Eagle 200  from Full CKD to Welded', '2026-01-01 18:29:07.038766', NULL, 'pending', 'f'),
(15, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Welded', 'Full CKD', 1, 'Reversed 1 Eagle 200  from Welded back to Full CKD', '2026-01-01 18:29:21.440859', NULL, 'pending', 'f'),
(16, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 152, 'Super 300', 'TRANSFER', 'Welded', 'Painted', 10, 'Transferred 10 Super 300 from Welded to Painted', '2026-01-01 18:29:44.289875', NULL, 'pending', 'f'),
(17, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 153, 'Trans 200 ', 'TRANSFER', 'Welded', 'Painted', 20, 'Transferred 20 Trans 200  from Welded to Painted', '2026-01-01 18:30:02.440083', NULL, 'pending', 'f'),
(18, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Full CKD', 'Welded', 1, 'Transferred 1 Eagle 200  from Full CKD to Welded', '2026-01-01 18:30:26.475876', NULL, 'pending', 'f'),
(19, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Welded', 'Painted', 1, 'Transferred 1 Eagle 200  from Welded to Painted', '2026-01-01 18:30:35.157225', NULL, 'pending', 'f'),
(20, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Painted', 'Final Product', 1, 'Transferred 1 Eagle 200  from Painted to Final Product', '2026-01-01 18:30:52.083355', NULL, 'pending', 'f'),
(21, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 152, 'Super 300', 'TRANSFER', 'Painted', 'Final Product', 1, 'Transferred 1 Super 300 from Painted to Final Product', '2026-01-01 18:31:26.226542', NULL, 'pending', 'f'),
(22, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 153, 'Trans 200 ', 'TRANSFER', 'Painted', 'Final Product', 1, 'Transferred 1 Trans 200  from Painted to Final Product', '2026-01-01 18:31:42.673977', NULL, 'pending', 'f'),
(23, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Final Product', 'Painted', 1, 'Reversed 1 Eagle 200  from Final Product back to Painted', '2026-01-01 18:32:07.787937', NULL, 'pending', 'f'),
(24, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Painted', 'Welded', 1, 'Reversed 1 Eagle 200  from Painted back to Welded', '2026-01-01 18:32:32.794049', NULL, 'pending', 'f'),
(25, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Welded', 'Full CKD', 1, 'Reversed 1 Eagle 200  from Welded back to Full CKD', '2026-01-01 18:32:42.621801', NULL, 'pending', 'f'),
(26, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Full CKD', 'Welded', 1, 'Transferred 1 Eagle 200  from Full CKD to Welded', '2026-01-05 15:48:50.336757', NULL, 'pending', 'f'),
(27, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Welded', 'Full CKD', 1, 'Reversed 1 Eagle 200  from Welded back to Full CKD', '2026-01-05 15:49:34.165481', '', 'pending', 'f'),
(28, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Full CKD', 'Welded', 16, 'Transferred 16 Eagle 200  from Full CKD to Welded', '2026-03-21 22:07:36.64541', NULL, 'pending', 'f'),
(29, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Welded', 'Painted', 14, 'Transferred 14 Eagle 200  from Welded to Painted', '2026-03-21 22:07:55.048212', NULL, 'pending', 'f'),
(30, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Welded', 'Painted', 2, 'Transferred 2 Eagle 200  from Welded to Painted', '2026-03-21 22:08:21.156044', NULL, 'pending', 'f'),
(31, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 151, 'Eagle 200 ', 'TRANSFER', 'Painted', 'Final Product', 14, 'Transferred 14 Eagle 200  from Painted to Final Product', '2026-03-21 22:08:47.826319', NULL, 'pending', 'f'),
(32, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 152, 'Super 300', 'TRANSFER', 'Painted', 'Final Product', 7, 'Transferred 7 Super 300 from Painted to Final Product', '2026-03-21 22:09:04.800385', NULL, 'pending', 'f'),
(33, 1, 1, 'bcd26b0d-b3b0-4f95-8b01-c191140fe583', 'Adam Dakik', 153, 'Trans 200 ', 'TRANSFER', 'Painted', 'Final Product', 17, 'Transferred 17 Trans 200  from Painted to Final Product', '2026-03-21 22:10:56.40611', NULL, 'pending', 'f');

INSERT INTO "public"."inventory" ("id", "company_id", "location_id", "stock_item_id", "quantity", "average_rate", "total_value", "last_updated", "color", "assigned_status") VALUES
(1, 1, 1, 151, 37.000, 1955.91, 72368.67, '2026-03-21 22:16:30.363', NULL, NULL),
(2, 1, 1, 153, 15.000, 2100.00, 31500.00, '2026-03-21 22:18:29.804', NULL, NULL),
(3, 1, 1, 152, 8.000, 2565.00, 20520.00, '2026-03-21 22:18:05.061', NULL, NULL),
(13, 1, 2, 151, 44.000, 1955.91, 86060.04, '2025-12-28 19:44:22.96008', NULL, NULL),
(14, 1, 2, 152, 10.000, 2565.00, 25650.00, '2025-12-28 19:44:22.96008', NULL, NULL),
(15, 1, 2, 153, 20.000, 2100.00, 42000.00, '2025-12-28 19:44:22.96008', NULL, NULL),
(18, 1, 3, 152, 1.000, 2565.00, 2565.00, '2026-03-21 22:33:37.37', NULL, NULL),
(19, 1, 3, 153, 7.000, 2100.00, 14700.00, '2026-03-21 22:18:29.807', NULL, NULL),
(20, 1, 3, 151, 0.000, 1955.91, 0.00, '2026-03-21 22:36:33.891', NULL, NULL);



-- Indices
CREATE UNIQUE INDEX employees_code_unique ON public.employees USING btree (code);


-- Indices
CREATE UNIQUE INDEX fiscal_period_closures_closing_voucher_id_unique ON public.fiscal_period_closures USING btree (closing_voucher_id);


-- Indices
CREATE UNIQUE INDEX fixed_assets_code_unique ON public.fixed_assets USING btree (code);


-- Indices
CREATE UNIQUE INDEX import_logs_file_hash_unique ON public.import_logs USING btree (file_hash);


-- Indices
CREATE UNIQUE INDEX bank_accounts_code_unique ON public.bank_accounts USING btree (code);


-- Indices
CREATE UNIQUE INDEX companies_code_unique ON public.companies USING btree (code);


-- Indices
CREATE UNIQUE INDEX company_settings_company_id_unique ON public.company_settings USING btree (company_id);


-- Indices
CREATE UNIQUE INDEX locations_code_unique ON public.locations USING btree (code);


-- Indices
CREATE UNIQUE INDEX suppliers_code_unique ON public.suppliers USING btree (code);


-- Indices
CREATE UNIQUE INDEX user_preferences_user_id_unique ON public.user_preferences USING btree (user_id);


-- Indices
CREATE UNIQUE INDEX vouchers_voucher_number_unique ON public.vouchers USING btree (voucher_number);


-- Indices
CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username);


-- Indices
CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


-- Indices
CREATE UNIQUE INDEX containers_container_number_unique ON public.containers USING btree (container_number);


-- Indices
CREATE UNIQUE INDEX assembly_inventory_unique ON public.assembly_inventory USING btree (location_id, stage, stock_item_id);
