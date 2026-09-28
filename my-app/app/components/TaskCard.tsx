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
  "cursor-pointer rounded-md p-1.5 text-slate-400 transition focus-visible:outline-2 focus-visible:outline-indigo-500";

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

  // passing the function itself (not currentValues()) means React only calls it on the first render
  const [form, setForm] = useState(currentValues);

  // setField("title") returns an onChange handler that updates only form.title
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

  // setHours(0, 0, 0, 0) moves "now" back to midnight today and returns it as a timestamp (ms),
  // so a task due today doesn't count as overdue until tomorrow
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const overdue = dueDate ? new Date(dueDate).getTime() < startOfToday : false;

  if (editing) {
    // TASK BOX (visible in edit mode)
    return (
      <div className={`${cardClass} grid gap-2`}>
        <input
          type="text"
          value={form.title}
          onChange={setField("title")}
          placeholder="Task title"
          className="field font-medium"
        />
        <textarea
          value={form.description}
          onChange={setField("description")}
          placeholder="Task description"
          rows={2}
          className="field"
        />
        <input
          type="text"
          value={form.category}
          onChange={setField("category")}
          placeholder="Category"
          className="field"
        />
        <input
          type="text"
          value={form.tags}
          onChange={setField("tags")}
          placeholder="Tags, separated by commas"
          className="field"
        />
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

      {/* TAGS (?) */}
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

        <div className="flex gap-1">
          <button
            onClick={handleEditClick}
            aria-label="Edit"
            title="Edit"
            className={`${iconButton} hover:bg-slate-100 hover:text-slate-700`}
          >
            <FiEdit2 aria-hidden />
          </button>
          <button
            onClick={() => onDelete?.(id)}
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
