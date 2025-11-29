-- Seed Data for Stormwater Watch
-- Run this in Supabase SQL Editor

-- 1. Create Users
INSERT INTO "User" (id, email, name, role, "createdAt") VALUES
('user-admin-001', 'admin@stormwaterwatch.org', 'Admin User', 'ADMIN', NOW()),
('user-partner-001', 'partner1@example.org', 'Environmental NGO Partner 1', 'PARTNER', NOW()),
('user-partner-002', 'partner2@example.org', 'Environmental NGO Partner 2', 'PARTNER', NOW());

-- 2. Create Pollutant Config
INSERT INTO "ConfigPollutant" (key, aliases, "canonicalUnit", notes) VALUES
('COPPER', ARRAY['Copper', 'CU', 'Total Copper', 'Cu'], 'µg/L', 'Metals - store as µg/L'),
('ZINC', ARRAY['Zinc', 'ZN', 'Total Zinc', 'Zn'], 'µg/L', 'Metals - store as µg/L'),
('TSS', ARRAY['Total Suspended Solids', 'TSS', 'Suspended Solids'], 'mg/L', 'Total suspended solids'),
('O&G', ARRAY['Oil and Grease', 'O&G', 'Oil & Grease', 'O/G'], 'mg/L', 'Oil and grease'),
('PH', ARRAY['pH', 'PH VALUE', 'pH Value'], 'pH', 'pH is range-based (6.0-9.0)'),
('TURBIDITY', ARRAY['Turbidity', 'TURB'], 'NTU', 'Turbidity in NTU');

-- 3. Create Facilities (10 facilities across Bay Area)
INSERT INTO "Facility" (id, name, "permitId", county, naics, lat, lon, "receivingWater", "watershedHuc12", ms4, "isInDAC", "createdAt", "lastSeenAt") VALUES
('fac-001', 'Oakland Industrial Park', 'WDID-001', 'Alameda', '324110', 37.8044, -122.2712, 'San Francisco Bay', '180500020401', 'Oakland', false, NOW(), NOW()),
('fac-002', 'Fremont Manufacturing', 'WDID-002', 'Alameda', '336211', 37.5483, -121.9886, 'San Francisco Bay', '180500020401', 'Fremont', true, NOW(), NOW()),
('fac-003', 'Hayward Processing Plant', 'WDID-003', 'Alameda', '311111', 37.6688, -122.0808, 'San Francisco Bay', '180500020401', 'Hayward', false, NOW(), NOW()),
('fac-004', 'Berkeley Chemical Works', 'WDID-004', 'Alameda', '325211', 37.8715, -122.2730, 'San Francisco Bay', '180500020401', 'Berkeley', true, NOW(), NOW()),
('fac-005', 'Alameda Shipyard', 'WDID-005', 'Alameda', '336611', 37.7652, -122.2416, 'San Francisco Bay', '180500020401', 'Alameda', false, NOW(), NOW()),
('fac-006', 'San Jose Tech Park', 'WDID-006', 'Santa Clara', '334413', 37.3382, -121.8863, 'San Francisco Bay', '180500020301', 'San Jose', false, NOW(), NOW()),
('fac-007', 'Sunnyvale Industrial', 'WDID-007', 'Santa Clara', '334220', 37.3688, -122.0363, 'San Francisco Bay', '180500020301', 'Sunnyvale', true, NOW(), NOW()),
('fac-008', 'Palo Alto Research Facility', 'WDID-008', 'Santa Clara', '541712', 37.4419, -122.1430, 'San Francisco Bay', '180500020301', 'Palo Alto', false, NOW(), NOW()),
('fac-009', 'Richmond Refinery', 'WDID-009', 'Contra Costa', '324110', 37.9358, -122.3477, 'San Francisco Bay', '180500020501', 'Richmond', true, NOW(), NOW()),
('fac-010', 'Concord Manufacturing', 'WDID-010', 'Contra Costa', '336399', 37.9780, -122.0311, 'San Francisco Bay', '180500020501', 'Concord', false, NOW(), NOW());

-- 4. Create Samples (multiple samples per facility with some exceedances)
-- Facility 1 - Oakland - Copper exceedances
INSERT INTO "Sample" (id, "facilityId", "sampleDate", pollutant, value, unit, benchmark, "benchmarkUnit", "exceedanceRatio", "reportingYear", source) VALUES
('sample-001', 'fac-001', '2024-10-15', 'COPPER', 28.5000, 'µg/L', 14.0000, 'µg/L', 2.04, '2024', 'CIWQS'),
('sample-002', 'fac-001', '2024-11-01', 'COPPER', 21.0000, 'µg/L', 14.0000, 'µg/L', 1.50, '2024', 'CIWQS'),
('sample-003', 'fac-001', '2024-11-15', 'COPPER', 35.0000, 'µg/L', 14.0000, 'µg/L', 2.50, '2024', 'CIWQS'),
('sample-004', 'fac-001', '2024-10-20', 'TSS', 150.0000, 'mg/L', 100.0000, 'mg/L', 1.50, '2024', 'CIWQS'),
('sample-005', 'fac-001', '2024-11-10', 'TSS', 85.0000, 'mg/L', 100.0000, 'mg/L', 0.85, '2024', 'CIWQS');

-- Facility 2 - Fremont - TSS exceedances
INSERT INTO "Sample" (id, "facilityId", "sampleDate", pollutant, value, unit, benchmark, "benchmarkUnit", "exceedanceRatio", "reportingYear", source) VALUES
('sample-006', 'fac-002', '2024-10-05', 'TSS', 180.0000, 'mg/L', 100.0000, 'mg/L', 1.80, '2024', 'CIWQS'),
('sample-007', 'fac-002', '2024-10-25', 'TSS', 220.0000, 'mg/L', 100.0000, 'mg/L', 2.20, '2024', 'CIWQS'),
('sample-008', 'fac-002', '2024-11-08', 'TSS', 165.0000, 'mg/L', 100.0000, 'mg/L', 1.65, '2024', 'CIWQS'),
('sample-009', 'fac-002', '2024-10-12', 'O&G', 22.0000, 'mg/L', 15.0000, 'mg/L', 1.47, '2024', 'CIWQS');

-- Facility 3 - Hayward - pH violations
INSERT INTO "Sample" (id, "facilityId", "sampleDate", pollutant, value, unit, benchmark, "benchmarkUnit", "exceedanceRatio", "reportingYear", source) VALUES
('sample-010', 'fac-003', '2024-09-20', 'PH', 5.2000, 'pH', 7.5000, 'pH', NULL, '2024', 'CIWQS'),
('sample-011', 'fac-003', '2024-10-18', 'PH', 9.8000, 'pH', 7.5000, 'pH', NULL, '2024', 'CIWQS'),
('sample-012', 'fac-003', '2024-11-05', 'COPPER', 18.0000, 'µg/L', 14.0000, 'µg/L', 1.29, '2024', 'CIWQS');

-- Facility 4 - Berkeley - Multiple pollutants
INSERT INTO "Sample" (id, "facilityId", "sampleDate", pollutant, value, unit, benchmark, "benchmarkUnit", "exceedanceRatio", "reportingYear", source) VALUES
('sample-013', 'fac-004', '2024-10-01', 'ZINC', 250.0000, 'µg/L', 120.0000, 'µg/L', 2.08, '2024', 'CIWQS'),
('sample-014', 'fac-004', '2024-10-22', 'ZINC', 180.0000, 'µg/L', 120.0000, 'µg/L', 1.50, '2024', 'CIWQS'),
('sample-015', 'fac-004', '2024-11-12', 'COPPER', 42.0000, 'µg/L', 14.0000, 'µg/L', 3.00, '2024', 'CIWQS');

-- Facility 6 - San Jose - Clean samples
INSERT INTO "Sample" (id, "facilityId", "sampleDate", pollutant, value, unit, benchmark, "benchmarkUnit", "exceedanceRatio", "reportingYear", source) VALUES
('sample-016', 'fac-006', '2024-10-10', 'TSS', 45.0000, 'mg/L', 100.0000, 'mg/L', 0.45, '2024', 'CIWQS'),
('sample-017', 'fac-006', '2024-11-01', 'COPPER', 8.0000, 'µg/L', 14.0000, 'µg/L', 0.57, '2024', 'CIWQS');

-- Facility 9 - Richmond Refinery - High severity
INSERT INTO "Sample" (id, "facilityId", "sampleDate", pollutant, value, unit, benchmark, "benchmarkUnit", "exceedanceRatio", "reportingYear", source) VALUES
('sample-018', 'fac-009', '2024-09-15', 'O&G', 45.0000, 'mg/L', 15.0000, 'mg/L', 3.00, '2024', 'CIWQS'),
('sample-019', 'fac-009', '2024-10-08', 'O&G', 38.0000, 'mg/L', 15.0000, 'mg/L', 2.53, '2024', 'CIWQS'),
('sample-020', 'fac-009', '2024-10-28', 'O&G', 52.0000, 'mg/L', 15.0000, 'mg/L', 3.47, '2024', 'CIWQS'),
('sample-021', 'fac-009', '2024-11-18', 'O&G', 29.0000, 'mg/L', 15.0000, 'mg/L', 1.93, '2024', 'CIWQS'),
('sample-022', 'fac-009', '2024-10-15', 'TSS', 280.0000, 'mg/L', 100.0000, 'mg/L', 2.80, '2024', 'CIWQS');

-- 5. Create Violation Events (aggregated from samples)
INSERT INTO "ViolationEvent" (id, "facilityId", pollutant, "firstDate", "lastDate", count, "maxRatio", "reportingYear", "impairedWater", dismissed, "createdAt") VALUES
('vio-001', 'fac-001', 'COPPER', '2024-10-15', '2024-11-15', 3, 2.50, '2024', false, false, NOW()),
('vio-002', 'fac-001', 'TSS', '2024-10-20', '2024-10-20', 1, 1.50, '2024', false, false, NOW()),
('vio-003', 'fac-002', 'TSS', '2024-10-05', '2024-11-08', 3, 2.20, '2024', true, false, NOW()),
('vio-004', 'fac-002', 'O&G', '2024-10-12', '2024-10-12', 1, 1.47, '2024', true, false, NOW()),
('vio-005', 'fac-003', 'PH', '2024-09-20', '2024-10-18', 2, 1.00, '2024', false, false, NOW()),
('vio-006', 'fac-003', 'COPPER', '2024-11-05', '2024-11-05', 1, 1.29, '2024', false, false, NOW()),
('vio-007', 'fac-004', 'ZINC', '2024-10-01', '2024-10-22', 2, 2.08, '2024', true, false, NOW()),
('vio-008', 'fac-004', 'COPPER', '2024-11-12', '2024-11-12', 1, 3.00, '2024', true, false, NOW()),
('vio-009', 'fac-009', 'O&G', '2024-09-15', '2024-11-18', 4, 3.47, '2024', true, false, NOW()),
('vio-010', 'fac-009', 'TSS', '2024-10-15', '2024-10-15', 1, 2.80, '2024', true, false, NOW());

-- 6. Create Subscriptions
INSERT INTO "Subscription" (id, "userId", name, mode, params, "minRatio", "repeatOffenderThreshold", "impairedOnly", schedule, delivery, active, "createdAt") VALUES
('sub-001', 'user-partner-001', 'San Francisco Bay Area Monitoring', 'POLYGON', '{"polygon": {"type": "Polygon", "coordinates": [[[-122.5, 37.7], [-122.3, 37.7], [-122.3, 37.9], [-122.5, 37.9], [-122.5, 37.7]]]}}', 1.50, 2, false, 'DAILY', 'EMAIL', true, NOW()),
('sub-002', 'user-partner-001', 'Oakland Area (10km radius)', 'BUFFER', '{"centerLat": 37.8044, "centerLon": -122.2712, "radiusKm": 10}', 1.00, 2, false, 'DAILY', 'BOTH', true, NOW()),
('sub-003', 'user-partner-002', 'Alameda County Facilities', 'JURISDICTION', '{"counties": ["Alameda"]}', 2.00, 3, true, 'WEEKLY', 'EMAIL', true, NOW());

-- Done!
SELECT
  (SELECT COUNT(*) FROM "User") as users,
  (SELECT COUNT(*) FROM "Facility") as facilities,
  (SELECT COUNT(*) FROM "Sample") as samples,
  (SELECT COUNT(*) FROM "ViolationEvent") as violations,
  (SELECT COUNT(*) FROM "Subscription") as subscriptions,
  (SELECT COUNT(*) FROM "ConfigPollutant") as pollutant_configs;
