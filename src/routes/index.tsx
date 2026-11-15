import { createFileRoute } from "@tanstack/react-router"
import { PlyApp } from "@/components/ply-app"

export const Route = createFileRoute("/")({
  component: PlyApp,
})
