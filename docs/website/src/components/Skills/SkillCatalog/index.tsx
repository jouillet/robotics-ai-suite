import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { skillsQueryOptions } from "../../../data/skills";
import { CheckboxItem } from "../../CheckboxItem";
import { SearchBox } from "../../SearchBox";
import { SkillCard } from "./SkillCard";
import { pluralize } from "@site/src/utils/pluralize";
import styles from "./styles.module.css";

export default function SkillCatalog() {
  const { data: skills = [] } = useQuery(skillsQueryOptions());

  const [query, setQuery] = useState("");
  const [selectedHw, setSelectedHw] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Compute hardware facets from skills
  const hwOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    skills.forEach((skill) => {
      if (skill.hwClass) {
        counts[skill.hwClass] = (counts[skill.hwClass] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([value, count]) => ({
        value,
        label: value.toUpperCase(),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [skills]);

  // Compute product facets from skills
  const productOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    skills.forEach((skill) => {
      skill.products?.forEach((product) => {
        counts[product] = (counts[product] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([value, count]) => ({
        value,
        label: value,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [skills]);

  const displayedProductOptions = useMemo(() => {
    if (showAllProducts || productOptions.length <= 8) {
      return productOptions;
    }
    return productOptions.slice(0, 8);
  }, [productOptions, showAllProducts]);

  const shown = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return skills.filter((skill) => {
      if (selectedHw.length > 0) {
        if (!skill.hwClass || !selectedHw.includes(skill.hwClass)) {
          return false;
        }
      }

      if (selectedProducts.length > 0) {
        const hasProduct = skill.products?.some((p) =>
          selectedProducts.includes(p)
        );
        if (!hasProduct) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack =
        `${skill.name} ${skill.summary} ${skill.description} ${skill.hwClass || ""} ${(skill.products || []).join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [skills, query, selectedHw, selectedProducts]);

  const toggleHw = (hw: string) => {
    setSelectedHw((prev) =>
      prev.includes(hw) ? prev.filter((v) => v !== hw) : [...prev, hw]
    );
  };

  const toggleProduct = (prod: string) => {
    setSelectedProducts((prev) =>
      prev.includes(prod) ? prev.filter((v) => v !== prod) : [...prev, prod]
    );
  };

  const hasActiveFilters =
    selectedHw.length > 0 || selectedProducts.length > 0 || query.trim() !== "";

  const clearAll = () => {
    setSelectedHw([]);
    setSelectedProducts([]);
    setQuery("");
  };

  return (
    <section className="container margin-vert--xl">
      <div className={styles.layout}>
        <aside className={styles.panel} aria-label="Skill filters">
          <div className={styles.filterHeader}>
            <span className={styles.filterLabel}>Filter by</span>
            {hasActiveFilters && (
              <button onClick={clearAll} className={styles.clearAll}>
                Clear All
              </button>
            )}
          </div>

          <SearchBox
            placeholder="Search skills"
            value={query}
            onChange={({ target }) => setQuery(target.value)}
          />

          {hwOptions.length > 0 && (
            <div className={styles.filterSection}>
              <h4 className={styles.sectionTitle}>Hardware</h4>
              <div className={styles.filterList}>
                {hwOptions.map((hw) => (
                  <CheckboxItem
                    key={hw.value}
                    label={hw.label}
                    count={hw.count}
                    checked={selectedHw.includes(hw.value)}
                    onChange={() => toggleHw(hw.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {productOptions.length > 0 && (
            <div className={styles.filterSection}>
              <h4 className={styles.sectionTitle}>Products</h4>
              <div className={styles.filterList}>
                {displayedProductOptions.map((prod) => (
                  <CheckboxItem
                    key={prod.value}
                    label={prod.label}
                    count={prod.count}
                    checked={selectedProducts.includes(prod.value)}
                    onChange={() => toggleProduct(prod.value)}
                  />
                ))}
              </div>
              {productOptions.length > 8 && (
                <button
                  type="button"
                  className={styles.showMoreBtn}
                  onClick={() => setShowAllProducts(!showAllProducts)}
                >
                  {showAllProducts
                    ? "Show less"
                    : `+${productOptions.length - 8} more`}
                </button>
              )}
            </div>
          )}
        </aside>

        <div>
          <p className={styles.count}>
            <span>{shown.length}</span> {pluralize(shown.length, "Skill")} found
          </p>

          <div className={styles.grid}>
            {shown.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
          {shown.length === 0 ? (
            <p className={styles.emptyState}>
              No skills match the current search and filter selection.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
