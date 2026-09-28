import { useCallback, useEffect, useMemo, useState } from "react";
import { createStoredValue } from "./storedValue";

export type Task = {
  id: number;
  title: string;
  description?: string | null;
  completed?: boolean;
  category?: string | null;
  dueDate?: string | null;
  tags?: string[] | null;
};

export type NewTaskFields = {
  title: string;
  description: string;
  category?: string;
  dueDate?: string;
  tags?: string[];
};

// "work, urgent,, Work " -> ["work", "urgent", "Work"]: split on commas, trim, drop empties and exact duplicates
export function parseTags(text: string) {
  const tags = text.split(",").map((tag) => tag.trim()).filter((tag) => tag !== "");
  return Array.from(new Set(tags));
}

export type SortKey = "dueDate" | "createdOrder" | "title";

export const UNCATEGORIZED = "Uncategorized";

// "2026-10-01" is read as local midnight, then toISOString() converts it to UTC,
// so east of UTC the stored timestamp falls on the previous day (e.g. "2026-09-30T22:00:00.000Z")
function toIsoDateTime(dateOnly: string) {
  const localMidnight = new Date(`${dateOnly}T00:00:00`);
  return localMidnight.toISOString();
}

//
const CATEGORY_COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#f97316",
];

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // multiplying by a prime (31) before adding spreads similar strings far apart
    hash = hash * 31 + str.charCodeAt(i);
    // "| 0" truncates to a 32-bit integer so the number can't grow forever (it may go negative, hence Math.abs)
    hash = hash | 0;
  }
  return Math.abs(hash);
}

export function colorForCategory(name: string) {
  // wraps nums 0-7
  const index = hashString(name) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}

// Category names, remembered in this browser so a category with no tasks yet survives a reload.
// ponytail: per-browser, like the category colours; move to a Category table to share them between devices
const useSavedColumns = createStoredValue("taskboard-categories", "[]");

function parseColumns(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // saved text was damaged: categories that have tasks still come back from the tasks
  }
}

function mergeColumns(existing: string[], taskList: Task[]) {
  const merged = new Set(existing);
  for (const task of taskList) {
    if (task.category) merged.add(task.category);
  }
  return Array.from(merged).sort();
}

function sortTasks(list: Task[], sortKey: SortKey) {
  // .sort() changes the array it's called on, so sort a copy ([...list])
  if (sortKey === "title") {
    // numeric: true compares numbers inside text by value, so "Task 2" comes before "Task 10"
    return [...list].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  }

  if (sortKey === "dueDate") {
    // the comparator returns: negative = a first, positive = b first, 0 = keep order
    return [...list].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      const aTime = new Date(a.dueDate).getTime();
      const bTime = new Date(b.dueDate).getTime();
      return aTime - bTime;
    });
  }

  // "createdOrder": ids auto-increment, so a higher id is a newer task (b - a = highest first)
  return [...list].sort((a, b) => b.id - a.id);
}

export function useTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]); //<> = type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("createdOrder");
  const [columnsJson, saveColumnsJson] = useSavedColumns();
  const columns = useMemo(() => parseColumns(columnsJson), [columnsJson]);

  // used like useState's setColumns((current) => next), but the list is also saved in this browser
  const setColumns = useCallback(
    (update: (current: string[]) => string[]) =>
      saveColumnsJson((json) => JSON.stringify(update(parseColumns(json)))),
    [saveColumnsJson]
  );

  // setColumns never changes, so this runs once, when the component first mounts
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error("Failed to load tasks");
        const data: Task[] = await res.json();
        setTasks(data);
        setColumns((current) => mergeColumns(current, data));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [setColumns]);

  // returns true if the task was saved, so the form knows whether to close
  const addTask = async (fields: NewTaskFields) => {
    const title = fields.title.trim();
    const description = fields.description.trim();
    if (!title || !description) return false;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: fields.category?.trim() || undefined,
          dueDate: fields.dueDate ? toIsoDateTime(fields.dueDate) : undefined,
          tags: fields.tags,
        }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const newTask: Task = await res.json();

      setTasks((current) => [newTask, ...current]);
      if (newTask.category) {
        setColumns((current) => mergeColumns(current, [newTask]));
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      return false;
    }
  };

  // this function will 
  const editTask = async (
    id?: number | string,
    updates?: { title: string; description?: string; category?: string; dueDate?: string; tags?: string[] }
  ) => {
    if (!updates) return;
    const taskId = Number(id);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          // JSON.stringify drops undefined fields, so send null to actually clear these
          category: updates.category ?? null,
          dueDate: updates.dueDate ? toIsoDateTime(updates.dueDate) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const updatedTask: Task = await res.json();

      setTasks((current) =>
        current.map((t) => (t.id === taskId ? updatedTask : t))
      );
      if (updatedTask.category) {
        setColumns((current) => mergeColumns(current, [updatedTask]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const moveTaskToColumn = async (taskId: number, targetColumn: string) => {
    const task = tasks.find((t) => t.id === taskId); // find task via ID
    if (!task) return;

    const nextCategory = targetColumn === UNCATEGORIZED ? null : targetColumn; //if target !

    // ?? null turns undefined into null so "no category" compares equal either way
    const currentCategory = task.category ?? null;
    if (currentCategory === nextCategory) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: nextCategory }),
      });
      if (!res.ok) throw new Error("Failed to move task");
      const updatedTask: Task = await res.json();

      setTasks((current) =>
        current.map((t) => (t.id === taskId ? updatedTask : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move task");
    }
  };

  const deleteTask = async (id?: number | string) => {
    const taskId = Number(id);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");

      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  // returns true if the column was added, so the form knows whether to close
  const addColumn = (rawName: string) => {
    const name = rawName.trim();
    if (!name) return false;

    const alreadyExists = name === UNCATEGORIZED || columns.includes(name);
    if (alreadyExists) {
      setError(`A category named "${name}" already exists`);
      return false;
    }

    setColumns((current) => [...current, name].sort());
    return true;
  };

  const deleteColumn = async (columnName: string) => {
    if (columnName === UNCATEGORIZED) return;

    const affectedTasks = tasks.filter((t) => t.category === columnName);

    let message = `Delete "${columnName}"?`;
    if (affectedTasks.length > 0) {
      message += ` ${affectedTasks.length} task(s) will move to Uncategorized.`;
    }
    if (!window.confirm(message)) return;

    try {
      // allSettled waits for every request, even if some fail, so the ones that
      // succeeded can still update local state (Promise.all would stop at the first failure)
      const results = await Promise.allSettled(
        affectedTasks.map(async (task) => {
          const res = await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: null }),
          });
          if (!res.ok) throw new Error("Failed to update task");
          const updatedTask: Task = await res.json();
          return updatedTask;
        })
      );

      const updatedTasks: Task[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") updatedTasks.push(result.value);
      }

      setTasks((current) =>
        current.map((task) => {
          const updated = updatedTasks.find((u) => u.id === task.id);
          return updated ?? task;
        })
      );

      if (updatedTasks.length < affectedTasks.length) {
        throw new Error("Some tasks failed to move, so the category was kept");
      }

      setColumns((current) => current.filter((c) => c !== columnName));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  // useMemo caches the result and only recomputes when tasks, columns or sortKey change
  const board = useMemo(() => {
    // Uncategorized only appears while some task has no category, so those tasks never become invisible
    const hasUncategorizedTasks = tasks.some((t) => !t.category);
    const allColumns = hasUncategorizedTasks ? [...columns, UNCATEGORIZED] : columns;

    return allColumns.map((columnName) => {
      const tasksInColumn = tasks.filter((t) => {
        if (columnName === UNCATEGORIZED) return !t.category;
        return t.category === columnName;
      });

      return {
        name: columnName,
        tasks: sortTasks(tasksInColumn, sortKey),
      };
    });
  }, [tasks, columns, sortKey]);

  return {
    loading, error, setError,
    sortKey, setSortKey,
    board,
    addTask, editTask, moveTaskToColumn, deleteTask, addColumn, deleteColumn,
  };
}
