# kreatormesh-cli

Draft and review social posts in [KreatorMesh](https://kreatormesh.com) from the terminal, for
agents and scripts that have no MCP client. It has no dependencies; it uses only Node's built-in
`fetch` and `fs`.

```bash
npx kreatormesh-cli setup --key km_live_...   # save and verify an API key
npx kreatormesh-cli accounts                  # connected accounts and their ids
npx kreatormesh-cli posts --status draft      # posts, newest first
npx kreatormesh-cli draft "caption" --accounts <id,id>
```

You need a KreatorMesh account on the Creator plan or above and an API key from
<https://kreatormesh.com/api-keys>. `KREATORMESH_API_KEY` is used in preference to the saved file,
which suits CI and agent sandboxes because it leaves nothing on disk. The saved key lives in
`~/.kreatormesh/config.json`, readable only by you where the OS supports it.

If your agent has an MCP client, connect it to `https://api.kreatormesh.com/api/mcp` instead: it
signs in with OAuth (no key to copy) and exposes more, including scheduling with media, checking a
draft against the hook rules learned from your own audience, and starting hook tests. See
[kreatormesh-agent-mode](https://github.com/orkuma-alex/kreatormesh-agent-mode).

MIT licence.
