---
author: "makotow"
pubDatetime: 2018-03-04T13:42:57.407Z
modDatetime: 2020-01-04T18:11:46.000Z
title: "GCP and AWS: k8s network のはマリどころ (知っていればすぐ解決）"
draft: false
tags:
  - "Kubernetes"
  - "AWS"
  - "Google Cloud Platform"
  - "Google Container Engine"
  - "Tech"
aliases:
  - "/gcp-and-aws-kubernetes-network-d5dcc51248e3"
description: "GCP and AWS: k8s network のはマリどころ (知っていればすぐ解決）"
timezone: "Asia/Tokyo"
---

GCP と AWS をVPN接続し、GCP上のk8sクラスタからAWS上のデータにアクセスしようとしてうまくいかなかったときのメモ。

## TL;DR;

k8s 上で動くコンテナから出る通信はNATされないので、別ネットワークと通信する際にはルーティングを設定する必要があるため切り分けの際に留意すること。

今回ハマったのはkubernetesネットワークの考えがわかっておらず、Docker環境でのネットワークを前提でかんがえてしまったことで起きたこと。

kubernetesネットワークを学んだことで思想を理解、参考資料に上げたサイトがとても有益。

## 環境

*   AWS と GCP をサイト間 VPN で接続
*   AWSに データ永続用ストレージを配置
*   GCP に k8s クラスタを配置
*   k8s クラスタのコンテナからNFSサーバを参照・更新

## なにが起きていたか

GCP上のVMからAWS上のNFSサーバへは疎通＋NFSマウントができていたが、GKEのコンテナからは疎通取れず。

コンテナからはAWS 側の VPN ゲートウェイまでは到達できていたがプライベートネットワークへ疎通が出来なかった。

## 解決方法

今回はGCPのクラウドルーターを使用し、BGPでルーティング情報をアドバタイズしていた。  
 そこに k8s pod への戻りのルーティングを追記したことで解決。


![クラウドルーター設定](1.jpeg)

クラウドルータにカスタムルート追加



ただし、参考資料にも記載があるとおり、GCP/GKEではネットワーク関連は自動で構築されているところも多くあり、これをオンプレミスでやろうとするとかなりハマり、時間が溶けるのではないかと思った。

## まとめ

とりあえずkubernetesクラスタを動かしたければGKEが早く、簡単で、安い。  
 ただし、別ネットワークへのアクセス等を行うとハマるポイントがあるので留意すること。

## 謝辞

複数の同僚の方々に相談に載っていただき、解決まで導いてもらったことに感謝申し上げます。

## 参考資料

以下2つがとても有益。

*   [https://qiita.com/apstndb/items/9d13230c666db80e74d0](https://qiita.com/apstndb/items/9d13230c666db80e74d0)
*   [https://speakerdeck.com/thockin/the-ins-and-outs-of-networking-in-google-container-engine](https://speakerdeck.com/thockin/the-ins-and-outs-of-networking-in-google-container-engine)
