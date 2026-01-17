import { cn } from "@/lib/utils";

type StatusType =
  | "active"
  | "pending"
  | "inactive"
  | "approved"
  | "rejected"
  | "cancelled"
  | "hired"
  | "interviewing"
  | "on-leave"
  | "terminated"
  | "resigned"
  | "clocked-in"
  | "clocked-out"
  | "on-break";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  inactive: "bg-muted text-muted-foreground",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  hired: "bg-primary/10 text-primary",
  interviewing: "bg-info/10 text-info",
  "on-leave": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  terminated: "bg-destructive/10 text-destructive",
  resigned: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "clocked-in": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "clocked-out": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  "on-break": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  hired: "Hired",
  interviewing: "Interviewing",
  "on-leave": "On Leave",
  terminated: "Terminated",
  resigned: "Resigned",
  "clocked-in": "Clocked In",
  "clocked-out": "Clocked Out",
  "on-break": "On Break",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-muted text-muted-foreground";
  const label = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={cn("badge-status", style, className)}>
      {label}
    </span>
  );
}
