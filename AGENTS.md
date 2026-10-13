<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Open source and privacy

- Jiddu's original code and documentation use the MIT License. Preserve
  `LICENSE` and the rights described in `THIRD_PARTY_NOTICES.md`.
- Follow `CONTRIBUTING.md` and `SECURITY.md`. Use synthetic fixtures and
  placeholder credentials in committed examples.
- Never commit production configuration, API keys, database dumps, user
  submissions, support records, or unredacted logs and screenshots.
- Run the secret scan before publishing new Git history. Keep reports
  outside the repository and report genuine findings privately.

## Production publishing — mandatory

- A plain `git push` updates GitHub but does **not** update the VPS.
- Whenever Rafael asks to “push”, “subir”, “publicar”, “colocar no ar” or
  “deploy”, commit the intended changes and run `npm run deploy`.
- `npm run deploy` pushes `main`, connects through the `jiddu-vps` SSH alias,
  runs `/opt/deploy-jiddu.sh`, verifies the VPS commit SHA and container state,
  and checks `https://jiddu.app/`.
- Do not report a production push as complete until that script finishes with
  a successful health check.

## Blog publishing — mandatory

- Every blog post slug must always be written in English, regardless of the
  language of the article being displayed.
- Every blog post must ship complete versions in English, Portuguese and
  Spanish, following the site's existing language selector.
- Localization covers the full editorial surface: index copy, title, SEO
  title, description, excerpt, body, reading time, FAQ, tags, CTAs, image alt
  text and captions. Do not publish a blog post with one of the three locales
  missing or partially translated.
