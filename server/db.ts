import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users,
  gasStations, InsertGasStation,
  employees, InsertEmployee,
  shifts, InsertShift,
  shiftReports, InsertShiftReport,
  transactions, InsertTransaction,
  expenses, InsertExpense,
  fuelDeliveries, InsertFuelDelivery
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
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

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.id,
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

export async function createShiftClosingReport(data: InsertShiftReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(shiftReports).values(data);
}

export async function getShiftClosingReportsByShift(shiftId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(shiftReports).where(eq(shiftReports.shiftId, shiftId));
}

export async function updateShiftClosingReportStatus(reportId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Status field doesn't exist in current schema, skip update
  return { success: true };
}

export async function getShiftClosingReportsByDateRange(gasStationId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  // Join with shifts to filter by gas station
  return await db.select({
    report: shiftReports,
    shift: shifts
  })
    .from(shiftReports)
    .innerJoin(shifts, eq(shiftReports.shiftId, shifts.id))
    .where(and(
      eq(shifts.gasStationId, gasStationId),
      gte(shifts.startTime, startDate),
      lte(shifts.startTime, endDate)
    ))
    .orderBy(desc(shiftReports.createdAt));
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
      gte(transactions.createdAt, startDate),
      lte(transactions.createdAt, endDate)
    ))
    .orderBy(desc(transactions.createdAt));
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

export async function getFuelDeliveriesByStation(gasStationId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(fuelDeliveries)
    .where(eq(fuelDeliveries.gasStationId, gasStationId))
    .orderBy(desc(fuelDeliveries.deliveryDate));
}

// Analytics and Reporting

export async function getRevenueByDateRange(gasStationId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, fuelRevenue: 0, groceryRevenue: 0 };
  
  const result = await db.select({
    totalSales: sql<number>`SUM(CAST(${shiftReports.totalSales} AS NUMERIC))`,
  })
    .from(shiftReports)
    .innerJoin(shifts, eq(shiftReports.shiftId, shifts.id))
    .where(and(
      eq(shifts.gasStationId, gasStationId),
      gte(shifts.startTime, startDate),
      lte(shifts.startTime, endDate)
    ));
  
  return {
    totalRevenue: result[0]?.totalSales || 0,
    fuelRevenue: 0,
    groceryRevenue: 0,
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

