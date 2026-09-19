# Publishing to the MCP Registry

`server.json` in this repo is the listing for the official MCP Registry
(https://registry.modelcontextprotocol.io). It validates as of 2026-09-19:

    curl -s -X POST https://registry.modelcontextprotocol.io/v0/validate \
      -H "Content-Type: application/json" --data-binary @server.json
    # {"valid":true,"issues":[]}

The name `com.kreatormesh/kreatormesh` is a domain namespace, so publishing needs
proof that we control `kreatormesh.com`. That proof is a DNS TXT record holding a
public key; the matching private key signs the login. Keep the private key
outside this repo (it is in `.gitignore` as `key.pem`).

## One-time setup

1. Install the publisher CLI (Windows: download the `windows_amd64` archive from
   https://github.com/modelcontextprotocol/registry/releases/latest and put
   `mcp-publisher.exe` on PATH; macOS/Linux: `brew install mcp-publisher`).

2. Generate a key pair and print the TXT record. Run from this directory:

       openssl genpkey -algorithm Ed25519 -out key.pem
       PUBLIC_KEY="$(openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)"
       echo "kreatormesh.com. IN TXT \"v=MCPv1; k=ed25519; p=${PUBLIC_KEY}\""

3. Add that TXT record in Cloudflare DNS for `kreatormesh.com`:
   Type `TXT`, Name `@`, Content `v=MCPv1; k=ed25519; p=<the value printed>`.
   Wait a few minutes, then confirm it resolves:

       nslookup -type=TXT kreatormesh.com

4. Log in with the private key:

       PRIVATE_KEY="$(openssl pkey -in key.pem -noout -text | grep -A3 'priv:' | tail -n +2 | tr -d ' :\n')"
       mcp-publisher login dns --domain kreatormesh.com --private-key "${PRIVATE_KEY}"

## Publish (and every later version)

    mcp-publisher publish

Then check the listing:

    curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=kreatormesh"

To publish an update, bump `version` in `server.json` (the registry refuses a
version that already exists) and run `mcp-publisher publish` again. The login
token lasts a while; if `publish` says unauthenticated, repeat step 4.

## What the listing says

- Remote only: there is no npm package to install, the server is hosted at
  `https://api.kreatormesh.com/api/mcp`.
- Auth is an `Authorization: Bearer km_live_...` header, declared in `remotes[0].headers`
  so clients that read the registry know to ask for it.
- Aggregators (Glama, PulseMCP, mcp.so and others) ingest the official registry,
  so this one listing is what most of them see.
