# TO-DOS

## Pending

### UI/UX Improvements
- [ ] Add back buttons on some pages (navigation improvement)

### Data Integration
- [ ] Research, plan, and strategize how to automate finding, ingesting, and integrating SMARTS/CIWQS data into the system
  - Refer back to the feasibility matrix
  - Consider automation workflows similar to eSMR cron sync

## Completed

### 2025-11-30
- [x] Validate weekly eSMR cron job works correctly
  - Fixed resource IDs for data.ca.gov CKAN API
  - Fixed field name mismatches in API response
  - Fixed region code parsing (R2 format)
  - Fixed NaN string value handling
- [x] Remove all mock data from codebase and database
  - Cleanup script: `npm run db:cleanup-mock`
  - Documentation: `MOCK_DATA_CLEANUP.md`
  - Test fixtures marked as TEST ONLY
- [x] Push all changes to GitHub (commit 1378f16)
