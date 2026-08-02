# jiddu-mcp

MCP server for [Jiddu](https://jiddu.app) — read anything with a critical mind. Seven tools for agents:

- **`detect_fallacies`** — find logical fallacies in a text.
- **`fact_check`** — extract factual claims and verify each against live web search.
- **`assess_neutrality`** — score bias and surface loaded language, one-sidedness, omission, and framing.
- **`explain`** — explain a dense paper paragraph by paragraph at a chosen audience level.
- **`detect_slop`** — flag templated, machine-assembled writing patterns without guessing authorship.
- **`start_adversarial_review`** — start a persisted review of a complete PDF at a public URL.
- **`get_adversarial_review`** — poll that review job and retrieve the final result.

It's a thin wrapper over the Jiddu public REST API. You need an API key assigned to your verified Jiddu/WorkOS account — ask for one at [jiddu.app/api-access](https://jiddu.app/api-access). Calls use that account's included access or Jiddu credit balance.

> **Most users don't need this package.** The recommended path is the hosted
> server at `https://jiddu.app/api/mcp`: compatible clients discover WorkOS
> OAuth automatically. Allowlisted accounts use Jiddu platform access;
> everyone else spends Jiddu Credits from the signed-in account. This
> package is only a local stdio wrapper around the separately
> authenticated REST API and is intentionally not published to npm.

## Install (local, from source)

Build it (see [Develop](#develop)), then point your MCP client at the built file. For Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "jiddu": {
      "command": "node",
      "args": ["/absolute/path/to/packages/jiddu-mcp/dist/index.js"],
      "env": {
        "JIDDU_API_KEY": "your-key-here"
      }
    }
  }
}
```

The API key is read from the environment and never passed as a tool argument, so it stays out of the model's context.

### Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `JIDDU_API_KEY` | yes | — | Your Jiddu API key (sent as the `X-Jiddu-Key` header). |
| `JIDDU_API_URL` | no | `https://jiddu.app` | Override the API base URL (e.g. for local development). |

## Tools

The five text tools take `text` (40–2000 characters; up to 10000 for
`fact_check`) and optional `lang` (`en` / `pt` / `es`). `explain` also accepts `level`.
`start_adversarial_review` takes a public `pdf_url`, optional venue
metadata, and `depth` (`standard` or `deep`) and returns an asynchronous job id; pass that id to
`get_adversarial_review` until it completes. Each tool returns the JSON
response from the corresponding `/api/v1/*` endpoint.

See [AGENT.md](./AGENT.md) for machine-oriented docs: when to use each tool, response shapes, limits, examples, and how to chain them.

## Develop

```bash
cd packages/jiddu-mcp
npm install
npm run build          # bundles to dist/index.js via tsup
JIDDU_API_KEY=... JIDDU_API_URL=http://localhost:3000 node dist/index.js
```

Test interactively with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Proprietary software

Copyright © 2026 Rafael M. Ehlers. All rights reserved. This package is private and is not published to npm.
