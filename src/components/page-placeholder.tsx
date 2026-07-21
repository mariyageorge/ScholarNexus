import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: ReactNode;
  actionLabel?: string;
}

export function PagePlaceholder({ title, description, icon, actionLabel }: Props) {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-1">
            <Badge className="gap-1.5 rounded-full border-none bg-accent/15 px-2.5 py-1 text-[0.7rem] font-medium text-foreground hover:bg-accent/20">
              <Sparkles className="h-3 w-3" /> ScholarNexus AI
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
          {actionLabel && (
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              {actionLabel}
            </Button>
          )}
        </div>

        <Card className="surface-elevated border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary">
              {icon}
            </div>
            <div className="max-w-md space-y-1.5">
              <h2 className="text-base font-semibold text-foreground">Nothing here yet</h2>
              <p className="text-sm text-muted-foreground">
                This page is not yet available in the public preview. Check back soon or contact us
                to request access.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Button size="sm" variant="outline" className="rounded-full">
                Learn more
              </Button>
              {actionLabel && (
                <Button size="sm" className="rounded-full">
                  {actionLabel}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
