import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Plus, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard-layout";

interface Paper {
  _id?: string;
  title?: string;
  authors?: string;
  summary?: string;
  createdAt?: string;
  [key: string]: unknown;
}

const fetchPapers = async (): Promise<Paper[]> => {
  const response = await fetch("/api/data?collection=papers");
  if (!response.ok) {
    throw new Error("Failed to load papers from MongoDB.");
  }
  return response.json();
};

const seedExamplePaper = async () => {
  const response = await fetch("/api/data?collection=papers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Example Research Paper",
      authors: "ScholarNexus AI",
      summary:
        "This paper record was created from MongoDB integration with the ScholarNexus backend.",
      createdAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to save the sample paper.");
  }

  return response.json();
};

export const Route = createFileRoute("/papers")({
  head: () => ({
    meta: [
      { title: "Research Papers — ScholarNexus AI" },
      { name: "description", content: "Your intelligent library of research papers." },
    ],
  }),
  component: () => {
    const { data: papers, isLoading, isError, error, refetch, isFetching } = useQuery<Paper[], Error>({
      queryKey: ["papers"],
      queryFn: fetchPapers,
      staleTime: 1000 * 60 * 5,
    });

    const hasPapers = useMemo(() => Array.isArray(papers) && papers.length > 0, [papers]);

    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge className="gap-1.5 rounded-full border-none bg-accent/15 px-2.5 py-1 text-[0.7rem] font-medium text-foreground hover:bg-accent/20">
                <FileText className="h-3.5 w-3.5" /> Research Papers
              </Badge>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Research papers from MongoDB</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  This page loads document records from MongoDB and displays all saved papers.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCcw /> Refresh
              </Button>
              <Button
                onClick={async () => {
                  await seedExamplePaper();
                  await refetch();
                }}
                size="sm"
              >
                <Plus /> Add sample paper
              </Button>
            </div>
          </div>

          {isLoading || isFetching ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">Loading papers from MongoDB…</p>
              </CardContent>
            </Card>
          ) : isError ? (
            <Card>
              <CardHeader>
                <CardTitle>Error loading papers</CardTitle>
                <CardDescription>{error?.message}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => refetch()} size="sm">
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : hasPapers ? (
            <div className="grid gap-4 md:grid-cols-2">
              {papers?.map((paper) => (
                <Card key={String(paper._id ?? paper.title ?? Math.random())}>
                  <CardHeader>
                    <CardTitle>{paper.title ?? "Untitled paper"}</CardTitle>
                    <CardDescription>{paper.authors ?? "Unknown author"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {paper.summary ?? "No summary available."}
                    </p>
                    {paper.createdAt ? (
                      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                        Created {new Date(paper.createdAt as string).toLocaleDateString()}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No papers found</CardTitle>
                <CardDescription>
                  There aren’t any documents in the MongoDB papers collection yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click Add sample paper to seed the collection and verify MongoDB integration.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  },
});
