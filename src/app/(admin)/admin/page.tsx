import { redirect } from "next/navigation";

export default function AdminRoot() {
  // Middleware will redirect to /admin/login if no session.
  // When a session exists, the root should land on the dashboard.
  redirect("/admin/dashboard");
}
