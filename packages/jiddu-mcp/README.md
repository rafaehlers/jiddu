# jiddu-mcp

MCP server for [Jiddu](https://jiddu.app) — read any text with a critical mind. Four tools for agents:

- **`detect_fallacies`** — find logical fallacies in a text.
- **`fact_check`** — extract factual claims and verify each against live web search.
- **`assess_neutrality`** — score bias and surface loaded language, one-sidedness, omission, and framing.
- **`explain`** — explain a dense paper paragraph by paragraph at a chosen audience level.

It's a thin wrapper over the Jiddu public REST API. You need an API key — ask for one at [jiddu.app/api-access](https://jiddu.app/api-access).

> **Most users don't need this package.** The recommended way to use Jiddu over MCP is the **hosted remote server** — point any MCP client at `https://jiddu.app/api/mcp` via [`mcp-remote`](https://www.npmjs.com/package/mcp-remote), nothing to install. See [jiddu.app/api-access](https://jiddu.app/api-access). This package is for **local / offline use, run from source** (it is intentionally not published to npm).

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

All tools take `text` (40–2000 characters) and an optional `lang` (`en` / `pt` / `es`). `explain` also takes an optional `level` (`eli5` / `high_school` / `undergrad` / `expert`). Each returns the JSON response from the corresponding `/api/v1/*` endpoint.

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

## License

AGPL-3.0-or-later. Source: [github.com/rafaehlers/jiddu](https://github.com/rafaehlers/jiddu) (`packages/jiddu-mcp`).
