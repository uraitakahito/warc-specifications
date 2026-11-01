#!/usr/bin/env node
// 日本語の頁（front matter に `lang: ja`）を、元の英語の頁と並べて検査する。
//
// 使い方: node scripts/check-ja.mjs <建てた _site>（repo の根で動かす）
//
// 規則（1〜4 は赤 = 終了コード 1。5 は注意 = GitHub Actions の warning を出して緑のまま）
//   1. 日本語の頁が translation_of と source_commit を持ち、英語の頁・建てた頁・commit が在る
//   2. 英日の本文の見出しの id の並びが同じ（目次と、#… のリンクが英日で同じ節を指す）
//   3. 本文の <pre><code> の中身の並びが同じ（記録の例と文法は訳さない）
//   4. 日本語の頁の href="#…" の行き先が、その頁の id に在る
//   5. 英語の頁が source_commit の後で変わっていない（変わっていたら訳が古い）
//
// 本文は layout の `<h1 class="nocount">`（頁の題）から `</div><!-- /.container -->` まで。
// 横の欄（目次・この文書について）とメニューは見ない。
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const BODY_START = '<h1 class="nocount">';
const BODY_END = "</div><!-- /.container -->";

/** front matter の、1 段目の `key: value` だけを読む（この repo の頁はそれで足りる）。 */
export const parseFrontMatter = (text) => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (m === null) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/.exec(line);
    if (kv === null) continue;
    out[kv[1]] = kv[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return out;
};

/** 頁の Markdown の場所から、`permalink: pretty` で建つ URL を返す（`a/b/index.md` → `/a/b/`）。 */
export const pageUrl = (sourcePath) => {
  const p = sourcePath.split(sep).join("/");
  if (p === "index.md") return "/";
  if (p.endsWith("/index.md")) return `/${p.slice(0, -"index.md".length)}`;
  return `/${p.replace(/\.md$/, "")}/`;
};

/** URL から、それを建てる Markdown の場所の候補を返す。 */
export const sourceCandidates = (url) => {
  const trimmed = url.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed === "" ? ["index.md"] : [`${trimmed}/index.md`, `${trimmed}.md`];
};

/** 本文（頁の題から本文の終わりまで）を切り出す。layout が変わって目印が無ければ投げる。 */
export const mainBody = (html) => {
  const i = html.indexOf(BODY_START);
  const j = i < 0 ? -1 : html.indexOf(BODY_END, i);
  if (i < 0 || j < 0) throw new Error("本文の目印（頁の題・container の終わり）が見つからない");
  return html.slice(i, j);
};

/** 本文の見出しの id を、出てくる順に。 */
export const headingIds = (body) =>
  [...body.matchAll(/<h[1-6]\b[^>]*\sid="([^"]*)"/g)].map((m) => m[1]);

/** 本文の <pre><code> の中身を、出てくる順に（HTML のまま比べる。英日とも同じ kramdown が書く）。 */
export const codeBlocks = (body) =>
  [...body.matchAll(/<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g)].map((m) => m[1]);

/** 本文の、頁の中への リンクの行き先（`#` の後ろ）を、出てくる順に。 */
export const fragmentLinks = (body) =>
  [...body.matchAll(/\shref="#([^"]*)"/g)].map((m) => m[1]);

/** 2 つの並びの最初の違い。同じなら null。 */
export const firstDifference = (a, b) => {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return { index: i, en: a[i], ja: b[i] };
  }
  return null;
};

const shorten = (s) => (s === undefined ? "（無い）" : JSON.stringify(s.length > 80 ? `${s.slice(0, 80)}…` : s));

/** 規則 2〜4。英日の建てた HTML を受け取り、見つけた問題を返す。 */
export const checkPair = ({ enHtml, jaHtml }) => {
  const en = mainBody(enHtml);
  const ja = mainBody(jaHtml);
  const issues = [];
  const enIds = headingIds(en);
  const jaIds = headingIds(ja);
  const idDiff = firstDifference(enIds, jaIds);
  if (idDiff !== null) {
    issues.push({
      rule: 2,
      message: `見出しの id の並びが違う（${idDiff.index + 1} 番目: 英 ${shorten(idDiff.en)}・日 ${shorten(idDiff.ja)}。英 ${enIds.length} 個・日 ${jaIds.length} 個）`,
    });
  }
  const enCode = codeBlocks(en);
  const jaCode = codeBlocks(ja);
  const codeDiff = firstDifference(enCode, jaCode);
  if (codeDiff !== null) {
    issues.push({
      rule: 3,
      message: `コードの例が違う（${codeDiff.index + 1} 番目: 英 ${shorten(codeDiff.en)}・日 ${shorten(codeDiff.ja)}。英 ${enCode.length} 個・日 ${jaCode.length} 個）`,
    });
  }
  const ids = new Set(jaIds);
  for (const target of fragmentLinks(ja)) {
    if (!ids.has(target)) issues.push({ rule: 4, message: `頁の中のリンクの行き先が無い: #${target}` });
  }
  return issues;
};

/**
 * 規則 5。英語の頁が source_commit の後で変わったか。`git diff --quiet` は差があると 1 で終わる。
 * git は差し替えられる（試験のため）。
 */
export const isStale = (sourceCommit, enPath, git = runGit) => {
  const status = git(["diff", "--quiet", sourceCommit, "HEAD", "--", enPath]);
  if (status === 0) return false;
  if (status === 1) return true;
  throw new Error(`git diff が ${String(status)} で終わった（${sourceCommit}・${enPath}）`);
};

const runGit = (args) => {
  try {
    execFileSync("git", args, { stdio: "ignore" });
    return 0;
  } catch (e) {
    return typeof e.status === "number" ? e.status : 128;
  }
};

const SKIP_DIRS = new Set([".git", "node_modules", "scripts", "assets"]);

/** repo の中の Markdown の場所を返す（`_` と `.` で始まるディレクトリは見ない。Jekyll も建てない）。 */
const markdownFiles = (root, dir = root) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      out.push(...markdownFiles(root, join(dir, entry.name)));
    } else if (entry.name.endsWith(".md")) {
      out.push(relative(root, join(dir, entry.name)));
    }
  }
  return out;
};

const builtPage = (site, url) => join(site, ...url.split("/").filter(Boolean), "index.html");

const main = () => {
  const site = process.argv[2] ?? "_site";
  if (!existsSync(site)) {
    console.error(`建てたサイトが無い: ${site}`);
    process.exit(2);
  }
  const root = process.cwd();
  const jaPages = markdownFiles(root)
    .map((path) => ({ path, fm: parseFrontMatter(readFileSync(join(root, path), "utf8")) }))
    .filter(({ fm }) => fm.lang === "ja");

  if (jaPages.length === 0) {
    console.log("日本語の頁は 0（検査する対象がない）");
    return;
  }

  let errors = 0;
  let warnings = 0;
  const error = (path, rule, message) => {
    errors++;
    console.log(`::error file=${path}::規則 ${rule}: ${message}`);
  };

  for (const { path, fm } of jaPages) {
    const jaUrl = pageUrl(path);
    if (!fm.translation_of || !fm.source_commit) {
      error(path, 1, "translation_of と source_commit が要る");
      continue;
    }
    const enPath = sourceCandidates(fm.translation_of).find((p) => existsSync(join(root, p)));
    if (enPath === undefined) {
      error(path, 1, `translation_of の英語の頁が無い: ${fm.translation_of}`);
      continue;
    }
    if (runGit(["cat-file", "-e", `${fm.source_commit}^{commit}`]) !== 0) {
      error(path, 1, `source_commit が引けない: ${fm.source_commit}`);
      continue;
    }
    const enBuilt = builtPage(site, fm.translation_of);
    const jaBuilt = builtPage(site, jaUrl);
    if (!existsSync(enBuilt) || !existsSync(jaBuilt)) {
      error(path, 1, `建てた頁が無い: ${existsSync(enBuilt) ? jaBuilt : enBuilt}`);
      continue;
    }
    for (const issue of checkPair({
      enHtml: readFileSync(enBuilt, "utf8"),
      jaHtml: readFileSync(jaBuilt, "utf8"),
    })) {
      error(path, issue.rule, issue.message);
    }
    if (isStale(fm.source_commit, enPath)) {
      warnings++;
      console.log(
        `::warning file=${path}::規則 5: 英語の頁 ${enPath} が source_commit（${fm.source_commit}）の後で変わった。` +
          `git diff ${fm.source_commit} HEAD -- ${enPath} を読んで訳を直し、source_commit を進める`,
      );
    }
  }

  console.log(`日本語の頁 ${jaPages.length}・赤 ${errors}・注意 ${warnings}`);
  if (errors > 0) process.exit(1);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
