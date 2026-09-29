import { useState } from "react";

type AddCategoryTileProps = {
  onAdd: (name: string) => boolean;
};

function AddCategoryTile({ onAdd }: AddCategoryTileProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");

  function close() {
    setName("");
    setIsAdding(false);
  }

  function handleAdd() {
    if (onAdd(name)) close();
  }

  if (!isAdding) {
    // ADD CATEGORY BUTTON
    return (
      <div className="w-72 shrink-0">
        <button onClick={() => setIsAdding(true)} className="btn btn-secondary mt-2 w-full">
          + Add Category/List
        </button>
      </div>
    );
  }

  // ADD CATEGORY FORM
  return (
    <div className="mt-2 grid w-72 shrink-0 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") close();
        }}
        placeholder="Category name"
        className="field"
        autoFocus
      />
      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={!name.trim()} className="btn btn-primary">
          Add
        </button>
        <button onClick={close} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AddCategoryTile;
