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
