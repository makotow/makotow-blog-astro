---
author: "makotow"
pubDatetime: 2019-01-22T10:49:58.040Z
modDatetime: 2020-01-04T18:12:07.000Z
title: "NetApp Kubernetes Service Part3 はじめての Helm Chart"
draft: false
tags:
  - "Tech"
  - "Netapp"
  - "Kubernetes"
  - "Helm"
aliases:
  - "/netapp-kubernetes-service-part3-helmchart-c50be5fe42ea"
description: "NKSでオリジナルのHelmChartを登録する。"
timezone: "Asia/Tokyo"
---

## 自分で創るHelm Chart編

NetApp Kubernetes Service (NKS)の使い所を見ながら、ポイントとなる機能をみていくシリーズです。

第3回目はNKS の Solutionsに自身のアプリケーションリポジトリをインポートする方法です。

*   [NKSを使う](https://medium.com/makotows-blog/netapp-kubernetes-service-part1-nks-179211138638)
*   [Heptio Arkを使ってバックアップ・リストア](https://medium.com/makotows-blog/netapp-kubernetes-service-part2-kubernetes-backup-restore-with-heptio-ark-a0b5e24597c1)
*   **今回** 自作Helm Chartを登録する
*   Federationを試す！
*   ServiceMeshを試す！


## 概要

NKSのSolutionsにはいくつかのカテゴリがあり、以下の３つが提供されています。


![](1.jpeg)



1.  NetApp Container Engine Solutions
2.  Trusted Charts
3.  MyCharts

1 に関してはNetAppが提供しているSolution（k8sにデプロイするもの）です。  
 2, 3 は Helm Chartsが定義されています。

2 についてはNetApp(正確にいうとStackPoint Cloudを買収）のGitHubリポジトリで公開・ホストされています。

3は自身で公開しているHelm ChartsをNKSへ取り組むことができる機能です。  
 今回のこの部分についてどうすれば登録できるかを説明していきます。

## 登録の方法

わかってしまえば単純でHelmのリポジトリの作り方通りに作ってリポジトリに公開すれば終わりです。Multiple Repository とsingleがありますが必要に応じて作り方を変更します。

[Helm - The Package Manager for Kubernetes.](https://docs.helm.sh/developing_charts/)


## オペレーション

NKSの画面で 「Solutions」-&gt;「CHARTS REPOS」と遷移後、以下の画面になります。


![](2.jpeg)

リポジトリ登録



ここで右上の以下のアイコンをクリックします。


![](3.jpeg)

インポートボタン



![](4.jpeg)

リポジトリ選択画面



登録時には「Github Repository URL」に以下のURLを入れます。  
 ポイントはstableまで入れるところです。

*   [https://github.com/makotow/ndx-charts/tree/master/stable](https://github.com/makotow/ndx-charts/tree/master/stable)

URL 入力後「REVIEW REPOSITORY」をクリックします。


![](5.jpeg)



確認画面となるので「SAVE REPOSITORY」をクリックします。


![](6.jpeg)



少し待つと以下の画面となりインポート成功です。


![](7.jpeg)



MyChartにもJenkinsが登録されました。（自身のリポジトリにJenkinsを作った）


![](8.jpeg)



## まとめ

自作Helmチャート、主に自身で作ったユーティリティやアプリケーションを登録することでNKSからデプロイ・管理することができるようになります。
