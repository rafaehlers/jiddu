# Contributing to Jiddu

Jiddu is released under the [MIT License](./LICENSE). Contributions to its
reading interface, analysis lenses, prompts, agent integrations, accessibility,
translations, and evaluations are welcome.

## Getting started

Follow [Local development in the README](./README.md#local-development).
Use your own local database and service accounts. Curated demos let you
inspect the interface without calling a model.

Read [AGENTS.md](./AGENTS.md) before changing code. This repository includes
Next.js documentation under `node_modules/next/dist/docs/`; consult the
relevant guide for the installed version.

## Changes and pull requests

- Describe the problem, resulting behavior, and checks you ran.
- Keep changes focused. Explain changes to analysis criteria and provide
  an example the reviewer can inspect.
- Keep user-facing content consistent in English, Portuguese, and Spanish.
  Blog slugs are always English and posts need complete versions in all three languages.
- Use English commit messages. A local `codex/` branch is appropriate for
  work done with a coding agent.
- AI-assisted work is welcome. Review generated code and sources yourself;
  do not submit unverified claims or third-party material without permission.
- Include synthetic examples in reports and tests. Use `example.com` or
  `example.test` identities instead of real accounts, documents, or transcripts.

By submitting a contribution, you confirm that you have the right to submit
it under Jiddu's MIT License. Preserve third-party copyright and license notices.

## Validation

After installing dependencies and generating the Prisma client:

```bash
npm run lint
npm test
npm run build
npx tsc --noEmit
npm run build:extension
npm run build --prefix packages/jiddu-mcp
```

Install the MCP package dependencies separately with
`npm ci --prefix packages/jiddu-mcp` before building it. The root test command
also discovers the Chrome extension tests; `npm run test:extension` runs
those tests on their own.

The invitation integration test runs only when `RUN_INVITATION_INTEGRATION=1`
is set and uses PostgreSQL. Read the test before enabling it and use a
dedicated, disposable database. Never point tests at the jiddu.app
production database. Model evaluations
and `smoke:openrouter-postgres` can call paid providers and must be run
explicitly with your own credentials and disposable data.

Run the checks relevant to your change locally before submitting a pull
request or publishing changes. Scan the complete Git history locally with
Gitleaks 8.30.1 or later:

```bash
gitleaks git . --log-opts="--all --full-history" \
  --redact=100 --ignore-gitleaks-allow --max-decode-depth=2 --max-archive-depth=2
```

Keep scan reports outside the repository. Run the scanner again before
publishing any new history or release artifact.

## Credentials and vulnerabilities

Never commit `.env`, API keys, cookies, private keys, database dumps,
user submissions, support messages, or unredacted screenshots and logs.
Use `.env.example` for placeholders and environment-variable documentation.
If a secret is committed, revoke or rotate it and report it privately;
deleting the current file does not remove it from Git history.

Follow [SECURITY.md](./SECURITY.md) for vulnerability reports. The
`npm run deploy` command belongs to the jiddu.app maintainer workflow;
contributors validate with local builds and their own installations.
