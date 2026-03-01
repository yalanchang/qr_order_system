import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getAllMenuItems,
  getAvailableMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createOrder,
  getOrdersWithItems,
  getPendingOrders,
  updateOrderStatus,
  seedMenuItems,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Menu (public read, admin write) ──────────────────────────────────────
  menu: router({
    // Public: customers can browse available items
    list: publicProcedure.query(async () => {
      await seedMenuItems();
      return getAvailableMenuItems();
    }),

    // Admin: see all items including unavailable
    listAll: adminProcedure.query(async () => {
      return getAllMenuItems();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          price: z.string(),
          category: z.string().min(1),
          imageUrl: z.string().optional(),
          available: z.boolean().default(true),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        await createMenuItem(input);
        return { success: true };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          price: z.string().optional(),
          category: z.string().optional(),
          imageUrl: z.string().optional(),
          available: z.boolean().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateMenuItem(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMenuItem(input.id);
        return { success: true };
      }),

    // Admin: upload menu item image to S3
    uploadImage: adminProcedure
      .input(
        z.object({
          base64: z.string(), // data:image/xxx;base64,...
          mimeType: z.string().default("image/jpeg"),
          ext: z.string().default("jpg"),
        })
      )
      .mutation(async ({ input }) => {
        // Strip data URL prefix if present
        const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const key = `menu-images/${nanoid(10)}.${input.ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── Orders ───────────────────────────────────────────────────────────────
  order: router({
    // Public: customers submit orders
    create: publicProcedure
      .input(
        z.object({
          tableNumber: z.string().min(1),
          note: z.string().optional(),
          items: z.array(
            z.object({
              menuItemId: z.number(),
              menuItemName: z.string(),
              menuItemPrice: z.string(),
              quantity: z.number().min(1),
              subtotal: z.string(),
            })
          ).min(1),
          totalAmount: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { orderId, displayId } = await createOrder(
          {
            tableNumber: input.tableNumber,
            totalAmount: input.totalAmount,
            note: input.note,
            status: "pending",
          },
          input.items.map(item => ({
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            menuItemPrice: item.menuItemPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })) as Omit<import('../drizzle/schema').InsertOrderItem, 'orderId'>[]
        );
        return { success: true, orderId, displayId };
      }),

    // Admin: get pending orders for kitchen display
    pending: adminProcedure.query(async () => {
      return getPendingOrders();
    }),

    // Admin: get all orders with optional status filter
    list: adminProcedure
      .input(
        z.object({
          status: z.enum(["pending", "preparing", "completed", "cancelled"]).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getOrdersWithItems(input?.status);
      }),

    // Admin: update order status
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "preparing", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
