-- 0015_org_contacts_offboard.sql
-- HSP-41 Slice D / pass (10): billing + security contacts, retention note.
-- Additive. Offboarding uses existing member disable + invite revoke + audit.

ALTER TABLE client_organizations
  ADD COLUMN IF NOT EXISTS billing_contact_email varchar(320);
ALTER TABLE client_organizations
  ADD COLUMN IF NOT EXISTS billing_contact_name varchar(255);
ALTER TABLE client_organizations
  ADD COLUMN IF NOT EXISTS security_contact_email varchar(320);
ALTER TABLE client_organizations
  ADD COLUMN IF NOT EXISTS security_contact_name varchar(255);
ALTER TABLE client_organizations
  ADD COLUMN IF NOT EXISTS data_retention_note text;
