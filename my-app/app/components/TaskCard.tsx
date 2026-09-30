import { useState, type ChangeEvent } from "react";
import { FiCalendar, FiEdit2, FiTrash2 } from "react-icons/fi";
import { parseTags } from "../lib/useTaskBoard";

type DateLike = string | Date | null | undefined;

export type TaskCardProps = {
  id?: number | string;
  title: string;
  description?: string | null;
  category?: string | null;
  dueDate?: string | Date | null;
  tags?: string[] | null;
  onDelete?: (id?: number | string) => void;
  onEdit?: (
    id?: number | string,
    updates?: { title: string; description?: string; category?: string; dueDate?: string; tags?: string[] }
  ) => void;
};

function formatDate(date: DateLike) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function toInputDate(date: DateLike) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-CA");
}

const iconButton =
  "rounded-md p-1.5 text-slate-400 transition";

function TaskCard({
  id,
  title,
  description,
  category,
  dueDate,
  tags,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const [editing, setEditing] = useState(false);

  const currentValues = () => ({
    title,
    description: description || "",
    category: category || "",
    dueDate: toInputDate(dueDate),
    tags: (tags ?? []).join(", "),
  });

  // lazy init: runs on first render only
  const [form, setForm] = useState(currentValues);

  // setField("title") -> onChange for form.title
  function setField(field: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: e.target.value }));
    };
  }

  function handleEditClick() {
    setForm(currentValues());
    setEditing(true);
  }

  function handleSaveClick() {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return;

    onEdit?.(id, {
      title: trimmedTitle,
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      dueDate: form.dueDate || undefined,
      tags: parseTags(form.tags),
    });
    setEditing(false);
  }

  const cardClass = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md";

  // midnight today, so tasks due today aren't overdue
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const overdue = dueDate ? new Date(dueDate).getTime() < startOfToday : false;

  if (editing) {
    // TASK BOX (visible in edit mode)
    return (
      <div className={`${cardClass} grid gap-2`}>
        {/* TITLE input */}
        <input
          type="text"
          value={form.title}
          onChange={setField("title")}
          placeholder="Task title"
          className="field font-medium"
        />
        {/* DESCRIPTION textarea */}
        <textarea
          value={form.description}
          onChange={setField("description")}
          placeholder="Task description"
          rows={2}
          className="field"
        />
        {/* CATEGORY input */}
        <input
          type="text"
          value={form.category}
          onChange={setField("category")}
          placeholder="Category"
          className="field"
        />
        {/* TAGS input */}
        <input
          type="text"
          value={form.tags}
          onChange={setField("tags")}
          placeholder="Tags, separated by commas"
          className="field"
        />
        {/* DUE DATE picker */}
        <label className="grid gap-1 text-xs font-medium text-slate-500">
          Due date
          <input type="date" value={form.dueDate} onChange={setField("dueDate")} className="field" />
        </label>
        {/* SAVE / CANCEL buttons */}
        <div className="mt-1 flex gap-2">
          <button onClick={handleSaveClick} className="btn btn-primary">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const dueBadgeColors = overdue ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700";
  const dueLabel = dueDate ? `Due ${formatDate(dueDate)}` : "No due date";

  // TASK BOX
  return (
    <div className={cardClass}>
      <h3 className="text-base font-semibold text-slate-900">
        {title}
      </h3>

      {description ? <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p> : null}

      {/* TAGS */}
      {tags && tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-medium text-fuchsia-700">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* CARD FOOTER */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${dueBadgeColors}`}>
            <FiCalendar aria-hidden />
            {dueLabel}
          </span>
          <span className="text-xs text-slate-400">#{id ?? "—"}</span>
        </div>

        {/* EDIT / DELETE buttons */}
        <div className="flex gap-1">
          {/* EDIT button (switches card to edit mode) */}
          <button
            onClick={handleEditClick}
            aria-label="Edit"
            title="Edit"
            className={`${iconButton} hover:bg-slate-100 hover:text-slate-700`}
          >
            <FiEdit2 aria-hidden />
          </button>
          <button
            onClick={() => confirm("Are you sure you want to delete this item?") && onDelete?.(id)}
            aria-label="Delete"
            title="Delete"
            className={`${iconButton} hover:bg-red-50 hover:text-red-600`}
          >
            <FiTrash2 aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
