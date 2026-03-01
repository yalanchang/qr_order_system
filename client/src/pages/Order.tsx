import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addItem, incrementItem, decrementItem,
  setTableNumber, setNote, clearCart, openCart, closeCart,
  selectCartItems, selectCartTotal, selectCartCount,
  selectTableNumber, selectNote, selectIsCartOpen,
} from "@/store/cartSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, ChefHat, CheckCircle, Utensils } from "lucide-react";

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  category: string;
  imageUrl: string | null;
  available: boolean;
  sortOrder: number;
};

const CATEGORY_ORDER = ["前菜", "主菜", "甜點", "飲品", "Appetizers", "Mains", "Desserts", "Beverages"];

export default function OrderPage() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const cartCount = useAppSelector(selectCartCount);
  const tableNumber = useAppSelector(selectTableNumber);
  const note = useAppSelector(selectNote);
  const isCartOpen = useAppSelector(selectIsCartOpen);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [displayOrderId, setDisplayOrderId] = useState<number | null>(null);

  // 從 URL 讀取桌號
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get("table") || "1";
    dispatch(setTableNumber(table));
  }, [dispatch]);

  const { data: menuItems, isLoading } = trpc.menu.list.useQuery();

  const createOrder = trpc.order.create.useMutation({
    onSuccess: (data) => {
      setOrderId(data.orderId);
      setDisplayOrderId(data.displayId ?? data.orderId);
      // orderId is for internal reference only
      setOrderSuccess(true);
      dispatch(clearCart());
      dispatch(closeCart());
    },
    onError: (err) => {
      toast.error("訂單送出失敗：" + err.message);
    },
  });

  const categories = menuItems
    ? Array.from(new Set(menuItems.map((i: MenuItem) => i.category))).sort(
        (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
      )
    : [];

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const filteredItems = menuItems?.filter((i: MenuItem) => i.category === activeCategory) ?? [];

  const getItemQty = (id: number) => cartItems.find(i => i.menuItemId === id)?.quantity ?? 0;

  const handleAddItem = (item: MenuItem) => {
    dispatch(addItem({
      menuItemId: item.id,
      name: item.name,
      price: parseFloat(item.price),
      imageUrl: item.imageUrl ?? undefined,
    }));
  };

  const handleSubmitOrder = () => {
    if (cartItems.length === 0) return;
    createOrder.mutate({
      tableNumber,
      note,
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId,
        menuItemName: item.name,
        menuItemPrice: item.price.toFixed(2),
        quantity: item.quantity,
        subtotal: (item.price * item.quantity).toFixed(2),
      })),
      totalAmount: cartTotal.toFixed(2),
    });
  };

  // 訂單成功畫面
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm mx-auto w-full">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">訂單已送出！</h2>
          <p className="text-muted-foreground mb-1">訂單編號 #{displayOrderId ?? orderId} · 第 {tableNumber} 桌</p>
          <p className="text-muted-foreground text-sm mb-8">
            廚房正在為您準備，請稍候片刻。
          </p>
          <Button
            onClick={() => { setOrderSuccess(false); setOrderId(null); }}
            className="w-full h-12 text-base"
          >
            繼續點餐
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 頂部導覽列 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <div>
              <span className="font-semibold text-foreground text-sm">精緻餐廳</span>
              <span className="text-muted-foreground text-xs ml-2">· 第 {tableNumber} 桌</span>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: "cart/toggleCart" })}
            className="relative p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="購物車"
          >
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 頁首橫幅 */}
      <div className="bg-gradient-to-b from-primary/8 to-transparent py-6 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">精選菜單</h1>
          <p className="text-muted-foreground text-sm">以熱情烹調，以用心服務</p>
        </div>
      </div>

      {/* 分類標籤列 */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1.5 overflow-x-auto py-3" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 菜品列表 */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-36">
        {isLoading ? (
          <div className="grid gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 sm:h-32 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredItems.map((item: MenuItem) => {
              const qty = getItemQty(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden flex"
                >
                  {item.imageUrl && (
                    <div className="w-24 sm:w-28 h-24 sm:h-28 flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm leading-tight">{item.name}</h3>
                      {item.description && (
                        <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-bold text-base">
                        NT${parseFloat(item.price).toFixed(0)}
                      </span>
                      {qty === 0 ? (
                        <button
                          onClick={() => handleAddItem(item)}
                          className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm active:scale-95"
                          aria-label={`加入 ${item.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dispatch(decrementItem(item.id))}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-semibold text-sm text-foreground">{qty}</span>
                          <button
                            onClick={() => dispatch(incrementItem(item.id))}
                            className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 浮動購物車按鈕 */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
          <button
            onClick={() => dispatch(openCart())}
            className="bg-primary text-primary-foreground rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl hover:bg-primary/90 transition-all w-full max-w-sm active:scale-[0.98]"
          >
            <span className="w-6 h-6 rounded-lg bg-primary-foreground/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
            <span className="flex-1 text-left font-semibold text-sm sm:text-base">查看購物車</span>
            <span className="font-bold text-sm sm:text-base">NT${cartTotal.toFixed(0)}</span>
          </button>
        </div>
      )}

      {/* 購物車抽屜 */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={() => dispatch(closeCart())}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* 拖曳指示條 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* 購物車標頭 */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-3 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground">我的訂單</h2>
                <Badge variant="secondary" className="text-xs">{cartCount} 項</Badge>
              </div>
              <button
                onClick={() => dispatch(closeCart())}
                className="p-1.5 rounded-full hover:bg-accent transition-colors"
                aria-label="關閉購物車"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* 購物車品項 */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3" style={{ WebkitOverflowScrolling: "touch" }}>
              {cartItems.map(item => (
                <div key={item.menuItemId} className="flex items-center gap-3">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">NT${item.price.toFixed(0)} / 份</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => dispatch(decrementItem(item.menuItemId))}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(incrementItem(item.menuItemId))}
                      className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-foreground w-14 sm:w-16 text-right flex-shrink-0">
                    NT${(item.price * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}

              {/* 備註 */}
              <div className="pt-2">
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">特殊需求／備註</label>
                <Textarea
                  placeholder="過敏原、口味偏好..."
                  value={note}
                  onChange={e => dispatch(setNote(e.target.value))}
                  className="text-sm resize-none h-20 bg-background"
                />
              </div>
            </div>

            {/* 購物車底部 */}
            <div className="px-5 sm:px-6 pb-8 pt-4 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">小計</span>
                <span className="font-semibold text-foreground">NT${cartTotal.toFixed(0)}</span>
              </div>
              <Button
                className="w-full h-12 text-base font-semibold rounded-xl active:scale-[0.98]"
                onClick={handleSubmitOrder}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? "送出中..." : `確認送出 · NT$${cartTotal.toFixed(0)}`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
