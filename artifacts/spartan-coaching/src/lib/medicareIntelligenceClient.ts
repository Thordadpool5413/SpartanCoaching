import { apiRequest } from "@/lib/queryClient";
import { MEDICARE_API_ROOT } from "@workspace/api-contract";

export const MEDICARE_API = MEDICARE_API_ROOT;

export async function getMedicareIntelligence<T = unknown>(path: string, query: Record<string, string> = {}): Promise<T> {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value.trim()));
  const response = await apiRequest("GET", `${MEDICARE_API}${path}${params.size ? `?${params}` : ""}`);
  return response.json() as Promise<T>;
}

export async function mutateMedicareIntelligence<T = unknown>(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
  const response = await apiRequest(method, `${MEDICARE_API}${path}`, body);
  return response.json() as Promise<T>;
}
