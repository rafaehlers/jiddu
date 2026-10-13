# Security policy

Security fixes are maintained on the default branch. Update to the current
version before checking whether a reported issue is still present.

## Report privately

Use GitHub's **Security → Report a vulnerability** when private reporting
is enabled on this repository. Otherwise, email
[support@emails.jiddu.app](mailto:support@emails.jiddu.app).
Do not include credentials, private documents, user records, or exploit
details in public issues or pull requests.

Include the affected version or commit, the relevant route or component,
the impact, and reproduction steps using synthetic data. Share sensitive
details only through the private report. You may report findings from
your own installation without probing or disrupting jiddu.app.

Relevant areas include account and result ownership, API/MCP authorization,
credit accounting, URL ingestion and SSRF, uploaded files, share links,
webhooks, and information exposed by model output or logs.

## Deployment credentials and data

- Configure secrets in an ignored `.env` or your deployment's secret store.
  Variables prefixed with `NEXT_PUBLIC_` are delivered to browsers.
- Use your own WorkOS, Stripe, OpenRouter, OpenAI, and Resend accounts.
- Keep the database on a private network and use HTTPS for public installations.
- Use synthetic fixtures and redact credentials and account information
  before sharing screenshots, reports, or logs.
- If a credential appears in a commit, revoke or rotate it immediately.
  Removing it from a working file does not remove previous copies.

The public source repository does not contain the production database,
service credentials, or private user submissions. Git history and public
release assets must be reviewed before changing repository visibility.
