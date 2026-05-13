interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-surface border-border text-text",
  success: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  warning: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  danger: "bg-rose-500/15 border-rose-500/30 text-rose-300",
  info: "bg-sky-500/15 border-sky-500/30 text-sky-300",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
