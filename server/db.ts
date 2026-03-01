import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, menuItems, orders, orderItems, InsertMenuItem, InsertOrder, InsertOrderItem } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ─── User helpers ────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Menu helpers ─────────────────────────────────────────────────────────────

export async function getAllMenuItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).orderBy(menuItems.category, menuItems.sortOrder);
}

export async function getAvailableMenuItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems)
    .where(eq(menuItems.available, true))
    .orderBy(menuItems.category, menuItems.sortOrder);
}

export async function createMenuItem(item: InsertMenuItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(menuItems).values(item);
  return result;
}

export async function updateMenuItem(id: number, item: Partial<InsertMenuItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(menuItems).set(item).where(eq(menuItems.id, id));
}

export async function deleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(menuItems).where(eq(menuItems.id, id));
}

// ─── Order helpers ────────────────────────────────────────────────────────────

export async function createOrder(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const [result] = await db.insert(orders).values(order).$returningId();
  const orderId = result.id;

  if (items.length > 0) {
    await db.insert(orderItems).values(items.map(i => ({ ...i, orderId })));
  }

  return orderId;
}

export async function getOrdersWithItems(status?: "pending" | "preparing" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) return [];

  const orderList = status
    ? await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt))
    : await db.select().from(orders).orderBy(desc(orders.createdAt));

  const result = await Promise.all(
    orderList.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return result;
}

export async function getPendingOrders() {
  const db = await getDb();
  if (!db) return [];

  const orderList = await db.select().from(orders)
    .where(and(
      eq(orders.status, "pending"),
    ))
    .orderBy(orders.createdAt);

  const result = await Promise.all(
    orderList.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return result;
}

export async function updateOrderStatus(id: number, status: "pending" | "preparing" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function seedMenuItems() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(menuItems).limit(1);
  if (existing.length > 0) return; // already seeded

  const sampleItems: InsertMenuItem[] = [
    // Appetizers
    { name: "Truffle Arancini", description: "Crispy risotto balls with black truffle and parmesan", price: "148", category: "Appetizers", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80", available: true, sortOrder: 1 },
    { name: "Burrata Caprese", description: "Fresh burrata, heirloom tomatoes, basil oil", price: "168", category: "Appetizers", imageUrl: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&q=80", available: true, sortOrder: 2 },
    { name: "Seared Foie Gras", description: "Pan-seared foie gras with brioche and fig jam", price: "298", category: "Appetizers", imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80", available: true, sortOrder: 3 },
    // Mains
    { name: "Wagyu Beef Tenderloin", description: "A5 Wagyu, roasted garlic, seasonal vegetables", price: "688", category: "Mains", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80", available: true, sortOrder: 1 },
    { name: "Pan-Seared Sea Bass", description: "Mediterranean sea bass, saffron beurre blanc, asparagus", price: "388", category: "Mains", imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80", available: true, sortOrder: 2 },
    { name: "Lobster Thermidor", description: "Half Maine lobster, cognac cream sauce, gruyère", price: "568", category: "Mains", imageUrl: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80", available: true, sortOrder: 3 },
    { name: "Mushroom Risotto", description: "Porcini, truffle oil, aged parmesan", price: "268", category: "Mains", imageUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80", available: true, sortOrder: 4 },
    // Desserts
    { name: "Chocolate Fondant", description: "Warm dark chocolate, vanilla bean ice cream", price: "128", category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80", available: true, sortOrder: 1 },
    { name: "Crème Brûlée", description: "Classic vanilla custard with caramelised sugar", price: "108", category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&q=80", available: true, sortOrder: 2 },
    // Beverages
    { name: "Sparkling Water", description: "San Pellegrino 750ml", price: "48", category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80", available: true, sortOrder: 1 },
    { name: "House Wine (Glass)", description: "Curated selection, red or white", price: "128", category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80", available: true, sortOrder: 2 },
    { name: "Artisan Coffee", description: "Single origin espresso or filter", price: "68", category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80", available: true, sortOrder: 3 },
  ];

  await db.insert(menuItems).values(sampleItems);
  console.log("[Seed] Menu items seeded successfully");
}
