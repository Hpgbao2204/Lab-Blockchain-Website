"use client";

import { useCallback, useRef, useState } from "react";
import { Check, CircleAlert, X } from "lucide-react";

export type Toast = { id: number; message: string; type: "success" | "error" };

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="fixed top-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/80 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/80 dark:text-emerald-300"
          }`}
          style={{ minWidth: "260px", maxWidth: "400px" }}
        >
          {toast.type === "error" ? (
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <Check className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <span className="flex-1 leading-5">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-muted hover:text-foreground"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const show = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, show, dismiss };
}
