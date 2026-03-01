import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChefHat, QrCode, LayoutDashboard, Star, Clock, Utensils } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Fine Dining</span>
          </div>
          <Link href="/admin">
            <a>
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin
              </Button>
            </a>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 py-24 text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Star className="w-3.5 h-3.5" />
            Elegant Dining Experience
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-6 leading-tight">
            Scan. Order.
            <br />
            <span className="text-primary">Enjoy.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            A seamless QR-code ordering experience. Guests scan their table code, browse the menu, and place orders — no app, no login required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/order?table=1">
              <a>
                <Button size="lg" className="gap-2 px-8">
                  <QrCode className="w-4 h-4" />
                  Try Demo (Table 1)
                </Button>
              </a>
            </Link>
            <Link href="/admin">
              <a>
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Backend
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: QrCode,
              title: "QR Code Ordering",
              desc: "Each table has a unique QR code. Guests scan and are taken directly to the menu — no app download needed.",
            },
            {
              icon: Clock,
              title: "Real-Time Kitchen",
              desc: "Orders appear instantly in the kitchen display. Staff can mark orders as preparing or completed with one tap.",
            },
            {
              icon: Utensils,
              title: "Full Menu Control",
              desc: "Admins can add, edit, or hide dishes at any time. Changes reflect immediately on the customer-facing menu.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card rounded-2xl border border-border p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-primary/5 border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Print QR Codes", desc: "Generate and print QR codes for each table from the admin panel." },
              { step: "02", title: "Guest Scans", desc: "Guest scans the table QR code with their phone camera." },
              { step: "03", title: "Browse & Order", desc: "Guest browses the menu, adds items to cart, and submits the order." },
              { step: "04", title: "Kitchen Prepares", desc: "Order appears in the kitchen display. Staff prepares and marks complete." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-primary" />
            <span>Fine Dining QR Order System</span>
          </div>
          <span>Built with elegance</span>
        </div>
      </footer>
    </div>
  );
}
