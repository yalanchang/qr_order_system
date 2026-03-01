import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChefHat, QrCode, LayoutDashboard, Star, Clock, Utensils } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* 導覽列 */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm sm:text-base">精緻餐廳</span>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">管理後台</span>
              <span className="xs:hidden">後台</span>
            </Button>
          </Link>
        </div>
      </nav>

      {/* 主視覺區 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-28 text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium mb-5 sm:mb-6">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            精緻用餐體驗
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-4 sm:mb-6 leading-tight">
            掃碼。點餐。
            <br />
            <span className="text-primary">盡情享用。</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8 sm:mb-10 px-2">
            無縫的 QR 碼點餐體驗。客人掃描桌號 QR 碼，即可瀏覽菜單並下單——無需下載 App，無需登入。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
            <Link href="/order?table=1" className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 px-6 sm:px-8 w-full sm:w-auto h-12 sm:h-11 text-base sm:text-sm">
                <QrCode className="w-4 h-4" />
                體驗點餐（第 1 桌）
              </Button>
            </Link>
            <Link href="/admin" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="gap-2 px-6 sm:px-8 w-full sm:w-auto h-12 sm:h-11 text-base sm:text-sm">
                <LayoutDashboard className="w-4 h-4" />
                進入管理後台
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 功能特色 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: QrCode,
              title: "QR 碼點餐",
              desc: "每張桌子擁有專屬 QR 碼，客人掃碼即直達菜單，無需下載任何 App。",
            },
            {
              icon: Clock,
              title: "即時出餐管理",
              desc: "訂單即時顯示於廚房介面，工作人員一鍵標記製作中或已完成。",
            },
            {
              icon: Utensils,
              title: "靈活菜單管理",
              desc: "管理員可隨時新增、編輯或下架菜品，變更立即反映於客人菜單。",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card rounded-2xl border border-border p-5 sm:p-6 flex sm:block gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 sm:mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1 sm:mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 使用流程 */}
      <section className="bg-primary/5 border-y border-border py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-8 sm:mb-10">使用流程</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { step: "01", title: "列印 QR 碼", desc: "從管理後台產生各桌專屬 QR 碼並列印放置桌上。" },
              { step: "02", title: "客人掃碼", desc: "客人使用手機相機掃描桌上的 QR 碼。" },
              { step: "03", title: "瀏覽並點餐", desc: "客人瀏覽菜單、加入購物車並送出訂單。" },
              { step: "04", title: "廚房出餐", desc: "訂單顯示於廚房介面，工作人員備餐後標記完成。" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold mx-auto mb-2 sm:mb-3">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground text-xs sm:text-sm mb-1">{title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed hidden sm:block">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 頁尾 */}
      <footer className="border-t border-border py-6 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-primary" />
            <span>精緻餐廳 QR 點餐系統</span>
          </div>
          <span>以匠心打造</span>
        </div>
      </footer>
    </div>
  );
}
