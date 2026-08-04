import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Bell, Lock, Shield, Save } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/settings")({
  head: () => ({
    meta: [
      { title: "Faculty Settings — ScholarNexus AI" },
      { name: "description", content: "Faculty portal notification and security settings." },
    ],
  }),
  component: FacultySettingsPage,
});

function FacultySettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [supervisionAlerts, setSupervisionAlerts] = useState(true);

  const handleSave = () => {
    toast.success("Faculty settings saved successfully.");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <Badge variant="outline" className="rounded-full border-muted-foreground/30 text-muted-foreground bg-muted/20 text-xs font-semibold">
              Preferences
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              Faculty Portal Settings
            </h1>
          </div>

          <Button onClick={handleSave} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
            <Save className="h-4 w-4" /> Save Preferences
          </Button>
        </div>

        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-500" /> Supervision Notifications
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-background">
                <div>
                  <Label className="font-bold text-foreground">Email Notifications for Supervision Requests</Label>
                  <p className="text-muted-foreground text-[0.68rem]">Receive immediate email alerts when students request mentorship.</p>
                </div>
                <Switch checked={supervisionAlerts} onCheckedChange={setSupervisionAlerts} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-background">
                <div>
                  <Label className="font-bold text-foreground">Manuscript Review Reminders</Label>
                  <p className="text-muted-foreground text-[0.68rem]">Receive weekly digest for pending manuscript reviews.</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
