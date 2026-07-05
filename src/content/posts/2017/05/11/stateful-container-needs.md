---
author: "makotow"
pubDatetime: 2017-05-11T15:41:33.969Z
modDatetime: 2020-01-04T18:11:07.000Z
title: "なぜコンテナでデータ永続化が必要なのか"
draft: false
tags:
  - "Tech"
  - "Docker"
  - "Netapp"
aliases:
  - "/%E3%81%AA%E3%81%9C%E3%82%B3%E3%83%B3%E3%83%86%E3%83%8A%E3%81%A7%E3%83%87%E3%83%BC%E3%82%BF%E6%B0%B8%E7%B6%9A%E5%8C%96%E3%81%8C%E5%BF%85%E8%A6%81%E3%81%AA%E3%81%AE%E3%81%8B-2c2839580f9b"
description: "2016年は「コンテナ」、「Deep Learning/Machine Learning」 が最も目立ったテクノロジーでした。コンテナ自体の考えは昔からあるものですが、Dockerが実現したものはアプリケーションパッケージング、プラットフォームを問わずにアプリケーションをデプロイすることができる docker image でした。"
timezone: "Asia/Tokyo"
---

## Dockerコンテナが辿ってきた歴史（主にストレージ方面）これまで Docker Volume Plugin の記事を記載してきました。

今回は **「なぜコンテナでデータ永続化が必要なのか」** を説明していきます。

## コンテナの市場動向

2016年は「コンテナ」、「Deep Learning/Machine Learning」 が最も目立ったテクノロジーでした。コンテナ自体の考えは昔からあるものですが、Dockerが実現したものはアプリケーションパッケージング、プラットフォームを問わずにアプリケーションをデプロイすることができる docker image でした。

Docker image を DockerHub で共有しアプリケーションの再利用が非常に簡単になりました。

## コンテナを用いたアプリケーションライフサイクルとデータライフサイクルのギャップ

ここでは、よく課題に上がる、アプリケーションとコンテナのライフサイクルのギャップ、主にデータ永続化について説明致します。

コンテナ上にデータがあるためコンテナを削除した時点でデータは破棄されます。

dockerコマンドで docker イメージに保存も可能ですが（厳密に説明するとVOLUMEの場合はされません、イメージとして保存することを指します）、docker コンテナイメージはあくまでアプリケーションのテンプレートであり、構成に必要な情報は外部から与えインスタンス化するというのが使い方のポイントと考えています。docker イメージに状態を持つ情報を入れてしまうとdocker イメージの再利用が難しくなったり、スケールアウトを想定した使い方などができなくなってしまうなどの課題が生まれます。コンテナ内部にデータを保持してしまうとコンテナらしい使い方ができなくなります。

アプリケーションが必要とするデータが消えてしまう事象が起こる背景としてはアプリケーションのライフサイクルとコンテナのライフサイクルの違いにあります。コンテナは状態を持たず使用する必要があります。コンテナの起動・停止・削除のライフサイクル、アプリケーションは稼働を始めてから終わるまでデータが必要です。アプリケーションのライフサイクルに合わせるためには状態をコンテナ外に永続化する必要があります。

データ永続化の方法としてコンテナのホストOS側にデータを保存することで永続化する手法が存在します。しかし、ホストOS に保存するとデータがホストOSにのみ存在し、コンテナのモビリティが低下してしまうなどの課題もあります。他のホストOSで起動した際にデータが参照できないなどです。以下の図でコンテナのライフサイクルについて説明します。

コンテナの起動から停止まではコンテナのインスタンスが存在しており、データも残っている状態です。

停止状態から起動するとデータは残ったままで起動します。停止しているコンテナインスタンスを削除することで保存されているデータが削除されます。


![ライフサイクルの違い](1.png)



アプリケーションをデプロイする際に既存のコンテナをすべて削除して、新規にコンテナを起動します。その結果、アプリケーションはデプロイ単位でライフサイクルが終わります。

アプリケーションが稼働するために必要なデータ、主に業務データなどのDBに保存されるデータはシステム全体が稼働を終えるまで取り続ける必要があります。従来型のデプロイであればサーバや仮想マシンを作り直すのではなく存在し続けているサーバリソースにアプリケーションを展開し直すという形であったため、環境そのものは残っている状態です。

## 2016年までのコンテナ(Docker)に不足していたもの１つ (ストレージ、データ永続化）

コンテナの登場時点ではクラウドネイティブなインフラ、スケーラビリティやステートレスと言ったキーワードが似合うアプリケーションでの使用を想定したものであり、エンタープライズアプリケーションへの対応はまだ未済の状態でした。そのような中データの永続化というテーマが課題になることがありました。

## エンタープライズアプリケーションに適応する

2016 年の初頭から Docker が永続化の仕組みを提供しました。

Docker Volume Plugin として 外部ストレージにデータを保持するための仕組みを提供し、 3rd party 製の外部ストレージへデータを永続化する手法を提供しました。これまでに紹介した NetApp Docker Volume Pluginはこのフレームワークに沿って開発されています。

また、2016年後半には Docker 社が Infinit という コンテナストレージを実装している会社を買収しました。目的としてはエンタープライズアプリケーション領域を取り込みたいという意図でした。

Infinit の情報は以下のURLやGitHubにリポジトリが作成されOSSとして公開される準備がされています。アーキテクチャ的にも非常に興味深いものになっています。

*   [https://infinit.sh/](https://infinit.sh/)
*   [https://github.com/infinit/infinit](https://github.com/infinit/infinit)

ここで気になるのは 「docker volume plugin」 はなくなるのではないか？という疑問が上がります。

Docker社自体は Infinit は現在のストレージソリューションを置き換えるものではないという回答をしています。ユーザの選択肢は多くしておきたいという意図です。

*   [https://blog.docker.com/2017/01/docker-storage-infinit-faq/](https://blog.docker.com/2017/01/docker-storage-infinit-faq/)

上記URLの文言を一部抜粋しました。
> 4. For existing storage plugin owners, is this a replacement, or does it mean we can adapt our plugins to work with the Infinit architecture?> It is not Docker’s philosophy to impose on its community or customers a single solution. Docker has always described itself as a plumbing platform for mass innovation. Even though Infinit will very likely solve storage-related challenges in Docker’s products, it will always be possible to switch from the default for another storage solution per our batteries included but swappable philosophy.> As such, Docker’s objective with the acquisition of Infinit is not to replace all the other storage solutions but rather to provide a reasonable default to the community. Also keep in mind that a storage solution solving all the use cases will likely never exist. The user must be able to pick the solution that best fits her needs.## 取り組み

ここまで、なぜコンテナでデータ永続が必要になっているかを説明しました。

ここからはネットアップが取り組んでいることについて紹介したいと思います。

## Cloud Native Computing Foundation

クラウドネイティブなアプリケーションがどのようにあるべきかを議論する団体です。 NetApp はこの団体のゴールドメンバーとして加入しており、クラウドネイティブなアプリケーション構成はどうあるべきかという議論・方針の策定を行っています。

*   [https://www.cncf.io/about/governing-board/](https://www.cncf.io/about/governing-board/)
*   [https://www.cncf.io/about/members/](https://www.cncf.io/about/members/)

## Kubernetes

CNCFでリードされている Kubernetes では Special Interest Group (SIG)という特定領域におけるインフラストラクチャがどうあるべきかということを議論するグループがあります。ネットアップはここで SIG-Storageの領域でクラウドネイティブな環境下においてストレージのあるべき姿について積極的に議論を行っています。

2016年12月に Kubernetes integration として「trident」をリリースしています。

Trident は kubernetes から外部ストレージに対して動的にプロビジョニングを行う仕組みを提供しています。

*   [https://github.com/NetApp/trident](https://github.com/NetApp/trident)

Kubernetes version 1.4 リリース時にステートフルアプリケーション対応を強化し、Provisioner controller という仕組み・概念を提供しました。Trident は Provisioner controller を初めて実装したものです。


![Trident overview](2.png)

Trident は複数のバックエンドストレージの統合的なインターフェースという仕組みを提供しています。Kubernetesだけではなく、REST API のエンドポイントを備えているためkubernetes 以外からも使用可能です。

## まとめ

今回は少し趣向を変えて、Dockerコンテナという技術領域が辿ってきた歴史、誕生からステートフルコンテナが必要になってきた背景、そして現在NetAppがコミュニティでどのような取り組みを行っているかについて記載しました。

今後も次世代データセンターのあるべき姿、その時期に応じて必要な技術領域において積極的に取り組んでいきます。
