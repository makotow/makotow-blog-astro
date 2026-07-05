---
author: "makotow"
pubDatetime: 2018-05-01T11:44:14.992Z
modDatetime: 2020-01-04T18:11:51.000Z
title: "ローカルマシンでSingle Node kubernetes クラスタ"
draft: false
tags:
  - "Kubernetes"
  - "Vagrant"
  - "Technology"
aliases:
  - "/10min-k8s-singlenode-k8s-f2b5704849ac"
description: "手元で簡単に試すようのk8sクラスタ"
timezone: "Asia/Tokyo"
---

## 10分で構成するkubernetesクラスタ

ローカルでkubernetesの環境を持ちたいと思い作成しました。

動作検証レベルで使えるものをめざしました。

## なぜローカルでつかうか？

GKEや会社のラボでつくって置くのがいいのですが、やはりふとしたときに手元ですぐに起動して確認したいことは多いです。実際にドキュメントを作成しているときにつないで試したいことも多かったためローカルでつくる方針としました。

## 様々な選択肢、最終的な決断

ローカルでkubernetesクラスタを構築するにはいくつか手段がありますが、今回はVirtualBoxを使ってsingleノードのクラスタとしました。他にもminikube, docker for Mac/Winに統合されているk8sもありますが、制約が幾つかあり、最終的にはkubeadm でつくる、VirtualBoxでVMをたてる方針としました。

今回はシングルノードで構成していますが、もちろんノードの追加もできます。

## 方法

*   Vagrant: VM自体のプロビジョニング
*   Ubuntu 16.04
*   CPU: 2CPU
*   Memory: 4GB
*   kubeadm: k8s クラスタの構成に使用
*   ネットワークプラグイン: flannel
*   Helm: k8sパッケージマネージャ的なもの

Vagrantを使ってUbuntuを起動、プロビジョニングを実施します。

## ハマりどころ

Vagrantは通常rootユーザでプロビジョニングを行うため、kubeadmの一部分で、一般ユーザで処理する部分をrootで実行しており失敗していることがありました。

kubeadm関連のコマンドを実行するところは別プロビジョニングスクリプトとして抽出し、VagrantのShellプロビジョナからユーザ指定で実行するようにしました。

## サンプルコード

上記のお試し環境は以下のリポジトリで公開しています。  
 注意点としては本来であれば要求事項としてOSのswapを無効化する要件になっていますが、今回のプロビジョニングスクリプトでは未済の状態です。

プロビジョニング後のOSを見てもswap領域が作られていなかったので動いている状況です。

[makotow/local-k8s](https://github.com/makotow/local-k8s)


## まとめ

クラウドが進んでも手元で確認したいことはいまだに多くあります。

今回はkubernetsを手元で動かしたくて試しに作ってみたものを公開しました。  
 本家の要求を満たしたり、バージョンアップに追従するところは今後の対応とします。
