import { redirect } from "next/navigation";

export default function AuthCompatibilityPage() {
  redirect("/login");
}
