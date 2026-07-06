---
author: "makotow"
pubDatetime: 2026-07-06T00:00:00+09:00
title: "HugoからAstroへ: 移行のほぼ全てをAIエージェントにやらせた記録"
draft: false
tags:
  - "astro"
  - "hugo"
  - "cloudflare"
  - "ai-agent"
categories:
  - "Tech"
description: "Hugoで運用していたブログをAstroへ移行し、URL保全、CI、Cloudflare Workers Static AssetsへのデプロイまでをAIエージェント主導で進めた記録。"
timezone: "Asia/Tokyo"
---

## これは何か

このブログを Hugo から Astro に移行した。

移行そのものは珍しい話ではない。静的サイトジェネレーターを入れ替えて、Markdown を変換して、テーマを選び直して、デプロイ先を整える。やることだけを並べると普通のサイト移行に見える。

ただ、今回は意識的に「実装作業のほとんどを AI エージェントに任せる」形で進めた。人間がやったのは、方針を決めること、レビューすること、Cloudflare や GitHub の画面で必要な確認をすること。コード変更、検証スクリプト、CI、Cloudflare Workers Static Assets の設定、移行計画の更新は、かなりの部分をエージェントに寄せた。

結果として、ブログの移行というより「小さな本番システムを AI エージェントと一緒に運用可能な形へ持っていく」実験になった。

## 移行前の状態

旧ブログは Hugo で動いていた。記事は 57 本。URL は `/YYYY/MM/DD/:slug/` 形式で、古い `/post/YYYY/MM/DD/:slug/` 形式の URL や、Hugo の `aliases` も残っていた。

今回の移行では見た目の再現は目標にしなかった。Astro 側では新しいテーマを使うため、重要なのは次の3つに絞った。

- 既存記事が失われないこと
- 既存 URL と RSS 購読者を壊さないこと
- 今後の変更を CI と preview で確認できること

見た目の比較をやめたのはよかった。移行で一番事故りやすいのは、CSS の細部よりも URL、redirect、RSS、画像参照、frontmatter の変換だからだ。

## AstroPaper を選んだ

Astro 側のベースには AstroPaper を使った。

ゼロからテーマを書くより、既にブログとして成立しているテーマをベースにした方が移行の主目的に集中できる。AstroPaper は記事主体で、RSS、sitemap、検索、OGP まわりも揃っている。Tailwind ベースなので、あとから調整しやすいのも大きい。

ただし、そのまま使ったわけではない。Hugo 時代の URL を維持するため、AstroPaper 標準の `/posts/...` ではなく、`/YYYY/MM/DD/:slug/` で記事を生成するようにした。

## URL 保全を最優先した

今回一番大事だったのは URL 保全だった。

具体的には、次を機械的に検証できるようにした。

- 57 本の記事がすべて canonical URL で 200 を返すこと
- legacy `/post/...` URL が canonical URL へ 301 すること
- Hugo の `aliases` が 301 すること
- `/index.xml` が新しい `/rss.xml` へ 301 すること
- sitemap と RSS が生成されること

Cloudflare Workers Static Assets では、`public/_redirects` をビルド成果物へコピーして redirect を扱う形にした。

最終的には本番ドメインに対して、次の検証を通している。

```text
VERIFY_BASE_URL=https://blog.makotow.net npm run verify:migration

Migration URL check: PASS
Posts: 57
Canonical HTTP OK: 57/57
Redirect rules OK: 108/108
Redirect targets OK: 108/108
```

この検証があると、公開直後の不安がかなり減る。

## CI を先に作った

移行中盤から、GitHub Actions に品質ゲートを入れた。

今は PR ごとに次を実行している。

- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm run verify:migration`
- `npm run review:content`
- `npm run verify:links`

さらに Cloudflare Workers Builds の check も必須にした。ブログではあるが、運用としては「main に入る前に build と deploy preview が通る」状態になっている。

一人運用なので、GitHub の required approvals は 0 にした。自分の PR を自分で approve することは GitHub が許可しないので、レビュー必須にしてしまうと運用が止まる。代わりに、必須 check を強めにする方針にした。

## Cloudflare Workers Static Assets で少しハマった

最初は Cloudflare Pages のつもりで進めていたが、Cloudflare の UI では Deploy command が必須で、output directory の入力欄がなかった。これは Pages の古い流れではなく、Workers Builds + Static Assets の流れだった。

ここでは `@astrojs/cloudflare` を入れないのがポイントだった。今回のサイトは静的ビルドなので、Astro の Cloudflare adapter は不要。必要なのは `wrangler` と、静的 assets の設定だった。

最終的な設定はこうなった。

```jsonc
{
  "name": "makotow-blog-astro",
  "compatibility_date": "2026-07-05",
  "workers_dev": true,
  "preview_urls": true,
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

一度 `blog.makotow.net` を `wrangler.jsonc` の custom domain route として入れようとしたが、main の Cloudflare Workers Builds で失敗した。PR preview では通っていたので、ここは少し罠だった。

最終的には、custom domain は `wrangler.jsonc` ではなく Cloudflare Dashboard の Domains & Routes で追加する形にした。この方が静的 assets のデプロイと DNS / domain attachment を分けて扱える。

## AI エージェントに任せてよかったところ

一番よかったのは、検証スクリプトや CI のような周辺作業が自然に積み上がったことだ。

人間だけでやると、記事変換が終わった時点で気が緩む。だが、実際に大事なのはその後の確認で、URL、redirect、RSS、画像、内部リンクをどれだけ機械的に見られるかが移行の品質を決める。

AI エージェントに任せると、こういう地味なチェックを作らせやすい。失敗したらログを見て直し、計画ファイルを更新し、再実行する。その反復が速い。

一方で、人間のレビューは必要だった。たとえば `ogImage` は OGP meta としては出ていたが、記事本文のカバー画像としては表示されていなかった。これは目視レビューで気づいた。エージェントに任せるほど、人間の確認ポイントをどこに置くかが大事になる。

## 今後

移行は終わったが、ここからが本来の運用だと思っている。

このブログは、単なる静的サイトではなく、AI エージェントと一緒に運用するための小さな本番環境として扱う。記事を書く、PR を作る、preview を確認する、CI で品質を見る、main に merge して公開する。この流れを普段の発信に組み込んでいく。

今回の移行で得た一番大きな収穫は、「AI エージェントの出力を信じる」のではなく、「AI エージェントの出力を検証できる仕組みに載せる」感覚だった。

ブログの移行としては少し大げさかもしれない。でも、このくらい小さい場所で運用設計を試しておくのは、かなり良い練習になる。
