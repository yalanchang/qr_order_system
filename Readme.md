# QR Code 掃碼點餐系統

一個掃碼點餐系統，客人無需登入，掃碼即可點餐；管理員登入後台管理出餐流程。包含客人端點餐介面與管理員後台出餐介面。

-----

## 🚀 主要功能

### 客人端

- 掃描 QR Code 即可進入點餐介面，**無需註冊或登入**
- 瀏覽菜單、加入購物車、送出訂單

### 管理員後台

- 管理員登入驗證
- 查看即時訂單列表
- 管理出餐狀態（接單、出餐、完成）
- 菜單管理

-----

## 🛠 技術堆疊

|層級   |技術                   |
|-----|---------------------|
|前端   |TypeScript、Vite、React|
|後端   |Node.js、TypeScript   |
|資料庫  |Drizzle ORM          |
|樣式   |CSS                  |
|測試   |Vitest               |
|程式碼格式|Prettier             |

-----

## 📁 專案結構

```
qr_order_system/
├── client/           # 前端應用程式（客人端 + 管理員後台）
├── server/           # 後端 API 伺服器
├── shared/           # 共用型別與工具函式
├── drizzle/          # 資料庫遷移與 Schema
├── patches/          # 套件修補檔
├── vite.config.ts    # Vite 設定檔
├── vitest.config.ts  # 測試設定檔
├── drizzle.config.ts # 資料庫設定檔
└── tsconfig.json     # TypeScript 設定檔
```



## 🔄 使用流程

```
餐廳產生 QR Code（對應桌號）
        ↓
客人掃描 QR Code
        ↓
客人瀏覽菜單並點餐
        ↓
訂單送出至後台
        ↓
管理員接單並管理出餐
        ↓
出餐完成
