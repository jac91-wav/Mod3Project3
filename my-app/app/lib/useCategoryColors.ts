import { createStoredValue } from "./storedValue";
import { colorForCategory, UNCATEGORIZED } from "./useTaskBoard";

const UNCATEGORIZED_COLOR = "#94a3b8";

// JSON: {"Work":"#ff0000"}
const useSavedColors = createStoredValue("taskboard-category-colors", "{}");

function parseColors(json: string): Record<string, string> {

  try {
    return JSON.parse(json);
  }

  catch {
    return {}; // corrupt: reset
  }

}

// user-picked category colours, saved per browser; others stay automatic
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
