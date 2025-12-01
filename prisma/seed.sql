-- Seed Data for Stormwater Watch
-- Run this in Supabase SQL Editor
--
-- IMPORTANT: This seed file has been updated to NOT create mock facilities.
-- The application now uses real eSMR facility data imported via the import:esmr script.
--
-- This file only seeds:
-- 1. Demo users
-- 2. Pollutant configuration
-- 3. Example subscriptions
--
-- For mock data in testing, see __tests__/fixtures/mock-*.ts files.

-- 1. Create Users
INSERT INTO "User" (id, email, name, role, "createdAt") VALUES
('user-admin-001', 'admin@stormwaterwatch.org', 'Admin User', 'ADMIN', NOW()),
('user-partner-001', 'partner1@example.org', 'Environmental NGO Partner 1', 'PARTNER', NOW()),
('user-partner-002', 'partner2@example.org', 'Environmental NGO Partner 2', 'PARTNER', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Create Pollutant Config
INSERT INTO "ConfigPollutant" (key, aliases, "canonicalUnit", notes) VALUES
('COPPER', ARRAY['Copper', 'CU', 'Total Copper', 'Cu'], 'µg/L', 'Metals - store as µg/L'),
('ZINC', ARRAY['Zinc', 'ZN', 'Total Zinc', 'Zn'], 'µg/L', 'Metals - store as µg/L'),
('TSS', ARRAY['Total Suspended Solids', 'TSS', 'Suspended Solids'], 'mg/L', 'Total suspended solids'),
('O&G', ARRAY['Oil and Grease', 'O&G', 'Oil & Grease', 'O/G'], 'mg/L', 'Oil and grease'),
('PH', ARRAY['pH', 'PH VALUE', 'pH Value'], 'pH', 'pH is range-based (6.0-9.0)'),
('TURBIDITY', ARRAY['Turbidity', 'TURB'], 'NTU', 'Turbidity in NTU')
ON CONFLICT (key) DO NOTHING;

-- 3. REMOVED: Mock facilities, samples, and violation events
-- These sections have been removed. Use real eSMR data instead.

-- To import real facility data:
--   npm run import:esmr
--
-- To create Facility records linked to eSMR data:
--   npm run link:facilities

-- 4. Create Example Subscriptions
INSERT INTO "Subscription" (id, "userId", name, mode, params, "minRatio", "repeatOffenderThreshold", "impairedOnly", schedule, delivery, active, "createdAt") VALUES
('sub-001', 'user-partner-001', 'San Francisco Bay Area Monitoring', 'POLYGON', '{"polygon": {"type": "Polygon", "coordinates": [[[-122.5, 37.7], [-122.3, 37.7], [-122.3, 37.9], [-122.5, 37.9], [-122.5, 37.7]]]}}', 1.50, 2, false, 'DAILY', 'EMAIL', true, NOW()),
('sub-002', 'user-partner-001', 'Oakland Area (10km radius)', 'BUFFER', '{"centerLat": 37.8044, "centerLon": -122.2712, "radiusKm": 10}', 1.00, 2, false, 'DAILY', 'BOTH', true, NOW()),
('sub-003', 'user-partner-002', 'Alameda County Facilities', 'JURISDICTION', '{"counties": ["Alameda"]}', 2.00, 3, true, 'WEEKLY', 'EMAIL', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Summary
SELECT
  (SELECT COUNT(*) FROM "User") as users,
  (SELECT COUNT(*) FROM "Facility") as facilities,
  (SELECT COUNT(*) FROM "Sample") as samples,
  (SELECT COUNT(*) FROM "ViolationEvent") as violations,
  (SELECT COUNT(*) FROM "Subscription") as subscriptions,
  (SELECT COUNT(*) FROM "ConfigPollutant") as pollutant_configs,
  (SELECT COUNT(*) FROM esmr_facilities) as esmr_facilities,
  (SELECT COUNT(*) FROM esmr_samples) as esmr_samples;
