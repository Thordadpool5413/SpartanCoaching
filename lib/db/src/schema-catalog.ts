/** Synthetic-only catalog comparison. Raw definitions/defaults never leave this module. */
import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
const queries: Record<string, string> = {
  columns: `SELECT c.relname || '.' || a.attname AS key, format_type(a.atttypid,a.atttypmod) AS type,
    a.attnotnull, a.attidentity, a.attgenerated, pg_get_expr(d.adbin,d.adrelid) AS default,
    col.collname AS collation FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
    LEFT JOIN pg_collation col ON col.oid=a.attcollation WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m')
    AND c.relname <> 'schema_migrations' AND a.attnum>0 AND NOT a.attisdropped`,
  constraints: `SELECT c.relname || '.' || x.conname AS key, x.contype, x.convalidated, x.condeferrable,
    x.condeferred, pg_get_constraintdef(x.oid,true) AS definition FROM pg_constraint x
    JOIN pg_class c ON c.oid=x.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname <> 'schema_migrations'`,
  indexes: `SELECT t.relname || '.' || c.relname AS key, i.indisvalid, i.indisready,
    pg_get_indexdef(i.indexrelid) AS definition FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
    JOIN pg_class t ON t.oid=i.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='public' AND t.relname <> 'schema_migrations'`,
  relations: `SELECT c.relname AS key,c.relkind,c.relrowsecurity,c.relforcerowsecurity,
    pg_get_userbyid(c.relowner) AS owner,c.relacl::text,c.reloptions
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S') AND c.relname <> 'schema_migrations'`,
  policies: `SELECT tablename || '.' || policyname AS key, permissive,roles::text,cmd,qual,with_check
    FROM pg_policies WHERE schemaname='public'`,
  functions: `SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS key,
    pg_get_functiondef(p.oid) AS definition,p.proacl::text,pg_get_userbyid(p.proowner) AS owner
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind IN ('f','p')`,
  triggers: `SELECT c.relname || '.' || t.tgname AS key, t.tgenabled, pg_get_triggerdef(t.oid,true) AS definition
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND NOT t.tgisinternal`,
  extensions: `SELECT e.extname AS key,e.extversion,n.nspname,e.extrelocatable FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace`,
  sequences: `SELECT sequencename AS key,data_type::text,start_value,min_value,max_value,increment_by,cycle,cache_size
    FROM pg_sequences WHERE schemaname='public'`,
  sequenceOwnership: `SELECT s.relname AS key,c.relname AS table_name,a.attname AS column_name,d.deptype
    FROM pg_class s JOIN pg_namespace n ON n.oid=s.relnamespace JOIN pg_depend d ON d.objid=s.oid AND d.classid='pg_class'::regclass
    JOIN pg_class c ON c.oid=d.refobjid JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=d.refobjsubid
    WHERE n.nspname='public' AND s.relkind='S' AND d.deptype IN ('a','i')`,
  schemaGrants: `SELECT nspname AS key,pg_get_userbyid(nspowner) AS owner,nspacl::text FROM pg_namespace WHERE nspname='public'`,
  defaultGrants: `SELECT pg_get_userbyid(d.defaclrole)||'.'||coalesce(n.nspname,'global')||'.'||d.defaclobjtype AS key,
    d.defaclacl::text FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace`,
};
export type Catalog = Record<string, Record<string, string>>;
export async function readCatalog(client: PoolClient): Promise<Catalog> {
  const catalog: Catalog = {};
  for (const [category, sql] of Object.entries(queries)) {
    const { rows } = await client.query(sql);
    const objects: Record<string, string> = {};
    for (const row of rows) {
      const key = String(row.key);
      if (Object.hasOwn(objects, key)) throw new Error("CATALOG_DUPLICATE_KEY");
      const ordered = Object.fromEntries(
        Object.entries(row).sort(([a], [b]) => a.localeCompare(b)),
      );
      objects[key] = createHash("sha256")
        .update(JSON.stringify(ordered))
        .digest("hex");
    }
    catalog[category] = Object.fromEntries(
      Object.entries(objects).sort(([a], [b]) => a.localeCompare(b)),
    );
  }
  return catalog;
}
export function diffCatalog(left: Catalog, right: Catalog) {
  return [...new Set([...Object.keys(left), ...Object.keys(right)])]
    .sort()
    .flatMap((category) => {
      const a = left[category] ?? {},
        b = right[category] ?? {};
      return [...new Set([...Object.keys(a), ...Object.keys(b)])]
        .sort()
        .filter((key) => a[key] !== b[key])
        .map((key) => ({
          category,
          key,
          kind: !a[key]
            ? "source_only"
            : !b[key]
              ? "replay_only"
              : "definition_differs",
        }));
    });
}
