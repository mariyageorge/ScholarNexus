import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Search, GraduationCap, Mail, BookOpen, Award, Filter, RefreshCw } from "lucide-react";
import { getUserSession, UserSession } from "@/lib/session";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/faculty/students")({
  head: () => ({
    meta: [
      { title: "My Students — ScholarNexus AI Faculty" },
      { name: "description", content: "Supervised students directory and academic mentorship status." },
    ],
  }),
  component: FacultyStudentsPage,
});

interface SupervisedStudent {
  id: string;
  name: string;
  email: string;
  department: string;
  degreeProgram: string;
  activeProject: string;
  status: "Active" | "Graduated" | "On Leave";
  joinedDate: string;
}

function FacultyStudentsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [students] = useState<SupervisedStudent[]>([
    {
      id: "std-1",
      name: "Alex Chen",
      email: "alex.chen@university.edu",
      department: "Computer Science",
      degreeProgram: "M.S. Artificial Intelligence",
      activeProject: "Neural Architecture Search for Lightweight LLMs",
      status: "Active",
      joinedDate: "2025-09-01",
    },
    {
      id: "std-2",
      name: "Sophia Martinez",
      email: "sophia.m@university.edu",
      department: "Computer Science",
      degreeProgram: "Ph.D. Computer Science",
      activeProject: "Distributed Consensus Algorithms in Edge Computing",
      status: "Active",
      joinedDate: "2024-08-15",
    },
    {
      id: "std-3",
      name: "Ethan Vance",
      email: "ethan.vance@university.edu",
      department: "Cybersecurity",
      degreeProgram: "M.S. Information Security",
      activeProject: "Quantum-Resistant Lattice Cryptography Framework",
      status: "Active",
      joinedDate: "2025-01-10",
    },
    {
      id: "std-4",
      name: "Maya Lin",
      email: "maya.lin@university.edu",
      department: "Bioinformatics",
      degreeProgram: "Ph.D. Computational Biology",
      activeProject: "Biomedical Graph Representation for Molecular Docking",
      status: "Active",
      joinedDate: "2024-01-15",
    },
  ]);

  useEffect(() => {
    const user = getUserSession();
    if (user) setSession(user);
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.activeProject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold">
              Supervision Directory
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              My Supervised Students
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage assigned research scholars, thesis progress, and academic advising
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border">
              Total: {students.length} Scholars
            </span>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scholar name, email, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold text-lg">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{student.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" /> {student.email}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[0.65rem] font-semibold">
                  {student.status}
                </Badge>
              </div>

              <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium"><Award className="h-3.5 w-3.5 text-indigo-500" /> Program</span>
                  <span className="font-bold text-foreground">{student.degreeProgram}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium"><BookOpen className="h-3.5 w-3.5 text-emerald-500" /> Research Project</span>
                </div>
                <p className="font-semibold text-foreground truncate">{student.activeProject}</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[0.7rem] text-muted-foreground">Supervised since {student.joinedDate}</span>
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold h-8">
                  View Academic Progress
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
