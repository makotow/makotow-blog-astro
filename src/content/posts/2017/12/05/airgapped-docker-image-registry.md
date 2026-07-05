---
author: "makotow"
pubDatetime: 2017-12-05T09:33:48.266Z
modDatetime: 2020-01-04T18:11:35.000Z
title: "インターネット接続できない環境におけるDocker Image の運用"
draft: false
tags:
  - "Docker"
  - "Operation"
  - "Tech"
aliases:
  - "/%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%BC%E3%83%8D%E3%83%83%E3%83%88%E6%8E%A5%E7%B6%9A%E3%81%A7%E3%81%8D%E3%81%AA%E3%81%84%E7%92%B0%E5%A2%83%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8Bdocker-image-%E3%81%AE%E9%81%8B%E7%94%A8-c378974c96e5"
description: "コンテナの本番運用を考えると日本では開発、ステージジング、本番などの環境がネットワークが物理的に分断されていることも多い、そのときにはどのような運用できるかを調査してみた。"
timezone: "Asia/Tokyo"
---

## 完全に分離された環境の運用

開発環境、本番環境のように完全にネットワークが分離されている環境や、インターネットに接続されていない環境がある場合どのように運用するのがいいのかということを考えた。

ポイントとしては以下2点

*   プライベートなDocker Registryの構築
*   Docker imageのデプロイ：開発→本番 開発環境で作成したイメージの本番へのデプロイ方法（ネットワークは物理的に分断）

## プライベートなDocker Registryの構築

こちらはDocker本家ページに記載の通り、ただし 本番運用するにはしっかりとセキュリティ関連（証明書など）は検討する必要あり。

*   [https://docs.docker.com/registry/](https://docs.docker.com/registry/)

## Docker imageのデプロイ：開発→本番

完全に開発環境、本番環境間でネットワークが分離されている場合の話かつプライベートリポジトリかつ、本番環境はインターネット接続なしのケース。

開発：DockerHubからダウンロード、自作のDocker Image をprivate registoryに登録

開発→本番へは、  
 開発： docker export or save で -o tar ファイルへ。  
 これをハンドキャリーで本番環境へ移動  
 本番：作業ホストで開発環境からエクスポートしたイメージをDocker imageとして復元  
 本番：ホストのdocker image へ登録されるため、private registory へpush

## さらに調べておくべきこと

今回調べたのはシンプルにDockerだけのケースなのでこれらをkubernetes, openshift, Rancherといったオーケストレータから使う場合どのような運用が適するのかは見定める必要がありそう。

## references

*   [https://hub.docker.com/_/registry/](https://hub.docker.com/_/registry/)
*   [https://docs.docker.com/registry/](https://docs.docker.com/registry/)
