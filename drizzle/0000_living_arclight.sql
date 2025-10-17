CREATE TYPE "public"."employee_role" AS ENUM('manager', 'cashier', 'attendant');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('utilities', 'maintenance', 'supplies', 'payroll', 'rent', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'credit_card', 'debit_card');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"gas_station_id" varchar(36),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" varchar(320),
	"phone_number" varchar(20),
	"employee_role" "employee_role" NOT NULL,
	"profile_picture_url" text,
	"id_document_url" text,
	"id_document_type" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"gas_station_id" varchar(36) NOT NULL,
	"category" "expense_category" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"expense_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fuel_deliveries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"gas_station_id" varchar(36) NOT NULL,
	"fuel_type" varchar(50) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"price_per_gallon" numeric(10, 2) NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"supplier" text NOT NULL,
	"bill_of_lading" varchar(100),
	"delivery_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gas_stations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shift_reports" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"shift_id" varchar(36) NOT NULL,
	"gas_station_id" varchar(36) NOT NULL,
	"employee_id" varchar(36) NOT NULL,
	"opening_cash" numeric(10, 2) NOT NULL,
	"closing_cash" numeric(10, 2) NOT NULL,
	"total_sales" numeric(10, 2) NOT NULL,
	"cash_sales" numeric(10, 2) NOT NULL,
	"credit_card_sales" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"gas_station_id" varchar(36) NOT NULL,
	"employee_id" varchar(36) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"status" "shift_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"gas_station_id" varchar(36) NOT NULL,
	"shift_id" varchar(36),
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(320),
	"password" varchar(255),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"lastSignedIn" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_gas_station_id_gas_stations_id_fk" FOREIGN KEY ("gas_station_id") REFERENCES "public"."gas_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_gas_station_id_gas_stations_id_fk" FOREIGN KEY ("gas_station_id") REFERENCES "public"."gas_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_deliveries" ADD CONSTRAINT "fuel_deliveries_gas_station_id_gas_stations_id_fk" FOREIGN KEY ("gas_station_id") REFERENCES "public"."gas_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_gas_station_id_gas_stations_id_fk" FOREIGN KEY ("gas_station_id") REFERENCES "public"."gas_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_gas_station_id_gas_stations_id_fk" FOREIGN KEY ("gas_station_id") REFERENCES "public"."gas_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_gas_station_id_gas_stations_id_fk" FOREIGN KEY ("gas_station_id") REFERENCES "public"."gas_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;