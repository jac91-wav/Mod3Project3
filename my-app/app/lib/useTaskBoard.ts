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

// "a, b,, a " -> ["a", "b"]
export function parseTags(text: string) {
  const tags = text.split(",").map((tag) => tag.trim()).filter((tag) => tag !== "");
  return Array.from(new Set(tags));
}

export type SortKey = "dueDate" | "createdOrder" | "title";

export const UNCATEGORIZED = "Uncategorized";

// local midnight as UTC ISO (previous day east of UTC)
function toIsoDateTime(dateOnly: string) {
  const localMidnight = new Date(`${dateOnly}T00:00:00`);
  return localMidnight.toISOString();
}

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
    hash = hash * 31 + str.charCodeAt(i);
    hash = hash | 0;
  }
  return Math.abs(hash);
}

export function colorForCategory(name: string) {
  const index = hashString(name) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}

// saved so empty categories survive reloads
// ponytail: per-browser; move to a Category table to share across devices
const useSavedColumns = createStoredValue("taskboard-categories", "[]");

function parseColumns(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // corrupt: rebuilt from tasks
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
  if (sortKey === "title") {
    return [...list].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  }

  if (sortKey === "dueDate") {
    // no due date last
    return [...list].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      const aTime = new Date(a.dueDate).getTime();
      const bTime = new Date(b.dueDate).getTime();
      return aTime - bTime;
    });
  }

  // createdOrder: newest (highest id) first
  return [...list].sort((a, b) => b.id - a.id);
}

export function useTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("createdOrder");
  const [columnsJson, saveColumnsJson] = useSavedColumns();
  const columns = useMemo(() => parseColumns(columnsJson), [columnsJson]);

  const setColumns = useCallback(
    (update: (current: string[]) => string[]) =>
      saveColumnsJson((json) => JSON.stringify(update(parseColumns(json)))),
    [saveColumnsJson]
  );

  // runs once on mount (setColumns is stable)
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

  // true if saved
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
          // null clears; undefined would be dropped
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
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nextCategory = targetColumn === UNCATEGORIZED ? null : targetColumn;

    // treat undefined as null
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

  // true if added
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
      // allSettled so successes still apply if some fail
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

  const board = useMemo(() => {
    // show Uncategorized only when needed
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
