---
name: kreatormesh
description: Draft, check and schedule social posts through KreatorMesh across TikTok, Instagram, YouTube, X, LinkedIn and more. Use when asked to write, check, schedule or review social content, to see what is already drafted or scheduled, or to find out how recent posts performed. Requires a KreatorMesh API key.
---

# KreatorMesh

KreatorMesh publishes to ten social platforms and — the part that matters here — knows what has
actually worked on this specific account. Treat it as the place to ask *what should I post and did
it work*, not only as a way to push text outward.

## Setup

The user needs a KreatorMesh account on the Creator plan or above, and an API key created at
<https://kreatormesh.com/api-keys>. Keys look like `km_live_…` and are shown once.

**MCP (preferred).** Point the client at:

```
https://api.kreatormesh.com/api/mcp
```

with the key as a bearer token. The tools below then appear directly.

**CLI (no MCP client).**

```bash
npx kreatormesh-cli setup --key km_live_...
npx kreatormesh-cli accounts
```

If the user has no key, send them to <https://kreatormesh.com/api-keys> rather than guessing one.
An API key cannot create or revoke other keys — that needs a signed-in session, by design.

## The workflow that matters

Do these in order. The ordering is the point: checking a draft *before* scheduling is what
separates this from any cross-posting tool.

1. **`list_connections`** — get the account ids. Everything else refers to accounts by these ids,
   and they are not guessable.
2. **`list_hook_rules`** — what has been learned about this audience from completed hook tests.
   Read these *before* writing, not after.
3. Write the caption yourself, using those rules and the user's own voice.
4. **`check_draft`** — pass the caption and the target account id. It returns which learned rules
   the draft follows and which it breaks, with the measured effect of each.
5. Revise if it breaks a rule with a large measured effect. Breaking one deliberately is fine —
   say so, and say why.
6. **`schedule_text_post`** — omit the timestamp to save a draft for review, or pass an ISO-8601
   UTC time to schedule it.
7. **`list_posts`** — confirm it saved, and check nothing similar is already queued.

## Tools

| Tool | Use it for |
|---|---|
| `list_connections` | account ids, handles and platforms. Call first. |
| `list_hook_rules` | rules learned from this account's completed hook tests |
| `check_draft` | check a caption against those rules before publishing |
| `list_posts` | drafts, scheduled, posted and failed. Filter with `status`. |
| `get_performance` | cross-platform results for recent posts |
| `list_evergreen` | posts that already performed and are being recycled |
| `schedule_text_post` | save a draft or schedule a text post |

## Things that will otherwise surprise you

**An empty ruleset is normal, not an error.** `list_hook_rules` and `check_draft` return nothing
until at least one hook test has run to completion in the app. If they come back empty, say so
plainly — "there are no learned rules for this account yet, so I cannot check the draft against
anything" — rather than implying the draft was verified. Suggest running a test at
<https://kreatormesh.com/hook-testing>. The `hook-testing-method` skill in this same package
explains the method and needs no account.

**Text posts only through these tools.** Anything with video or an image needs the REST API and a
real upload; `schedule_text_post` will not carry media. Do not offer to schedule a video here.

**Omitting the publish time saves a draft.** That is the safer default when the user has not said
when to post. Do not invent a publish time to fill the field.

**Failures come back as readable results, not exceptions.** An unknown account id returns
`{"ok": false, "error": "No connected account with id '…'. Call list_connections for the valid
ids."}`. Read the error and correct the call rather than retrying it unchanged.

**A key acts as its owner.** Anything the tools can do, the person whose key it is could do. Confirm
before scheduling anything to a live account, the same as you would before any other outward-facing
action.

## Writing captions well

Platforms differ more than they look. The same idea needs different wording, not the same wording
truncated:

- **X** — 280 characters. Write to it; do not trim a longer caption and hope.
- **LinkedIn** — 3,000 characters, and a completely different register. A TikTok caption pasted here
  reads badly.
- **TikTok / Instagram** — 2,200 characters, but the first line is doing nearly all the work.
- **Bluesky** — 300 characters. **Threads** — 500.

Hashtag counts differ too: two or three on X and YouTube, up to about eight on Instagram, five or
fewer on TikTok. More than that reads as spam on every one of them.
