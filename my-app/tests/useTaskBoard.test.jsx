import { act, renderHook, waitFor } from "@testing-library/react";
import { useTaskBoard } from "@/app/lib/useTaskBoard";

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

  it("deletes a category with one request, moving its tasks to Uncategorized", async () => {
    const tasks = [
      { id: 1, title: "a", category: "Work" },
      { id: 2, title: "b", category: "Work" },
    ];
    // first call loads tasks, any later call is the bulk PATCH
    global.fetch = jest.fn(async (url, options) => ({ ok: true, json: async () => (options ? { count: 2 } : tasks) }));
    window.confirm = jest.fn(() => true);

    const { result } = renderHook(() => useTaskBoard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.deleteColumn("Work"));

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/tasks",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ clearCategory: "Work" }) })
    );
    expect(result.current.board.map((column) => column.name)).toEqual(["Uncategorized"]);
    expect(result.current.board[0].tasks).toHaveLength(2);
  });
});
