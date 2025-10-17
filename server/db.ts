import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  gasStations, InsertGasStation,
  employees, InsertEmployee,
  shifts, InsertShift,
  shiftClosingReports, InsertShiftClosingReport,
  transactions, InsertTransaction,
  expenses, InsertExpense,
  fuelDeliveries, InsertFuelDelivery,
  fuelDeliveryItems, InsertFuelDeliveryItem,
  fuelInventory, InsertFuelInventory
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Gas Station Management Queries

export async function getAllGasStations() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(gasStations).orderBy(desc(gasStations.createdAt));
}

export async function getGasStationById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gasStations).where(eq(gasStations.id, id)).limit(1);
  return result[0];
}

export async function createGasStation(data: InsertGasStation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gasStations).values(data);
  return result;
}

// Employee Management

export async function getEmployeesByStation(gasStationId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees).where(eq(employees.gasStationId, gasStationId));
}

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees).orderBy(desc(employees.createdAt));
}

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(employees).values(data);
}

export async function updateEmployee(id: string, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(employees).set(data).where(eq(employees.id, id));
}

// Shift Management

export async function createShift(data: InsertShift) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(shifts).values(data);
}

export async function getActiveShifts(gasStationId?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (gasStationId) {
    return await db.select().from(shifts)
      .where(and(eq(shifts.gasStationId, gasStationId), eq(shifts.endTime, null as any)))
      .orderBy(desc(shifts.startTime));
  }
  
  return await db.select().from(shifts)
    .where(eq(shifts.endTime, null as any))
    .orderBy(desc(shifts.startTime));
}

export async function endShift(shiftId: string, endTime: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(shifts).set({ endTime }).where(eq(shifts.id, shiftId));
}

export async function getShiftsByDateRange(gasStationId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(shifts)
    .where(and(
      eq(shifts.gasStationId, gasStationId),
      gte(shifts.startTime, startDate),
      lte(shifts.startTime, endDate)
    ))
    .orderBy(desc(shifts.startTime));
}

// Shift Closing Reports

export async function createShiftClosingReport(data: InsertShiftClosingReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(shiftClosingReports).values(data);
}

export async function getShiftClosingReportsByShift(shiftId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(shiftClosingReports).where(eq(shiftClosingReports.shiftId, shiftId));
}

export async function updateShiftClosingReportStatus(reportId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(shiftClosingReports).set({ status }).where(eq(shiftClosingReports.id, reportId));
}

export async function getShiftClosingReportsByDateRange(gasStationId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  // Join with shifts to filter by gas station
  return await db.select({
    report: shiftClosingReports,
    shift: shifts
  })
    .from(shiftClosingReports)
    .innerJoin(shifts, eq(shiftClosingReports.shiftId, shifts.id))
    .where(and(
      eq(shifts.gasStationId, gasStationId),
      gte(shifts.startTime, startDate),
      lte(shifts.startTime, endDate)
    ))
    .orderBy(desc(shiftClosingReports.createdAt));
}

// Transactions

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(transactions).values(data);
}

export async function getTransactionsByDateRange(gasStationId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(transactions)
    .where(and(
      eq(transactions.gasStationId, gasStationId),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate)
    ))
    .orderBy(desc(transactions.transactionDate));
}

// Expenses

export async function createExpense(data: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(expenses).values(data);
}

export async function getExpensesByDateRange(gasStationId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(expenses)
    .where(and(
      eq(expenses.gasStationId, gasStationId),
      gte(expenses.expenseDate, startDate),
      lte(expenses.expenseDate, endDate)
    ))
    .orderBy(desc(expenses.expenseDate));
}

export async function getExpensesByCategory(gasStationId: string, category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(expenses)
    .where(and(
      eq(expenses.gasStationId, gasStationId),
      eq(expenses.category, category as any)
    ))
    .orderBy(desc(expenses.expenseDate));
}

// Fuel Deliveries

export async function createFuelDelivery(data: InsertFuelDelivery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(fuelDeliveries).values(data);
}

export async function createFuelDeliveryItem(data: InsertFuelDeliveryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(fuelDeliveryItems).values(data);
}

export async function getFuelDeliveriesByStation(gasStationId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(fuelDeliveries)
    .where(eq(fuelDeliveries.gasStationId, gasStationId))
    .orderBy(desc(fuelDeliveries.deliveryDate));
}

export async function getFuelDeliveryItems(deliveryId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(fuelDeliveryItems)
    .where(eq(fuelDeliveryItems.fuelDeliveryId, deliveryId));
}

// Fuel Inventory

export async function updateFuelInventory(data: InsertFuelInventory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if inventory exists for this station and fuel grade
  const existing = await db.select().from(fuelInventory)
    .where(and(
      eq(fuelInventory.gasStationId, data.gasStationId),
      eq(fuelInventory.fuelGrade, data.fuelGrade)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    return await db.update(fuelInventory)
      .set({ quantity: data.quantity, lastUpdated: new Date() })
      .where(eq(fuelInventory.id, existing[0].id));
  } else {
    return await db.insert(fuelInventory).values(data);
  }
}

export async function getFuelInventoryByStation(gasStationId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(fuelInventory)
    .where(eq(fuelInventory.gasStationId, gasStationId));
}

// Analytics and Reporting

export async function getRevenueByDateRange(gasStationId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, fuelRevenue: 0, groceryRevenue: 0 };
  
  const result = await db.select({
    totalSales: sql<number>`SUM(${shiftClosingReports.totalSales})`,
    totalFuelSales: sql<number>`SUM(${shiftClosingReports.fuelSales})`,
    totalGrocerySales: sql<number>`SUM(${shiftClosingReports.grocerySales})`,
  })
    .from(shiftClosingReports)
    .innerJoin(shifts, eq(shiftClosingReports.shiftId, shifts.id))
    .where(and(
      eq(shifts.gasStationId, gasStationId),
      gte(shifts.startTime, startDate),
      lte(shifts.startTime, endDate)
    ));
  
  return {
    totalRevenue: result[0]?.totalSales || 0,
    fuelRevenue: result[0]?.totalFuelSales || 0,
    groceryRevenue: result[0]?.totalGrocerySales || 0,
  };
}

export async function getProfitByDateRange(gasStationId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { revenue: 0, expenses: 0, profit: 0 };
  
  const revenue = await getRevenueByDateRange(gasStationId, startDate, endDate);
  
  const expenseResult = await db.select({
    totalExpenses: sql<number>`SUM(${expenses.amount})`,
  })
    .from(expenses)
    .where(and(
      eq(expenses.gasStationId, gasStationId),
      gte(expenses.expenseDate, startDate),
      lte(expenses.expenseDate, endDate)
    ));
  
  const totalExpenses = expenseResult[0]?.totalExpenses || 0;
  
  return {
    revenue: revenue.totalRevenue,
    expenses: totalExpenses,
    profit: revenue.totalRevenue - totalExpenses,
  };
}

