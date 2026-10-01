# KreatorMesh Agent Mode

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![KreatorMesh MCP connector – tool definition quality and endpoint health on Glama](https://glama.ai/mcp/connectors/com.kreatormesh/kreatormesh/badges/score.svg)](https://glama.ai/mcp/connectors/com.kreatormesh/kreatormesh)

Give your AI agent the ability to draft, check and schedule social posts — and, more usefully, to
find out what has actually worked on your audience before it writes anything.

**Supports:** TikTok, Instagram, YouTube, X (Twitter), LinkedIn, Facebook, Threads, Pinterest,
Bluesky, Google Business Profile.

Built on [KreatorMesh](https://kreatormesh.com).

## Two skills, and one of them is free

| Skill | Needs an account? | What it does |
|---|---|---|
| [`hook-testing-method`](skills/hook-testing-method/SKILL.md) | **No** | How to work out which opening lines hold attention on *your* audience, instead of following generic hook advice. Method only — a spreadsheet is enough. |
| [`kreatormesh`](skills/kreatormesh/SKILL.md) | Yes | Draft, check against your learned rules, schedule, and review — through KreatorMesh. |

The first is free and standalone on purpose. Most hook advice is an average taken across audiences
that are not yours, and the fix is measurement rather than better advice. That skill explains how to
do it by hand. It is genuinely useful without paying anyone.

## Install

### As skills (Claude Code, Cursor, Windsurf, Codex and others)

```bash
npx skills add orkuma-alex/kreatormesh-agent-mode
```

Install just one:

```bash
npx skills add orkuma-alex/kreatormesh-agent-mode --skill hook-testing-method
```

### As an agent plugin

The repo root is a portable [Agent Plugin](https://agent-plugins.org) (spec 1.0.0): `plugin.json` +
`mcp.json` + `skills/`. Claude Code additionally reads `.claude-plugin/`. Both layouts sit side by
side, so the same repo works either way.

### CLI only

```bash
npx kreatormesh-cli setup --key km_live_...
npx kreatormesh-cli accounts
```

Node 18+. No dependencies.

## Connecting

You need a KreatorMesh account on the Creator plan or above and an API key from
<https://kreatormesh.com/api-keys>. Keys are shown once.

**MCP** — point your client at `https://api.kreatormesh.com/api/mcp` with the key as a bearer token,
or set `KREATORMESH_API_KEY` and use the bundled `mcp.json`.

**CLI** — `npx kreatormesh-cli setup --key km_live_...`, or set `KREATORMESH_API_KEY` in the
environment (preferred in CI and agent sandboxes, since it leaves nothing on disk).

## Tools

| Tool | Use it for |
|---|---|
| `list_connections` | account ids, handles and platforms. Call first. |
| `list_hook_rules` | rules learned from this account's completed hook tests |
| `check_draft` | check a caption against those rules before publishing |
| `schedule_post` | save a draft, or schedule a post, with or without media (public https URLs) |
| `list_posts` | drafts, scheduled, posted and failed. Filter with `status`, keep `limit` small. |
| `get_post` | one post by id: caption, media, schedule, status, and per-platform links once published |
| `cancel_post` | delete a post that has not gone out yet. Refuses published posts and hook-test posts. |
| `get_performance` | metrics for published posts: totals across all of them, plus the newest `limit` in detail |
| `list_evergreen` | posts that already performed and are being recycled |
| `create_hook_test` | start a hook test. Schedules real posts, so confirm first. |

The ordering is the point. `check_draft` between writing and scheduling is what makes this different
from a cross-poster: it tells you which of your *measured* rules a draft breaks, and by how much.

## Known limits, stated up front

- **Media is attached by URL.** `schedule_post` takes public https links to images or video, and the
  platform fetches them when the post publishes, so the link must still work then. Instagram, TikTok,
  YouTube and Pinterest need at least one; X, LinkedIn, Facebook, Threads, Bluesky and Google
  Business accept text alone.
- **`cancel_post` only stops posts that have not gone out.** A published post is already live on the
  platform; deleting KreatorMesh's record would not take it down, so the tool refuses and says so.
- **`check_draft` returns nothing until a hook test has completed** in the app. An empty result means
  "no rules learned yet", not "the draft is fine". The free `hook-testing-method` skill explains the
  method meanwhile.
- **Hook tests need a platform that reports views:** X, YouTube, Instagram, Facebook, Threads,
  Pinterest and TikTok. Bluesky and LinkedIn report likes and comments only, so tests are refused there.
- **API keys cannot manage API keys.** Listing, creating and revoking need a signed-in session, so a
  leaked key cannot mint more or revoke the one you are using to investigate it.
- **A key acts as its owner.** Anything these tools can do, that person could do.

## Security

Keys are stored hashed server-side — the plaintext is shown once and cannot be retrieved, so a lost
key is replaced rather than recovered. Revoke at <https://kreatormesh.com/api-keys>; revocation takes
effect on the next request.

The CLI saves a key to `~/.kreatormesh/config.json` with owner-only permissions where the platform
supports it. `KREATORMESH_API_KEY` takes precedence and writes nothing to disk.

## Registry listing

`server.json` is the official MCP Registry entry; see [PUBLISHING.md](PUBLISHING.md).

## Licence

MIT. See [LICENSE](LICENSE).
