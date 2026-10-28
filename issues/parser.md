# Shared parser reads day-first tenant dates as MM/DD — 379 reports in #4471

Source ticket: #4471
Cause: parser
Reports: 379

## Scope and count

379 distinct reports in ticket #4471 in the 2026-10-04 KB export classify as `parser`.
Count after `uniqueById`, then filter `mergedInto === 4471`, look up each tenant, and run
`causeOf`. There are 412 unique reports overall (427 raw rows, 15 repeated IDs); the other
33 belong to the separate booking-v3 hint issue. This is an export snapshot, not a live count.

The parser group spans 11 tenants, first received 2026-04-01 and last received 2026-10-04.
Intake tagged 356 as parser and 23 as hint. Classifying by intakeTag would give the wrong count.

## Reproduction

1. Use Harbour Dental, tenant `harbour.dental`, locale `en-GB`, booking-v2.
2. Submit 7 April 2026 through the shared parser as `07/04/2026`.
3. Observe an invite for 4 July, as reported in R-41200.

Expected: the date remains 7 April using the tenant's declared day-first order.
Actual: the shared parser treats the first part as a month and reverses the date.

The exported classifier assigns day-first tenant app/email reports and booking-v2 form reports
to this path. A booking-v3 tenant's app/email report also belongs here; form version alone is
not enough to pick the cause.

## Separate fix and verification

Respect tenant date order in the shared parser. Cover app, email, booking-v2 form, and
non-form booking-v3 paths. Include ambiguous dates such as 07/04 and an unambiguous day above 12.
Keep month-first tenants working. Verify the invite date rather than only the input string.
The booking-v3 hint mismatch is a separate issue and needs its own fix.

## Unresolved evidence

The exported rule counts five unusual reports here: R-41202, R-41209, R-41236, R-41344, R-41620.
Their bodies describe one-day shifts, pre-booking arrival, or a timezone-dependent day. They do
not establish the parser as their root cause. Investigate original timestamps and timezones;
retain their IDs and count provenance. Do not close them merely because the parser is fixed.

## Sources

- `src/lib/kb/causes.ts`: `causeOf`, `uniqueById`, `groupByCause`
- `src/lib/kb/locales.ts` and `src/lib/data/tenants/*.json`
- `src/lib/data/reports-4471.json`, `src/lib/data/desk-notes.json`
- [KB review](https://github.com/remnov/mega-s01e03-support-kb/blob/main/src/routes/kb/decisions/0002-split-4471-by-cause/+page.svx)
