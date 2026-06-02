import { Suspense } from "react";
import { FightEscrowPolicyTabs } from "@/components/legal/FightEscrowPolicyTabs";

export const metadata = {
  title: "Fight Rules & Escrow Policy — ArenaMC",
};

export default function FightRulesPage() {
  return (
    <Suspense fallback={null}>
      <FightEscrowPolicyTabs />
    </Suspense>
  );
}
