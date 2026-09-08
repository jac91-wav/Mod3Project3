"use client";

import { useEffect, useMemo, useState } from "react";
import TaskCard from "./components/TaskCard";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  completed?: boolean;
  category?: string | null;
  dueDate?: string | null;
};

type SortKey = "dueDate" | "createdOrder" | "title";

const UNCATEGORIZED = "Uncategorized";
const toIsoDateTime = (dateOnly: string) => new Date(`${dateOnly}T00:00:00`).toISOString();
const BLUE_PALETTE = ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"];

//gives random blue color to each category
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
};
const colorForCategory = (name: string) => BLUE_PALETTE[hashString(name) % BLUE_PALETTE.length];

export default function HomePage() {

  //states [startState, updateState]
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("createdOrder");
  const [columns, setColumns] = useState<string[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => { // runs once on mount (empty deps array below) to load tasks from the api
    const loadTasks = async () => {
      try {
        const res = await fetch("/api/tasks"); // calls our own api route, returns a response object
        if (!res.ok) throw new Error("Failed to load tasks");
        const data: Task[] = await res.json(); // parses the response body as json
        setTasks(data);
        setColumns((current) => mergeColumns(current, data));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  //merge cats
  function mergeColumns(existing: string[], taskList: Task[]) {
    const fromTasks = Array.from( // Set + Array.from removes duplicate category names
      new Set(taskList.map((t) => t.category).filter((c): c is string => !!c))
    );
    const merged = new Set(existing); // Set again to dedupe against existing columns
    fromTasks.forEach((c) => merged.add(c));
    return Array.from(merged).sort();
  }

  const addTask = async () => {
    if (!title.trim() || !description.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST", // creates a new task on the server
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ // turns this object into a json string for the request body
          title: title.trim(),
          description: description.trim(),
          category: category.trim() || undefined,
          dueDate: dueDate ? toIsoDateTime(dueDate) : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const newTask: Task = await res.json();

      setTasks((current) => [newTask, ...current]);
      if (newTask.category) {
        setColumns((current) => mergeColumns(current, [newTask]));
      }
      setTitle("");
      setDescription("");
      setCategory("");
      setDueDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const toggleTask = async (id?: number | string) => {
    const taskId = Number(id); // id can arrive as a string from TaskCard, force it back to a number
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH", // partially updates just the fields we send
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const updatedTask: Task = await res.json();

      setTasks((current) =>
        current.map((t) => (t.id === taskId ? updatedTask : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const editTask = async (
    id?: number | string,
    updates?: { title: string; description?: string; category?: string; dueDate?: string }
  ) => {
    if (!updates) return;
    const taskId = Number(id);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          dueDate: updates.dueDate ? toIsoDateTime(updates.dueDate) : undefined,
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
    if ((task.category ?? null) === nextCategory) return;

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
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" }); // removes the task on the server
      if (!res.ok) throw new Error("Failed to delete task");

      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const addColumn = () => {
    const name = newColumnName.trim();
    if (!name || name === UNCATEGORIZED || columns.includes(name)) return;
    setColumns((current) => [...current, name]);
    setNewColumnName("");
  };

  const sortTasks = (list: Task[]) => {
    if (sortKey === "title") {
      return [...list].sort((a, b) => a.title.localeCompare(b.title)); // localeCompare orders strings alphabetically
    }
    if (sortKey === "dueDate") {
      return [...list].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    return list;
  };

  const board = useMemo(() => { // recomputes only when tasks/columns/sortKey change, not every render
    const allColumns = [...columns, UNCATEGORIZED];
    return allColumns.map((columnName) => ({
      name: columnName,
      tasks: sortTasks(
        tasks.filter((t) =>
          columnName === UNCATEGORIZED ? !t.category : t.category === columnName
        )
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, columns, sortKey]);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ textAlign: "justify", fontWeight: "bold" }}>PROJECT 3 TASKBOARD</h1>

      {error ? (
        <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 12,
          marginBottom: 24,
          border: "2px solid #000000",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          style={{ padding: 10, fontSize: 16, border: "2px solid #000000"}}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description"
          rows={3}
          style={{ padding: 10, fontSize: 16, resize: "vertical", border: "2px solid #000000" }}
        />
        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            style={{ padding: 10, fontSize: 16, flex: 1, border: "2px solid #000000"}}
          />
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, fontSize: 13, color: "#374151" }}>
            DUE DATE
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ padding: 10, fontSize: 16, border: "2px solid #000000" }}
            />
          </label>
        </div>
        <button
          onClick={addTask}
          style={{
            padding: "10px 14px",
            fontSize: 16,
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Add Task
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
          Sort by:
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            style={{ padding: 6 }}
          >
            <option value="createdOrder">Newest</option>
            <option value="dueDate">Due date</option>
            <option value="title">Title</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="text"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addColumn()}
            placeholder="New column name"
            style={{ padding: 6, fontSize: 14 }}
          />
          <button
            onClick={addColumn}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            + Add column
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
          {board.map((col) => (
            <div
              key={col.name}
              onDragOver={(e) => {
                e.preventDefault(); // required or the browser blocks dropping here
                setDragOverColumn(col.name);
              }}
              onDragLeave={() => setDragOverColumn((current) => (current === col.name ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = Number(e.dataTransfer.getData("text/plain")); // reads the id stashed in onDragStart below
                if (taskId) moveTaskToColumn(taskId, col.name);
                setDragOverColumn(null);
              }}
              style={{
                flex: "0 0 280px",
                background: dragOverColumn === col.name ? "#eef2ff" : "#f9fafb",
                border: "1px solid #e5e7eb",
                borderTop: `4px solid ${colorForCategory(col.name)}`,
                borderRadius: 10,
                padding: 12,
                minHeight: 200,
                transition: "background 0.15s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 14, color: "#374151" }}>{col.name}</h3>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{col.tasks.length}</span>
              </div>

              {col.tasks.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af" }}>Drop tasks here</p>
              ) : (
                col.tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(task.id)); // stashes the id for onDrop to read
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    style={{ cursor: "grab" }}
                  >
                    <TaskCard
                      id={task.id}
                      title={task.title}
                      description={task.description}
                      completed={task.completed}
                      category={task.category}
                      dueDate={task.dueDate}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onEdit={editTask}
                    />
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
