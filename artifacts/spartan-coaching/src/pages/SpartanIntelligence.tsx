import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { SEO } from "@/components/SEO";
import TrustedMedicarePlatform from "@/components/medicare-platform/TrustedMedicarePlatform";

export default function SpartanIntelligence() {
  return (
    <FieldKitToolLayout toolPath="/tools/intelligence" className="max-w-none" showHowTo={false}>
      <SEO
        title="CMS Medicare Knowledge Hub | Hospice Sales Pro"
        description="National hospice market, provider, territory, referral, financial, and decision intelligence grounded in current public evidence."
      />
      <TrustedMedicarePlatform />
    </FieldKitToolLayout>
  );
}
