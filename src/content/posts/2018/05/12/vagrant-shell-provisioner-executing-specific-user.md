---
author: "makotow"
pubDatetime: 2018-05-12T14:49:15.673Z
modDatetime: 2020-01-04T18:11:53.000Z
title: "Vagrant shellプロビジョナでの別ユーザの使用方法"
draft: false
tags:
  - "Vagrant"
  - "Technology"
aliases:
  - "/vagrant-shell-provisioner-user-a84a2e227f6b"
description: "Vagrant shellプロビジョナでの別ユーザの使用方法"
timezone: "Asia/Tokyo"
---

## shell プロビジョニング時のユーザ指定の簡単な方法

[前回の記事](https://medium.com/makotows-blog/10min-k8s-singlenode-k8s-f2b5704849ac) で Vagrant のシェルプロビジョナで別ユーザを指定したと記事内で言及したのですが、さらっと書いてありますが実は実現するまでに紆余曲折を経て実現しました。

今回はやり方について自分へのメモの意味も込めて記録しておきたいと思います。

該当部分は以下の２つです。

やっていることはシンプルで該当するコマンドをshellスクリプトにして、ユーザを指定して実行します。  
 これでユーザを切り替え、切り替え後プロファイルの読み込みまでを行いシェルを実行してくれます。

```bash
$ sudo -u #{user} -i /path/to/shellscript.sh
```

*   [https://github.com/makotow/local-k8s/blob/8060b7e13ece29629b7bae655ca10c1c16b3c2f0/Vagrantfile#L61](https://github.com/makotow/local-k8s/blob/8060b7e13ece29629b7bae655ca10c1c16b3c2f0/Vagrantfile#L61)
*   [https://github.com/makotow/local-k8s/blob/8060b7e13ece29629b7bae655ca10c1c16b3c2f0/Vagrantfile#L63](https://github.com/makotow/local-k8s/blob/8060b7e13ece29629b7bae655ca10c1c16b3c2f0/Vagrantfile#L63)
