---
author: "makotow"
pubDatetime: 2018-01-22T15:38:00.232Z
modDatetime: 2020-01-04T18:11:42.000Z
title: "NetApp CloudSyncサービスの様々な使い方"
draft: false
tags:
  - "AWS"
  - "Cloud"
  - "Hybrid Cloud"
aliases:
  - "/ttps-medium-com-makotow-netapp-cloudsync-usecase-aed66d395d00"
ogImage: "1.png"
description: "NetApp CloudSync サービスを使ってオンプレミスNFSからオブジェクトストレージ（SGWS S3 API)を試してみた。"
timezone: "Asia/Tokyo"
---

## 今回はオンプレミスNFSからオンプレミスオブジェクトストレージにデータを移動してみた。

今回は [CloudSync サービス](https://www.netapp.com/jp/products/cloud-storage/data-sync-saas.aspx) について紹介したいと思います。  
 オンプレミスのNFSサーバーからAWS S3 へデータを高速に転送するという話を多くさせていただいておりますが、実はオンプレミスでのデータ移行、クラウド内のデータ移行にも利用可能なものです。

今回はそもそもなぜ CloudSync サービスが生まれたのかと、オンプレミスの NFSサーバからオンプレミスのオブジェクトストレージへデータ転送を試してみた結果をお届けします。

## CloudSync が生まれた背景 NASA ジェット推進研究所がやりたかったこと

そもそもの生まれとしてはNASAの火星探査機で収集した画像データをNASAのジェット推進研究所へ転送し、オンプレミスのサーバにある大量のデータ解析にAWSの解析サービスを使用したいという要望から生まれたソリューションです。




![](1.png)

[http://live.netapp-insight.com/detail/videos/see-more-netapp-insight-2017-videos/video/5599211315001/netapp-insight-general-session-day-3?autoStart=true&amp;page=3](http://live.netapp-insight.com/detail/videos/see-more-netapp-insight-2017-videos/video/5599211315001/netapp-insight-general-session-day-3?autoStart=true&amp;page=3)



今までのNetAppのクラウド連携ソリューションとの違いはデータをそのまま AWS S3 に転送するというところになります。

S3に直接データを入れることで AWS の S3 を中心としたデータ分析系のサービスを活用し分析を行うといったことが可能となります。

NASA ジェット推進研究所では夜間に転送を実施し、分析までを終わらせるためには高速に転送を行うソリューションが必要でした。  
 そのような背景のもと CloudSync が生まれてきました。

# 今までのクラウドにデータを送るもののまとめ

## ONTAP Cloud NetApp

SnapMirrorを使った転送、転送元、転送先にONTAPが必要。バックアップ、DR、ワークロードオフロードなどの様々なユースケースに利用可能。オンプレミスのONTAPがそのままクラウド上で動作する。

## AltaVault

基本的にはアーカイブ・バックアップのクラウドゲートウェイとして利用される。バックアップ、DRのユースケース。ポイントは既存インフラを変更せずに導入可能、対応しているバックアップ先の多さ、データの重複排除・圧縮の効率性が特徴

## StorgeGrid WebScale(SGWS)

オンプレミスからデータをS3へデータをレプリケーションする。オブジェクトストレージのレプリケーション機能。

## CloudSync

オンプレミスのNFS/CIFSから直接データをS3へ送る。S3をデータレイクとして、AWS の PaaS サービスを直接利用可能となる。分析を行いたいときに高速にデータを転送可能。また、大量ファイル環境においても 高速にデータ転送が可能に。

## CloudSync の使い方

ここからは CloudSync を使うための手順について確認します。  
 CloudSync は環境を選ばずデータを転送することができます。  
 アーキテクチャを説明後、実際のオペレーションを見ていただければと思います。

## アーキテクチャ

NFS と S3 の間にデータを変換する 「Data broker 」が存在します。このデータブローカーにデータを送ることで宛先に適したフォーマットに変換しデータ転送を行います。


![](2.gif)



## Cloud Sync の動き

一通りの手順を見てみます。以下のスクリーンショットの内容はバージョンアップにより内容が異なる可能性があります。

まずはサービスにアクセスし、ログインします。

*   [https://cloudsync.netapp.com](https://cloudsync.netapp.com)

![Login画面](3.jpeg)



ログインするとリレーション（転送元、転送先）を選択する画面となります。


![](4.jpeg)



「Add Source」、「Add Target」を選択すると選択可能な対象サーバー・サービスが見れます。今回はすべて表示されるものは記載していますが転送先、転送元すべての組み合わせが使えるわけではありません。SaaSとして提供しているため「転送先」、「転送元」は随時増えていきます。

「Add source」として選択出来るものは以下の通りです。

*   NFS Server
*   EFS
*   CIFS Server
*   S3 Bucket

![](5.jpeg)



「Add Target」を選択した場合は以下の通りです。

*   NFS Server
*   EFS
*   CIFS Server
*   S3 Bucket
*   Storage Grid

![](6.jpeg)



今回はオンプレミスのNFSとオンプレミスのStorageGridを選択しました。


![](7.jpeg)



仕組みの説明画面がでます。


![](8.jpeg)



転送元のIPを設定します。


![](9.jpeg)



ネットワークの疎通が取れると以下のような確認になります。


![](10.jpeg)



データブローカーのデプロイ先を選択します。


![](11.jpeg)



今回はオンプレミスを選択しました。


![](12.jpeg)



オンプレミスを選択するとデプロイメントの手順が表示されます。


![](13.jpeg)



最後まで手順を実行すると、以下のような画面となります。これでデータブローカーのインストール完了です。


![](14.jpeg)



該当のDatabroker をクリックして 「Continue」をクリック

転送元のディレクトリ一覧を選択します。


![](15.jpeg)



転送先のIPを設定します。


![](16.jpeg)



ポート、アクセスキー、シークレットキーを設定します。


![](17.jpeg)



「Continue」をクリックすると以下のバケットを読み込む画面になります。


![](18.jpeg)



転送先のバケットを選択します。


![](19.jpeg)



確認画面が表示されます。


![](20.jpeg)



「Create Relationship」をクリックすると同期が始まります。


![](21.jpeg)



転送完了画面は画面下部に進捗％が表示されます。


![](22.jpeg)



## 管理画面

リレーション毎の管理画面は以下のように見えます。


![](23.jpeg)



## 同期設定のスケジュール

手動での転送だけではなく、スケジューリングして定期的に差分転送をすることも可能です。

以下の画面の 「Sync Schedule」をクリック。


![](24.jpeg)



設定画面が表示されます。


![](25.jpeg)



スケジュールだけではなく、手動でオンデマンドに同期することもできます。


![](26.jpeg)



## まとめ

今回は NetApp CloudSync Service について説明しました。発表当初は オンプレミスのNFSサーバーからAWS S3 へデータを高速に転送するソリューションでしたが、日々進化しており対応する転送元、転送先が追加されております。  
 また、大量のファイルが存在しても高速に転送出来るというのも特徴の１つです。
