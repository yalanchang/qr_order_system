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
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

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
    onError: (err) => toast.error("Failed to update: " + err.message),
  });

  const handleStatusChange = (id: number, status: "pending" | "preparing" | "completed" | "cancelled") => {
    updateStatus.mutate({ id, status });
    toast.success(
      status === "completed" ? "Order marked as completed!" :
      status === "preparing" ? "Order is now being prepared" :
      "Order status updated"
    );
  };

  const pendingCount = orders?.filter((o: Order) => o.status === "pending").length ?? 0;
  const preparingCount = orders?.filter((o: Order) => o.status === "preparing").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            Kitchen Display
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Real-time order management</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", count: pendingCount, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Preparing", count: preparingCount, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Total Today", count: orders?.length ?? 0, color: "text-primary", bg: "bg-primary/5" },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-4 ${stat.bg}`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["pending", "preparing", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {f === "all" ? "All Orders" : f}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No orders to display</p>
          <p className="text-muted-foreground text-sm mt-1">New orders will appear here automatically</p>
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
              {/* Order Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                order.status === "pending" ? "bg-amber-50 dark:bg-amber-950/30" :
                order.status === "preparing" ? "bg-blue-50 dark:bg-blue-950/30" :
                "bg-muted/50"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">Table {order.tableNumber}</span>
                  <span className="text-muted-foreground text-xs">#{order.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{timeAgo(order.createdAt)}</span>
                  <Badge
                    variant={order.status === "pending" ? "destructive" : "secondary"}
                    className="text-xs capitalize"
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>

              {/* Order Items */}
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

              {/* Order Footer */}
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <span className="font-bold text-foreground">${parseFloat(order.totalAmount).toFixed(2)}</span>
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "preparing")}
                      disabled={updateStatus.isPending}
                      className="text-xs h-7 px-3"
                    >
                      Start Preparing
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
                      Done
                    </Button>
                  )}
                  {order.status === "completed" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Completed
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
