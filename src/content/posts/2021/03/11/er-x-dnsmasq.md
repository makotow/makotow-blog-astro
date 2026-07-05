---
author: "makotow"
pubDatetime: 2021-03-11T00:00:00+09:00
title: "家庭内簡易DNSサーバを EdgeRouter X を使って実現した"
draft: false
tags:
  - "network"
  - "dns"
categories:
  - "network"
ogImage: "erx.png"
description: "家庭内簡易DNSサーバを EdgeRouter X を使って実現した"
timezone: "Asia/Tokyo"
---

家庭内のLANで名前解決を簡単にしたかたのでいろいろ調べた結果、なんとなく結論がでたのでその記録を残しておく記事です。

---

## 課題感

いろいろ試していて、[code-server] (https://github.com/cdr/code-server) を導入した。
Dockerイメージが公開されており、TLSもサポートしていたのでlegoでさっくりと証明書を作った。
冷静に考えると家庭内にDNSがなかったのでIPアクセス。IPアクセスだとドメイン名が違う系ワーニングが出てしまうため、名前解決が必要なことになった。

## 検討したこと

家庭内にDNSサーバを作る。以前やってたけどめんどくさすぎてavahiにしたのを思い出した。
無線ルータにDNS機能が入っていたので使うことを考えたが現在はAPモードで動いているためできそうにない。
であれば、上流にいるEdgeRoute Xを使ってやればいいのではとおもって調べてみたらdnsmasqが使えそうというのがわかった。

## 現状

EgeRouter Xでdnsmasqを設定し、問題なく運用できているので試験運用中。

参考にしたページはこちらの「Customizing the DNS Forwarding Options」

* https://help.ui.com/hc/en-us/articles/115010913367-EdgeRouter-DNS-Forwarding-Setup-and-Options

設定は以下の設定をいれるだけで実現可能でかなりお手軽。

```shell
configure
set service dns forwarding options address=/domain.com/192.168.1.10
commit
save
```
特定ドメインを別のDNSへとばす(options server)

```shell
 set service dns forwarding options server=/domain.local/192.168.1.1
```
