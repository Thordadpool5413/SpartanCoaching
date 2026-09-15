import { SEO } from "@/components/SEO";
import TrustedMedicarePlatform from "@/components/medicare-platform/TrustedMedicarePlatform";

export default function SpartanIntelligence() {
  return (
    <div className="medicare-workspace-page">
      <SEO
        title="CMS Medicare Knowledge Hub | Hospice Sales Pro"
        description="National hospice market, provider, territory, referral, financial, and decision intelligence grounded in current public evidence."
      />
      <TrustedMedicarePlatform />
    </div>
  );
}
