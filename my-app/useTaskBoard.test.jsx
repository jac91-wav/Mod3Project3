import { act, renderHook, waitFor } from "@testing-library/react";
import { useTaskBoard } from "./app/lib/useTaskBoard";

describe("useTaskBoard", () => {
  it("remembers a category with no tasks, so it's still there after a reload", async () => {
    // the API has no tasks
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => [] }));

    const first = renderHook(() => useTaskBoard());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    act(() => first.result.current.addColumn("Work"));
    expect(JSON.parse(localStorage.getItem("taskboard-categories"))).toEqual(["Work"]);
    first.unmount();

    const second = renderHook(() => useTaskBoard());
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.board.map((column) => column.name)).toEqual(["Work"]);
  });
});
