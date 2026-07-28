import Gc2AutomationPolicy from "@/components/automation/gc2-automation-policy";
import Gc2AutomationRuleEditorLauncher from "@/components/automation/gc2-automation-rule-editor-launcher";
import Gc2DeleteAutomationConfirmation from "@/components/automation/gc2-delete-automation-confirmation";

export default function AutomationPage() {
  return (
    <>
      <Gc2AutomationPolicy />
      <Gc2AutomationRuleEditorLauncher />
      <Gc2DeleteAutomationConfirmation />
    </>
  );
}
