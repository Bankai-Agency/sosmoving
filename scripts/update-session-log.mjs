#!/usr/bin/env node
// Auto-generated session log. Runs on Claude Code Stop hook.
// Writes SESSION-LOG.md with a snapshot of current repo state.
// Filesystem-only (no git/gh required). Fast, <100ms typical.

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'SESSION-LOG.md');
const NOW = new Date();
const ISO = NOW.toISOString();
const LOCAL = NOW.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', hour12: false });

const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', '_legacy', 'public', '.claude', '.vercel', '.turbo']);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.claude') continue;
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) {
      try {
        const s = statSync(p);
        out.push({ path: relative(ROOT, p), mtime: s.mtimeMs, size: s.size });
      } catch {}
    }
  }
  return out;
}

function countFiles(dir, ext) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith(ext)) n++;
  }
  return n;
}

function grepTodos(files) {
  const markers = [];
  const re = /\b(TODO|FIXME|XXX|HACK)\b[:\s]+(.{5,120})/;
  for (const f of files) {
    if (!/\.(ts|tsx|js|mjs|md)$/.test(f.path)) continue;
    try {
      const lines = readFileSync(join(ROOT, f.path), 'utf8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(re);
        if (m) markers.push({ file: f.path, line: i + 1, kind: m[1], text: m[2].trim().slice(0, 100) });
        if (markers.length > 30) return markers;
      }
    } catch {}
  }
  return markers;
}

function extractPhase() {
  const ctxPath = join(ROOT, 'PROJECT-CONTEXT.md');
  if (!existsSync(ctxPath)) return null;
  const content = readFileSync(ctxPath, 'utf8');
  const m = content.match(/## TL;DR\s*\n+([\s\S]+?)\n## /);
  return m ? m[1].trim().slice(0, 800) : null;
}

const allFiles = walk(join(ROOT, 'src')).concat(walk(join(ROOT, 'scripts')));

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const recent24h = allFiles.filter(f => NOW.getTime() - f.mtime < DAY).sort((a, b) => b.mtime - a.mtime);
const recent7d = allFiles.filter(f => NOW.getTime() - f.mtime < WEEK).sort((a, b) => b.mtime - a.mtime);

const counts = {
  pages: countFiles(join(ROOT, 'public/pages'), '.html'),
  blogPosts: countFiles(join(ROOT, 'src/data/blog'), '.md'),
  webflowSections: countFiles(join(ROOT, 'src/components/sections'), '.tsx'),
  mainpage2Sections: countFiles(join(ROOT, 'src/components/mainpage2/sections'), '.tsx'),
  mainpage2Ui: countFiles(join(ROOT, 'src/components/mainpage2/ui'), '.tsx'),
  sharedHtml: countFiles(join(ROOT, 'src/data/shared'), '.html'),
};

const todos = grepTodos(allFiles);
const phase = extractPhase();

const fmt = (f) => `- \`${f.path}\` — ${new Date(f.mtime).toISOString().replace('T', ' ').slice(0, 19)}`;

const body = `# Session Log — SOS-MOVING

> **Авто-обновляется Stop-хуком Claude Code.** Не редактируй руками — перезапишется. Для постоянного контекста смотри [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md) и [CLAUDE.md](CLAUDE.md).

**Последнее обновление:** ${LOCAL} (MSK) / ${ISO}

---

## Снимок состояния репо

| Что | Количество |
|---|---:|
| Webflow HTML-страниц (\`public/pages/*.html\`) | ${counts.pages} |
| Постов блога (\`src/data/blog/*.md\`) | ${counts.blogPosts} |
| Webflow \`Section*.tsx\` компонентов | ${counts.webflowSections} |
| \`mainpage2\` секций | ${counts.mainpage2Sections} |
| \`mainpage2\` UI-компонентов | ${counts.mainpage2Ui} |
| Shared HTML-блоков (navbar/footer/etc) | ${counts.sharedHtml} |

---

## Изменённые файлы за 24 часа (${recent24h.length})

${recent24h.length ? recent24h.slice(0, 25).map(fmt).join('\n') : '_Нет правок за последние сутки._'}

${recent24h.length > 25 ? `\n_...и ещё ${recent24h.length - 25}._\n` : ''}

---

## Изменённые файлы за 7 дней (${recent7d.length})

${recent7d.length ? recent7d.slice(0, 15).map(fmt).join('\n') : '_Нет правок за неделю._'}

---

## TODO / FIXME в коде (${todos.length})

${todos.length ? todos.slice(0, 20).map(t => `- **${t.kind}** [\`${t.file}:${t.line}\`] — ${t.text}`).join('\n') : '_Нет активных маркеров._'}

---

## Текущая фаза (из PROJECT-CONTEXT.md)

${phase ? phase : '_PROJECT-CONTEXT.md не найден._'}

---

## Как восстановить контекст

Если вернулся к проекту после паузы — читай в таком порядке:
1. [CLAUDE.md](CLAUDE.md) — жёсткие правила (какой git репо, что трогать нельзя)
2. [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md) — архитектура, два стэка, что сделано
3. [COMPONENTS-AND-PAGES.md](COMPONENTS-AND-PAGES.md) — инвентарь компонентов и типов страниц
4. Этот файл (SESSION-LOG.md) — что менялось недавно
`;

writeFileSync(OUT, body);
console.log(`[session-log] wrote ${OUT} (${recent24h.length} files in 24h, ${todos.length} todos)`);
