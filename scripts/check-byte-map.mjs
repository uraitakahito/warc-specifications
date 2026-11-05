#!/usr/bin/env node
// 建てた頁で、warc-byte-map への link の表（_data/byte_map.yml）が指す見出しの id が在るかを見る。
//
// 使い方: node scripts/check-byte-map.mjs <建てた _site>
//
// 表は layout の script（_layouts/default.html）が頁に JSON で書き出すので、YAML ではなく
// 建てた HTML から読む。見出しの id が上流の変更で消えると、link は黙って出なくなる。それを赤にする。
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** 1 つの頁の HTML から、表の行き先の問題を並べる（空なら問題無し）。 */
export const checkPage = (html) => {
  const links = /var links = (\{.*?\});/s.exec(html);
  const sources = /var sources = (\{.*?\});/s.exec(html);
  if (links === null) return [];
  let table;
  let known;
  try {
    table = JSON.parse(links[1]);
    known = sources === null ? {} : JSON.parse(sources[1]);
  } catch {
    return ["link の表を JSON として読めない（layout の Liquid が建てずに残っている？）"];
  }
  return Object.entries(table).flatMap(([id, at]) => [
    ...(html.includes(` id="${id}"`) ? [] : [`見出しの id「${id}」が頁に無い`]),
    ...(known[at.src] === undefined ? [`「${id}」の src「${at.src}」が sources に無い`] : []),
  ]);
};

const pages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? pages(join(dir, e.name)) : e.name.endsWith(".html") ? [join(dir, e.name)] : [],
  );

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const site = process.argv[2] ?? "_site";
  let checked = 0;
  const problems = pages(site).flatMap((path) => {
    const html = readFileSync(path, "utf-8");
    if (html.includes("var links = ")) checked++;
    return checkPage(html).map((p) => `${path}: ${p}`);
  });
  console.log(`warc-byte-map の link の表を持つ頁: ${checked}`);
  for (const p of problems) console.error(`✗ ${p}`);
  process.exitCode = problems.length === 0 && checked > 0 ? 0 : 1;
}
