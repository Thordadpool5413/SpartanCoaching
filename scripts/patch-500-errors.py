from pathlib import Path
import re

p = Path("artifacts/api-server/src/routes/routes.ts")
s = p.read_text(encoding="utf-8")
if "clientErrorMessage" not in s:
    needle = 'from "../rateLimits";'
    if needle not in s:
        raise SystemExit("rateLimits import not found")
    s = s.replace(
        needle,
        needle + '\nimport { clientErrorMessage } from "../lib/httpErrors";',
        1,
    )

s2, n1 = re.subn(
    r'res\.status\(500\)\.json\(\{\s*error:\s*error\.message\s*\|\|\s*("[^"]+")\s*\}\)',
    r"res.status(500).json({ error: clientErrorMessage(error, \1) })",
    s,
)
s3, n2 = re.subn(
    r"res\.status\(500\)\.json\(\{\s*error:\s*error\.message\s*\}\)",
    r'res.status(500).json({ error: clientErrorMessage(error, "Request failed") })',
    s2,
)
p.write_text(s3, encoding="utf-8")
print("replacements", n1, n2, "refs", s3.count("clientErrorMessage"))
