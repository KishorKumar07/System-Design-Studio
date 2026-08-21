import { forwardRef } from "react";

const base =
  "w-full rounded-lg border border-border bg-background-soft px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle outline-none transition-all focus:border-accent focus:ring-2 focus:ring-ring";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`${base} ${className}`} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return <textarea ref={ref} className={`${base} resize-none ${className}`} {...props} />;
  },
);

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground-muted">{children}</label>;
}
