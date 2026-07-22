import type { Request, Response } from "express";

export function legacyRoleplayRetired(_req: Request, res: Response) {
  return res.status(410).json({
    error: "Legacy roleplay has been retired while tenant-safe roleplay is being introduced.",
    code: "LEGACY_ROLEPLAY_RETIRED",
  });
}
