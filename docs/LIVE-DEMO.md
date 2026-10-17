# Live testing and two-device demonstration

Use https://medilink-wheat-two.vercel.app on both devices. The deployed app does
not require the devices to share a Wi-Fi network. A mobile browser and a
separate private desktop window can also be used.

Sign in as the patient on the phone and as the doctor through **Clinical Team**
on the laptop. Use privately supplied credentials. Account switching through
an unauthenticated profile selector is not supported.

## Safe preparation

For a fresh rehearsal, create a separate synthetic patient account. Do not reset
the shared production database. The doctor must first submit a new request for
this patient's code; old hard-coded grants are not reusable consent requests.
Use only fictional examples when rehearsing.

## Six-step workflow

1. **Import sources.** On `/patient/import`, load **Hospital A: Discharge Record**
   and click **Ingest & Run Discrepancy Check**. Repeat with **Clinic B: Negative
   Challenge**. Loading a sample only fills the form; it does not import it.
   Confirm both source documents in `/patient/history`, then inspect provenance
   to see their SHA-256 fingerprints. Identical imports return a duplicate error.
   The input accepts clinical text; it is not a PDF OCR uploader.
2. **Review the discrepancy.** Open `/patient/conflicts` and inspect the two
   original source statements. Optionally enter a statement and click **Affirm
   for Clinician**. The statement is entered by the patient, not pre-filled.
3. **Request and approve.** The doctor opens `/clinic/access-requests`, enters
   the patient's code and purpose, and selects categories. The patient opens
   `/patient/consents`, chooses **Pending Grants**, and clicks **Review & Approve**.
   Leave only **Allergies** checked. Choose **15 Minutes** for the full rehearsal
   or **2 Minutes** to demonstrate expiry. Click **Sign & Grant Access**.
   The generated QR and copyable link contain this specific grant's URL.
4. **Open the doctor's handoff.** Decode the QR with a camera/scanner or copy
   the link into the signed-in doctor window. Built-in camera scanning is not
   provided by the app. Conditions must show **Not available (Excluded from
   grant)**. Check the API response as well: unrelated baseline fields, medication
   facts, and lab documents must not be returned. Enter a clinical determination
   and supporting rationale, then click **Sign & Mark Reconciled**. Refresh and
   confirm the signed review remains. The application does not preselect a
   treatment recommendation.
5. **Verify the patient's history.** The patient's timeline includes the review.
   Open `/patient/access-history` and check `ACCESS_APPROVED`, `RECORD_ACCESSED`,
   and `CLINICAL_REVIEW_RECORDED`, including the actor and timestamp. New events
   provide an expandable **SHA-256 event fingerprint**. These fingerprints are
   not a digital signature or a cryptographically chained audit ledger.
6. **Revoke.** In the patient's active grants, click **Revoke Access Immediately**
   and **Confirm revocation**. Refresh the doctor's handoff: the API must return
   403 and the page must show **Clinical Access Terminated by Patient**.
   Confirm an `ACCESS_DENIED` event with outcome `DENIED` in the patient's audit.

## Expiry check

Create another request and approve it for **2 Minutes**. Open the handoff while
active. After the exact expiry timestamp, refresh: the API must return 403 and
the page must show **Clinical Access Has Expired**. A revoked request cannot be
approved again; create a new request for another rehearsal.

## Automated browser verification

Install the development dependencies and Chromium:

```bash
npm ci
npx playwright install chromium
```

With a private environment file containing `SUPABASE_DATABASE_URL` and
`CLINICIAN_PASSWORD`, run:

```bash
node --env-file=.env.supabase.local scripts/verify-live-demo.mjs https://medilink-wheat-two.vercel.app
```

This is an explicitly invoked integration test: it creates a synthetic patient
and test records, runs separate 390x844 and 1440x1000 browser contexts, decodes
the actual rendered QR, completes the six steps, verifies hashes and API scoping,
and waits through a real two-minute expiry. It saves screenshots and results
under `.artifacts/live-demo/`, which is excluded from Git. It removes only the
synthetic patient and records created by that invocation; audit events remain.
Physical phone-camera behavior and Safari require a separate device check.
