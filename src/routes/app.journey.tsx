import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/journey")({
  beforeLoad: () => {
    throw redirect({ to: "/app/journey/create" });
  },
  component: () => null,
});