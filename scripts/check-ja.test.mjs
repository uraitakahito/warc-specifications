// scripts/check-ja.mjs の試験。見本の HTML は、layout の本文の目印（頁の題と container の終わり）で
// 挟んだ小さな物。規則ごとに、通る見本と、その規則に関わる所だけが違う落ちる見本を並べる。
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkPair,
  codeBlocks,
  firstDifference,
  fragmentLinks,
  headingIds,
  isStale,
  mainBody,
  pageUrl,
  parseFrontMatter,
  sourceCandidates,
} from "./check-ja.mjs";

const page = (inner, { sidebar = "" } = {}) =>
  `<html><body><nav>menu</nav>${sidebar}<div class="container"><div class="col">` +
  `<h1 class="nocount">Title</h1>${inner}</div></div><!-- /.container --></body></html>`;

const EN = page(
  '<h1 id="intro">Intro</h1><p>Text <a href="#rules">rules</a>.</p>' +
    '<h2 id="rules">Rules</h2><pre><code>WARC/1.1\nWARC-Type: resource\n</code></pre>',
);
const JA = page(
  '<h1 id="intro">はじめに</h1><p>本文 <a href="#rules">規則</a>。</p>' +
    '<h2 id="rules">規則</h2><pre><code>WARC/1.1\nWARC-Type: resource\n</code></pre>',
);

describe("front matter と URL", () => {
  it("1 段目の key: value を読み、引用符を外す", () => {
    const fm = parseFrontMatter('---\nlang: ja\ntitle: "WARC 形式"\nsource_commit: 0b8aff2\n---\n本文\n');
    assert.deepEqual(fm, { lang: "ja", title: "WARC 形式", source_commit: "0b8aff2" });
  });
  it("front matter が無ければ空", () => {
    assert.deepEqual(parseFrontMatter("# 見出し\n"), {});
  });
  it("index.md とほかの .md の、pretty の URL", () => {
    assert.equal(pageUrl("index.md"), "/");
    assert.equal(pageUrl("specifications/warc-format/warc-1.1/ja/index.md"), "/specifications/warc-format/warc-1.1/ja/");
    assert.equal(pageUrl("specifications/warc-zstd.md"), "/specifications/warc-zstd/");
  });
  it("URL から Markdown の場所の候補", () => {
    assert.deepEqual(sourceCandidates("/specifications/warc-format/warc-1.1/"), [
      "specifications/warc-format/warc-1.1/index.md",
      "specifications/warc-format/warc-1.1.md",
    ]);
    assert.deepEqual(sourceCandidates("/"), ["index.md"]);
  });
});

describe("本文の切り出しと取り出し", () => {
  it("横の欄の目次の id は数えず、本文の見出しの id だけを順に取る", () => {
    const html = page('<h2 id="a">A</h2><h3 id="b">B</h3>', {
      sidebar: '<div id="toc"><h3 id="toc-only">Contents</h3></div>',
    });
    assert.deepEqual(headingIds(mainBody(html)), ["a", "b"]);
  });
  it("頁の題（id の無い h1）は数えない", () => {
    assert.deepEqual(headingIds(mainBody(page('<h2 id="a">A</h2>'))), ["a"]);
  });
  it("本文の目印が無ければ投げる", () => {
    assert.throws(() => mainBody("<html></html>"), /目印/);
  });
  it("コードの例と頁の中のリンクを順に取る", () => {
    const body = mainBody(EN);
    assert.deepEqual(codeBlocks(body), ["WARC/1.1\nWARC-Type: resource\n"]);
    assert.deepEqual(fragmentLinks(body), ["rules"]);
  });
  it("並びの最初の違い。同じなら null、長さが違えば短い方の外", () => {
    assert.equal(firstDifference(["a", "b"], ["a", "b"]), null);
    assert.deepEqual(firstDifference(["a", "b"], ["a"]), { index: 1, en: "b", ja: undefined });
  });
});

describe("規則 2〜4（英日の組）", () => {
  it("見出しと地の文だけを訳した組は通る", () => {
    assert.deepEqual(checkPair({ enHtml: EN, jaHtml: JA }), []);
  });
  it("規則 2: 訳した見出しの id が英語と違えば赤", () => {
    const ja = JA.replace('id="rules"', 'id="gui-ze"').replace('href="#rules"', 'href="#gui-ze"');
    assert.deepEqual(checkPair({ enHtml: EN, jaHtml: ja }).map((i) => i.rule), [2]);
  });
  it("規則 2: 見出しが 1 つ多ければ赤", () => {
    const ja = JA.replace("<h2 id=\"rules\">", '<h2 id="extra">余分</h2><h2 id="rules">');
    assert.deepEqual(checkPair({ enHtml: EN, jaHtml: ja }).map((i) => i.rule), [2]);
  });
  it("規則 3: コードの例を 1 字でも変えれば赤", () => {
    const ja = JA.replace("WARC-Type: resource", "WARC-Type: リソース");
    assert.deepEqual(checkPair({ enHtml: EN, jaHtml: ja }).map((i) => i.rule), [3]);
  });
  it("規則 4: 頁の中のリンクの行き先が無ければ赤", () => {
    const ja = JA.replace('href="#rules"', 'href="#nowhere"');
    assert.deepEqual(checkPair({ enHtml: EN, jaHtml: ja }).map((i) => i.rule), [4]);
  });
});

describe("規則 5（英語の頁の古さ）", () => {
  it("git diff --quiet が 0 なら古くない", () => {
    assert.equal(isStale("abc1234", "a/index.md", () => 0), false);
  });
  it("git diff --quiet が 1 なら古い", () => {
    assert.equal(isStale("abc1234", "a/index.md", () => 1), true);
  });
  it("それ以外で終われば投げる（commit が無いなど）", () => {
    assert.throws(() => isStale("nope", "a/index.md", () => 128), /128/);
  });
  it("渡す引数は diff --quiet <commit> HEAD -- <英語の頁>", () => {
    let seen;
    isStale("abc1234", "a/index.md", (args) => {
      seen = args;
      return 0;
    });
    assert.deepEqual(seen, ["diff", "--quiet", "abc1234", "HEAD", "--", "a/index.md"]);
  });
});
