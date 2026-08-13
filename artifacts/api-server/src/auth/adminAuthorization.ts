import type { NextFunction, Request, Response } from "express";
import {
  adminRequiredStatus,
  buildApiErrorBody,
} from "@workspace/api-contract";

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
  return res
    .status(adminRequiredStatus(Boolean(req.clientMemberId)))
    .json(buildApiErrorBody({ code: "ADMIN_REQUIRED" }));
}
