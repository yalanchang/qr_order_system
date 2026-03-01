import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ChefHat, UtensilsCrossed, QrCode, LayoutDashboard, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/admin", label: "出餐管理", icon: ChefHat },
  { href: "/admin/menu", label: "菜單管理", icon: UtensilsCrossed },
  { href: "/admin/qr", label: "QR 碼產生", icon: QrCode },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
    onError: () => toast.error("登出失敗"),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">管理員登入</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {isAuthenticated && user?.role !== "admin"
              ? "您的帳號沒有管理員權限，請聯絡系統管理員。"
              : "請使用管理員帳號登入以進入後台。"}
          </p>
          {!isAuthenticated && (
            <Button
              className="w-full"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              使用 Manus 帳號登入
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-sidebar-primary" />
            </div>
            <div>
              <p className="font-bold text-sidebar-foreground text-sm">精緻餐廳</p>
              <p className="text-xs text-sidebar-foreground/50">管理後台</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary">
              {user?.name?.charAt(0) ?? "管"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name ?? "管理員"}</p>
              <p className="text-xs text-sidebar-foreground/50">系統管理員</p>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="p-1 rounded-lg hover:bg-sidebar-accent transition-colors"
              title="登出"
            >
              <LogOut className="w-3.5 h-3.5 text-sidebar-foreground/50" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
