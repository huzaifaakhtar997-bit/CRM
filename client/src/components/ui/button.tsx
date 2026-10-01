import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg";
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md text-xs font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";
    
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs border border-transparent active:scale-[0.99]",
      outline: "border border-border/80 bg-card hover:bg-accent/70 hover:text-foreground text-muted-foreground shadow-2xs active:scale-[0.99]",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40 active:scale-[0.99]",
      ghost: "hover:bg-accent/70 hover:text-foreground text-muted-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-2xs border border-transparent active:scale-[0.99]",
    };

    const sizes = {
      default: "h-8.5 px-3.5 py-1.5",
      sm: "h-7 px-2.5 text-[11px]",
      lg: "h-10 px-5 text-sm",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
