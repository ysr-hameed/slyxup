import { useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error";

export interface Toast {
  type: ToastType;
  message: string;
}

export function useToast(duration = 3000) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), duration);
  }, [duration]);

  return { toast, showToast };
}
