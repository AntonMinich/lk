import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import path from "node:path";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { validatePartnerPhone } from "../shared/phone.ts";
import { PartnerStore, toPublicPartner, type PublicPartner } from "./store.ts";
import { proxyToVite } from "./vite-proxy.ts";

const SESSION_COOKIE = "lk_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Session = {
  partnerId: string;
  expiresAt: number;
};

export type CreateAppOptions = {
  partnersPath: string;
  imageDir: string;
  distDir?: string;
  viteOrigin?: string;
};

export function createApp(options: CreateAppOptions) {
  const store = new PartnerStore(options.partnersPath);
  const sessions = new Map<string, Session>();
  const app = express();

  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use("/image", express.static(options.imageDir));

  function readSession(req: Request): Session | null {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token || typeof token !== "string") {
      return null;
    }
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(token);
      return null;
    }
    return session;
  }

  function setSession(res: Response, partnerId: string) {
    const token = randomBytes(24).toString("hex");
    sessions.set(token, { partnerId, expiresAt: Date.now() + SESSION_TTL_MS });
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS,
    });
  }

  function clearSession(req: Request, res: Response) {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) {
      sessions.delete(token);
    }
    res.clearCookie(SESSION_COOKIE, { path: "/" });
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/", (_req, res, next) => {
    if (options.distDir || options.viteOrigin) {
      next();
      return;
    }
    res.json({ ok: true, service: "lk-api", health: "/api/health" });
  });

  app.post("/api/register", async (req, res) => {
    const companyName = String(req.body?.companyName ?? "").trim();
    const contactName = String(req.body?.contactName ?? "").trim();
    const password = String(req.body?.password ?? "");
    const phoneResult = validatePartnerPhone(String(req.body?.phone ?? ""));

    if (!companyName) {
      res.status(400).json({ message: "Укажите название организации" });
      return;
    }
    if (!phoneResult.ok) {
      res.status(400).json({ message: phoneResult.message });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: "Пароль должен содержать не менее 6 символов" });
      return;
    }

    const existing = await store.findByPhone(phoneResult.canonical);
    if (existing) {
      res.status(409).json({ message: "Партнёр с таким номером уже зарегистрирован" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await store.create({
      phone: phoneResult.canonical,
      passwordHash,
      companyName,
      contactName,
    });

    res.status(201).json({ ok: true });
  });

  app.post("/api/login", async (req, res) => {
    const password = String(req.body?.password ?? "");
    const phoneResult = validatePartnerPhone(String(req.body?.phone ?? ""));

    if (!phoneResult.ok) {
      res.status(400).json({ message: phoneResult.message });
      return;
    }
    if (!password) {
      res.status(400).json({ message: "Введите пароль" });
      return;
    }

    const partner = await store.findByPhone(phoneResult.canonical);
    if (!partner) {
      res.status(401).json({ message: "Партнёр с таким номером не зарегистрирован" });
      return;
    }

    const matches = await bcrypt.compare(password, partner.passwordHash);
    if (!matches) {
      res.status(401).json({ message: "Неверный пароль" });
      return;
    }

    setSession(res, partner.id);
    res.json({ partner: toPublicPartner(partner) });
  });

  app.post("/api/logout", (req, res) => {
    clearSession(req, res);
    res.json({ ok: true });
  });

  app.get("/api/me", async (req, res) => {
    const session = readSession(req);
    if (!session) {
      res.status(401).json({ message: "Нужна авторизация" });
      return;
    }

    const partners = await store.list();
    const partner = partners.find((item) => item.id === session.partnerId);
    if (!partner) {
      clearSession(req, res);
      res.status(401).json({ message: "Нужна авторизация" });
      return;
    }

    res.json({ partner: toPublicPartner(partner) });
  });

  if (options.distDir) {
    app.use(express.static(options.distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(options.distDir!, "index.html"));
    });
  } else if (options.viteOrigin) {
    app.use(proxyToVite(options.viteOrigin));
  }

  return app;
}

export type { PublicPartner };
