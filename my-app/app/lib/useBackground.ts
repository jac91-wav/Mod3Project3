import { createStoredValue } from "./storedValue";

export const DEFAULT_BACKGROUND = "#8b5cf6";
const MAX_IMAGE_SIZE = 1920;

// The page background (a CSS colour, or a picture), remembered in this browser: [background, setBackground]
export const useBackground = createStoredValue("taskboard-background", DEFAULT_BACKGROUND);

// The background as a "#rrggbb" colour. A picture has no single colour, so it gives the default colour.
export function backgroundColor(background: string) {
  return background.startsWith("#") ? background : DEFAULT_BACKGROUND;
}

export async function imageFileToBackground(file: File) {
  const image = await createImageBitmap(file);

  // longest side -> 1920px; Math.min(1, ...) means small pictures are never enlarged
  const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported");
  context.fillStyle = "#ffffff"; // JPEG has no transparency, so see-through areas become white instead of black
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  // center / cover = fill the whole page, cropping the edges if the shape doesn't match
  return `url("${dataUrl}") center / cover no-repeat`;
}
