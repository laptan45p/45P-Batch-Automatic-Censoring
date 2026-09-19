import { createFileRoute } from "@tanstack/react-router";
import { VeilApp } from "@/components/veil/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <VeilApp />;
}
