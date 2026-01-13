import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="page-header">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
