/**
 * PostgreSQL 16 dump/restore can move an unbounded varchar[] -> text[] cast
 * onto each literal. Normalize only that exact text-enum form. All other SQL,
 * bounded casts, collations, expressions and operators retain byte comparison.
 */
export function normalizeCheckDefinition(definition: string): string {
  const match =
    /^CHECK \(((?:"(?:[^"]|"")*"|[a-z_][a-z0-9_]*)::text) = ANY \(ARRAY\[([\s\S]*?)\](::text\[\])?\)\)$/.exec(
      definition,
    );
  if (!match) return definition;
  const [, column, list, arrayCast] = match;
  const values: string[] = [];
  const element =
    /\s*('(?:[^']|'')*')::(character varying(?:::text)?|text)\s*(,|$)/y;
  let offset = 0;
  while (offset < list!.length) {
    element.lastIndex = offset;
    const value = element.exec(list!);
    if (!value || (!arrayCast && value[2] === "character varying"))
      return definition;
    values.push(value[1]!);
    offset = element.lastIndex;
    // A dangling comma is not a valid supported literal list.
    if (value[3] === "," && offset === list!.length) return definition;
  }
  if (!values.length) return definition;
  return `TEXT_ENUM_CHECK:${JSON.stringify({ column, values })}`;
}
