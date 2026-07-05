---
author: "makotow"
pubDatetime: 2017-07-30T14:41:09.724Z
modDatetime: 2020-01-04T18:11:22.000Z
title: "[Tips][Solution]NetApp Docker volume plugin status 32 error exit"
draft: false
tags:
  - "Docker"
  - "Docker Volume"
  - "Troubleshooting"
aliases:
  - "/tips-solution-netapp-docker-volume-plugin-status-32-error-exit-81e49e0dfb21"
description: "[Tips][Solution]NetApp Docker volume plugin status 32 error exit"
timezone: "Asia/Tokyo"
---

Slack のチャネルで議論されていたり、自身でもたまにハマるもの。メモとして残す。

## 結論

NFS v3でnDVPを使う際には最近のLinux distributionでは, NFSクライアントやrpcbind などが標準でインストールされていない、サービスが有効になっていないのでまずはインストール状況、サービス稼働状況を確認。

[VolumeDriver.Mount: Problem attaching docker volume with exit status 32](https://www.exospheredata.com/2017/05/25/problem-attaching-docker-volume/?utm_content=bufferb04c7&amp;utm_medium=social&amp;utm_source=twitter.com&amp;utm_campaign=buffer)


## 切り分け

まずは NFS マウントをできるかを確認。

できない場合は、原因として以下の２つが考えられる。

## NFS Client がインストールされていない

そのままなので、nfs-common(ubuntu)、nfs-utils(Redhat, CentOSパッケージをインストール。

## NFS を使うために必要なサービスが起動していない（NFSv３の場合)

タイトルのエラー「 status 32 error exit 」がでるケースはほとんどがrpcbind サービスが起動していないことによるもの。

その場合は `systemctl start rpcbind` でサービスを起動することで解決。

`systemctl enable rpcbind` で常時有効にしておく。
