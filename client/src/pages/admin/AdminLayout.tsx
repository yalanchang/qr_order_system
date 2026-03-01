import { ChefHat, UtensilsCrossed, QrCode, LayoutDashboard, LogOut, Menu, X, Eye, EyeOff, Lock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "出餐管理", icon: ChefHat },
  { href: "/admin/menu", label: "菜單管理", icon: UtensilsCrossed },
  { href: "/admin/qr", label: "QR 碼", icon: QrCode },
];

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const utils = trpc.useUtils();

  const login = trpc.admin.login.useMutation({
    onSuccess: () => {
      toast.success("登入成功");
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "帳號或密碼錯誤");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("請輸入帳號與密碼");
      return;
    }
    login.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">管理員登入</h1>
          <p className="text-muted-foreground text-sm mt-1">請輸入管理員帳號與密碼</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">帳號</Label>
            <Input
              id="username"
              type="text"
              placeholder="請輸入帳號"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              disabled={login.isPending}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="請輸入密碼"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={login.isPending}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base mt-2"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                登入中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                登入後台
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const utils = trpc.useUtils();

  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      window.location.href = "/admin";
    },
    onError: () => toast.error("登出失敗"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 未登入或非管理員 → 顯示登入表單
  if (!user || user.role !== "admin") {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* ── 桌面版側邊欄 ── */}
      <aside className="hidden md:flex w-60 bg-sidebar text-sidebar-foreground flex-col flex-shrink-0 min-h-screen">
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
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary flex-shrink-0">
              管
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">管理員</p>
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

      {/* ── 手機版頂部導覽列 ── */}
      <header className="md:hidden sticky top-0 z-40 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <ChefHat className="w-3.5 h-3.5 text-sidebar-primary" />
            </div>
            <div>
              <p className="font-bold text-sidebar-foreground text-sm leading-none">精緻餐廳</p>
              <p className="text-xs text-sidebar-foreground/50 leading-none mt-0.5">管理後台</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              aria-label="選單"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-sidebar-foreground" /> : <Menu className="w-5 h-5 text-sidebar-foreground" />}
            </button>
          </div>
        </div>

        {/* 手機版下拉選單 */}
        {mobileMenuOpen && (
          <div className="bg-sidebar border-t border-sidebar-border px-3 py-2 space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = location === href;
              return (
                <Link key={href} href={href}>
                  <div
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                </Link>
              );
            })}
            <div className="pt-1 pb-1 border-t border-sidebar-border mt-1">
              <button
                onClick={() => logout.mutate()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── 主內容區 ── */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-8">
          {children}
        </div>
      </main>

      {/* ── 手機版底部導覽列 ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-sidebar border-t border-sidebar-border">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <div className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-sidebar-primary" : ""}`} />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
