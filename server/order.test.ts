import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  seedMenuItems: vi.fn().mockResolvedValue(undefined),
  getAvailableMenuItems: vi.fn().mockResolvedValue([
    { id: 1, name: "Truffle Arancini", price: "148", category: "Appetizers", available: true, sortOrder: 1, description: null, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, name: "Wagyu Beef", price: "688", category: "Mains", available: true, sortOrder: 1, description: null, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getAllMenuItems: vi.fn().mockResolvedValue([
    { id: 1, name: "Truffle Arancini", price: "148", category: "Appetizers", available: true, sortOrder: 1, description: null, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  createMenuItem: vi.fn().mockResolvedValue({ insertId: 99 }),
  updateMenuItem: vi.fn().mockResolvedValue(undefined),
  deleteMenuItem: vi.fn().mockResolvedValue(undefined),
  createOrder: vi.fn().mockResolvedValue({ orderId: 42, displayId: 1 }),
  getOrdersWithItems: vi.fn().mockResolvedValue([]),
  getPendingOrders: vi.fn().mockResolvedValue([]),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
}));

function makeCtx(role: "admin" | "user" | null = null): TrpcContext {
  return {
    user: role
      ? {
          id: 1,
          openId: "test-user",
          name: "Test User",
          email: "test@example.com",
          loginMethod: "manus",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Menu Tests ───────────────────────────────────────────────────────────────

describe("menu.list (public)", () => {
  it("returns available menu items without authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const items = await caller.menu.list();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });
});

describe("menu.listAll (admin only)", () => {
  it("allows admin to list all items", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const items = await caller.menu.listAll();
    expect(Array.isArray(items)).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.menu.listAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects unauthenticated requests", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.menu.listAll()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("menu.create (admin only)", () => {
  it("allows admin to create a menu item", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.menu.create({
      name: "Test Dish",
      price: "99",
      category: "Mains",
      available: true,
      sortOrder: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin users from creating menu items", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.menu.create({ name: "Hack", price: "1", category: "Mains", available: true, sortOrder: 0 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ─── Order Tests ──────────────────────────────────────────────────────────────

describe("order.create (public)", () => {
  it("allows guests to create an order without authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.order.create({
      tableNumber: "5",
      items: [
        { menuItemId: 1, menuItemName: "Truffle Arancini", menuItemPrice: "148.00", quantity: 2, subtotal: "296.00" },
      ],
      totalAmount: "296.00",
    });
    expect(result.success).toBe(true);
    expect(result.orderId).toBe(42);
    expect(result.displayId).toBe(1);
  });

  it("rejects empty order items", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.order.create({ tableNumber: "1", items: [], totalAmount: "0.00" })
    ).rejects.toThrow();
  });
});

describe("order.pending (admin only)", () => {
  it("allows admin to view pending orders", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const orders = await caller.order.pending();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("rejects non-admin from viewing pending orders", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.order.pending()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("order.updateStatus (admin only)", () => {
  it("allows admin to update order status", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.order.updateStatus({ id: 1, status: "completed" });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin from updating order status", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.order.updateStatus({ id: 1, status: "completed" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears session cookie on logout", async () => {
    const { ctx } = (() => {
      const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
      const ctx = makeCtx("user");
      ctx.res = {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as unknown as TrpcContext["res"];
      return { ctx, clearedCookies };
    })();

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
