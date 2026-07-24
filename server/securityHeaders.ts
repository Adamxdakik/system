import helmet from "helmet";
import type { RequestHandler } from "express";

const PERMISSIONS_POLICY = [
  "camera=()",
  "geolocation=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");

export function securityHeaders(environment = process.env.NODE_ENV): RequestHandler[] {
  const isProduction = environment === "production";

  return [
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: isProduction ? ["'self'"] : ["'self'", "ws:", "wss:"],
          fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:", "blob:"],
          objectSrc: ["'none'"],
          scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          workerSrc: ["'self'", "blob:"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      frameguard: { action: "deny" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      strictTransportSecurity: isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true }
        : false,
    }),
    (_req, res, next) => {
      res.setHeader("Permissions-Policy", PERMISSIONS_POLICY);
      next();
    },
  ];
}
