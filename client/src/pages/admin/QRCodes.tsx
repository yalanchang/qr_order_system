import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { QrCode, Download, Plus, Minus } from "lucide-react";
import QRCode from "qrcode";

function QRCard({ tableNumber }: { tableNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseUrl = window.location.origin;
  const url = `${baseUrl}/order?table=${tableNumber}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: "#2C1810", light: "#FDFAF6" },
      });
    }
  }, [url]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `桌號${tableNumber}-QR碼.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success(`第 ${tableNumber} 桌 QR 碼已下載`);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 flex flex-col items-center gap-4">
        <div className="bg-[#FDFAF6] p-3 rounded-2xl shadow-inner">
          <canvas ref={canvasRef} className="rounded-lg" />
        </div>
        <div className="text-center">
          <p className="font-bold text-foreground text-lg">第 {tableNumber} 桌</p>
          <p className="text-xs text-muted-foreground mt-0.5 break-all max-w-[200px]">{url}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} className="w-full gap-2">
          <Download className="w-3.5 h-3.5" />
          下載 PNG
        </Button>
      </div>
    </div>
  );
}

export default function QRCodesPage() {
  const [tableCount, setTableCount] = useState(8);
  const [inputVal, setInputVal] = useState("8");

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <QrCode className="w-6 h-6 text-primary" />
          QR 碼產生器
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          為每張桌子產生專屬 QR 碼，客人掃碼即可直接點餐。
        </p>
      </div>

      {/* 控制區 */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <label className="text-sm font-medium text-foreground block mb-3">桌位數量</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { const v = Math.max(1, tableCount - 1); setTableCount(v); setInputVal(String(v)); }}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <Input
            type="number"
            min={1}
            max={50}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={() => {
              const v = Math.min(50, Math.max(1, parseInt(inputVal) || 1));
              setTableCount(v);
              setInputVal(String(v));
            }}
            className="w-20 text-center"
          />
          <button
            onClick={() => { const v = Math.min(50, tableCount + 1); setTableCount(v); setInputVal(String(v)); }}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground ml-2">桌（最多 50 桌）</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          每個 QR 碼連結至：<code className="bg-muted px-1 py-0.5 rounded text-xs">{window.location.origin}/order?table=N</code>
        </p>
      </div>

      {/* QR 碼格狀排列 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map(n => (
          <QRCard key={n} tableNumber={n} />
        ))}
      </div>
    </div>
  );
}
