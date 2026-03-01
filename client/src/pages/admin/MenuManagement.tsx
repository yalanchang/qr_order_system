import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, UtensilsCrossed, Upload, X, ImageIcon } from "lucide-react";

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

const CATEGORIES = ["前菜", "主菜", "甜點", "飲品"];

const emptyForm = {
  name: "", description: "", price: "", category: "主菜",
  imageUrl: "", available: true, sortOrder: 0,
};

// 圖片上傳區域元件
function ImageUploader({
  value,
  onChange,
  onUpload,
  isUploading,
}: {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("請選擇圖片檔案");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片大小不可超過 5MB");
      return;
    }
    onUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground block">菜品圖片</label>

      {/* 預覽區 */}
      {value ? (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border group">
          <img src={value} alt="菜品圖片" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white/90 text-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-white transition-colors"
            >
              更換圖片
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-destructive/90 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-destructive transition-colors"
            >
              移除
            </button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          } ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <>
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">上傳中...</p>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">點擊上傳或拖曳圖片</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG、PNG、WEBP，最大 5MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 或輸入網址 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">或輸入圖片網址</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://..."
        className="text-sm"
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function MenuManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.menu.listAll.useQuery();

  const uploadImage = trpc.menu.uploadImage.useMutation();

  const createItem = trpc.menu.create.useMutation({
    onSuccess: () => { utils.menu.listAll.invalidate(); utils.menu.list.invalidate(); closeDialog(); toast.success("菜品已新增！"); },
    onError: (e) => toast.error(e.message),
  });
  const updateItem = trpc.menu.update.useMutation({
    onSuccess: () => { utils.menu.listAll.invalidate(); utils.menu.list.invalidate(); closeDialog(); toast.success("菜品已更新！"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteItem = trpc.menu.delete.useMutation({
    onSuccess: () => { utils.menu.listAll.invalidate(); utils.menu.list.invalidate(); setDeleteConfirm(null); toast.success("菜品已刪除"); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name, description: item.description ?? "",
      price: item.price, category: item.category,
      imageUrl: item.imageUrl ?? "", available: item.available, sortOrder: item.sortOrder,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); setForm(emptyForm); };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const mimeType = file.type;
        const ext = file.name.split(".").pop() ?? "jpg";
        try {
          const result = await uploadImage.mutateAsync({ base64, mimeType, ext });
          setForm(f => ({ ...f, imageUrl: result.url }));
          toast.success("圖片上傳成功！");
        } catch (err: any) {
          toast.error("圖片上傳失敗：" + err.message);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
      toast.error("讀取圖片失敗");
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.category) {
      toast.error("名稱、價格與分類為必填欄位");
      return;
    }
    if (isUploading) {
      toast.error("圖片上傳中，請稍候");
      return;
    }
    if (editItem) {
      updateItem.mutate({ id: editItem.id, ...form });
    } else {
      createItem.mutate(form);
    }
  };

  const toggleAvailability = (item: MenuItem) => {
    updateItem.mutate({ id: item.id, available: !item.available });
  };

  const allCategories = items
    ? Array.from(new Set(items.map((i: MenuItem) => i.category)))
    : [];
  const grouped = allCategories.map(cat => ({
    category: cat,
    items: items?.filter((i: MenuItem) => i.category === cat) ?? [],
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            菜單管理
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">新增、編輯或下架菜品</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5 text-sm h-9 px-3 sm:px-4">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新增菜品</span>
          <span className="sm:hidden">新增</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, items: catItems }) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h2>
              <div className="grid gap-3">
                {catItems.map((item: MenuItem) => (
                  <div key={item.id} className="bg-card rounded-2xl border border-border flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                        <Badge variant={item.available ? "default" : "secondary"} className="text-xs">
                          {item.available ? "供應中" : "已下架"}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                      <p className="text-primary font-bold text-sm mt-1">NT${parseFloat(item.price).toFixed(0)}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                        title={item.available ? "下架" : "上架"}
                      >
                        {item.available
                          ? <ToggleRight className="w-5 h-5 text-primary" />
                          : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                        }
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增／編輯對話框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "編輯菜品" : "新增菜品"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* 圖片上傳 */}
            <ImageUploader
              value={form.imageUrl}
              onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
              onUpload={handleImageUpload}
              isUploading={isUploading}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">菜品名稱 *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：松露燉飯" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">價格（元）*</label>
                <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="例：288" type="number" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">分類 *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">菜品描述</label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="簡短描述食材與風味..."
                  className="resize-none h-20 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">排序</label>
                <Input value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} type="number" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-foreground">供應中</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>取消</Button>
            <Button
              onClick={handleSubmit}
              disabled={createItem.isPending || updateItem.isPending || isUploading}
            >
              {isUploading ? "上傳圖片中..." : editItem ? "儲存變更" : "新增菜品"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>確認刪除菜品？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">此操作無法復原，菜品將從菜單中永久移除。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteItem.mutate({ id: deleteConfirm })}
              disabled={deleteItem.isPending}
            >
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
