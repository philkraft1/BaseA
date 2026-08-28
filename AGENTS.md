<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Base MCP

IDE Cursor loads [`.cursor/mcp.json`](.cursor/mcp.json) (`https://mcp.base.org` and the Coinbase CDP docs MCP). Cloud Agents do **not**. Enable Base MCP from the [Cloud Agents MCP dropdown](https://cursor.com/agents) as an HTTP server at `https://mcp.base.org`, then complete Base Account OAuth.

When Base MCP tools are callable, follow [`.agents/skills/base-mcp/SKILL.md`](.agents/skills/base-mcp/SKILL.md): run onboarding (including the Terms disclaimer), use [tone](.agents/skills/base-mcp/references/tone.md) and [approval mode](.agents/skills/base-mcp/references/approval-mode.md), and do not fetch or display wallet address or balances unless the user asks or a write needs the address.

If no Base MCP tool is callable, send the user to [https://docs.base.org/ai-agents/quickstart](https://docs.base.org/ai-agents/quickstart) and the Cloud Agents MCP dropdown. Do not invent a wallet integration.

Do not set `mcpServerAllowlist` in [`.cursor/environment.json`](.cursor/environment.json) to only Base MCP — that would block other user/team MCP servers. Omit it so this environment inherits upstream MCP policy.

### App

`npm run dev` serves on port `3000` (see `.cursor/environment.json` `terminals`). Live demo: https://basea-tau.vercel.app. Do not click **Sign in with Base** in automated demos unless the user asks.
