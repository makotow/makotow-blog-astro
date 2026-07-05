---
author: "makotow"
pubDatetime: 2017-08-08T15:34:00.375Z
modDatetime: 2020-01-04T18:11:26.000Z
title: "Git のサブコマンドを実装する"
draft: false
tags:
  - "Git"
  - "Tech"
aliases:
  - "/git-%E3%81%AE%E3%82%B5%E3%83%96%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89%E3%82%92%E5%AE%9F%E8%A3%85%E3%81%99%E3%82%8B-39ef0c19bc87"
description: "Git のサブコマンドを実装する"
timezone: "Asia/Tokyo"
---

## ユーティリティや他システム連携の準備

### 背景

git のサブコマンドで任意の動作、例えばワークフローをまとめてみたり、外部のプログラムやAPIを呼び出すことをやりたかった。

## 実現する方法

まずは基本を確認、gitのサブコマンドの実装方法に調べた。

パスが通っている場所に git-XXというファイル名で配置

ファイルはバイナリでも、スクリプトファイルでもよい。

この仕組みを取ることで `git xxx arg1 arg2`のように Git のサブコマンドとして使用可能になる。

## できること

1.  一連の git ワークフローをまとめる
2.  Git コマンドの裏側で何かしらの処理をさせる

今回は実験的に「一連の git ワークフローをまとめる」を実装。

本来は「Git コマンドの裏側で何かしらの処理をさせる」をできるようにしたい。

## 出来上がったもの

[makotow/dailyutils](https://github.com/makotow/dailyutils/blob/master/git-mirror/git-mirror)


シンプルに git のリポジトリをミラーするもの。

```bash
$ git mirror src_repo dest_repo
```

でgit repository をコピーするもの
