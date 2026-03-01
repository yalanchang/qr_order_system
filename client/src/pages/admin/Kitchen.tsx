import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, CheckCircle2, ChefHat, RefreshCw, UtensilsCrossed, Volume2, VolumeX } from "lucide-react";

type OrderItem = {
  id: number;
  menuItemName: string;
  quantity: number;
  subtotal: string;
};

type Order = {
  id: number;
  displayId: number | null;
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

/** 使用 Web Audio API 合成一段清脆的「叮咚」提示音，無需外部音效檔 */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const playTone = (freq: number, startTime: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // 叮（高音）→ 咚（低音）雙音節提示
    playTone(880, now, 0.4, 0.5);
    playTone(660, now + 0.18, 0.5, 0.4);
  } catch {
    // 瀏覽器不支援或使用者尚未互動，靜默忽略
  }
}

export default function KitchenPage() {
  const [filter, setFilter] = useState<"pending" | "preparing" | "all">("pending");
  const [muted, setMuted] = useState(false);
  const prevOrderIdsRef = useRef<Set<number> | null>(null);
  const isFirstLoadRef = useRef(true);
  const utils = trpc.useUtils();

  const { data: orders, isLoading, refetch } = trpc.order.list.useQuery(
    filter === "all" ? {} : { status: filter },
    { refetchInterval: 10000 }
  );

  // 偵測新訂單並播放提示音
  const { data: allPendingOrders } = trpc.order.list.useQuery(
    { status: "pending" },
    { refetchInterval: 10000 }
  );

  const handleNewOrder = useCallback(() => {
    if (muted) return;
    playNotificationSound();
    toast("🔔 新訂單進來了！", {
      description: "有新的待處理訂單，請盡快確認。",
      duration: 5000,
    });
  }, [muted]);

  useEffect(() => {
    if (!allPendingOrders) return;

    const currentIds = new Set(allPendingOrders.map((o: Order) => o.id));

    if (isFirstLoadRef.current) {
      // 第一次載入，記錄現有訂單 ID，不播音
      prevOrderIdsRef.current = currentIds;
      isFirstLoadRef.current = false;
      return;
    }

    if (prevOrderIdsRef.current) {
      const hasNew = Array.from(currentIds).some(id => !prevOrderIdsRef.current!.has(id));
      if (hasNew) {
        handleNewOrder();
      }
    }

    prevOrderIdsRef.current = currentIds;
  }, [allPendingOrders, handleNewOrder]);

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

  const pendingCount = allPendingOrders?.length ?? 0;
  const preparingCount = orders?.filter((o: Order) => o.status === "preparing").length ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-0">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            出餐管理
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">每 10 秒自動更新</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 靜音開關 */}
          <button
            onClick={() => {
              setMuted(m => !m);
              toast(muted ? "🔔 提示音已開啟" : "🔕 提示音已靜音");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              muted
                ? "border-muted text-muted-foreground bg-muted/50"
                : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
            }`}
            title={muted ? "點擊開啟提示音" : "點擊靜音"}
          >
            {muted
              ? <VolumeX className="w-3.5 h-3.5" />
              : <Volume2 className="w-3.5 h-3.5" />
            }
            <span className="hidden sm:inline">{muted ? "已靜音" : "提示音開"}</span>
          </button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs h-8 px-3">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重新整理</span>
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "待處理", count: pendingCount, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "製作中", count: preparingCount, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "今日總計", count: orders?.length ?? 0, color: "text-primary", bg: "bg-primary/5" },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-3 sm:p-4 ${stat.bg}`}>
            <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 篩選標籤 */}
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {([
          { key: "pending", label: "待處理" },
          { key: "preparing", label: "製作中" },
          { key: "all", label: "全部訂單" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {label}
            {key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 訂單列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <UtensilsCrossed className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">目前沒有訂單</p>
          <p className="text-muted-foreground text-sm mt-1">新訂單將自動顯示在這裡</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
                  <span className="text-muted-foreground text-xs">#{order.displayId ?? order.id}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
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
                    <span className="text-muted-foreground">NT${parseFloat(item.subtotal).toFixed(0)}</span>
                  </div>
                ))}
                {order.note && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground italic">📝 {order.note}</p>
                  </div>
                )}
              </div>

              {/* 訂單底部操作 */}
              <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-2">
                <span className="font-bold text-foreground text-sm">NT${parseFloat(order.totalAmount).toFixed(0)}</span>
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "preparing")}
                      disabled={updateStatus.isPending}
                      className="text-xs h-8 px-3"
                    >
                      開始製作
                    </Button>
                  )}
                  {(order.status === "pending" || order.status === "preparing") && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, "completed")}
                      disabled={updateStatus.isPending}
                      className="text-xs h-8 px-3 gap-1"
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
