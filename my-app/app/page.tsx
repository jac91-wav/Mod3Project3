"use client";

import AddCategoryTile from "./components/AddCategoryTile";
import BackgroundPicker from "./components/BackgroundPicker";
import BoardColumn from "./components/BoardColumn";
import type { CSSProperties } from "react";
import { backgroundColor, useBackground } from "./lib/useBackground";
import { SortKey, useTaskBoard } from "./lib/useTaskBoard";

export default function HomePage() {
  const {
    loading, error, setError,
    sortKey, setSortKey,
    board,
    addTask, editTask, moveTaskToColumn, deleteTask, addColumn, deleteColumn,
  } = useTaskBoard();
  const [background, setBackground] = useBackground();

  // --page-color tints .btn-secondary text
  const pageStyle = { background, "--page-color": backgroundColor(background) } as CSSProperties;

  // PAGE BACKGROUND
  return (
    <div className="min-h-screen font-sans text-slate-900" style={pageStyle}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* TOP PANEL */}
        <div className="mb-6 rounded-2xl bg-white/80 p-5 shadow-lg backdrop-blur">
          <header className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Taskboard Demo
            </h1>
          </header>

          {/* CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Sort Tasks by
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="field w-auto py-1.5"
              >
                <option value="createdOrder">Newest</option>
                <option value="dueDate">Due date</option>
                <option value="title">Title</option>
              </select>
            </label>

            <BackgroundPicker value={background} onChange={setBackground} />
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg"
          >
            {error}
            <button onClick={() => setError(null)} aria-label="Dismiss error" className="text-lg leading-none">
              ×
            </button>
          </div>
        )}

        {/* BOARD */}
        {loading ? (
          <p className="inline-block rounded-lg bg-white/80 px-3 py-2 text-sm text-slate-600 backdrop-blur">Loading tasks...</p>
        ) : (
          <div className="flex items-start gap-4 overflow-x-auto pb-4">
            {/* CATEGORY BOXES */}
            {board.map((col) => (
              <BoardColumn
                key={col.name}
                name={col.name}
                tasks={col.tasks}
                onAddTask={addTask}
                onDropTask={moveTaskToColumn}
                onDeleteColumn={deleteColumn}
                onEditTask={editTask}
                onDeleteTask={deleteTask}
              />
            ))}

            {/* ADD CATEGORY */}
            <AddCategoryTile onAdd={addColumn} />
          </div>
        )}
      </div>
    </div>
  );
}
