import { createStoredValue } from "./storedValue";
import { colorForCategory, UNCATEGORIZED } from "./useTaskBoard";

const UNCATEGORIZED_COLOR = "#94a3b8";

// saved as JSON text, e.g. '{"Work":"#ff0000","School":"#00aa55"}'
const useSavedColors = createStoredValue("taskboard-category-colors", "{}");

function parseColors(json: string): Record<string, string> {
  try {
    return JSON.parse(json);
  } catch {
    return {}; // saved text was damaged: start over with automatic colours
  }
}

// Colours the user picked for categories, remembered in this browser.
// Categories without a picked colour keep their automatic one.
export function useCategoryColors() {
  const [json, saveJson] = useSavedColors();
  const customColors = parseColors(json);

  function colorFor(name: string) {
    const automatic = name === UNCATEGORIZED ? UNCATEGORIZED_COLOR : colorForCategory(name);
    return customColors[name] ?? automatic;
  }

  function setColor(name: string, color: string) {
    saveJson(JSON.stringify({ ...customColors, [name]: color }));
  }

  return { colorFor, setColor };
}
