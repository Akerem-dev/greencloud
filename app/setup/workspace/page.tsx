import AuthGate from "@/components/auth/auth-gate";
import WorkspaceSetupForm from "@/components/setup/workspace-setup-form";

export default function WorkspaceSetupPage() {
  return (
    <AuthGate>
      <WorkspaceSetupForm />
    </AuthGate>
  );
}
