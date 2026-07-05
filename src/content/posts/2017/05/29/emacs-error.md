---
author: "makotow"
pubDatetime: 2017-05-29T16:31:04.015Z
modDatetime: 2020-01-04T18:11:11.000Z
title: "Emacs を起動するとエラー"
draft: false
tags:
  - "Programming"
  - "Fish"
  - "Emacs"
aliases:
  - "/emacs-%E3%82%92%E8%B5%B7%E5%8B%95%E3%81%99%E3%82%8B%E3%81%A8%E3%82%A8%E3%83%A9%E3%83%BC-daa17c4faad0"
description: "Emacs を起動するとエラー"
timezone: "Asia/Tokyo"
---

## emacs 25.2.1 + fish 2.5 で発生

ある日突然、emacsを起動すると以下のエラーが発生、タイミング的にzsh から fish へ移行したことで起きたと推測できた。
```bash
`Error (use-package): exec-path-from-shell :init: Expected printf output from shell, but got: “”  
Warning (initialization): An error occurred while loading ‘/Users/makoto/.emacs.d/init.el’:  

error: Expected printf output from shell, but got: “”  

To ensure normal operation, you should investigate and remove the  
cause of the error in your initialization file. Start Emacs with  
the ‘ — debug-init’ option to view a complete error backtrace.`
```

軽く調べてみると GitHub Issue が検索でヒットしてくるので詳細を確認。

## GitHub Issue を確認

*   [https://github.com/syl20bnr/spacemacs/issues/4755](https://github.com/syl20bnr/spacemacs/issues/4755)
*   [https://github.com/oh-my-fish/plugin-virtualfish/issues/3](https://github.com/oh-my-fish/plugin-virtualfish/issues/3)

確認すると fish 2.6 で解決済みとのことだが Mac の brew ではまだ2.6はリリースされていないので、HEADで最新版をインストールして解決。

```bash
brew install fish --HEAD
```

休日の yak shavingおわり。
