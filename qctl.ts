#!/usr/bin/env node
// ─── qctl — Q Network Command Line Tool ──────────────────────────────────────
// اجرا: node qctl.js <command> [arg]
// مثال: node qctl.js planets | node qctl.js analyze | node qctl.js snapshot

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

function loadFile(filename: string): any {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

const cmd = process.argv[2] ?? 'help';
const arg = process.argv[3];

const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW= '\x1b[33m';
const RED   = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

function header(title: string) {
  console.log(`\n${BOLD}${CYAN}══════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${GREEN}  Q NETWORK — ${title}${RESET}`);
  console.log(`${CYAN}══════════════════════════════════════${RESET}\n`);
}

switch (cmd) {
  case 'planets':
  case 'civs': {
    const civs = loadFile('civilizations.json') ?? [];
    header('PLANET REGISTRY');
    if (civs.length === 0) {
      console.log(`${YELLOW}هیچ سیاره‌ای ثبت نشده${RESET}`);
    } else {
      civs.forEach((c: any, i: number) => {
        console.log(`${BOLD}${i + 1}. ${c.id}${RESET}`);
        console.log(`   Q Tokens: ${GREEN}${c.qTokens}${RESET}  Tick: ${c.tick}  Agents: ${c.agents?.length ?? 0}`);
        console.log(`   Last event: ${c.log?.at(-1) ?? '—'}`);
      });
    }
    break;
  }

  case 'tokens': {
    const balances = loadFile('token_ledger.json') ?? {};
    header('Q TOKEN LEDGER');
    const entries = Object.entries(balances).sort(([, a], [, b]) => (b as number) - (a as number));
    if (entries.length === 0) {
      console.log(`${YELLOW}هیچ موجودی ثبت نشده${RESET}`);
    } else {
      entries.forEach(([userId, balance], i) => {
        console.log(`  ${i + 1}. ${userId}: ${GREEN}${balance} Q${RESET}`);
      });
    }
    break;
  }

  case 'analyze': {
    const civs    = loadFile('civilizations.json') ?? [];
    const balances = loadFile('token_ledger.json') ?? {};
    header('NETWORK ANALYSIS');

    const totalQ      = civs.reduce((s: number, c: any) => s + (c.qTokens ?? 0), 0);
    const totalAgents = civs.reduce((s: number, c: any) => s + (c.agents?.length ?? 0), 0);
    const totalTicks  = civs.reduce((s: number, c: any) => s + (c.tick ?? 0), 0);
    const wallets     = Object.keys(balances).length;
    const walletTotal = Object.values(balances).reduce((s: number, v) => s + (v as number), 0);

    console.log(`${BOLD}سیاره‌ها:${RESET}       ${civs.length}`);
    console.log(`${BOLD}کل Q token:${RESET}    ${GREEN}${totalQ}${RESET}`);
    console.log(`${BOLD}کل Agents:${RESET}     ${totalAgents}`);
    console.log(`${BOLD}کل Ticks:${RESET}      ${totalTicks}`);
    console.log(`${BOLD}کیف‌پول‌ها:${RESET}     ${wallets}`);
    console.log(`${BOLD}موجودی کل:${RESET}     ${GREEN}${walletTotal} Q${RESET}`);
    console.log(`\n${BOLD}تاریخ تحلیل:${RESET}  ${new Date().toISOString()}`);
    break;
  }

  case 'snapshot': {
    const civs     = loadFile('civilizations.json') ?? [];
    const balances = loadFile('token_ledger.json') ?? {};
    header('WORLD SNAPSHOT');

    const snap = {
      timestamp: new Date().toISOString(),
      state: 'frozen_analysis',
      planets: civs.length,
      totalQTokens: civs.reduce((s: number, c: any) => s + (c.qTokens ?? 0), 0),
      totalAgents:  civs.reduce((s: number, c: any) => s + (c.agents?.length ?? 0), 0),
      wallets: Object.keys(balances).length,
      civilizations: civs.map((c: any) => ({
        id: c.id, qTokens: c.qTokens, tick: c.tick,
        agents: c.agents?.length ?? 0,
        lastLog: c.log?.at(-1) ?? null,
      })),
    };

    console.log(JSON.stringify(snap, null, 2));
    break;
  }

  case 'planet': {
    if (!arg) { console.log(`${RED}خطا: شناسه سیاره مشخص نشده${RESET}\nمثال: node qctl.js planet <id>`); break; }
    const civs = loadFile('civilizations.json') ?? [];
    const civ  = civs.find((c: any) => c.id === arg || c.id.startsWith(arg));
    if (!civ) { console.log(`${RED}سیاره «${arg}» پیدا نشد${RESET}`); break; }
    header(`PLANET: ${civ.id}`);
    console.log(JSON.stringify(civ, null, 2));
    break;
  }

  case 'help':
  default:
    header('HELP');
    console.log(`${BOLD}استفاده:${RESET}  node qctl.js <command> [arg]\n`);
    console.log(`  ${GREEN}planets${RESET}          لیست همه سیاره‌ها`);
    console.log(`  ${GREEN}tokens${RESET}           موجودی توکن‌های کاربران`);
    console.log(`  ${GREEN}analyze${RESET}          تحلیل آماری کل شبکه`);
    console.log(`  ${GREEN}snapshot${RESET}         Snapshot JSON کل جهان`);
    console.log(`  ${GREEN}planet <id>${RESET}      جزئیات یک سیاره خاص`);
    console.log(`\n${YELLOW}مثال:${RESET}`);
    console.log(`  node qctl.js analyze`);
    console.log(`  node qctl.js snapshot > snap.json`);
}
