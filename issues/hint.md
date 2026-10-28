# Booking-v3 displays MM/DD to day-first tenants — 33 reports in #4471

## Scope and count

33 distinct reports in #4471 in the 2026-10-04 KB export classify as `hint`: channel `form`,
a day-first tenant locale, and booking-v3. Tenants are Copper Studio (`es-ES`), Alder Physio
(`de-DE`), and Pale Harbour (`pt-PT`). First received 2026-04-17; last received 2026-09-22.
Intake tagged 18 as hint and 15 as parser, so intakeTag is not a reliable classifier.

Deduplicate by report ID before counting, filter #4471, join the tenant directory, and run
`causeOf`. The full export is 427 rows / 412 unique reports. The other 379 classify as the
separate shared-parser issue. Counts describe the export, not the live support queue.

## Reproduction

1. Open Copper Studio's booking-v3 form with tenant locale `es-ES`.
2. The date hint displays `MM/DD/YYYY`.
3. Follow that hint to enter 6 January 2026 as `01/06/2026`.
4. The form interprets the input day first and produces 1 June, consistent with R-41230.

Expected: the displayed hint and the form's interpretation agree with the tenant's date order.
Actual: the hint requests month first while the form reads day first, reversing month and day.

## Separate fix and verification

Generate the hint from the same date-order setting the form actually uses. Test the hint,
entered value, submitted date, and resulting invite together for all three tenant locales.
Test booking-v2 and month-first tenants as controls. Check non-form channels separately:
booking-v3 app/email reports classify as `parser`, not this issue.

Correcting only the shared parser will leave this form instruction mismatch unresolved.

## Sources

- `src/lib/kb/causes.ts`: `DATE_HINT`, `dayFirst`, `causeOf`
- `src/lib/data/tenants/copper.studio.json`, `alder.physio.json`, `pale.harbour.json`
- `src/lib/data/reports-4471.json`, report R-41230
- [KB review](https://github.com/remnov/mega-s01e03-support-kb/blob/main/src/routes/kb/decisions/0002-split-4471-by-cause/+page.svx)
