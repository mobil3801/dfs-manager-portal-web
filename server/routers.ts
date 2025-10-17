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

  // File Upload
  upload: router({
    uploadEmployeeDocument: protectedProcedure
      .input(
        z.object({
          employeeId: z.string(),
          fileData: z.string(), // base64 encoded
          fileName: z.string(),
          fileType: z.string(),
          documentType: z.enum(["profile", "id"]),
          idType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        
        // Decode base64
        const buffer = Buffer.from(input.fileData, "base64");
        
        // Create unique file path
        const timestamp = Date.now();
        const fileExtension = input.fileName.split(".").pop();
        const filePath = `employees/${input.employeeId}/${input.documentType}_${timestamp}.${fileExtension}`;
        
        // Upload to S3
        const { url } = await storagePut(filePath, buffer, input.fileType);
        
        // Update employee record
        if (input.documentType === "profile") {
          await db.updateEmployee(input.employeeId, {
            profilePictureUrl: url,
          });
        } else {
          await db.updateEmployee(input.employeeId, {
            idDocumentUrl: url,
            idDocumentType: input.idType,
          });
        }
        
        return { success: true, url };
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
        gasStationId: z.string().optional(),
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
        return await db.createShiftClosingReport({
          ...input,
          gasStationId: input.shiftId, // Will be updated from shift
          employeeId: input.shiftId, // Will be updated from shift
          openingCash: "0",
          closingCash: input.cashAmount.toString(),
          totalSales: input.totalSales.toString(),
          cashSales: input.cashAmount.toString(),
          creditCardSales: input.creditAmount.toString(),
        });
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
        return await db.createTransaction({
          ...input,
          amount: input.amount.toString(),
          paymentMethod: "cash", // Default payment method
        });
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
        category: z.enum(["payroll", "utilities", "maintenance", "supplies", "rent", "insurance", "other"]),
        amount: z.number(),
        description: z.string().optional(),
        expenseDate: z.string(), // date string
      }))
      .mutation(async ({ input }) => {
        return await db.createExpense({
          ...input,
          amount: input.amount.toString(),
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
        deliveryDate: z.string(),
        gasStationId: z.string(),
        fuelType: z.string(),
        quantity: z.number(),
        pricePerGallon: z.number(),
        supplier: z.string(),
        billOfLading: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { deliveryDate, quantity, pricePerGallon, ...deliveryData } = input;
        const totalCost = quantity * pricePerGallon;
        
        return await db.createFuelDelivery({
          ...deliveryData,
          quantity: quantity.toString(),
          pricePerGallon: pricePerGallon.toString(),
          totalCost: totalCost.toString(),
          deliveryDate: new Date(deliveryDate)
        });
      }),
    
    byStation: protectedProcedure
      .input(z.object({ gasStationId: z.string() }))
      .query(async ({ input }) => {
        return await db.getFuelDeliveriesByStation(input.gasStationId);
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

