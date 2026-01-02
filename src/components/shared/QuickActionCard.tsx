import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "primary";
  className?: string;
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  variant = "default",
  className,
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-all duration-200 group",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-card border border-border hover:border-primary/30 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "p-2.5 rounded-lg",
            variant === "primary"
              ? "bg-primary-foreground/10"
              : "bg-primary/10 group-hover:bg-primary/20"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              variant === "primary" ? "text-primary-foreground" : "text-primary"
            )}
          />
        </div>
        <div>
          <p
            className={cn(
              "font-semibold",
              variant === "default" && "text-foreground"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "text-sm mt-0.5",
              variant === "primary"
                ? "text-primary-foreground/80"
                : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
