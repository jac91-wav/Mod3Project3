import { useState, type ChangeEvent } from "react";
import { backgroundColor, DEFAULT_BACKGROUND, imageFileToBackground } from "../lib/useBackground";

type BackgroundPickerProps = {
  value: string;
  onChange: (background: string) => void;
};

function BackgroundPicker({ value, onChange }: BackgroundPickerProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  // color input needs "#rrggbb"; pictures fall back to the default
  const currentColor = backgroundColor(value);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again
    if (!file) return;

    try {
      onChange(await imageFileToBackground(file));
      setUploadError(null);
    }

    catch {
      setUploadError("Couldn't read that picture. Try a JPG or PNG.");
    }

  }

  // BACKGROUND CONTROLS
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <label className="flex items-center gap-2">
        Background Color
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
        />
      </label>

      {/* hidden input, opened via the label */}
      <label className="btn btn-secondary">
        Upload picture
        <input type="file" accept="image/*" onChange={handleUpload} className="sr-only" />
      </label>

      {/* REMOVE PICTURE BUTTON */}
      {!value.startsWith("#") && (
        <button type="button" onClick={() => onChange(DEFAULT_BACKGROUND)} className="btn btn-secondary">
          Remove picture
        </button>
      )}

      {uploadError && <span className="text-red-600">{uploadError}</span>}
    </div>
  );
}

export default BackgroundPicker;
