---
author: "makotow"
pubDatetime: 2019-12-16T16:42:40.764Z
modDatetime: 2020-01-04T18:12:32.000Z
title: "Rook: EdgeFS をKubernetesへデプロイする"
draft: false
tags:
  - "Kubernetes"
  - "Rook"
  - "Edgefs"
  - "Storage"
categories:
  - "2019-advent-calendar"
aliases:
  - "/rook-edgefs-operator-6b3c379519c8"
ogImage: "admin.png"
description: "Rookだらけの Advent Calendar 2019/12/17: Rook EdgeFS Operator の力を実感する"
timezone: "Asia/Tokyo"
---

Rookだらけの Advent Calendar 2019/12/17: Rook EdgeFS Operator の力を実感する

この記事は「[Rookだらけの Advent Calendar](https://qiita.com/advent-calendar/2019/rook)」 2019/12/17分です。Rook EdgeFSについて記事を投稿します。

## TL;DR

*   **事前準備が終わっていれば3分でデプロイ可能**
*   事前要件はしっかりみておく
*   Operatorは偉大

この記事では実際にプロビジョニングするところまでやってみたいと思います。

<!--more-->

<!--toc-->

---

端的に言うと以下のコマンドで終了です。  
しかし、EdgeFSではクラスタ作成時の事前準備が必要となるためその部分を重点的に今日は書きたいと思います。

```bash
$ git clone https://github.com/rook/rook.git
$ cd cluster/examples/kubernetes/edgefs
$ kubectl create -f operator.yaml
$ kubectl create -f cluster.yaml
```

## 事前準備・今回の環境

*   Rook masterブランチを使用 (1fd1938234fd896d63150fb4fdd3a27204256d90)
*   Kubernetes v1.16.4: 1 master(2vCPU 4GiB memory), 3 worker(2vCPU, 8GiB memory)、KVMで準備
*   ホストマシン: AMD Ryzen 5 3600 6-Core Processor, 64GB memory, Ubuntu18.04
*   stern version 1.11.0

## デプロイの流れ

大まかな流れとしては

*   EdgeFS Operator導入
*   EdgeFSクラスタ導入

のステップです。

最初に書いたとおり3つのマニフェストを適応すれば完了です。

実際に試す際に引っかかりそうなところをピックアップし、Podの状態を確認しながら見ていきます。

正式な手順についてはこちらをご参照ください。[https://rook.io/docs/rook/master/edgefs-cluster-crd.html](https://rook.io/docs/rook/master/edgefs-cluster-crd.html)

## デバイスの設定

まずはじめにはまったのがデバイスを付与しておくというところです。なのでディスクをVMにつけておきましょう。今回はKVMで実施したので以下のようにVirtIOディスク２をEdgeFS用に付与しました。



![KVM の仮想マシンのディスク](1.png)




以下のような結果になればOKです。今回はvdbが対象のディスクになります。

```bash
$ sudo lsblk -l | grep vd
vda  252:0    0   30G  0 disk   
vda1 252:1    0    1M  0 part   
vda2 252:2    0    1G  0 part /boot  
vda3 252:3    0   29G  0 part   
vdb  252:16   0   10G  0 disk
```

ちなみにドキュメントにはカーネルパラメータを自動調整する旨記載があります。

> IMPORTANT EdgeFS will automatically adjust deployment nodes to use larger then 128KB data chunks, with the following addition to /etc/sysctl.conf:

もし嫌ならCRDで無効化しておきましょう。

[Rook Docs](https://rook.io/docs/rook/master/edgefs-cluster-crd.html)


## マニフェストの変更

基本的にはリポジトリのマニフェストをkubectl create -f で流していくだけで大丈夫です。

はじめにEdgeFS Operatorを導入します。

```bash
$ cd cluster/examples/kubernetes/edgefs
$ kubectl create -f operator.yaml
namespace/rook-edgefs-system created 
customresourcedefinition.apiextensions.k8s.io/clusters.edgefs.rook.io created 
customresourcedefinition.apiextensions.k8s.io/nfss.edgefs.rook.io created c
ustomresourcedefinition.apiextensions.k8s.io/swifts.edgefs.rook.io created 
customresourcedefinition.apiextensions.k8s.io/s3s.edgefs.rook.io created 
customresourcedefinition.apiextensions.k8s.io/s3xs.edgefs.rook.io created 
customresourcedefinition.apiextensions.k8s.io/iscsis.edgefs.rook.io created 
customresourcedefinition.apiextensions.k8s.io/isgws.edgefs.rook.io created 
clusterrole.rbac.authorization.k8s.io/rook-edgefs-cluster-mgmt created 
role.rbac.authorization.k8s.io/rook-edgefs-system created 
clusterrole.rbac.authorization.k8s.io/rook-edgefs-global created 
serviceaccount/rook-edgefs-system created 
rolebinding.rbac.authorization.k8s.io/rook-edgefs-system created 
clusterrolebinding.rbac.authorization.k8s.io/rook-edgefs-global created 
deployment.apps/rook-edgefs-operator created
```

Operatorが導入されたことを確認します。

```bash
❯ kubectl -n rook-edgefs-system get pod -o wide 
NAME                                    READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES 
rook-discover-7jvfk                     1/1     Running   0          76s   10.244.2.9    worker3   <none>           <none> 
rook-discover-h95k6                     1/1     Running   0          76s   10.244.1.10   worker2   <none>           <none> 
rook-discover-nmksm                     1/1     Running   0          76s   10.244.3.10   worker1   <none>           <none> 
rook-edgefs-operator-5c94848c48-dd84f   1/1     Running   0          84s   10.244.1.9    worker2   <none>           <none>
```

続いて、クラスタの作成です。

```bash
❯ kubectl create -f cluster.yaml 
namespace/rook-edgefs created
serviceaccount/rook-edgefs-cluster created
role.rbac.authorization.k8s.io/rook-edgefs-cluster created
rolebinding.rbac.authorization.k8s.io/rook-edgefs-cluster-mgmt created
rolebinding.rbac.authorization.k8s.io/rook-edgefs-cluster created
podsecuritypolicy.policy/privileged created
clusterrole.rbac.authorization.k8s.io/privileged-psp-user created
clusterrolebinding.rbac.authorization.k8s.io/rook-edgefs-system-psp created
clusterrolebinding.rbac.authorization.k8s.io/rook-edgefs-cluster-psp created
cluster.edgefs.rook.io/rook-edgefs created
```

最初はサンプルのマニフェストで実行していたところエラーが発生し、うまく行っておりませんでした。（エラーのログ失念…）

stern を使ってPodの状態を関しすることで気づけました。

```bash
stern . -n rook-edgefs-system
```

デバイスの使用部分のところで存在するものをすべて使おうとしていてエラーとなっていました。（**この記事だと３秒ぐらいで気づいたような記載ですが、ここに気づくのにすごい時間がかかった**）

ここらへんをヒントに対応して行きました。

[https://github.com/Nexenta/edgefs/issues/385](https://github.com/Nexenta/edgefs/issues/385)

ということであれば、cluster.yaml を以下のように修正し対応しました。

### Before

`useAllDevices: true`

### After

`useAllDevices: false`

シングルノードの場合はyamlの#sysRepCount: 1 のコメントを外してください。

デフォルトでは3なので３つの場所にレプリカを取れないとエラーとなります。

今回はマルチノードで実施したため変更はしませんでした。

## デプロイ後の確認

再度デプロイすると以下のように無事完了しました。

```
❯ kubectl get pod -n rook-edgefs -o wide 
NAME                               READY   STATUS    RESTARTS   AGE     IP            NODE      NOMINATED NODE   READINESS GATES 
rook-edgefs-mgr-795c59c456-pgdrm   3/3     Running   0          3m30s   10.244.1.15   worker2   <none>           <none> 
rook-edgefs-target-0               3/3     Running   0          3m30s   10.244.2.12   worker3   <none>           <none> 
rook-edgefs-target-1               3/3     Running   0          3m30s   10.244.3.13   worker1   <none>           <none> 
rook-edgefs-target-2               3/3     Running   0          3m30s   10.244.1.16   worker2   <none>           <none>
```


サービスも確認してみましょう。

```
❯ kubectl get svc --all-namespaces 
NAMESPACE     NAME                  TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE default       
kubernetes                          ClusterIP   10.96.0.1        <none>        443/TCP                      45h 
kube-system   kube-dns              ClusterIP   10.96.0.10       <none>        53/UDP,53/TCP,9153/TCP       45h 
rook-edgefs   rook-edgefs-mgr       ClusterIP   10.97.189.186    <none>        6789/TCP                     6h52m 
rook-edgefs   rook-edgefs-restapi   ClusterIP   10.107.169.160   <none>        8881/TCP,8080/TCP,4443/TCP   6h52m 
rook-edgefs   rook-edgefs-target    ClusterIP   None             <none>        <none>                       6h52m 
rook-edgefs   rook-edgefs-ui        ClusterIP   10.108.180.155   <none>        3000/TCP,3443/TCP            6h52m
```

サービスの中のrook-edgefs-ui が管理画面になっています。forwardして画面を確認しました。無事３ノード分のクラスタができていました。

![](2.png)

## ダッシュボード

仮想マシンを1台電源オフにすると 以下のようになりました。

![](3.png)

## まとめ

本日はEdgeFS Operatorの導入とクラスタの導入までを書きました。

事前要件さえ満たしていれば３分でできます。この記事を書くためにハマっていましたがなんかも作り直しをしました。Operatorを使うことでそれだけ簡単にできるということが身を持って理解できました。

確かに簡単に色々できてしまうのですが肝心の仕組みがうまく理解できません。むしろそこら辺を気にしなくていいようにOperatorが作られているので正しいのですが…。この件に関しては４日目に掘り下げていきたいと思います。

明日は本日作ったクラスタ上にNFSサービスを実行し、実際にPVとして見えるところまでを行います。
