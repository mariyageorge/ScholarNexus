import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PagePlaceholder } from "@/components/page-placeholder";
import { getUserSession, type UserSession } from "@/lib/session";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "User Profile — ScholarNexus AI" },
      { name: "description", content: "Your researcher profile and academic identity." },
    ],
  }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(getUserSession());
  }, []);

  return (
    <DashboardLayout>
      {!user ? (
        <PagePlaceholder
          title="User Profile"
          description="Please sign in to view your profile."
          icon={<UserCircle className="h-7 w-7" />}
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Profile</p>
                <h1 className="mt-2 text-3xl font-bold text-foreground">{user.displayName ?? user.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{user.role}</p>
              </div>
              <div className="flex items-center gap-3 rounded-3xl border border-border bg-muted px-4 py-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Signed in as</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Account details</h2>
              <dl className="mt-6 grid gap-4 text-sm text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">Name</dt>
                  <dd>{user.displayName ?? user.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Role</dt>
                  <dd>{user.role}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Profile status</dt>
                  <dd>{user.profileCompleted ? "Complete" : "Incomplete"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">About</h2>
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Affiliation</p>
                  <p>{user.affiliation ?? "Not provided"}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Research interests</p>
                  <p>{user.bio ?? "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Profile</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{user.displayName ?? user.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.role}</p>
          </div>
          <div className="flex items-center gap-3 rounded-3xl border border-border bg-muted px-4 py-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Signed in as</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Account details</h2>
          <dl className="mt-6 grid gap-4 text-sm text-muted-foreground">
            <div>
              <dt className="font-medium text-foreground">Name</dt>
              <dd>{user.displayName ?? user.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Role</dt>
              <dd>{user.role}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Profile status</dt>
              <dd>{user.profileCompleted ? "Complete" : "Incomplete"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Affiliation</p>
              <p>{user.affiliation ?? "Not provided"}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Research interests</p>
              <p>{user.bio ?? "Not provided"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
