# QR Order System TODO

## Database & Backend
- [x] Design and push DB schema (users, menu_items, orders, order_items)
- [x] Seed sample menu items
- [x] tRPC router: menu (list, add, edit, delete)
- [x] tRPC router: orders (create, list, updateStatus)
- [x] tRPC router: admin (protected, role-gated)
- [x] Admin role guard (adminProcedure)

## Customer-Facing
- [x] Customer ordering page at /order?table=X (no auth required)
- [x] Menu browsing with categories
- [x] Redux store for shopping cart
- [x] Cart sidebar / drawer
- [x] Order submission form (table number auto-filled)
- [x] Order confirmation page

## Admin Backend
- [x] Admin login via Manus OAuth
- [x] Kitchen display: real-time pending orders
- [x] Mark order as completed
- [x] Menu management (add / edit / delete dishes)
- [x] QR Code generation per table
- [x] QR Code download/print

## UI & Style
- [x] Elegant dark/warm color palette
- [x] Customer page: mobile-first, beautiful food card layout
- [x] Admin dashboard: clean sidebar layout
- [x] Responsive design

## Testing
- [x] Vitest: order creation procedure
- [x] Vitest: menu CRUD procedures
- [x] Vitest: admin role guard

## 修復與中文化
- [x] 修復 AdminLayout 巢狀 <a> 標籤錯誤
- [x] 全介面中文化（首頁、點餐頁、管理後台）
- [x] 菜單種子資料改為中文

## 呼叫服務員功能
- [ ] DB Schema 新增 service_requests 表
- [ ] tRPC API：createServiceRequest、listServiceRequests、resolveServiceRequest
- [ ] 客人點餐頁新增「呼叫服務員」按鈕（含防重複呼叫冷卻機制）
- [ ] 廚房介面新增服務請求通知區塊（即時輪詢）
- [ ] 廚房介面可標記服務請求為已處理
- [ ] Vitest：服務請求 API 測試

## 手機版 RWD 調整
- [x] 首頁手機版排版優化
- [x] 客人點餐頁手機版優化（菜單卡片、購物車抽屜、底部固定按鈕）
- [x] AdminLayout 手機版：側邊欄改為底部導覽列
- [x] 廚房出餐介面手機版優化
- [x] 菜單管理頁手機版優化
- [x] QR 碼產生頁手機版優化

## 廚房提示音功能
- [x] 廚房介面新訂單提示音（Web Audio API）
- [x] 靜音開關按鈕
- [x] 偵測新訂單自動播放

## 訂單編號與圖片上傳
- [x] 修正訂單編號顯示（新增 displayId 欄位，從 1 開始遞增）
- [x] 菜單管理頁新增圖片上傳功能（S3）
- [x] 上傳 UI：點擊選圖或拖曳上傳，預覽縮圖
