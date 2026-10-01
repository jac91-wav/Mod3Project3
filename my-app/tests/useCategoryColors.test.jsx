import { act, renderHook } from "@testing-library/react";
import { useCategoryColors } from "@/app/lib/useCategoryColors";
import { colorForCategory } from "@/app/lib/useTaskBoard";

describe("useCategoryColors", () => {
  it("uses the automatic colour until one is picked, then remembers the picked one", () => {
    const { result } = renderHook(() => useCategoryColors());
    expect(result.current.colorFor("Work")).toBe(colorForCategory("Work"));

    act(() => result.current.setColor("Work", "#123456"));

    expect(result.current.colorFor("Work")).toBe("#123456");
    expect(result.current.colorFor("School")).toBe(colorForCategory("School"));
    expect(JSON.parse(localStorage.getItem("taskboard-category-colors"))).toEqual({ Work: "#123456" });
  });
});
