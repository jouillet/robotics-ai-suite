import { useMemo } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import type { HfConfig, Domain } from "./api";
import chipsets from "./chipsets";

// Reads the Hugging Face catalog config from docusaurus `customFields` and
// returns it as the `HfConfig` the data layer consumes.
export function useHfConfig(): HfConfig {
  const { siteConfig } = useDocusaurusContext();
  const fields = siteConfig.customFields ?? {};
  return useMemo<HfConfig>(
    () => ({
      org: String(fields.hfOrg ?? ""),
      token: (fields.hfToken as string | null) ?? null,
      catalogTag: String(fields.hfCatalogTag ?? ""),
      domains: (fields.hfDomains as Domain[]) ?? [],
      chipsets,
    }),
    [fields.hfOrg, fields.hfToken, fields.hfCatalogTag, fields.hfDomains],
  );
}
