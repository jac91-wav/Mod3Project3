import { act, renderHook } from "@testing-library/react";
import { DEFAULT_BACKGROUND, useBackground } from "./app/lib/useBackground";

describe("useBackground", () => {
  it("starts on the default colour, then applies and remembers the chosen background", () => {
    const { result } = renderHook(() => useBackground());
    expect(result.current[0]).toBe(DEFAULT_BACKGROUND);

    act(() => result.current[1]("#123456"));

    expect(result.current[0]).toBe("#123456");
    expect(localStorage.getItem("taskboard-background")).toBe("#123456");
  });
});
