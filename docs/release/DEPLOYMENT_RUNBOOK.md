# Deployment and rollback runbook (staging first)

Do not execute against production without separate owner authorization. Do not put secrets in the repository, screenshots, terminal output or feedback forms.

## Pre-deployment

1. Confirm candidate branch and exact commit; clean tracked working tree. Review all changes and release gates.
2. Use an isolated staging database and explicit HTTPS staging origin, auth enabled, stable secret and provider credentials only in approved secret storage. Configure trusted database certificate chain via GAMEFINDER_DATABASE_CA_PEM if required. Never disable TLS verification. Keep Stripe and xAI keys absent for restricted beta; remote scan approval and local simulation off.
3. Run npm ci, npm run typecheck, npm test, npm run build and npm run check:release with the intended staging configuration. The preflight is configuration-only; it does not connect to the DB or certify security.
4. Back up staging and rehearse restoring into a separate disposable database. Run npm run db:migrate only against the approved staging database. Verify the migration ledger and schema; do not apply migrations via an unreviewed automatic deploy.
5. Run npm run test:postgres in Docker-enabled CI or a Codespace; it provisions an isolated PostgreSQL 16 container. Never point integration tests at production. Run authenticated browser and device acceptance. Confirm /api/health gives only {"ok":true}, no-store, and returns 503 when required persistence/schema is missing.
6. Deploy the exact reviewed candidate to a restricted staging URL. Verify auth, Vault, recommendations, scanner privacy, Finn source labels and disabled billing. Record artifact hash/commit, migration state and previous working deployment. Obtain explicit approval before widening access.

## Rollback

Stop further release traffic for critical issues; disable affected functionality using reviewed server-side controls. Restore the prior known-good application deployment only after confirming compatibility with the current schema. Additive migrations are not automatically reversed; never delete tables or restore a backup over live writes without a reviewed recovery plan. Restore into a separate database first, validate integrity, reconcile post-backup writes, then obtain approval for any cutover. Preserve incident evidence and event receipts; redact personal data. Retest affected workflows before reopening access.

This runbook is unexecuted against staging or production. No migrations or payment activation are authorized.
