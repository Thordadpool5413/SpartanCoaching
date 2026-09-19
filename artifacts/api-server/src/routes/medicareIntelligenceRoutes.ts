import type { Express, NextFunction, Response } from "express";
import { requireElite, type AuthedRequest } from "../auth/middleware";
import { handler } from "../medicare-intelligence";

export function registerMedicareIntelligenceRoutes(app: Express) {
  app.use("/api/v1/medicare", requireElite, async (request: AuthedRequest, response: Response, next: NextFunction) => {
    const controller = new AbortController();
    const abort = () => controller.abort(new Error("Medicare request disconnected"));
    request.once("aborted", abort);
    response.once("close", abort);
    try {
      const member = request.fieldKit!.member!;
      const result = await handler({
        method: request.method,
        path: `/api${request.path === "/" ? "/_healthcheck" : request.path}`,
        query: Object.fromEntries(Object.entries(request.query).map(([key, value]) => [key, Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "")])),
        body: request.body,
        user: { userId: `${member.organizationId}:${request.clientMemberId}` },
        signal: controller.signal,
      });
      if (controller.signal.aborted || response.headersSent) return;
      for (const [key, value] of Object.entries(result.headers || {})) response.setHeader(key, value);
      response.status(result.statusCode).send(result.body || "");
    } catch (error) {
      next(error);
    } finally {
      request.off("aborted", abort);
      response.off("close", abort);
    }
  });
}
