---
author: "makotow"
pubDatetime: 2018-07-22T13:28:17.309Z
modDatetime: 2020-01-04T18:11:57.000Z
title: "On-premise Kubernetes pitfalls"
draft: false
tags:
  - "Kubernetes"
  - "Technology"
aliases:
  - "/on-premise-kubernetes-pitfalls-2aa49e1a4c2c"
description: "オンプレミスのk8sのはじめの一歩で盛大に躓くポイントをいくつかまとめました。"
timezone: "Asia/Tokyo"
---

## オンプレkubernetesで共通してはまるところ

ウェブで公開されているマニフェストは基本的にはクラウドで動かすことを想定しているのでオンプレミスで動かそうとするとそのままでは動かない箇所があったりする。

今回はだれもがハマるであろうことを自分への備忘も含めて記載してみた。

## Service の type

マニフェスト内に`type: LoadBalancer`とあるが、これは外部にサービスを公開する際にクラウドが提供しているロードバランスサー経由でアクセスできるようにするもの。外部公開用のIPの設定やロードバランス先も設定される。

このように公開されているマニフェストをオンプレミスで動かすとIPを割当てるところで`pending`になってしまい止まる。

解決方法は大きく２つ。

1.  解決方法としては `type: NodePort`またはIngressを使う方向へ。
2.  [MetalLB](https://metallb.universe.tf/)のようなオンプレミスでクラウドのロードバランスサーのようなことをできるものを使う。

## Deployment/Pod等のストレージ設定

上記のロードバランサーと同様にストレージについても動的にプロビジョニングされることを前提としている。  
 クラウドサービスを使った場合、PVCのマニフェストに`StorageClass`が指定されていないければデフォルトのストレージクラスが使用され、動的にプロビジョニングされる。([https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#defaultstorageclass](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#defaultstorageclass))

クラウドプロバイダー毎で実装は違うところもあると思うがオンプレミスでやるとそもそもストレージクラスが存在しないのでボリュームを作成するところでエラー。

## その他はまりどころ

*   DNS、名前解決をどうするか
*   SSL certification、自己証明書での実装
*   証明書に関係して、プライベートレジストリを作成する場合に、Insecure Registryを使うか？
*   Helmも上記同様なハマりポイント＋マニフェストと文法が同じだが若干考え方が違うためハマる。
