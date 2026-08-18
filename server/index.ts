import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 3001);
const distDir = path.join(rootDir, "dist");
const viteOrigin = process.env.VITE_ORIGIN;
const serveFrontend = !viteOrigin && process.env.SERVE_FRONTEND !== "0" && existsSync(distDir);

const app = createApp({
  partnersPath: process.env.PARTNERS_PATH ?? path.join(rootDir, "data", "partners.json"),
  imageDir: path.join(rootDir, "image"),
  distDir: serveFrontend ? distDir : undefined,
  viteOrigin,
});

app.listen(port, "0.0.0.0", () => {
  console.log(`LK API http://localhost:${port}`);
});
