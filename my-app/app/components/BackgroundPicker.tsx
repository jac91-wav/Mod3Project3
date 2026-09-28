import { useState, type ChangeEvent } from "react";
import { backgroundColor, DEFAULT_BACKGROUND, imageFileToBackground } from "../lib/useBackground";

type BackgroundPickerProps = {
  value: string;
  onChange: (background: string) => void;
};

function BackgroundPicker({ value, onChange }: BackgroundPickerProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  // <input type="color"> only understands "#rrggbb", so show the default colour while a picture is the background
  const currentColor = backgroundColor(value);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset, so choosing the same file again still triggers onChange
    if (!file) return;

    try {
      onChange(await imageFileToBackground(file));
      setUploadError(null);
    } catch {
      setUploadError("Couldn't read that picture. Try a JPG or PNG.");
    }
  }

  // BACKGROUND CONTROLS
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <label className="flex items-center gap-2">
        Background colour
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
        />
      </label>

      {/* the file input is visually hidden; clicking the label (styled as a button) opens it */}
      <label className="btn btn-secondary">
        Upload picture
        <input type="file" accept="image/*" onChange={handleUpload} className="sr-only" />
      </label>

      {/* REMOVE PICTURE BUTTON (only while a picture is the background) */}
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
