import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick?: () => void };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed bg-card/60", className)}>
      <CardContent
        className={cn(
          "flex flex-col items-center justify-center text-center",
          compact ? "gap-2 py-8" : "gap-3 py-14",
        )}
      >
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-primary">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
        {action && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 rounded-full"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
