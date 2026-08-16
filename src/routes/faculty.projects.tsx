import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/faculty/projects")({
  beforeLoad: () => {
    throw redirect({ to: "/faculty-dashboard" });
  },
  component: FacultyProjectsRedirect,
});

function FacultyProjectsRedirect() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/faculty-dashboard";
    }
  }, []);

  return null;
}
