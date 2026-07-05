---
author: "makotow"
pubDatetime: 2019-12-08T15:36:01.366Z
modDatetime: 2020-01-04T18:12:28.000Z
title: "ここ数年のKubernetesのステートフルワークロードを振り返る"
draft: false
tags:
  - "Kubernetes"
  - "Storage"
  - "Poem"
  - "Cloud"
categories:
  - "2019-advent-calendar"
aliases:
  - "/kubernetes3-day9-statefulworkload-on-k8s-retrospective-and-next-challenges-18251c8b8cd3"
ogImage: "landscape.jpg"
description: "ここ数年のKubernetesストレージ周りを振り返り"
timezone: "Asia/Tokyo"
---

ステートフルワークロードの振り返りと今後
この記事は、[Kubernetes3 Advent Calendar](https://qiita.com/advent-calendar/2019/kubernetes3)の9日目の記事です。



この記事では個人的に興味がある、コンテナ上のステートフルワークロードについてトレンドや過去からの変遷をまとめたいと思います。  
個人的にここ3,4年はKubernetesを含んだコンテナにおけるデータの取扱をどうするかをメインに活動をしていました。  
最初のころはコンテナの世界でステートフル（ストレージ）の話していると「そんなことするのか？」という皆さんの意見がありましたが、ここ1年くらいはデータをどのように管理するのか、ステートフルワークロードをどう取り扱うかが **一部界隈** で議論されていたように感じます。

この記事では過去・現在・未来についてポエム的な内容で書きます。個人の主観が大きく出ている内容になっていますので、それは違うのでは？というところは **ぜひフィードバックください。**

## TL;DR

*   Kubernetes上のステートフルワークロードは増えている
*   Kubernetes Storage が難しいのではなく、ストレージが難しい
*   いつの時代もステートフルワークロードは少し遅れて課題が出てくる、2019年はステートフルワークロード元年
*   様々な環境下でのステートフルワークロード対応としてグローバル分散DB/ファイルに注目

---

## 過去 2015–2017くらいの話: これまで

Dockerがかなり注目されていた時期でまだオーケストレーションはそこまで議題には出ておらず、おそらくこの時点で必要だった人たちは自作またはMesos等を使っていた、このあたりからサービスで使うために必要なネットワーク、ストレージ、ログ周りなどが整っていった状況です。

Docker Swarm, Docker composeなどもこのタイミングで出てきており、ネットワーク、ストレージ、ログドライバもリリースされサービスで使う準備ができ始め、さらにオーケストレーションが必要なことも課題として認識され始めました。

Kubernetes としてはこの時代はKubernetes内部のコードにストレージに関するコードが含まれていおり、in-tree plugin という形態で提供されていました。in-tree plugin だとリリースサイクルやバグへの対応で課題があり別の方法が検討され、out-of-treeといったアーキテクチャが採用されました。

まだまだステートフルなワークロードに対しては課題があるという段階です。

ちなみに2017年夏からCNCF（ **Cloud Native Computing Foundation** ）に参加する企業が急増し、CNCF=テクノロジーハブとして認識されてきました。

## 現在2018–2019: 現状

様々なコンテナストレージに対応するための共通仕様としてContainer Storage Interface(**CSI**)が定義されました。

Kubernetes 1.9 (2018/1) のリリースでCSI (Container Storage Interface) がαリリースされ、1.10(2018/4)にβ、そしてKubernetes 1.13(2019/1)でGAしました。

[Introducing Container Storage Interface (CSI) Alpha for Kubernetes](https://kubernetes.io/blog/2018/01/introducing-container-storage-interface/)


なお、自分のブログでも取り上げていました。CSIとは？という疑問に答える内容になっています。

[Kubernetes Contaienr Storage Interface（CSI）とは？](https://medium.com/makotows-blog/https-medium-com-makotow-kubernetes-contaienr-storage-interface-a0c4a0d04bad)


### ステートフルワークロードのトピックは増加傾向

KubeCon 2019 EU でもKubernetes上のでステートフルワークロードは議題に挙がりました。

キーノートで「Keynote: Debunking the Myth: Kubernetes Storage is Hard」というタイトルで Kubernetes上でのストレージ、 Stateful workload の話がでており、課題や現状をシェアする内容となっています。




ここで有名な名言が生まれます。

> Reality: Storage is complicated

「Kubernetes Storage が難しいのではなく、ストレージが難しい。」ということです。

このセッションの中でも話されていますがOperatorが活発に議論されるようにもなりDB on KubernetesやStorage on Kubernetes が実現しやすいフレームワークが出始めたという時期でもあります。

CSIがGAしてから早いペースで仕様が追加されております。2019年後半時点の機能としては以下の通りです。様々なユースケースに対応できるようになってきております。

*   Secret & Credential: StorageClass Secret, VolumeSnapshotClass Secret
*   Topology
*   Raw Block Volume
*   Skip Attach
*   Pod Info on Mount
*   Volume expansion
*   DataSources: Cloning, Volume Snapshot & Restore
*   Ephemeral Local Volumes
*   Volume Limits

上記の機能が次々と追加されています。（ここでは個別の説明は省略します、興味があれば[https://kubernetes-csi.github.io/docs/features.html](https://kubernetes-csi.github.io/docs/features.html)を見てください）

また、以下のCNCF LandscapeにリストされているCloud Native Storage も最初から比べるとだいぶ賑やかなメンツが揃ってきました。

![2019/12 時点のCloud Native Storage抜粋](1.jpg)



[CNCF Cloud Native Interactive Landscape](https://landscape.cncf.io/category=cloud-native-storage&format=card-mode&grouping=category)


## 未来：2020年〜 これから起こりそうな話

2019年は急速にステートフルワークロードに対応してきているイメージがあります。それでは来年はどうなるでしょうか？

今年の後半個人的に興味があるのは以下の2つです。

### Stateful Serverless

今年から来年にかけてはKubernetes上でのサーバーレスをどうデザインするかが大きなトピックとなります。  
ステートフルワークロードもよりいっそう適応が進み、新たな課題が生まれてくるはずです。現時点でキーワードとして出てきているのが、**Stateful Serverless** です。こちらについてはまだ調査中ではあるのですが、Serverless = 新しいカタチのPaaSという理解でいます。

Serverless自体はステートレスなプラットフォームでは最適なプラットフォームであるが、それをStatefulな環境に適応するにはどうするかというのが課題です。

現時点で様々な議論がされています。


Towards Stateful Serverless



関連事項としてこちらも要確認な内容です。Vitessの資料で、非常に興味深いのはStateless Storageとは相反する言葉が出てきているところです。Stateless Storageというキーワードが指すところがNoOpsストレージというようなイメージを持ちました。


Vitess: Stateless Storage in the Cloud



最初にStateful Serverlessで検索するとAzure Durable Functionsが結果としてでます。こちらはKubernetes関連ではなく個別のサービスでしたが目指すところは同じなのではと現状理解しています。

[Durable Functions の概要 - Azure](https://docs.microsoft.com/ja-jp/azure/azure-functions/durable/durable-functions-overview)


### エッジ・マルチクラウドでのユースケース

これまで KubeCon 等でエッジでの Kubernetes のユースケースが発表されました。2020年はこういったユースケースも増えていくと思われます。これらがステートフルワークロードに関連することは、どうやってデータを取り扱うかが今までと変わってくると思われます。

ステートフルワークロードが対応するアーキテクチャとして１つクラスタではなく、マルチクラウド、エッジ、プライベートクラウドにデプロイされたクラスタが連携するようなユースケースに対応したものが必要とされてくるでしょう。

これまで通りファイルシステムやソフトウェアによるデータレプリケーションを行うというやりかたもできますがより多くのユースケースに対応するためにグローバル分散に対応可能なデータサービスが必要になると考えています。

このようなユースケースを実現するものとしてYugaByte DB や EdgeFS のようなグローバル分散での考え方のＤＢやファイルシステムがすでに登場しています。エンジニアはさらなるレベルアップを求められるでしょう。

2つのプロダクトの一言紹介を見ると想定しているワークロードは見えてきますね。

*   **[YugaByteDB](https://www.yugabyte.com/)** : The high-performance distributed SQL database
for global, internet-scale apps. Avoid cloud lock-in with
an enterprise-grade, cloud-native, open-source database.
*   **[EdgeFS](http://edgefs.io/)**: Multi-cloud era distributed storage system for geo-transparent data access.

## まとめ

かなりポエムな内容になってしましたが、最初に書いたとおり ステートフルワークロードをKubernetesで動かすということに関してここ3,4年の変遷を自分の視点から書き上げてみました。

2019年はステートフルワークロードについて多く語られた年だったと感じています 、それと同時に来年はもっとスケールが大きくなりそうなイメージを持っています。

エンジニアとしては刺激的な日々を送りつづけることができそうな時代になりそうです。

## 情報源

### 公式ドキュメント系

*   sig-storage: [https://github.com/kubernetes/community/tree/master/sig-storage](https://github.com/kubernetes/community/tree/master/sig-storage)
*   CSI: [https://kubernetes-csi.github.io/docs/](https://kubernetes-csi.github.io/docs/)
*   YugaByte DB: [https://www.yugabyte.com/](https://www.yugabyte.com/)
*   EdgeFS: [http://edgefs.io/](http://edgefs.io/)
