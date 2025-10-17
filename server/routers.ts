import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { authenticateUser, createUser } from "./auth";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await authenticateUser(input.email, input.password);
        
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Create session token
        const token = await sdk.createSessionToken(user.id, {
          name: user.name || user.email || "User",
          expiresInMs: ONE_YEAR_MS,
        });

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    createUser: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(8),
          name: z.string().optional(),
          role: z.enum(["user", "admin"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only admins can create users
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can create users",
          });
        }

        const user = await createUser(input);
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),
  }),

  // Gas Station Management
  gasStations: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllGasStations();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getGasStationById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createGasStation(input);
      }),
  }),

  // Employee Management
  employees: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllEmployees();
    }),
    
    byStation: protectedProcedure
      .input(z.object({ gasStationId: z.string() }))
      .query(async ({ input }) => {
        return await db.getEmployeesByStation(input.gasStationId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        role: z.enum(["manager", "cashier", "attendant"]),
      }))
      .mutation(async ({ input }) => {
        return await db.createEmployee(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        role: z.enum(["manager", "cashier", "attendant"]).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateEmployee(id, data);
      }),
  }),

  // Shift Management
  shifts: router({
    create: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        employeeId: z.string(),
        startTime: z.date(),
      }))
      .mutation(async ({ input }) => {
        return await db.createShift(input);
      }),
    
    end: protectedProcedure
      .input(z.object({
        shiftId: z.string(),
        endTime: z.date(),
      }))
      .mutation(async ({ input }) => {
        return await db.endShift(input.shiftId, input.endTime);
      }),
    
    active: protectedProcedure
      .input(z.object({ gasStationId: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getActiveShifts(input.gasStationId);
      }),
    
    byDateRange: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getShiftsByDateRange(input.gasStationId, input.startDate, input.endDate);
      }),
  }),

  // Shift Closing Reports
  shiftReports: router({
    create: protectedProcedure
      .input(z.object({
        shiftId: z.string(),
        stationNumber: z.number().optional(),
        totalSales: z.number(),
        totalTax: z.number(),
        cashAmount: z.number(),
        creditAmount: z.number(),
        debitAmount: z.number(),
        mobileAmount: z.number(),
        overShortAmount: z.number(),
        fuelSales: z.number(),
        grocerySales: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createShiftClosingReport(input);
      }),
    
    byShift: protectedProcedure
      .input(z.object({ shiftId: z.string() }))
      .query(async ({ input }) => {
        return await db.getShiftClosingReportsByShift(input.shiftId);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        reportId: z.string(),
        status: z.enum(["pending", "approved", "rejected"]),
      }))
      .mutation(async ({ input }) => {
        return await db.updateShiftClosingReportStatus(input.reportId, input.status);
      }),
    
    byDateRange: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getShiftClosingReportsByDateRange(input.gasStationId, input.startDate, input.endDate);
      }),
  }),

  // Transactions
  transactions: router({
    create: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        shiftClosingReportId: z.string().optional(),
        type: z.enum(["fuel_sale", "store_sale", "expense", "fuel_delivery", "other"]),
        amount: z.number(),
        description: z.string().optional(),
        transactionDate: z.date(),
      }))
      .mutation(async ({ input }) => {
        return await db.createTransaction(input);
      }),
    
    byDateRange: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getTransactionsByDateRange(input.gasStationId, input.startDate, input.endDate);
      }),
  }),

  // Expenses
  expenses: router({
    create: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        category: z.enum(["payroll", "utilities", "maintenance", "supplies", "rent", "insurance", "taxes", "other"]),
        amount: z.number(),
        description: z.string().optional(),
        expenseDate: z.string(), // date string
      }))
      .mutation(async ({ input }) => {
        return await db.createExpense({
          ...input,
          expenseDate: new Date(input.expenseDate)
        });
      }),
    
    byDateRange: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getExpensesByDateRange(
          input.gasStationId,
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),
    
    byCategory: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        category: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getExpensesByCategory(input.gasStationId, input.category);
      }),
  }),

  // Fuel Deliveries
  fuelDeliveries: router({
    create: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        billOfLadingNumber: z.string(),
        deliveryDate: z.string(),
        supplier: z.string().optional(),
        items: z.array(z.object({
          fuelGrade: z.enum(["regular", "plus", "premium", "diesel"]),
          quantity: z.number(),
          pricePerGallon: z.number(),
          yellowMark: z.string().optional(),
          redMark: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { items, deliveryDate, ...deliveryData } = input;
        
        // Create delivery
        const delivery = await db.createFuelDelivery({
          ...deliveryData,
          deliveryDate: new Date(deliveryDate)
        });
        const deliveryId = (delivery as any).insertId || (delivery as any)[0]?.insertId;
        
        // Create delivery items with cost calculations
        for (const item of items) {
          let cost = 0;
          if (item.fuelGrade === "diesel") {
            // Diesel: Price + 0.660965
            cost = Math.round((item.pricePerGallon + 66.0965));
          } else {
            // Regular/Plus/Premium: Price + 0.618346
            cost = Math.round((item.pricePerGallon + 61.8346));
          }
          
          const totalCost = cost * item.quantity;
          
          await db.createFuelDeliveryItem({
            fuelDeliveryId: deliveryId,
            fuelGrade: item.fuelGrade,
            quantity: item.quantity,
            pricePerGallon: item.pricePerGallon,
            cost,
            totalCost,
            yellowMark: item.yellowMark,
            redMark: item.redMark,
          });
        }
        
        return delivery;
      }),
    
    byStation: protectedProcedure
      .input(z.object({ gasStationId: z.string() }))
      .query(async ({ input }) => {
        return await db.getFuelDeliveriesByStation(input.gasStationId);
      }),
    
    items: protectedProcedure
      .input(z.object({ deliveryId: z.string() }))
      .query(async ({ input }) => {
        return await db.getFuelDeliveryItems(input.deliveryId);
      }),
  }),

  // Fuel Inventory
  fuelInventory: router({
    update: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        fuelGrade: z.enum(["regular", "plus", "premium", "diesel"]),
        quantity: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateFuelInventory(input);
      }),
    
    byStation: protectedProcedure
      .input(z.object({ gasStationId: z.string() }))
      .query(async ({ input }) => {
        return await db.getFuelInventoryByStation(input.gasStationId);
      }),
  }),

  // Analytics
  analytics: router({
    revenue: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getRevenueByDateRange(input.gasStationId, input.startDate, input.endDate);
      }),
    
    profit: protectedProcedure
      .input(z.object({
        gasStationId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getProfitByDateRange(input.gasStationId, input.startDate, input.endDate);
      }),
  }),
});

export type AppRouter = typeof appRouter;

