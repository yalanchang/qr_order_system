import { eq, desc, and, sql } from "drizzle-orm";
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
  return db.insert(menuItems).values(item);
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

  // 計算下一個 displayId（從 1 開始遞增，用 MAX 避免 null 值干擾）
  const [maxResult] = await db.select({ maxId: sql<number>`COALESCE(MAX(displayId), 0)` }).from(orders);
  const nextDisplayId = (maxResult?.maxId ?? 0) + 1;

  const [result] = await db.insert(orders).values({ ...order, displayId: nextDisplayId }).$returningId();
  const orderId = result.id;

  if (items.length > 0) {
    await db.insert(orderItems).values(items.map(i => ({ ...i, orderId })));
  }

  return { orderId, displayId: nextDisplayId };
}

export async function getOrdersWithItems(status?: "pending" | "preparing" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) return [];

  const orderList = status
    ? await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt))
    : await db.select().from(orders).orderBy(desc(orders.createdAt));

  return Promise.all(
    orderList.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );
}

export async function getPendingOrders() {
  const db = await getDb();
  if (!db) return [];

  const orderList = await db.select().from(orders)
    .where(and(eq(orders.status, "pending")))
    .orderBy(orders.createdAt);

  return Promise.all(
    orderList.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );
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
  if (existing.length > 0) return; // 已有資料，跳過

  const sampleItems: InsertMenuItem[] = [
    // 前菜
    { name: "松露炸飯糰", description: "酥脆義式炸飯糰，內含黑松露與帕瑪森起司", price: "148", category: "前菜", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80", available: true, sortOrder: 1 },
    { name: "布拉塔番茄沙拉", description: "新鮮布拉塔起司、傳家番茄、羅勒油", price: "168", category: "前菜", imageUrl: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&q=80", available: true, sortOrder: 2 },
    { name: "煎鵝肝", description: "香煎鵝肝佐布里歐麵包與無花果果醬", price: "298", category: "前菜", imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80", available: true, sortOrder: 3 },
    // 主菜
    { name: "和牛菲力", description: "A5 和牛，烤大蒜，時令蔬菜", price: "688", category: "主菜", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80", available: true, sortOrder: 1 },
    { name: "香煎地中海鱸魚", description: "地中海鱸魚，番紅花奶油醬，蘆筍", price: "388", category: "主菜", imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80", available: true, sortOrder: 2 },
    { name: "龍蝦熱炒", description: "半隻緬因龍蝦，干邑奶油醬，格呂耶爾起司", price: "568", category: "主菜", imageUrl: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80", available: true, sortOrder: 3 },
    { name: "松露野菇燉飯", description: "牛肝菌、松露油、陳年帕瑪森起司", price: "268", category: "主菜", imageUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80", available: true, sortOrder: 4 },
    // 甜點
    { name: "熔岩巧克力蛋糕", description: "溫熱黑巧克力，香草冰淇淋", price: "128", category: "甜點", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80", available: true, sortOrder: 1 },
    { name: "法式焦糖布丁", description: "經典香草卡士達，焦糖脆皮", price: "108", category: "甜點", imageUrl: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&q=80", available: true, sortOrder: 2 },
    // 飲品
    { name: "氣泡礦泉水", description: "San Pellegrino 750ml", price: "48", category: "飲品", imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80", available: true, sortOrder: 1 },
    { name: "精選葡萄酒（杯）", description: "每日精選，紅酒或白酒", price: "128", category: "飲品", imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80", available: true, sortOrder: 2 },
    { name: "精品咖啡", description: "單一產區義式濃縮或手沖咖啡", price: "68", category: "飲品", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80", available: true, sortOrder: 3 },
  ];

  await db.insert(menuItems).values(sampleItems);
  console.log("[Seed] 中文菜單資料已成功植入");
}
