#!/usr/bin/env node
/**
 * kreatormesh-cli — the same surface as the MCP tools, for agents and terminals
 * without an MCP client.
 *
 * Deliberately dependency-free: it uses only Node's built-in fetch and fs. A CLI
 * an agent is told to run with `npx` should not drag a tree of transitive
 * packages onto someone's machine, and every dependency here would be one more
 * thing between a user's API key and the network.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

const API = process.env.KREATORMESH_API ?? 'https://api.kreatormesh.com';
const CONFIG_DIR = join(homedir(), '.kreatormesh');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/* ------------------------------------------------------------------ key --- */

function readKey() {
  // Environment first: CI and agent sandboxes should not need a config file, and
  // an env var leaves nothing behind on disk.
  if (process.env.KREATORMESH_API_KEY) return process.env.KREATORMESH_API_KEY.trim();
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')).apiKey ?? null;
  } catch {
    return null;
  }
}

function saveKey(key) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify({ apiKey: key }, null, 2));
  // Owner-only. A credential sitting world-readable in a home directory is a
  // small mistake that stays made; best-effort because Windows ignores the mode.
  try {
    chmodSync(CONFIG_FILE, 0o600);
  } catch {
    /* not POSIX — the file is still inside the user's own home directory */
  }
}

/* ------------------------------------------------------------- requests --- */

async function request(path, init = {}) {
  const key = readKey();
  if (!key) {
    fail(
      'No API key configured.\n' +
        '  Run: npx kreatormesh-cli setup --key km_live_...\n' +
        '  Create one at https://kreatormesh.com/api-keys',
    );
  }

  const resp = await fetch(API + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
  });

  if (resp.status === 401) fail('That API key was rejected. It may have been revoked.');
  if (resp.status === 402) {
    fail('Your plan does not include API access. Creator or above is required.');
  }
  if (resp.status === 403) {
    fail('Refused. Key management needs a signed-in session, not an API key.');
  }

  const text = await resp.text();
  const json = text ? JSON.parse(text) : null;
  if (!resp.ok) fail(json?.message ?? `Request failed (${resp.status}).`);
  return json;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/* ------------------------------------------------------------- commands --- */

function flag(args, name) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

const commands = {
  async setup(args) {
    const key = flag(args, 'key');
    if (!key) fail('Usage: kreatormesh-cli setup --key km_live_...');
    if (!key.startsWith('km_live_')) {
      fail('That does not look like a KreatorMesh key — they start with "km_live_".');
    }
    saveKey(key);
    // Prove it works now rather than failing on the user's next command.
    const accounts = await request('/api/connections');
    console.log(`Saved. ${accounts.length} connected account(s).`);
  },

  async accounts() {
    const list = await request('/api/connections');
    if (list.length === 0) return console.log('No connected accounts.');
    for (const a of list) console.log(`${a.id}  ${a.platform.padEnd(16)} ${a.handle}`);
  },

  async posts(args) {
    const status = flag(args, 'status');
    const limit = Number(flag(args, 'limit') ?? 20);
    let list = await request('/api/posts');
    if (status) list = list.filter((p) => p.status?.toLowerCase() === status.toLowerCase());
    list = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    if (list.length === 0) return console.log(status ? `No ${status} posts.` : 'No posts.');
    for (const p of list) {
      const when = (p.scheduledAt ?? p.createdAt).slice(0, 16).replace('T', ' ');
      const where = p.targets.map((t) => t.platformId).join('+');
      console.log(`${p.status.padEnd(10)} ${when}  ${where.padEnd(28)} ${trim(p.caption, 48)}`);
    }
  },

  async draft(args) {
    const caption = args.find((a) => !a.startsWith('--'));
    const accounts = flag(args, 'accounts');
    if (!caption || !accounts) {
      fail('Usage: kreatormesh-cli draft "your caption" --accounts <id,id>');
    }
    const connected = await request('/api/connections');
    const targets = [];
    for (const id of accounts.split(',').map((s) => s.trim())) {
      const match = connected.find((c) => c.id === id);
      if (!match) fail(`No connected account with id '${id}'. Run: kreatormesh-cli accounts`);
      targets.push({ accountId: match.id, platformId: match.platform });
    }
    const post = await request('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ targets, caption, scheduleMode: 'draft', media: [] }),
    });
    console.log(`Draft saved: ${post.id}`);
  },
};

function trim(s, n) {
  const one = (s ?? '').replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n - 1) + '…' : one;
}

/* ---------------------------------------------------------------- entry --- */

const [, , command, ...args] = process.argv;

if (!command || command === 'help' || command === '--help') {
  console.log(`kreatormesh-cli — post to ten social platforms from the terminal

  setup --key km_live_...              save and verify an API key
  accounts                             list connected accounts and their ids
  posts [--status draft] [--limit 20]  list posts, newest first
  draft "caption" --accounts <id,id>   save a draft

Create a key at https://kreatormesh.com/api-keys
KREATORMESH_API_KEY is used if set, in preference to the saved file.`);
  process.exit(0);
}

const handler = commands[command];
if (!handler) fail(`Unknown command '${command}'. Run kreatormesh-cli help.`);

handler(args).catch((e) => fail(e?.message ?? String(e)));
