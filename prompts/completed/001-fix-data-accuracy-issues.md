<objective>
Fix critical data accuracy issues identified by domain expert water resources engineer. These issues undermine professional credibility and must be corrected before the application can be trusted by environmental groups, consultants, and lawyers.

This is the highest priority task as accuracy is non-negotiable for professional use.
</objective>

<context>
A water resources engineer (Gavin Plume, EIT at EKI Environment & Water) provided expert feedback identifying several data accuracy problems:

**Critical Issues Identified:**
1. **Incorrect sample/activity counts**: Shows "1.2M+" samples which would require ~25,000 years of operation at 4 samples/month
2. **Stale violation status**: "Active Violation Events" showing violations that were resolved months ago
3. **Timezone issues**: Case packet function shows time received as 8 hours ahead
4. **Missing sample data**: Case packets showing blank sample data
5. **Violation date logic**: Every day counted as individual violation without clarification
6. **Repeat violation confusion**: Count shows "28 (Repeat)" but period dates suggest different interpretation needed

Read @prisma/schema.prisma to understand data model and relationships between:
- Facilities
- Samples/measurements
- Violations
- ViolationEvents
- Monitoring locations

Read relevant API routes and database queries that generate these statistics and violation statuses.
</context>

<research>
**Phase 1 - Understand Current Implementation:**
1. Examine violation detection logic - how are violations identified and marked as active/resolved?
2. Review sample counting queries - where does "1.2M+" come from?
3. Find timezone handling for timestamps - why 8 hours offset?
4. Trace violation event aggregation - how are repeat violations counted?
5. Investigate case packet generation - why is sample data missing?

**Phase 2 - Identify Root Causes:**
For each issue, determine:
- Where in the codebase the problem originates
- Whether it's a data issue, calculation issue, or display issue
- What the correct behavior should be based on stormwater monitoring domain logic

**Phase 3 - Document Findings:**
Create a detailed analysis showing:
- Current behavior (with code references)
- Why it's incorrect
- Proposed fix with rationale
</research>

<requirements>
You must thoroughly investigate and document (not fix yet) each data accuracy issue:

1. **Sample Count Accuracy**:
   - Find where "1.2M+" samples stat is calculated
   - Verify actual sample count in database
   - Explain discrepancy if count is wrong
   - Document correct calculation method

2. **Violation Status Accuracy**:
   - Identify logic for marking violations as "active" vs "resolved"
   - Find why resolved violations appear in "Active Violation Events"
   - Document criteria for active violations (ongoing exceedance? unresolved enforcement action?)
   - Propose clear status logic

3. **Timezone Correctness**:
   - Find all timestamp handling in case packet generation
   - Identify timezone conversion issues (UTC vs local time)
   - Document correct timezone handling approach

4. **Case Packet Sample Data**:
   - Trace why sample data is blank in generated packets
   - Check if data exists in DB but isn't queried correctly
   - Identify any data serialization or format issues

5. **Violation Count Clarification**:
   - Document how "each day is an individual violation" logic works
   - Explain what "28 (Repeat)" means vs actual violation period
   - Propose clearer violation counting and display

6. **Calculation Verification**:
   - Review all statistical calculations shown on landing page
   - Verify each metric against actual database queries
   - Flag any suspicious numbers that don't pass sanity check
</requirements>

<constraints>
- DO NOT fix anything yet - this is research and documentation only
- WHY: You need user approval on the fix strategy before changing data logic
- Use actual database queries to verify counts - don't trust displayed stats
- Include code file paths and line numbers in your documentation
- Be thorough - missing issues now means professional users won't trust the system
</constraints>

<output>
Create a detailed analysis document at: `./docs/data-accuracy-analysis.md`

Structure:
```markdown
# Data Accuracy Issues Analysis

## Executive Summary
[Brief overview of all issues found]

## Issue 1: [Issue Name]
- **Current Behavior**: [What happens now, with code references]
- **Why It's Wrong**: [Technical explanation]
- **Root Cause**: [File:line causing the issue]
- **Proposed Fix**: [High-level approach]
- **Verification**: [How to test the fix]

[Repeat for each issue]

## Database State Assessment
- Actual sample count: [X]
- Actual violation count: [Y]
- Active vs resolved violations: [breakdown]

## Priority Recommendations
1. [Highest priority fix]
2. [Second priority]
...
```
</output>

<verification>
Before completing, verify you have:
- [ ] Examined all 6 identified issues
- [ ] Included actual database query results
- [ ] Provided code file references for each issue
- [ ] Proposed concrete fixes for each problem
- [ ] Explained domain logic (what is correct behavior for stormwater monitoring)
- [ ] Created comprehensive documentation
</verification>

<success_criteria>
- Every issue from expert feedback is investigated and documented
- Root causes identified with file:line references
- Proposed fixes are technically sound and domain-appropriate
- Documentation is clear enough for non-technical stakeholders
- User can approve/reject fix approach before implementation
</success_criteria>
