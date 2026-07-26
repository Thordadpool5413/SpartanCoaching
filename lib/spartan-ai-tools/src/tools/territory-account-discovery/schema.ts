import { z } from "zod";

export const inputSchema = z
  .object({
    zipCodes: z.array(z.string()),
    radiusMiles: z.number().finite(),
    facilityTypes: z.array(z.string()),
    facilities: z.array(z.record(z.string(), z.unknown())).default([]),
  })
  .strict();

export const outputSchema = z
  .object({
    matchedFacilities: z.array(z.record(z.string(), z.unknown())),
    searchedZipCodes: z.array(z.string()),
    summary: z.record(z.string(), z.unknown()),
    implementationNote: z.string().min(1),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
