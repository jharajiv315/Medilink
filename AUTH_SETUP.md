# MediLink account setup

Patient accounts can be created from the Patient Sign Up tab on the sign-in page. New accounts receive an empty patient record; existing seeded medical records remain attached only to the seeded demo patient.

Clinician accounts cannot self-register. For administrator-managed provisioning, set `ADMIN_PASSWORD` in the local, ignored `.env` file, restart the server, and sign in as `compliance@medilink.health` using the Clinical Team tab. Open Doctor Accounts to provision a doctor with their name, work email, organization, and initial password. The new doctor can then sign in from the Clinical Team tab with those credentials. Share the initial password with the doctor through an approved secure channel; MediLink does not email it.

For the seeded clinician (`m.vance@sutterhealth.org`), you can alternatively set `CLINICIAN_PASSWORD` in `.env`. Use a unique password with at least 12 characters. The server stores a salted scrypt hash in the existing JSON store, not the password. Changing this environment password replaces the hash and ends that clinician's sessions.

For a temporary Vercel presentation only, set `DEMO_CLINICIAN_PASSWORD` and a random `DEMO_CLINICIAN_SESSION_SECRET` as encrypted Production environment variables. This enables a 2-hour stateless session for the seeded clinician without relying on writable function storage. The account is for the bundled fictional demo data only; do not use it with real patient information. Rotate or remove both variables after the presentation.

Optional seeded accounts can be enabled with `DEMO_PATIENT_PASSWORD` for `ananya.sharma@example.com`. Keep populated `.env` files and the JSON store private.

The authentication collections are additive and optional when loading older JSON stores. No existing patient, clinical, grant, or audit records need to be migrated. The sign-in session is held in an HttpOnly, SameSite cookie and expires after 12 hours.
