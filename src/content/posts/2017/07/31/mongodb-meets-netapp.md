---
author: "makotow"
pubDatetime: 2017-07-31T06:26:45.320Z
modDatetime: 2020-01-04T18:11:24.000Z
title: "MongoDB meets NetApp"
draft: false
tags:
  - "Mongodb"
  - "Netapp"
  - "Data Management"
  - "Altavault"
  - "Ontap"
aliases:
  - "/mongodb-meets-netapp-46c45a1b5771"
description: "MongoDB meets NetApp"
timezone: "Asia/Tokyo"
---

## クラウド連携をメインとしたソリューション編

この記事ではTechnical Reportとして発行している内容をサマライズしてお届けします。

今回は、「[TR-4492 MongoDB on the NetApp Data Fabric](https://www.netapp.com/us/media/tr-4492.pdf)」と [https://newsroom.netapp.com/blogs/netapp-solutions-for-mongodb/](https://newsroom.netapp.com/blogs/netapp-solutions-for-mongodb/) を翻訳したものに対して、補足を追加してお送りします。ソーシャル、モバイル、クラウド、およびIoTデータが急増しています。  
この急増は、顧客分析、電子商取引、セキュリティ、監視、ビジネスインテリジェンスなどのハイパースケール、分散、データ中心のアプリケーションを企業に展開するようになっています。  
これらの大容量かつの大量の数のデータ取り込み、リアルタイムアプリケーションのデータ要件を処理するために、企業は急速にMongoDBなどの大規模でスケーラブルで非リレーショナルなデータベースを採用しています。

MongoDBは一般的な汎用オープンソースのスケールアウトNoSQL DBです。高可用性、高度なデータ管理などの大規模なデータ分析アプリケーションを含む最新のアプリケーションに対応しています。MongoDBの主な使用例には、リアルタイム解析が含まれます。製品カタログ、コンテンツ管理、モバイル、IoT、およびブロック・チェーン・アプリケーションが含まれます。

このブログ記事は、MongoDB Ops Manager バックアップをコストとスペース効率良くNetApp上でMongoDBを動かすソリューションをまとめたものです。  
また、NetApp Data FabricとVMware vSphere上に MongoDB NoSQLデータベースをデプロイする方法についても説明します。

## NetAppとMongoDB Ops Managerとの統合

MongoDB Ops Manager は、データ保護の豊富な機能を提供します。これらの機能には、ローカルストレージおよびクラウドベースのストレージで整合性の取れたポイントインタイムバックアップを作成し、データの損失が発生しないことを確認する機能が含まれます。ほとんどの顧客はMongoDBに大量のデータを格納するため、バックアップストレージは非常に大きくなります。また、ストレージサイズとRTO(目標復旧時間)で常にトレードオフがあります。その結果、ローカルバックアップの保持には限界があり、これらのバックアップをクラウドに保存するとコストが高くなる可能性があります。

このソリューションは、MongoDB Enterprise Advanced を NetApp ストレージ、NetApp AltaVaultにデプロイします。AltaVaultとは、クラウド統合ストレージであり、コスト効率、ストレージの使用効率を向上させることができます。Ops Manager のバックアップをNetApp AltaVault を使用することで長期間の保存に低コストのクラウドベースのストレージを使用しながら、バックアップの保存にスペース効率の良いローカルストレージを提供します。

このソリューションのアーキテクチャはシンプルであり、Ops Managerへの変更は必要ありません。

NetAppストレージ上にAltaVaultの仮想マシンを作成して、AltaVault をlocalバックアップのコピーキャッシュとして使用します。AltaVault上にNFS共有を作成し、Ops Manager サーバからマウントして使用します。Ops Manager はマウントした NFS ボリュームをスナップショット保存先として使用します。最終的にAltaVault で Amazon S3を保存先として設定します。

Ops Managerはスナップショットを作成すると、バックアップファイルはローカルストレージキャッシュとして機能するAltaVaultに格納されます。ファイルが書き込まれるにつれて、インライン重複除外/圧縮が効果を発揮し、データの格納領域が減少します。S3へデータを転送する際のセキュリティ面においても対策がされており、データは書き込まれる前に暗号化されます。その後、AltaVaultはAmazon S3ストレージにデータの転送を開始します。データ転送中はデータは暗号化されており、傍受されたとしてもよくわからないデータの塊にしか見えません。（図1参照）




![image](./images/1.png#layoutTextWidth)

図1）MongoDB Ops ManagerとNetAppの統合



MongoDB Ops ManagerとNetApp AltaVaultを統合することで Ops Managerのデータ保護機能のスナップショットに次の機能を提供できます。

*   **ローカルバックアップの長期保存** Ops Managerのバックアップのフットプリントが削減され、ローカルバックアップコピーの保存期間の長期化が可能に
*   **ストレージコスト削減** NetAppストレージの容量効率化によるクラウドストレージのコスト削減
*   **データセキュリティ** オンプレミスとクラウド間のデータ転送中の暗号化

## NetAppデータファブリック上のMongoDB

NetAppは、仮想環境におけるスケールアウトMongo DB をVMWare vSphere と NetApp Data Fabric上に効率的にデプロイするためのエンドツーエンドソリューションを設計し、検証をしました。  
このソリューションでは、スケールアウトNetApp All Flash FAS（AFF）がMongoDB仮想マシンとデータベースをホストします。バックアップおよび災害復旧サービスは、Amazon AWS上で稼働する NetApp ONTAP Cloud SDSソリューション及びNetApp Private Storageによって提供されます。（図2参照）




![image](./images/2.png#layoutTextWidth)

NetApp データファブリック上のMongoDB



## まとめ

NetApp上のMongoDBは、より柔軟なインフラ、データ保護のためのシームレスのクラウド連携とスケールアウトを提供します。  
そして、コモディティストレージよりも優れた可用性とセキュリティを提供します。
