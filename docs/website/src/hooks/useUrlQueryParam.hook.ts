import { useHistory, useLocation } from "@docusaurus/router";

export const useUrlQueryParam = (paramName: string, defaultValue?: string) => {
  const location = useLocation();
  const history = useHistory();

  const fromQuery = new URLSearchParams(location.search).get(paramName);
  const value = fromQuery ?? defaultValue;

  const setValue = (nextValue?: string) => {
    if (typeof window === "undefined") {
      return;
    }

    // Read the live URL (not the stale `location` closure) so batched
    // calls from the same render don't overwrite each other.
    const params = new URLSearchParams(window.location.search);
    const currentValue = params.get(paramName);

    if (!nextValue) {
      if (currentValue === null) {
        return;
      }
      params.delete(paramName);
    } else {
      if (currentValue === nextValue) {
        return;
      }
      params.set(paramName, nextValue);
    }

    history.replace({ ...location, search: params.toString() });
  };

  return { value, setValue };
};
