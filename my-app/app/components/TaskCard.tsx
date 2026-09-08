import { useState } from "react";

// This is the props (inputs) that TaskCard needs to work.
type TaskCardProps = {
  id?: number | string;
  title: string;
  description?: string | null;
  completed?: boolean;
  category?: string | null;
  dueDate?: string | Date | null;
  onToggle?: (id?: number | string) => void;
  onDelete?: (id?: number | string) => void;
  onEdit?: (
    id?: number | string,
    updates?: { title: string; description?: string; category?: string; dueDate?: string }
  ) => void;
};

// turns a date into something like "1/2/2026" for showing on the page
function formatDate(date?: string | Date | null) {
  if (!date) {
    return null;
  }
  const realDate = typeof date === "string" ? new Date(date) : date;
  return realDate.toLocaleDateString();
}

// turns a date into "yyyy-mm-dd" so it can go inside an <input type="date">
function toInputDate(date?: string | Date | null) {
  if (!date) {
    return "";
  }
  const realDate = typeof date === "string" ? new Date(date) : date;
  return realDate.toISOString().slice(0, 10);
}

function TaskCard({
  id,
  title,
  description,
  completed = false,
  category,
  dueDate,
  onToggle,
  onDelete,
  onEdit,
}: TaskCardProps) {
  // this is true while we are showing the edit form instead of the normal view
  const [editing, setEditing] = useState(false);

  // these hold the values typed into the edit form
  const [newTitle, setNewTitle] = useState(title);
  const [newDescription, setNewDescription] = useState(description || "");
  const [newCategory, setNewCategory] = useState(category || "");
  const [newDueDate, setNewDueDate] = useState(toInputDate(dueDate));

  function handleEditClick() {
    // fill the edit form with the current task info before showing it
    setNewTitle(title);
    setNewDescription(description || "");
    setNewCategory(category || "");
    setNewDueDate(toInputDate(dueDate));
    setEditing(true);
  }

  function handleCancelClick() {
    setEditing(false);
  }

  function handleSaveClick() {
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle === "") {
      return; // don't save a task with no title
    }

    if (onEdit) {
      onEdit(id, {
        title: trimmedTitle,
        description: newDescription.trim() === "" ? undefined : newDescription.trim(),
        category: newCategory.trim() === "" ? undefined : newCategory.trim(),
        dueDate: newDueDate === "" ? undefined : newDueDate,
      });
    }
    setEditing(false);
  }

  function handleToggleClick() {
    if (onToggle) {
      onToggle(id);
    }
  }

  function handleDeleteClick() {
    if (onDelete) {
      onDelete(id);
    }
  }

  // green background when the task is done, white otherwise
  const cardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 5,
    marginBottom: 12,
    background: completed ? "#f0fdf4" : "#fff",
  };

  // show the edit form instead of the normal card while editing
  if (editing) {
    return (
      <div style={cardStyle}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Task title"
          style={{ padding: 8, marginBottom: 8, width: "100%", fontSize: 15 }}
        />
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Task description"
          rows={2}
          style={{ padding: 8, marginBottom: 8, width: "100%", fontSize: 14 }}
        />
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Category"
          style={{ padding: 8, marginBottom: 8, width: "100%", fontSize: 14 }}
        />
        <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "#374151" }}>
          Due date
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            style={{ padding: 8, marginTop: 4, width: "100%", fontSize: 14 }}
          />
        </label>
        <button onClick={handleSaveClick} style={{ marginRight: 8, padding: "6px 10px" }}>
          Save
        </button>
        <button onClick={handleCancelClick} style={{ padding: "6px 10px" }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: "bold",
            textDecoration: completed ? "line-through" : "none",
          }}
        >
          {title}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={handleToggleClick} style={{ padding: "6px 10px" }}>
            {completed ? "Completed" : "Mark"}
          </button>
          <button onClick={handleEditClick} style={{ padding: "6px 10px" }}>
            Edit
          </button>
          <button onClick={handleDeleteClick} style={{ padding: "6px 10px", color: "#ef4444" }}>
            Delete
          </button>
        </div>
      </div>

      {description ? <p style={{ margin: "0 0 8px 0", color: "#374151" }}>{description}</p> : null}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <small style={{ color: "#6b7280" }}>
          {dueDate ? "Due: " + formatDate(dueDate) : "No due date"}
        </small>
        <small style={{ color: "#6b7280" }}>ID: {id !== undefined ? id : "—"}</small>
      </div>
    </div>
  );
}

export default TaskCard;
