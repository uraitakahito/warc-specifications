import assert from "node:assert/strict";
import { test } from "node:test";
import { checkPage } from "./check-byte-map.mjs";

const page = (links) =>
  `<h3 id="warc-record">WARC record</h3><script>var sources = {"types":"https://x.test/t.warc"}; var links = ${JSON.stringify(links)};</script>`;

test("表の id が頁に在り、src が sources に在れば、問題は無い", () => {
  assert.deepEqual(checkPage(page({ "warc-record": { src: "types", rec: 0, part: "record" } })), []);
});

test("頁に無い id と、sources に無い src を言う", () => {
  assert.deepEqual(checkPage(page({ "warc-gone": { src: "nope", rec: 0, part: "record" } })), [
    "見出しの id「warc-gone」が頁に無い",
    "「warc-gone」の src「nope」が sources に無い",
  ]);
});

test("表を持たない頁は見ない", () => {
  assert.deepEqual(checkPage("<h1 id=\"x\">x</h1>"), []);
});

test("表を JSON として読めなければ、そう言う（例外で落ちない）", () => {
  assert.deepEqual(checkPage("<script>var links = {{ byte_map | jsonify }};</script>"), [
    "link の表を JSON として読めない（layout の Liquid が建てずに残っている？）",
  ]);
});
