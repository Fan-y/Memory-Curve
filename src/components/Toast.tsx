import { useToastStore } from "@/stores/toastStore";

const typeStyles: Record<string, string> = {
  success: "border-emerald-400 bg-emerald-50 text-emerald-800",
  error: "border-red-400 bg-red-50 text-red-800",
  info: "border-primary/40 bg-primary/5 text-primary",
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-[slideUpFadeIn_0.25s_ease-out] rounded-lg border px-4 py-2 text-sm shadow-md ${typeStyles[toast.type] ?? typeStyles.info}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}