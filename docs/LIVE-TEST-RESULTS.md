# Live demonstration verification

Deployment: https://medilink-wheat-two.vercel.app/

Completed: **17 October 2026, 10:16 IST** (`2026-10-17T04:46:02.686Z`).

Application revision tested: `34c7539`.

## Results

| Guide workflow | Observed result |
| --- | --- |
| Patient and doctor sign-in | Passed with separate authenticated browser contexts. Wrong passwords and patient access to the doctor API were rejected. |
| Hospital A and Clinic B imports | Passed through the UI. Both documents and extracted statements appeared in the timeline with source SHA-256 fingerprints. The original text hash was recomputed successfully; duplicate import returned 409. |
| Discrepancy detection | Passed. Contradictory source statements were displayed and a patient-entered affirmation persisted. |
| Allergies-only consent | Passed through the mobile UI. Other requested categories were unchecked before approval. |
| Dynamic QR | Passed. The actual rendered QR image was decoded and matched the newly generated handoff URL exactly. QR generation uses local browser code. |
| Doctor scope enforcement | Passed in both UI and API. The baseline lock appeared; unrelated baseline fields were absent from the response, and returned facts/documents were allergy-scoped. |
| Reconciliation | Passed with clinician-entered determination and rationale. The review survived a browser refresh and appeared in the patient's timeline. |
| Audit evidence | Passed. Approval, record access, and review events included timestamps and SHA-256 fingerprints. Fingerprints were recomputed from canonical event fields after storage in Postgres. |
| Immediate revocation | Passed through the UI. Doctor refresh showed the dedicated revoked-access page, the API returned 403, and `ACCESS_DENIED` with outcome `DENIED` was recorded. |
| Actual two-minute expiry | Passed without editing the expiry timestamp or mocking the clock. The handoff worked before expiry, then returned 403 and displayed the dedicated expired-access page. |
| Responsive checks | Passed horizontal-overflow assertions for the captured workflow states at 390x844 and 1440x1000. |
| Runtime errors | No uncaught browser page errors were recorded during the run. |
| Automated checks | TypeScript checks, production build, and all 15 unit/API/storage tests passed. |

## Implemented corrections

- Restored the dedicated 403 UI for revoked, expired, and otherwise denied grants.
- Removed baseline fields outside the clinical grant from handoff responses and
  limited dashboard patient summaries to identifying metadata.
- Removed invented baseline diagnoses from the handoff UI.
- Replaced canned extraction doses and evidence quotes with actual source statements.
- Added source document fingerprints to corresponding timeline facts.
- Added canonical SHA-256 fingerprints to new audit events and exposed them in
  the audit UI. Historical events remain unchanged; this is not a hash chain.
- Added locally generated, decodable QR codes without the external QR service.
- Enabled explicitly selected fictional import samples for fresh test accounts.
- Isolated patient statement drafts per discrepancy and prevented an affirmation
  from overwriting a clinician-reconciled status.
- Hardened expiry handling at the exact timestamp and for invalid timestamps.
- Updated mobile import layout and replaced unsupported encryption claims.

## Data handling and evidence

Testing created a separate synthetic patient and test clinical records. Cleanup
removed only the fixtures created for these checks and retained their audit
events. Checks against the migration backup confirmed that original users were
preserved and original source documents were unchanged. No shared database reset
was performed.

The reproducible command and current manual procedure are in
[LIVE-DEMO.md](LIVE-DEMO.md). Screenshots and the machine-readable run result are
saved locally in `.artifacts/live-demo/` and excluded from Git.

## Verification boundaries

The two devices were represented by separate Chromium browser contexts, one
with a mobile viewport and one desktop viewport. This does not verify a physical
phone camera, hardware camera permissions, mobile Safari, or every browser/OS.
The QR's content was decoded programmatically; a physical camera scan remains a
manual device check. No claim of universal browser compatibility or zero future
defects is made.

The older guide's unauthenticated persona switch, globally available reset,
hard-coded grant URL, and pre-filled treatment recommendation were intentionally
not restored. Use separate sign-ins, fresh requests, and clinician-entered notes
as documented in the updated guide.
