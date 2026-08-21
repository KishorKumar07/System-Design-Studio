type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-surface-strong text-foreground-muted border-border",
  accent: "bg-accent-soft text-accent border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}
