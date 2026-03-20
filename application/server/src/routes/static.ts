import fs from "fs";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const COMPRESSIBLE_EXTS = new Set([".js", ".css"]);
const MIME_TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function precompressedMiddleware(root: string) {
  return (req: any, res: any, next: () => void) => {
    const ext = path.extname(req.path);
    if (!COMPRESSIBLE_EXTS.has(ext)) return next();

    const accept = (req.headers["accept-encoding"] ?? "") as string;
    const candidates: Array<{ suffix: string; encoding: string }> = [];
    if (accept.includes("br")) candidates.push({ suffix: ".br", encoding: "br" });
    if (accept.includes("gzip")) candidates.push({ suffix: ".gz", encoding: "gzip" });

    for (const { suffix, encoding } of candidates) {
      const filePath = path.join(root, req.path + suffix);
      if (fs.existsSync(filePath)) {
        res.setHeader("Content-Encoding", encoding);
        res.setHeader("Content-Type", MIME_TYPES[ext]);
        res.setHeader("Vary", "Accept-Encoding");
        return res.sendFile(filePath);
      }
    }
    next();
  };
}

// メディアファイルは UUID ベースで不変 → 長期キャッシュ
staticRouter.use("/movies/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/images/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/sounds/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});

// コンテンツハッシュ付きの不変アセットは長期キャッシュ
staticRouter.use("/scripts/chunk-", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/assets/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/styles/fonts/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/fonts/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(precompressedMiddleware(CLIENT_DIST_PATH));
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
  }),
);
