import http from "node:http";
import type { Request, Response } from "express";

export function proxyToVite(viteOrigin: string) {
  const target = new URL(viteOrigin);

  return function viteProxy(req: Request, res: Response) {
    const headers = { ...req.headers, host: target.host };
    delete headers.connection;

    const proxyReq = http.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: req.originalUrl,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on("error", () => {
      res
        .status(200)
        .type("html")
        .send(`<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="2" />
    <title>Кабинет партнёра</title>
  </head>
  <body>
    <p>API запущен. Фронт поднимается… страница обновится автоматически.</p>
    <p><a href="/api/health">Проверить API</a></p>
  </body>
</html>`);
    });

    req.pipe(proxyReq);
  };
}
