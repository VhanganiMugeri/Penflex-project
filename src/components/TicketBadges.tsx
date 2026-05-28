import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  "Pending": "bg-accent/60 text-accent-foreground border-accent",
  "In Progress": "bg-chart-2/30 text-foreground border-chart-2/50",
  "Resolved": "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200",
  "Closed": "bg-muted text-muted-foreground border-border",
};

const PRIORITY_STYLES: Record<string, string> = {
  "Low": "bg-muted text-muted-foreground border-border",
  "Medium": "bg-accent/50 text-accent-foreground border-accent",
  "High": "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={STATUS_STYLES[status] ?? ""}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge variant="outline" className={PRIORITY_STYLES[priority] ?? ""}>{priority}</Badge>;
}

export function DeptBadge({ department, ai }: { department: string; ai?: boolean }) {
  return (
    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
      {ai ? "AI: " : ""}{department}
    </Badge>
  );
}
