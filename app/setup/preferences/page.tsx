import AuthGate from "@/components/auth/auth-gate";
import PreferencesSetupForm from "@/components/setup/preferences-setup-form";

export default function PreferencesSetupPage() {
  return (
    <AuthGate>
      <PreferencesSetupForm />
    </AuthGate>
  );
}
