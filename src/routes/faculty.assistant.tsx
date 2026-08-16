import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/faculty/assistant")({
  beforeLoad: () => {
    throw redirect({ to: "/faculty-dashboard" });
  },
  component: FacultyAssistantRedirect,
});

function FacultyAssistantRedirect() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/faculty-dashboard";
    }
  }, []);

  return null;
}
