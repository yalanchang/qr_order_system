import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, CheckCircle2, ChefHat, RefreshCw, UtensilsCrossed } from "lucide-react";

type OrderItem = {
  id: number;
  menuItemName: string;
  quantity: number;
  subtotal: string;
};

type Order = {
  id: number;
  tableNumber: string;
  status: string;
  totalAmount: string;
  note: string | null;
  createdAt: Date;
  items: OrderItem[];
};

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff} 秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
  return `${Math.floor(diff / 3600)} 小時前`;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "待處理",
  preparing: "製作中",
  completed: "已完成",
  cancelled: "已取消",
};

export default function KitchenPage() {
  const [filter, setFilter] = useState<"pending" | "preparing" | "all">("pending");
  const utils = trpc.useUtils();

  const { data: orders, isLoading, refetch } = trpc.order.list.useQuery(
    filter === "all" ? {} : { status: filter },
    { refetchInterval: 15000 }
  );

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
      utils.order.pending.invalidate();
    },
    onError: (err) => toast.error("更新失敗：" + err.message),
  });

  const handleStatusChange = (id: number, status: "pending" | "preparing" | "completed" | "cancelled") => {
    updateStatus.mutate({ id, status });
    toast.success(
      status === "completed" ? "訂單已標記為完成！" :
      status === "preparing" ? "訂單開始製作中" :
      "訂單狀態已更新"
    );
  };

  const pendingCount = orders?.filter((o: Order) => o.status === "pending").length ?? 0;
  const preparingCount = orders?.filter((o: Order) => o.status === "preparing").length ?? 0;

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            出餐管理
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">即時訂單管理介面</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          重新整理
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "待處理", count: pendingCount, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "製作中", count: preparingCount, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "今日總計", count: orders?.length ?? 0, color: "text-primary", bg: "bg-primary/5" },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-4 ${stat.bg}`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 篩選標籤 */}
      <div className="flex gap-2">
        {([
          { key: "pending", label: "待處理" },
          { key: "preparing", label: "製作中" },
          { key: "all", label: "全部訂單" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 訂單列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">目前沒有訂單</p>
          <p className="text-muted-foreground text-sm mt-1">新訂單將自動顯示在這裡</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders?.map((order: Order) => (
            <div
              key={order.id}
              className={`bg-card rounded-2xl border overflow-hidden transition-all ${
                order.status === "pending"
                  ? "border-amber-200 dark:border-amber-800/60 shadow-amber-100/50 dark:shadow-none shadow-lg"
                  : order.status === "preparing"
                  ? "border-blue-200 dark:border-blue-800/60"
                  : "border-border opacity-60"
              }`}
            >
              {/* 訂單標頭 */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                order.status === "pending" ? "bg-amber-50 dark:bg-amber-950/30" :
                order.status === "preparing" ? "bg-blue-50 dark:bg-blue-950/30" :
                "bg-muted/50"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">{order.tableNumber} 桌</span>
                  <span className="text-muted-foreground text-xs">#{order.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{timeAgo(order.createdAt)}</span>
                  <Badge
                    variant={order.status === "pending" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                </div>
              </div>

              {/* 訂單明細 */}
              <div className="px-4 py-3 space-y-1.5">
                {order.items.map((item: OrderItem) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      <span className="font-semibold text-primary">{item.quantity}×</span>{" "}
                      {item.menuItemName}
                    </span>
                    <span className="text-muted-foreground">${parseFloat(item.subtotal).toFixed(0)}</span>
                  </div>
                ))}
                {order.note && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground italic">📝 {order.note}</p>
                  </div>
                )}
              </div>

              {/* 訂單底部操作 */}
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <span className="font-bold text-foreground">${parseFloat(order.totalAmount).toFixed(0)}</span>
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "preparing")}
                      disabled={updateStatus.isPending}
                      className="text-xs h-7 px-3"
                    >
                      開始製作
                    </Button>
                  )}
                  {(order.status === "pending" || order.status === "preparing") && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, "completed")}
                      disabled={updateStatus.isPending}
                      className="text-xs h-7 px-3 gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      完成出餐
                    </Button>
                  )}
                  {order.status === "completed" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      已完成
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
