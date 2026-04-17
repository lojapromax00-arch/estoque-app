import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "error" | "info" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: "bg-green-900/40 text-green-400 border border-green-800",
  warning: "bg-yellow-900/40 text-yellow-400 border border-yellow-800",
  error: "bg-red-900/40 text-red-400 border border-red-800",
  info: "bg-blue-900/40 text-blue-400 border border-blue-800",
  default: "bg-gray-800 text-gray-400 border border-gray-700",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
