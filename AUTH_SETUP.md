# MediLink account setup

Patient accounts can be created from the Patient Sign Up tab on the sign-in page. New accounts receive an empty patient record; existing seeded medical records remain attached only to the seeded demo patient.

Clinician accounts cannot self-register. To provision the seeded clinician (`m.vance@sutterhealth.org`), set `CLINICIAN_PASSWORD` in the local, ignored `.env` file and restart the server. Use a unique password with at least 12 characters. The server stores a salted scrypt hash in the existing JSON store, not the password. Changing this environment password replaces the hash and ends that clinician's sessions.

Optional seeded accounts can be enabled with `DEMO_PATIENT_PASSWORD` for `ananya.sharma@example.com` and `ADMIN_PASSWORD` for `compliance@medilink.health`. Keep populated `.env` files and the JSON store private.

The authentication collections are additive and optional when loading older JSON stores. No existing patient, clinical, grant, or audit records need to be migrated. The sign-in session is held in an HttpOnly, SameSite cookie and expires after 12 hours.
