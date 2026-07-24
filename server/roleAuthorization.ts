import type { NextFunction, Request, Response } from "express";

export function sendNoCompanyAccess(req: Request, res: Response) {
  return res.status(403).json({
    message: "No company access",
    code: "NO_COMPANY_ACCESS",
    requestId: req.requestId,
  });
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
