import React from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "purple"
  | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ComponentType<{ className?: string }>;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  icon: Icon,
  dot,
  className,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default:
      "bg-muted/80 text-foreground border-border/70 dark:bg-muted dark:text-foreground",
    success:
      "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
    destructive:
      "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20",
    info:
      "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20",
    purple:
      "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/20",
    neutral:
      "bg-muted/60 text-muted-foreground border-border/60",
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: "bg-foreground/60",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    destructive: "bg-rose-500",
    info: "bg-sky-500",
    purple: "bg-indigo-500",
    neutral: "bg-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium tracking-tight border transition-colors select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
};
