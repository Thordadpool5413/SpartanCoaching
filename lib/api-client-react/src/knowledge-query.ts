import type { GetKnowledgeMetadataParams } from "./generated/api.schemas";

/** OpenAPI form/explode serialization for this metadata-only query union. */
export function knowledgeMetadataQueryString(
  params: GetKnowledgeMetadataParams,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params.filter))
    if (value !== undefined) query.set(key, String(value));
  return query.toString();
}
