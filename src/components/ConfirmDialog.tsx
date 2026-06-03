import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-background/80" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel ?? t("confirmDialogCancel")}
          </Button>
          <Button
            size="sm"
            className={variant === "danger" ? "bg-red-600 hover:bg-red-700" : ""}
            onClick={onConfirm}
          >
            {confirmLabel ?? t("confirmDialogConfirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}