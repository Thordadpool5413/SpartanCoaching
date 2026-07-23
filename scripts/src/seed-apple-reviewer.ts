/**
 * Seed the Apple App Review test account in the Field Kit database.
 *
 * Idempotent — safe to run multiple times. If the account already exists,
 * it resets the password and re-activates it so credentials stay current.
 *
 * The password is read from REVIEWER_PASSWORD env var. If not provided,
 * a secure random password is generated and printed to stdout so you can
 * paste it straight into App Store Connect → App Review Information.
 *
 * Usage:
 *   # Generate a new random password (recommended for initial setup):
 *   DATABASE_URL=<url> pnpm --filter @workspace/scripts run seed:apple-reviewer
 *
 *   # Provide a specific password (e.g. to reset to a known value):
 *   DATABASE_URL=<url> REVIEWER_PASSWORD=<password> pnpm --filter @workspace/scripts run seed:apple-reviewer
 *
 * After running, copy the printed credentials into:
 *   App Store Connect → App Review Information → Sign-in required
 */

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import pkg from "pg";

const { Pool } = pkg;

const REVIEWER_EMAIL = "apple-reviewer@spartanhospicecoaching.com";
const REVIEWER_NAME = "Apple App Reviewer";
const ORG_NAME = "Apple App Review (Test Account)";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

function generatePassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  return Array.from(randomBytes(20))
    .map((b) => chars[b % chars.length])
    .join("");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL is not set.");
    process.exit(1);
  }

  const password = process.env.REVIEWER_PASSWORD?.trim() || generatePassword();
  const passwordHash = await hashPassword(password);

  const pool = new Pool({ connectionString: databaseUrl });

  console.log("Seeding Apple reviewer test account...");

  const existingResult = await pool.query(
    `SELECT id, organization_id FROM client_members WHERE email = $1 LIMIT 1`,
    [REVIEWER_EMAIL]
  );

  if (existingResult.rows.length > 0) {
    const member = existingResult.rows[0] as { id: number; organization_id: number };
    console.log(
      `Account already exists (member id ${member.id}). Resetting password and ensuring active status.`
    );

    await pool.query(
      `UPDATE client_members SET password_hash = $1, status = 'active', name = $2 WHERE id = $3`,
      [passwordHash, REVIEWER_NAME, member.id]
    );

    await pool.query(
      `UPDATE client_organizations SET status = 'active', trial_ends_at = NULL WHERE id = $1`,
      [member.organization_id]
    );

    await pool.query(
      `INSERT INTO org_timeline_events (organization_id, type, body, created_by)
       VALUES ($1, 'system', $2, 'seed-script')`,
      [
        member.organization_id,
        "Apple reviewer test account password reset and re-activated.",
      ]
    );

    console.log("✅ Account updated successfully.");
  } else {
    console.log("Creating new Apple reviewer org and member...");

    const orgResult = await pool.query(
      `INSERT INTO client_organizations
         (name, type, seat_limit, status, pipeline_status, trial_ends_at, activated_at, notes)
       VALUES ($1, 'personal', 1, 'active', 'won', NULL, NOW(),
               'Permanent test account for Apple App Store reviewers. Do not expire or delete.')
       RETURNING id`,
      [ORG_NAME]
    );
    const orgId = (orgResult.rows[0] as { id: number }).id;

    const memberResult = await pool.query(
      `INSERT INTO client_members
         (email, password_hash, name, title, role, organization_id, status, terms_accepted_at)
       VALUES ($1, $2, $3, 'App Reviewer', 'member', $4, 'active', NOW())
       RETURNING id`,
      [REVIEWER_EMAIL, passwordHash, REVIEWER_NAME, orgId]
    );
    const memberId = (memberResult.rows[0] as { id: number }).id;

    await pool.query(
      `INSERT INTO org_timeline_events (organization_id, type, body, created_by)
       VALUES ($1, 'system', $2, 'seed-script')`,
      [orgId, "Apple reviewer test account seeded for App Store review."]
    );

    console.log(`✅ Created org id=${orgId}, member id=${memberId}`);
  }

  console.log("");
  console.log("──────────────────────────────────────────────────────────────");
  console.log(" CREDENTIALS — enter these in App Store Connect immediately");
  console.log("──────────────────────────────────────────────────────────────");
  console.log(` Email:    ${REVIEWER_EMAIL}`);
  console.log(` Password: ${password}`);
  console.log("──────────────────────────────────────────────────────────────");
  console.log("");
  console.log("Path: App Store Connect → your app → App Review Information");
  console.log("       → Sign-in required → Username / Password fields");
  console.log("");
  console.log(
    "Copy the App Review notes from store/README.md into the Notes field."
  );
  console.log(
    "Do NOT commit the password above — it only needs to live in App Store Connect."
  );

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
