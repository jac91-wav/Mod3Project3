import { createStoredValue } from "./storedValue";

export const DEFAULT_BACKGROUND = "#8b5cf6";
const MAX_IMAGE_SIZE = 1920;

// page background (colour or picture), saved per browser
export const useBackground = createStoredValue("taskboard-background", DEFAULT_BACKGROUND);

// "#rrggbb" for colour inputs; pictures give the default
export function backgroundColor(background: string) {
  return background.startsWith("#") ? background : DEFAULT_BACKGROUND;
}

export async function imageFileToBackground(file: File) {
  const image = await createImageBitmap(file);

  // cap longest side at 1920px, never upscale
  const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported");
  context.fillStyle = "#ffffff"; // transparency -> white, not black
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  // fill page, crop overflow
  return `url("${dataUrl}") center / cover no-repeat`;
}
