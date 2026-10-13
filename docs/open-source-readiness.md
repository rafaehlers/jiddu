# Open source readiness review

Review date: October 13, 2026. Repository: `rafaehlers/jiddu`.
Baseline commit: `bc2be33f5d5a5799331f202ee910e5c22c5b55b5`.

The complete application was released under MIT on October 13, 2026.
The GitHub repository is public. The history review and validation below
describe the initial release preparation against the baseline above.

## History and privacy review

- Fetched remote branches and tags and checked both remote branches,
  `main` and `redesign-1`, together with all locally reachable refs.
- Examined 220 commit objects and 2,209 unique file blobs. The scan includes
  deleted files, previous file versions, commit messages, and author metadata.
- Ran Gitleaks 8.30.1 against all reachable Git history with full history,
  recursive decoding, archive inspection, and redacted output. The official
  binary's SHA-256 digest was verified before execution. No findings were reported.
- Compared credential values from ignored local configuration against
  reachable objects. No provider keys, passwords, signing secrets, or
  credential-bearing connection strings were identified in published files.
- Reviewed email, account-id, filesystem-path, and address candidates.
  Remaining maintainer attribution uses the same email already visible on
  the maintainer's public GitHub profile. Other candidates were synthetic
  tests, public service contacts, Git URLs, assistant coauthor attribution,
  browser version strings, or SVG coordinates.
- Reviewed 34 historical image versions, including listing screenshots
  and public-news demonstrations. Example API credentials shown in the
  onboarding mockup are masked. Embedded EXIF entries contain dimensions,
  orientation, and resolution; no GPS, artist, or device-serial tags were found.
- The only environment file found in tracked history is `.env.example`.
  No database files, private keys, account exports, user uploads, or
  production support records were identified. `scripts/backup-postgres.sh`
  is an operational script, not a database backup.

At the start of the review, GitHub had no issues/pull requests, release
assets, or Actions artifacts. All 53 historical Actions log downloads were
expired or unavailable. Their run metadata contains the expected public repository
and maintainer attribution; unavailable logs cannot be inspected.

Raw audit output and extracted historical images were kept outside the
repository. No history rewrite or credential rotation was necessary based
on the confirmed findings.

## License and documentation

- Added the MIT License and aligned application, MCP, Chrome extension,
  and npm lockfile metadata.
- Updated README setup and deployment instructions, MCP documentation,
  the OpenAPI license, and the hosted-service terms in all three locales.
- Added contribution and private vulnerability-reporting instructions.
- Preserved attribution and documented dependency and screenshot rights
  in `THIRD_PARTY_NOTICES.md`, including MPL/LGPL native dependencies.
- Added a standalone Compose override and included MIT/third-party notices
  in Docker and Chrome extension distributions.
- Documented local build, test, and all-history Gitleaks checks in
  `CONTRIBUTING.md`.
- Expanded Git and Docker exclusions for private keys, database files,
  dumps, uploads, benchmark downloads, and security reports.

## Validation

Validation used an isolated copy of the publishable files, Node.js 22.23.2,
npm 10.9.8, and an empty, disposable PostgreSQL 16 container. Ignored
production configuration was not copied, and no paid model calls were made.

- Clean `npm ci` and `npx prisma generate` passed.
- `npm run lint`, `npm run build`, and `npx tsc --noEmit` passed. Two
  pre-existing lint errors in the architecture map were resolved by moving
  selection updates from effects into the selection actions and trace timer.
- The default test run passed 306 cases and skipped the opt-in invitation
  integration test. That remaining case passed separately against the
  disposable PostgreSQL database: all 307 test cases were exercised.
- All 14 PostgreSQL migrations applied and the demo seed command completed.
- All 18 curated demo URLs rendered on the isolated production server.
  Source links, terms in English/Portuguese/Spanish, and OpenAPI MIT metadata
  were checked over HTTP.
- Chrome extension and local MCP builds passed. The extension ZIP includes
  the exact MIT license and third-party notices.
- Both Compose configurations parsed correctly. The standalone override
  creates a managed network and binds the application port to loopback;
  the maintainer base file retains its external proxy network.
- Gitleaks reported no findings in the prepared source snapshot. The final
  source and history scans and `git diff --check` completed without findings.

## Publication

The MIT changes are published on `main`, and GitHub recognizes the license.
The source/license links resolve publicly. The maintainer publishes with
`npm run deploy`, which verifies the deployed commit, container state,
and public health check.

GitHub Actions was removed on October 13, 2026 at the maintainer's request.
Validation and secret scans run locally before publication. Private
vulnerability reporting and secret-scanning push protection are recommended
where available.

This is a point-in-time review of reachable repository content and
available GitHub metadata. It does not certify future commits, external
services, or ignored production files. Repeat the history and artifact
scan if any new refs, files, screenshots, or release assets are added before
publication.
