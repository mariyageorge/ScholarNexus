import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/faculty/resources")({
  beforeLoad: () => {
    throw redirect({ to: "/faculty-dashboard" });
  },
  component: FacultyResourcesRedirect,
});

function FacultyResourcesRedirect() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/faculty-dashboard";
    }
  }, []);

  return null;
}
