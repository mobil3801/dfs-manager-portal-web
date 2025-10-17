CREATE TABLE `employees` (
	`id` varchar(36) NOT NULL,
	`gas_station_id` varchar(36),
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` varchar(320),
	`phone_number` varchar(20),
	`employee_role` enum('manager','cashier','attendant') NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` varchar(36) NOT NULL,
	`gas_station_id` varchar(36) NOT NULL,
	`expense_category` enum('payroll','utilities','maintenance','supplies','rent','insurance','taxes','other') NOT NULL,
	`amount` int NOT NULL,
	`description` text,
	`expense_date` date NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fuel_deliveries` (
	`id` varchar(36) NOT NULL,
	`gas_station_id` varchar(36) NOT NULL,
	`bill_of_lading_number` varchar(100) NOT NULL,
	`delivery_date` date NOT NULL,
	`supplier` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fuel_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `fuel_deliveries_bill_of_lading_number_unique` UNIQUE(`bill_of_lading_number`)
);
--> statement-breakpoint
CREATE TABLE `fuel_delivery_items` (
	`id` varchar(36) NOT NULL,
	`fuel_delivery_id` varchar(36) NOT NULL,
	`fuel_grade` enum('regular','plus','premium','diesel') NOT NULL,
	`quantity` int NOT NULL,
	`price_per_gallon` int NOT NULL,
	`cost` int NOT NULL,
	`total_cost` int NOT NULL,
	`yellow_mark` varchar(50),
	`red_mark` varchar(50),
	CONSTRAINT `fuel_delivery_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fuel_inventory` (
	`id` varchar(36) NOT NULL,
	`gas_station_id` varchar(36) NOT NULL,
	`fuel_grade_inventory` enum('regular','plus','premium','diesel') NOT NULL,
	`quantity` int NOT NULL,
	`last_updated` timestamp DEFAULT (now()),
	CONSTRAINT `fuel_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gas_stations` (
	`id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zip_code` varchar(10) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `gas_stations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift_closing_reports` (
	`id` varchar(36) NOT NULL,
	`shift_id` varchar(36) NOT NULL,
	`station_number` int,
	`total_sales` int NOT NULL,
	`total_tax` int NOT NULL,
	`cash_amount` int NOT NULL,
	`credit_amount` int NOT NULL,
	`debit_amount` int NOT NULL,
	`mobile_amount` int NOT NULL,
	`over_short_amount` int NOT NULL,
	`fuel_sales` int NOT NULL,
	`grocery_sales` int NOT NULL,
	`notes` text,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `shift_closing_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` varchar(36) NOT NULL,
	`gas_station_id` varchar(36) NOT NULL,
	`employee_id` varchar(36) NOT NULL,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(36) NOT NULL,
	`gas_station_id` varchar(36) NOT NULL,
	`shift_closing_report_id` varchar(36),
	`transaction_type` enum('fuel_sale','store_sale','expense','fuel_delivery','other') NOT NULL,
	`amount` int NOT NULL,
	`description` text,
	`transaction_date` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp DEFAULT (now()),
	`lastSignedIn` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_gas_station_id_gas_stations_id_fk` FOREIGN KEY (`gas_station_id`) REFERENCES `gas_stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_gas_station_id_gas_stations_id_fk` FOREIGN KEY (`gas_station_id`) REFERENCES `gas_stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fuel_deliveries` ADD CONSTRAINT `fuel_deliveries_gas_station_id_gas_stations_id_fk` FOREIGN KEY (`gas_station_id`) REFERENCES `gas_stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fuel_delivery_items` ADD CONSTRAINT `fuel_delivery_items_fuel_delivery_id_fuel_deliveries_id_fk` FOREIGN KEY (`fuel_delivery_id`) REFERENCES `fuel_deliveries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fuel_inventory` ADD CONSTRAINT `fuel_inventory_gas_station_id_gas_stations_id_fk` FOREIGN KEY (`gas_station_id`) REFERENCES `gas_stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shift_closing_reports` ADD CONSTRAINT `shift_closing_reports_shift_id_shifts_id_fk` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_gas_station_id_gas_stations_id_fk` FOREIGN KEY (`gas_station_id`) REFERENCES `gas_stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_gas_station_id_gas_stations_id_fk` FOREIGN KEY (`gas_station_id`) REFERENCES `gas_stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_shift_closing_report_id_shift_closing_reports_id_fk` FOREIGN KEY (`shift_closing_report_id`) REFERENCES `shift_closing_reports`(`id`) ON DELETE no action ON UPDATE no action;