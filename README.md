# warc-specifications（日本語の頁を足すための fork）

[iipc/warc-specifications](https://github.com/iipc/warc-specifications) の fork です。英語の頁は上流のまま触らず、日本語の頁を英語の頁の隣（`…/ja/`）に置ける仕組みを足してあります。

- サイト: https://uraitakahito.github.io/warc-specifications/ （master への push で CI が建て、検査が緑なら配る）
- 日本語の頁の決まり・権利の状態・上流の追い方: [TRANSLATING.ja.md](TRANSLATING.ja.md)

**WARC の本文の日本語訳は、まだありません。** 上流の repo にはライセンスが無く、メンテナーは [issue #103](https://github.com/iipc/warc-specifications/issues/103) で、この repo の文書を二次的著作物の元にすることを意図していないと答えています。WARC の正典は ISO の規格（ISO 28500:2017）です。本文の訳は、権利を持つ側の許しを得てから足します。

## 仕組み

- 頁の `lang`（既定は `en`）で、メニュー・横の欄・足元の文の言語が替わります（`_data/i18n.yml`）。
- 日本語の頁は `lang: ja`・`translation_of`（元の英語の頁の URL）・`source_commit` を持ちます。英日の頁は互いへの切り替えのリンクを出し、切り替えるときに見ている節（`#…`）を持って移ります。
- CI（`.github/workflows/build.yml`）が GitHub Pages と同じ組み立て（`actions/jekyll-build-pages`）で建て、`scripts/check-ja.mjs` で英日の頁を比べます（見出しの id の並び・コードの例・頁の中のリンク・訳の古さ）。建てた `_site` は成果物 `site` として残り、master では同じ `_site` を Pages に配ります（Pages の設定は「GitHub Actions」）。
- 注釈つき WARC 1.1 の頁では、用語の見出しの横に、[warc-byte-map](https://github.com/uraitakahito/warc-byte-map) で例の bytes を開く link が出ます。表は `_data/byte_map.yml` で、layout の script が建てた頁の見出しに足します（英語の頁の本文は変えません）。表の見出しの id が建てた頁に在るかは、CI が `scripts/check-byte-map.mjs` で確かめます。
- PR はこの fork の中だけで出します。上流には出しません。

## English

This is a fork of iipc/warc-specifications that adds the scaffolding for Japanese pages placed next to the English ones (`…/ja/`). The English pages are unchanged from upstream; on the annotated WARC 1.1 page, a layout script adds links from term headings to examples in [warc-byte-map](https://github.com/uraitakahito/warc-byte-map) (`_data/byte_map.yml`).

No Japanese translation of the WARC specification text is published here. The upstream repository has no license, and its maintainers have said the text is not intended as a basis for derivative works (iipc/warc-specifications#103). The authoritative specification is the ISO standard (ISO 28500:2017).
