# 日本語の頁の決まり

この fork（uraitakahito/warc-specifications）に日本語の頁を足すときの決まりです。サイトには出しません（`_config.yml` の `exclude`）。

## 位置づけ

- 日本語の頁は**非公式訳**です。原文と食い違うときは原文が優先します。
- WARC の正典は ISO の規格（ISO 28500:2017）です。この repo の WARC 1.1 の英語の頁は、上流の IIPC が ISO 28500 の最終草案から起こした HTML で、ISO の最終版そのものではありません。
- 上流は https://github.com/iipc/warc-specifications です。上流には PR を出しません（`gh repo set-default` は fork、remote `upstream` の push の URL は `DISABLED`）。

## 権利の状態と公開の門

**WARC の本文の訳は、まだ公開しません。** 訳を push した時点で、公開の repo の中で誰でも読めるようになり、master に入れば Pages にも出ます。

- 上流の repo には LICENSE がありません。issue #103「No license」（2025-04・未解決）で、repo を立ち上げた一人は、正典は ISO の規格で、この repo の文書は二次的著作物の元にすることを意図していない、ライセンスを付けるには ISO の関係者との正式な取り決めが要る、と答えています。
- issue #99（2024-11）では、注釈つきの版の注釈の主な書き手（Alex Osborne）が、**自分が書いた注釈の文に限って**、使うこと・複製すること・改変した版を作ることを許しています。本文と、ほかの人が書いた文は含みません。

本文の訳を公開するのは、権利を持つ側の許し（ISO の側。日本の ISO の会員は JISC）を得てからです。許しが無いうちに日本語で置けるのは、次の 2 つです。

1. Alex Osborne 本人が書いた注釈の訳（`git blame` で書き手を確かめる。Chris Ha・Thalia Archibald など、ほかの人の文は含めない）
2. 本文を写さない、自分の言葉の解説（引用は短くし、出典を示す）

## 頁の置き方

日本語の頁は、元の英語の頁のフォルダに `ja/index.md` として置きます（例 `specifications/warc-format/warc-1.1/ja/index.md` → `/specifications/warc-format/warc-1.1/ja/`）。英語の頁には触りません。

front matter は、英語の頁と同じ鍵（`status`・`version`・`version-of`・`numbered`・`latest` など）に、次の 3 つを足します。

| 鍵 | 中身 |
|---|---|
| `lang` | `ja`。メニューと一覧は英語の頁だけを並べ、訳のある頁に「日本語」の札を付ける |
| `translation_of` | 元の英語の頁の URL（例 `/specifications/warc-format/warc-1.1/`）。英日の切り替えのリンクはこれで結ぶ |
| `source_commit` | 訳したときの英語の頁の commit。英語の頁がこの後で変わると、検査が「古い」と知らせる |

## 書き方（仮の決め。変えるならこの文書を直す）

- **見出しは訳し、末尾に英語の頁と同じ id を付けます。** 例 `## …（日本語の見出し） {#warc-type}`。英語の id は、建てた英語の頁の HTML（`<h2 id="…">`）で確かめます。setext の見出しでも、見出しの行の末尾に書けます（GitHub Pages の組み立てで効くことを確かめ済み）。欄の名前（`WARC-Type` など）とレコード種別の名前の見出しは英語のままにします。
- **コードの例（記録の例・文法）は 1 字も変えません。** 検査が英語の頁とバイト単位で比べます。
- **日本語の段落は 1 段落を 1 行で書きます。** Markdown の改行は HTML で空白になり、ブラウザによっては日本語の字の間に空白が見えます。
- **冒頭の断り書きは、見出しを使わず引用の箱で書きます。** 見出しを足すと、英日の id の並びがずれて検査が赤になります。
- **規範の語**（仮）: shall「〜しなければならない」・shall not「〜してはならない」・should「〜することが望ましい」・may「〜してもよい」。JIS でよく使われる形ですが、JIS Z 8301 の本文では確かめていません。英語の語を毎回（shall）のように添えます。
- **用語**（仮。BrowserHive の docs「仕様の実装状況」と BrowserHive WACZ Profile の訳にそろえる）:

| 英語 | 日本語 |
|---|---|
| record／record type | レコード／レコード種別 |
| header／named field | ヘッダ／フィールド（初出は「名前付きフィールド」） |
| content block | コンテンツブロック |
| payload／digest | payload／digest（英語のまま） |
| segmentation | 分割 |

## 検査

CI（`.github/workflows/build.yml`）が、GitHub Pages と同じ組み立てで `_site` を建て、`npm run check`（`scripts/check-ja.mjs`）を回します。

| # | 見ること | 落ちたら |
|---|---|---|
| 1 | `translation_of` と `source_commit` が在り、英語の頁・建てた頁・commit が在る | 赤 |
| 2 | 本文の見出しの id の並びが英日で同じ | 赤 |
| 3 | 本文のコードの例が英日でバイト単位で同じ | 赤 |
| 4 | 日本語の頁の中のリンクの行き先が在る | 赤 |
| 5 | 英語の頁が `source_commit` の後で変わった | 注意（緑のまま） |

手元では `npm test`（検査の試験）を回せます。建てた結果は、CI の成果物 `site` を `gh run download` で落とし、`serve/warc-specifications/` の下に置いて `python3 -m http.server` で開きます。

## 上流を追う

月に 1 度か、上流の変更に気づいたときに、worktree で上流を取り込みます。

```sh
R=~/projects/web-capture/warc-specifications
git -C "$R" fetch upstream origin
git -C "$R" worktree add ~/projects/web-capture/tmp/warc-ja-sync -b sync/upstream-<hash> origin/master
cd ~/projects/web-capture/tmp/warc-ja-sync && git merge upstream/master
git push -u origin HEAD && gh pr create --repo uraitakahito/warc-specifications --base master
```

上流の取り込みで変わるのは英語の頁だけです。検査の規則 5 が「古い」と知らせたら、`git diff <source_commit> HEAD -- <英語の頁>` を読んで日本語の頁を直し、`source_commit` を進めます。
