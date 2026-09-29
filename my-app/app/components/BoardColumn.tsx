import { useState, type DragEvent } from "react";
import AddTaskForm from "./AddTaskForm";
import TaskCard, { type TaskCardProps } from "./TaskCard";
import { useCategoryColors } from "../lib/useCategoryColors";
import { UNCATEGORIZED, type NewTaskFields, type Task } from "../lib/useTaskBoard";

type BoardColumnProps = {
  name: string;
  tasks: Task[];
  onAddTask: (fields: NewTaskFields) => Promise<boolean>;
  onDropTask: (taskId: number, columnName: string) => void;
  onDeleteColumn: (columnName: string) => void;
  onEditTask: TaskCardProps["onEdit"];
  onDeleteTask: TaskCardProps["onDelete"];
};

function handleDragStart(e: DragEvent<HTMLDivElement>, taskId: number) {
  e.dataTransfer.setData("text/plain", String(taskId));
  e.dataTransfer.effectAllowed = "move";
}

function BoardColumn({ name, tasks, onAddTask, onDropTask, onDeleteColumn, onEditTask, onDeleteTask }: BoardColumnProps) {
  const [isDragTarget, setIsDragTarget] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { colorFor, setColor } = useCategoryColors();

  const isUncategorized = name === UNCATEGORIZED;
  const dotColor = colorFor(name);
  const columnColors = isDragTarget
    ? "bg-violet-50 ring-4 ring-violet-300"
    : "bg-white/85 shadow-lg backdrop-blur";

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    // allow dropping
    e.preventDefault();
    setIsDragTarget(true);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragTarget(false);

    // skip 0 / NaN
    const taskId = Number(e.dataTransfer.getData("text/plain"));
    if (taskId) onDropTask(taskId, name);
  }

  // new tasks inherit this column's category
  function handleAddTask(fields: NewTaskFields) {
    return onAddTask({ ...fields, category: isUncategorized ? undefined : name });
  }

  // CATEGORY BOX
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragTarget(false)}
      onDrop={handleDrop}
      className={`relative min-h-48 w-72 shrink-0 rounded-2xl p-3 pl-8 transition ${columnColors}`}
    >

      <div className="absolute inset-y-0 left-0 w-3 rounded-l-full" style={{ background: dotColor }} />

      {/* CATEGORY HEADER */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <label
            title="Change colour"
            className="relative size-4 cursor-pointer rounded-full ring-offset-2 transition hover:ring-2 hover:ring-slate-300"
            style={{ background: dotColor }}
          >
            <span className="sr-only">Change colour of {name}</span>
            <input
              type="color"
              value={dotColor}
              onChange={(e) => setColor(name, e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <h3 className="text-sm font-semibold text-slate-700">{name}</h3>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
            {tasks.length}
          </span>
        </div>

        {/* DELETE CATEGORY */}
        {!isUncategorized && (
          <button
            onClick={() => onDeleteColumn(name)}
            title={`Delete "${name}" category`}
            aria-label={`Delete "${name}" category`}
            className="rounded-md px-1.5 text-lg leading-none text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          >
            ×
          </button>
        )}
      </div>

      {/* ADD TASK */}
      <div className="my-3">
        {isAddingTask ? (
          <AddTaskForm onSave={handleAddTask} onClose={() => setIsAddingTask(false)} />
        ) : (
          <button onClick={() => setIsAddingTask(true)} className="btn btn-secondary w-full">
            + Add Task
          </button>
        )}
      </div>

      {/* TASK LIST */}
      {tasks.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-black-200 py-8 text-center text-sm text-black-400">
          Drop tasks here
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* TASK BOX */}
          {tasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              className="cursor-grab active:cursor-grabbing"
            >
              <TaskCard
                id={task.id}
                title={task.title}
                description={task.description}
                category={task.category}
                dueDate={task.dueDate}
                tags={task.tags}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BoardColumn;
