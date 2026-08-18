export const BRAND_NAME = "fincode";
export const BRAND_SLOGAN = "лизинг, который всегда рядом";

export function brandAsset(path: string) {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\//, "")}`;
}

export const LOGO_SRC = brandAsset("image/Fincode_logo_blue_color_d.png");
