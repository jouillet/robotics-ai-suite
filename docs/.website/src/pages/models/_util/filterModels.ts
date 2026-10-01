import type { Model } from "@site/src/data/models/api";

export const filterModels = (
  models: Model[],
  searchQuery: string,
  selectedChipsets: string[],
  selectedDomain?: string,
  selectedCategory?: string,
): Model[] => {
  const query = searchQuery.trim().toLowerCase();

  return models.filter((model) => {
    const chipsetMismatch =
      selectedChipsets.length > 0 &&
      model.chipsets.length > 0 &&
      !model.chipsets.some((chip) => selectedChipsets.includes(chip));

    if (chipsetMismatch) return false;

    // Filter by selected domain (gen-ai, physical-ai, vision-ai)
    if (selectedDomain && selectedDomain !== "__all__") {
      const modelDomain =
        model.category === "Physical AI"
          ? "physical-ai"
          : model.category === "Vision AI"
            ? "vision-ai"
            : "gen-ai";
      if (modelDomain !== selectedDomain) return false;
    }

    // Filter by selected subcategory / task pipeline tag
    if (selectedCategory) {
      const target = selectedCategory.toLowerCase();
      const matchPipeline = model.pipelineTag?.toLowerCase() === target;
      const matchTags = model.tags?.some((t) => t.toLowerCase() === target);
      const matchPrimary = model.primaryType?.toLowerCase() === target;
      if (!matchPipeline && !matchTags && !matchPrimary) return false;
    }

    if (!query) return true;

    const haystack =
      `${model.name} ${model.subtitle ?? ""} ${model.primaryType ?? ""} ${model.secondaryTypes.join(" ")} ${model.category} ${model.keyNovelty ?? ""} ${model.description ?? ""}`.toLowerCase();

    return haystack.includes(query);
  });
};
