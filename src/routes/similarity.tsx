import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/similarity")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
