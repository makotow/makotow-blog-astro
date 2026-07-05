---
author: "makotow"
pubDatetime: 2017-10-24T16:57:40.833Z
modDatetime: 2020-01-04T18:11:31.000Z
title: "Kubernetes/OpenShift: Static vs Dynamic Storage"
draft: false
tags:
  - "Container"
  - "Openshift"
  - "Storage"
  - "Kubernetes"
  - "Tech"
aliases:
  - "/kubernetes-static-vs-dynamic-storage-provisioning-1eaeddb8dbfb"
ogImage: "1.png"
description: "kubernetes/openshiftのexternal dynamic provisioner の話です。"
timezone: "Asia/Tokyo"
---

## PV /PVC/ StorageClass の関係、External Dynamic Provisionerについて

## コンテナを運用するために必要なもの

今回はコンテナを運用するための考慮すべきことや必要となることについて説明するとともに NetApp が提供しているコンテナ関連のテクノロジー、インテグレーションについて紹介します。

## コンテナ、コンテナオーケストレーション とは？

Dockerだけでコンテナを管理しようとすると、単一のホストの機能を超えてアプリケーションを拡張することは複雑な作業になります。 このプロセスを簡単にするために、いくつかのコンテナオーケストラが非常に目立つようになりました。その1つはKubernetes (k8s) です。

k8s を使用する場合、アプリケーション開発者/管理者は、アプリケーションを作成するために依存関係がある一連のコンテナの要件を定義します。 これには、各コンテナイメージだけでなく、ネットワーク上での通信方法や、必要なストレージまで含まれます。

コンテナをクラスタを構成するノードのどこにデプロイするか、クラスタ全体の管理や、リソース管理を行うものです。

現在のマーケットでは、主に以下のソフトウェアがプレイヤーとして登場します。

*   [Kubernetes](https://kubernetes.io/)
*   [Mesos (DC/OS)](https://dcos.io/)
*   [Docker Swarm](https://docs.docker.com/engine/swarm/)
*   [OpenShift](https://www.redhat.com/ja/technologies/cloud-computing/openshift)
*   [Rancher](http://rancher.com/)

今回は kubernetes/OpenShift に焦点を当て、Kubernetes/OpenShift のデータ永続化について記載します。

コンテナ技術についてはよく話に上がりますが、何に使えるかという観点では様々な調査結果をまとめると大きく二点に絞られるかと思います。

*   社内の開発環境の払い出しの高速化
*   ビジネス上のアウトプットの速度を向上、市場へのTTMを高速化

## kubernetesでのデータ永続化

Kubernetes の永続化ストレージの考え方は大きく３つに分類されます。

*   **Persistent Volume (PV)
**kubernetes クラスタに導入されている iSCSI LUN, NFS export などの永続化ストレージの単位
*   **Persistent Volume Claim (PVC)
**ユーザやアプリケーションからリクエストされるPVのこと、動的にストレージをプロビジョニングする際には PVC に StorageClassを指定する
*   **StorageClass** (SC)
ストレージのタイプを定義する仕組み。
例えば “Performance” や “Capacity”といったストレージのサービスメニューを定義し、PVCから要求した際に作成されるボリュームのカタログ化が可能。

### Static Provisioning

kubernetes 1.3 まではデータの永続化にある程度制約が有りました、事前に手動で Persistent Volume (PV) を定義し実際のストレージリソースとのマッピングを実施します。Persistent Volume Claim(PVC) が要求されたときに、条件にマッチするPVを探し出し割り当てる方式です。

PVC は kubernetes よって以下の動きをします。




![k8s におけるStatic provisioning のストレージリソース割り当て](1.png)




コンテナを活用したセルフサービス、消費型のインフラストラクチャを実現するには**オンデマンド**にPV を作成し、コンテナにマウントする必要があります。

### Dynamic Provisioning & StorageClass

動的にストレージをプロビジョニングし、コンテナ化されたアプリケーションにPVを割り当てる機構として StorageClass が存在します。

StorageClass自体はKubernetes 1.2でα版、1.4 でβ版としてリリースされました。

*   [http://blog.kubernetes.io/2016/10/dynamic-provisioning-and-storage-in-kubernetes.html](http://blog.kubernetes.io/2016/10/dynamic-provisioning-and-storage-in-kubernetes.html)

そして Kubernetes 1.6 で安定版としてリリースされています。

*   [http://blog.kubernetes.io/2017/03/dynamic-provisioning-and-storage-classes-kubernetes.html](http://blog.kubernetes.io/2017/03/dynamic-provisioning-and-storage-classes-kubernetes.html)

StorageClassを使ったDynamic Provisioning は以下のようなイメージで動作します。




![k8s の Dynamic Provisioning &amp; StorageClass](2.png)




## External Storage Provisioner とは？

External Storage Provisioner は kubernetes の out-of-tree (外側)でPVのダイナミックプロビジョニングを実現するものです。  
out-of-treeとはkubernetes のコントローラーからボリュームをプロビジョニングするものではなく、外部に存在するもので独立してデプロイ、アップデートができるものです。

PersistentVolumeClaim で StorageClass を要求されたリクエストを監視し、自動的にPersistentVolumeを作成します。

## NetApp Trident

NetAppのストレージ・ポートフォリオを使用する場合、このダイナミックプロビジョニング機能は、NetAppのオープンソースプロジェクトのNetApp Tridentを使用して提供されます。  
 TridentはKubernetes/OpenShiftに対応する External Storage Provisioner です。NFSエクスポートや iSCSI LUN などのストレージリソースを動的に作成し、アプリケーションによって指定された StorgeClass に設定されている要求を満たしたストレージリソースを作成し、提供します。 アプリケーションは、基盤となるストレージインフラストラクチャを気にすることなく、Kubernetesクラスタ内のホスト間で Pod をシームレスに拡張し、展開でき、 必要なときに、必要な場所でストレージリソースを利用できます。

Trident は Storage Dynamic Provisioner として NetApp ストレージと StorageClass をマッピングすることで個々のアプリケーションに最適なストレージを提供することができます。

[NetApp/trident](https://github.com/NetApp/trident)




![Tridentの概念図](3.png)




Tridentを使用することでNetAppストレージポートフォリオ全体に対して動的にボリュームを作成し個々のPod(コンテナ化されたアプリケーション郡）に対してPVを割り当てることが可能となりました。

現時点(2017/09)で Trident は Kubernetes とOpenShift に対応しています。

### NetApp で実現可能なこと

ここまでは機能的な説明をしました。ここからはNetAppを選択した場合どのようなメリットがあるかをお伝えします。

大きく２つの価値を提供できます。

## 1. 消費型のインフラの実現

この記事の最初にも記載したとおり消費型のインフラをつくる、PaaSのように開発者にワンクリックで環境を作成し提供するような場合に必須となる機能を実現することができます。

コンテナを活用した開発インフラを検討する際にはおそらくOpenShiftやk8s をベースにすることを考えるでしょう。その時にストレージのプロビジョニングは動的にできワークロードに応じたストレージリソースをプロビジョニングする必要があります。ストレージオーケストレータである trideht を使うことで上記のことを実現することができます。

## 2. マルチクラウド運用の実現

NetAppが提唱しているデータファブリックのアーキテクチャの中でデータを管理し、データモビリティを実現することができるようになります。

例えば StorageClass のマッピング先としてONTAPを選択すると、データ管理については、あるときはオンプレミス上のONTAPにデータを保管、コンテナのワークロードをAWS へ移行したくなった場合は AWS上で稼働するONTAP Cloud for AWS をデプロイしデータを非同期転送することで同じ環境、同じデータでアプリケーションを再開することができるようになります。

コンテナ化されたアプリケーションと同時にデータをシームレスに環境間を移動させることができるようになります。

アプリケーションのモビリティはコンテナを使用して実現し、データのモビリティはNetAppのデータファブリックの概念を使用し任意の場所にデータを移動することが可能となり、いつでもアプリケーションを稼働することが可能です。

ユーザは**必要なタイミング**でワークロードを**最適な環境**へ場所に移動できるようになります。

NetAppのテクノロジーでデータプラットフォームを作成することでオンプレミスやクラウドといった環境を考慮せずとも**そのときに最適なプラットフォームを選択**できるようになります。

### 事例

先日、NetApp社内でのOpenShiftのユースケースについてもブログで公開されました。

[Introducing Platform-as-a-Service (PaaS) in NetApp IT | NetApp Blog](https://blog.netapp.com/blogs/introducing-platform-as-a-service-paas-in-netapp-it)

## 次回予告

今回の記事ではなぜオーケストレータが必要なのか、NetAppを用いることでできることをお伝えしました。  
 次回は実際に試してみた結果をお伝えします。
