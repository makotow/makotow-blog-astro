---
author: "makotow"
pubDatetime: 2018-01-14T16:56:50.336Z
modDatetime: 2020-01-04T18:11:41.000Z
title: "2018 年 までのコンテナ関連の動向について"
draft: false
tags:
  - "Wip"
  - "Container"
  - "Kubernetes"
  - "Docker"
aliases:
  - "/2013-2018-container-85d169b6965e"
description: "コンテナ関連の動きを2013年〜2018年にかけて書いてみた。"
timezone: "Asia/Tokyo"
---

個人的に必要になったため、簡単にまとめてみた。  
 メモであり、主観がはいっているため必ずしも正しいとは限りませんが、まとめ中の情報をメモとして公開します。

Work in Progress. 書くのに時間がかかるため一旦パブリッシュ

_TODOs_

*   [] DockerCon関連を追記
*   [] k8s 関連を追記
*   [] 各クラウドプロバイダーの動きを追記

## 2013 年 〜 2018年にかけて（簡単にまとめ）

*   2013年 Docker 現る
*   2014年 注目を浴びるDocker
*   2015年 進撃のDocker、 エコシステム周り強まる
*   2016年 Docker一般化する、みんなが使う時代に
*   2017年 コンテナオーケストレーション戦国時代
*   2018年以降（予想）: 標準化が進み…

## 2013 年 Docker 現る

*   Evernoteの記録をみると自分で最初にDockerを知ったのが2013/6/17のようだ。その当時は仮想環境実現のための１つの手段として記録されている。
*   AUFSのファイルシステムでOSのイメージ差分を管理、実行環境としてLXCをベースとしていた時代。
*   ユースケースとしては Jenkins の ジョブを実行するなどのものが多かった。
*   年末ごろには Docker 0.7がリリースされ、ストレージドライバAPIを採用しプラガブルにした。

## 2014 年 注目を浴びる Docker

*   年初に Mac 対応。
*   1月にリリースされたThoughWorks社の「[TECHNOLOGY RADAR](http://thoughtworks.fileburst.com/assets/technology-radar-jan-2014-en.pdf)」にも ASSESSとして登場。
*   2014年３月 Docker 0.9 がリリースされ、LXCに依存しない形にlibcontainerを開発し同梱。
*   AWS, GCPなどがDocker対応を開始。
*   2014/6 Docker1.0リリース。
*   アプリケーションパッケージングとして認識され始める。 kubernetes(k8s)の活動が開始される。
*   Docker使うと簡単にアプリケーション立ち上げられるということがメリットに。
*   様々な買収劇、身売り劇が繰り広げられる。
*   かなり個人的だが、twitterのファボとかみてるといま仕事で関係している人たちのツイートをふぁぼっている。
*   年末頃には Google Container Engine (GCE) が発表。最近すべてのメジャーなパブリッククラウドプロバイダーがマネージドkubernetesをサポートしたがその先駆けとなった。
*   年末には CoreOSから Rocket が公開される。セキュリティ関連でい蝋色と揉めてた記憶あり。
*   Docker Machine/Swarm/Composeを発表。
*   個人的にはVagrant から VM起動をやっていた時代でDocker使うと起動早くなるかなぐらいの時代でした。なので、記録も曖昧。

## 2015 年 進撃のDocker、 エコシステム周り強まる

*   年明けは Rocket とのいざこざがあったイメージ。
*   少ししてから Machine/Swarm/Composeがリリースされる。
*   Docker 1.6 リリース、ロギングドライバの実装。
*   少しずつサービスで使うために必要なものを本家や周りが出し始める。マルチホストでのデプロイやネットワーク、ストレージ、ロギング、その他諸々の見直しが入り始める。
*   k8s + CoreOSの商用プラットフォーム、「Tectonic」が発表。
*   2015/5 には OpenStack で k8s、 Swarmを統合する「Magnum」が発表。
 ココらへんからオーケストレーションツール系の記事などもよく出始める「Rancher」もこの辺り。
*   Docker Con 2015
*   [runC発表](https://github.com/opencontainers/runc)
*   OCP(OpenContainer Project) 発足、後のOCI(OpenContainer Initiative)に。
*   DockerとCoreOSのいざこざが解決？して共同で標準仕様を策定していくようになる。
*   2015/8 自分が転職、このあたりから仕事でコンテナ使うようになる（いろんな意味で）。
*   本番運用時の課題に焦点があたり始める。
*   Mesosphere DCOSあたりも調べ始める（個人の動き）
*   Docker 1.9 Swarm、マルチポストネットワーキングが プロダクションレディに。
*   関連事項としてCNCFがこの時に設立。

## 2016 年 Dockerが一般的になる

*   Docker 社、Unikernel社を買収
*   やっぱり便利な開発環境
*   80人レベルDokcerハンズオン実施、環境つくるの大変だった。主にネットワークどうするかで悩んだ記憶あり。（個人の動き)
*   Docker Con 2016
*   Docker for Mac,Docker for Win登場
*   Docker Store
*   Docker Datacenter
*   etc…
*   AlpineLinuxを使い始める(個人の動き)
*   Docker Plugin リリース
*   ストレージやネットワークをプラガブルに、３rdパーティーのものを使えるようにインターフェースを定義
*   2016/11の TECHNOLOGY RADARでPlatformでADOPTに。
*   Docker datacenter/Cloudとかも併せて発表

書くの疲れてきたので雑に。

## 2017 年 コンテナオーケストレーション戦国時代

*   Docker Con 2017
*   moby project -hyperkit -vpnkit -Containerd -infrakit -linuxkit
*   2017/2 CoreOS fleet 開発終了
*   2017/3 Docker EE/CE, docker managed plugin
*   Moby Project 発表
*   CRI-O (Container Runtime for kubernets)
*   CNI(Container Network Interface)
*   CSI (Container Storage Interface)
*   Docker にk8s同梱の発表
*   CNCF に様々な企業が参加し、テクノロジーハブとしてCNCFが存在するようになる。
*   様々な商用コンテナプラットフォームのベースがk8sに
*   DockerCon 2017/1１ではユーザ事例などが多くなってきている。
*   2017/12 k8s 1.9 リリース。Workload API GA, CSI αリリース、Windows 対応の発表など

## 2018 年 Alternative Container Engine.

*   2017 年から 標準化の動きが活発化
*   Kubernetes/Container image のテストツールなどがリリースされ始める。

以上、個人的まとめ。
