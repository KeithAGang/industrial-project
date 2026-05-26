-- LifecycleIQ default seed data
-- Passwords are BCrypt hashed. Plain-text:
--   admin@lifecycleiq.com  → admin123
--   manager@lifecycleiq.com → manager123
-- IMPORTANT: Change passwords before any production deployment.

BEGIN;

-- Users
INSERT INTO "Users" ("Id", "Email", "PasswordHash", "FullName", "Role", "CreatedAt") VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'admin@lifecycleiq.com',
  '$2a$11$8K1p/a0dR1xqM8K3e5F6.eKzNBUqfLHUTMmCH4VzRVtFq9YRFQZO6',
  'System Administrator',
  'Admin',
  NOW()
),
(
  'a2000000-0000-0000-0000-000000000002',
  'manager@lifecycleiq.com',
  '$2a$11$mhZbEFZkWYyR1qJq6Wf7X.RbOjuZjgXG6LXkbHWk1uHFqHGQTnLtu',
  'Jane Manager',
  'Manager',
  NOW()
)
ON CONFLICT ("Email") DO NOTHING;

-- Clients
INSERT INTO "Clients" ("Id", "Name", "ContactPerson", "Email", "Phone", "CreatedAt") VALUES
(
  'c1000000-0000-0000-0000-000000000001',
  'Acme Financial Services',
  'Robert Chen',
  'r.chen@acme-finance.com',
  '+263 77 123 4567',
  NOW()
),
(
  'c2000000-0000-0000-0000-000000000002',
  'ZimTech Industries',
  'Tendai Moyo',
  'tendai.moyo@zimtech.co.zw',
  '+263 77 987 6543',
  NOW()
),
(
  'c3000000-0000-0000-0000-000000000003',
  'Harare Municipal Council',
  'Chiedza Nyamhondera',
  'c.nyamhondera@hararecity.gov.zw',
  '+263 4 700 0000',
  NOW()
)
ON CONFLICT DO NOTHING;

-- Solutions
INSERT INTO "Solutions" (
  "Id", "ClientId", "Name", "Description",
  "CurrentVersion", "LatestVersion",
  "LicenceExpiryDate", "SlaTier", "SlaComplianceStatus",
  "LastMaintenanceDate", "IsActive", "CreatedAt", "UpdatedAt"
) VALUES
(
  'e1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'CoreBanking ERP',
  'Enterprise resource planning system managing financial operations.',
  '4.2.1', '5.0.0',
  NOW() + INTERVAL '25 days',
  'Critical', 'AtRisk',
  NOW() - INTERVAL '95 days',
  TRUE, NOW(), NOW()
),
(
  'e2000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000001',
  'Reporting Suite',
  'Financial reporting and analytics platform.',
  '2.8.0', '3.1.0',
  NOW() + INTERVAL '180 days',
  'Standard', 'Compliant',
  NOW() - INTERVAL '20 days',
  TRUE, NOW(), NOW()
),
(
  'e3000000-0000-0000-0000-000000000003',
  'c2000000-0000-0000-0000-000000000002',
  'MES Platform',
  'Manufacturing execution system for factory floor management.',
  '1.4.3', '2.0.0',
  NOW() + INTERVAL '5 days',
  'Premium', 'Breached',
  NOW() - INTERVAL '200 days',
  TRUE, NOW(), NOW()
),
(
  'e4000000-0000-0000-0000-000000000004',
  'c3000000-0000-0000-0000-000000000003',
  'Citizen Portal',
  'Online portal for municipal services and rate payments.',
  '3.0.2', '3.0.2',
  NOW() + INTERVAL '400 days',
  'Standard', 'Compliant',
  NOW() - INTERVAL '10 days',
  TRUE, NOW(), NOW()
)
ON CONFLICT DO NOTHING;

COMMIT;
