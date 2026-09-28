import { useState } from "react";
import { parseTags, type NewTaskFields } from "../lib/useTaskBoard";

type AddTaskFormProps = {
  onSave: (fields: NewTaskFields) => Promise<boolean>;
  onClose: () => void;
};

function AddTaskForm({ onSave, onClose }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  // the api requires both, so Add stays disabled until they're filled in
  // (and while saving, so a double-click can't create the task twice)
  const canSave = title.trim() !== "" && description.trim() !== "" && !saving;

  async function handleSave() {
    setSaving(true);
    const saved = await onSave({ title, description, dueDate: dueDate || undefined, tags: parseTags(tags) });
    setSaving(false);
    if (saved) onClose();
  }

  // ADD TASK FORM
  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="field font-medium"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description"
        rows={2}
        className="field"
      />
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags, separated by commas"
        className="field"
      />
      <label className="grid gap-1 text-xs font-medium text-slate-500">
        Due date
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field" />
      </label>
      <div className="mt-1 flex gap-2">
        <button onClick={handleSave} disabled={!canSave} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          Add
        </button>
        <button onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AddTaskForm;
