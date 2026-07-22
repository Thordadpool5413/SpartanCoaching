import type { NextFunction, Request, Response } from "express";

export type AdminAuthorizationRequest = Request & {
  clientMemberId?: number;
  fieldKit?: {
    member?: {
      status: string;
      role: string;
    } | null;
  };
};

export function isAdminRequest(req: AdminAuthorizationRequest | Request): boolean {
  const member = (req as AdminAuthorizationRequest).fieldKit?.member;
  return Boolean(member && member.status === "active" && member.role === "platform_admin");
}

export function requireAdmin(
  req: AdminAuthorizationRequest,
  res: Response,
  next: NextFunction,
) {
  if (isAdminRequest(req)) return next();
  return res.status(req.clientMemberId ? 403 : 401).json({
    error: "Platform administrator session required",
    code: "ADMIN_REQUIRED",
  });
}
