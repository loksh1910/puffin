import { PhoneFrame } from "@/components/phone-frame";
import { PayFlow } from "@/components/pay-flow";
import { SplitProvider } from "@/lib/split-store";
import { ResponsibilitiesProvider } from "@/lib/responsibilities-store";
import { SubscriptionsProvider } from "@/lib/subscriptions-store";

export default function Page() {
  return (
    <PhoneFrame>
      <SplitProvider>
        <ResponsibilitiesProvider>
          <SubscriptionsProvider>
            <PayFlow />
          </SubscriptionsProvider>
        </ResponsibilitiesProvider>
      </SplitProvider>
    </PhoneFrame>
  );
}
