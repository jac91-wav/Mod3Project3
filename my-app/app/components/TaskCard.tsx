import { useState, type ChangeEvent } from "react";

type DateLike = string | Date | null | undefined;

// What the parent page passes in. Only `title` is required.
type TaskCardProps = {
  id?: number | string;
  title: string;
  description?: string | null;
  completed?: boolean; // true = green background and struck-through title
  category?: string | null;
  dueDate?: string | Date | null;
  onDelete?: (id?: number | string) => void; // called with this task's id when Delete is clicked
  onEdit?: (
    id?: number | string,
    updates?: { title: string; description?: string; category?: string; dueDate?: string }
  ) => void; // called with the id and the edited fields when Save is clicked
};

// Accepts: an ISO string, a Date, or nothing
// Returns: a display date like "1/2/2026", or null if there is no date
const formatDate = (date: DateLike) => (date ? new Date(date).toLocaleDateString() : null);

// Accepts: an ISO string, a Date, or nothing
// Returns: "yyyy-mm-dd", the format <input type="date"> needs ("" if there is no date)
const toInputDate = (date: DateLike) => (date ? new Date(date).toISOString().slice(0, 10) : "");

// Shared inline styles for the edit form and buttons
const fieldStyle = { padding: 8, marginBottom: 8, width: "100%", fontSize: 14 };
const buttonStyle = { padding: "6px 10px" };

function TaskCard({
  id,
  title,
  description,
  completed = false,
  category,
  dueDate,
  onDelete,
  onEdit,
}: TaskCardProps) {
  // true while the edit form is shown instead of the normal view
  const [editing, setEditing] = useState(false);

  // The task's current values as strings for the form inputs (null/undefined become "")
  const currentValues = () => ({
    title,
    description: description || "",
    category: category || "",
    dueDate: toInputDate(dueDate),
  });

  // What the user has typed into the edit form so far
  const [form, setForm] = useState(currentValues);

  // Returns an onChange handler that updates one field of the form
  const setField =
    (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  // Opens the form, reset to the task's current values (discards any earlier unsaved typing)
  function handleEditClick() {
    setForm(currentValues());
    setEditing(true);
  }

  // Sends the trimmed values to the parent; empty optional fields are sent as undefined
  function handleSaveClick() {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return; // don't save a task with no title

    onEdit?.(id, {
      title: trimmedTitle,
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      dueDate: form.dueDate || undefined,
    });
    setEditing(false);
  }

  // green background when the task is done, white otherwise
  const cardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 5,
    marginBottom: 12,
    background: completed ? "#f0fdf4" : "#fff",
  };

  if (editing) {
    return (
      <div style={cardStyle}>
        <input
          type="text"
          value={form.title}
          onChange={setField("title")}
          placeholder="Task title"
          style={{ ...fieldStyle, fontSize: 15 }}
        />
        <textarea
          value={form.description}
          onChange={setField("description")}
          placeholder="Task description"
          rows={2}
          style={fieldStyle}
        />
        <input
          type="text"
          value={form.category}
          onChange={setField("category")}
          placeholder="Category"
          style={fieldStyle}
        />
        <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "#374151" }}>
          Due date
          <input
            type="date"
            value={form.dueDate}
            onChange={setField("dueDate")}
            style={{ ...fieldStyle, marginTop: 4, marginBottom: 0 }}
          />
        </label>
        <button onClick={handleSaveClick} style={{ ...buttonStyle, marginRight: 8 }}>
          Save
        </button>
        <button onClick={() => setEditing(false)} style={buttonStyle}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: 20,
          fontWeight: "bold",
          textDecoration: completed ? "line-through" : "none",
        }}
      >
        {title}
      </h3>

      {description ? <p style={{ margin: "0 0 8px 0", color: "#374151" }}>{description}</p> : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #e5e7eb",
          marginTop: 8,
          paddingTop: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <small style={{ color: "#6b7280" }}>
            {dueDate ? `Due: ${formatDate(dueDate)}` : "No due date"}
          </small>
          <small style={{ color: "#6b7280" }}>ID: {id ?? "—"}</small>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleEditClick} style={buttonStyle}>
            Edit
          </button>
          <button onClick={() => onDelete?.(id)} style={{ ...buttonStyle, color: "#ef4444" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
