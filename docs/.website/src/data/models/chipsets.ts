import type { Chipset } from "./api";
import { listHardware } from "./hardware";

// Chipset filter options for the AI Models catalog. `label` is shown in the UI;
// `alias` is matched against each model's `chipset:<alias>` tags. Labels come
// from the centralized hardware map in ./hardware.ts.
const chipsets: Chipset[] = listHardware().map(({ alias, tier }) => ({
  alias,
  label: tier,
}));

export default chipsets;
