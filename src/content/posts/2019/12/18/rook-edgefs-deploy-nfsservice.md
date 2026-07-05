---
author: "makotow"
pubDatetime: 2019-12-18T14:45:23.688Z
modDatetime: 2020-01-04T18:12:34.000Z
title: "Rook: EdgeFS NFSサービスをデプロイする"
draft: false
tags:
  - "Kubernetes"
  - "Edgefs"
  - "Rook"
  - "Storage"
categories:
  - "2019-advent-calendar"
aliases:
  - "/rook-edgefs-nfs-service-65365863aa7e"
description: "Rookだらけの Advent Calendar 2019/12/18: Rook EdgeFS NFSをつかう"
timezone: "Asia/Tokyo"
---

この記事は「[Rookだらけの Advent Calendar](https://qiita.com/advent-calendar/2019/rook)」 2019/12/18分です。Rook EdgeFSについて記事を投稿します。
Rook EdgeFS NFSを使ってみたです。

## TL;DR
 
* efscliとNFS CRDで数分でNFSサービスを利用可能に


## やること

この記事では実際にプロビジョニングするところまでやってみたいと思います。

端的に言うと以下のステップでKubernetesクラスタまたは外部のホストからNFSサービスが利用可能になります。

1.  EdgeFS でサイト・テナントを作成
2.  NFSサービスを有効化する
3.  クライアントからマウント＆PV化
4.  気になるところは４日目：VDEV managementなど

## 事前準備

*   ノードにNFSクライアントを入れておく

## EdgeFS でクラスタ・テナント・バケットを作る

[昨日の記事](https://medium.com/makotows-blog/rook-edgefs-operator-6b3c379519c8)でEdgeFSクラスタをデプロイしたところから始まります。  
EdgeFS上にサイトやテナントをつくる には `efscli` というCLIを使います。ちなみにAWSのEFSではないです（はず）。

`efscli` はrook-edgefs-mgrというポッドに含まれています。

デプロイ済みのポッドを確認しましょう。

```bash
$ kubectl get po --all-namespaces | grep edgefs-mgr rook-edgefs          
rook-edgefs-mgr-795c59c456-pgdrm        3/3     Running   0
```

ポッド名がわかったのでログインします。

```bash
kubectl exec -it -n rook-edgefs rook-edgefs-mgr-795c59c456-pgdrm -- env COLUMNS=$COLUMNS LINES=$LINES TERM=linux toolbox 
```

ログインすると以下のメッセージが表示されます。

```bash
Defaulting container name to rook-edgefs-mgr. Use 'kubectl describe pod/rook-edgefs-mgr-795c59c456-pgdrm -n rook-edgefs' to see all of the containers in this pod.  Welcome to EdgeFS Mgmt Toolbox. Hint: type neadm or efscli to begin
```

`efscli` の他にも `neadm` というツールが入っているようです。今回は使用しません。

クラスタの正常性の確認をします。efscli system status で無事３ノードオンラインであることがわかりました。

```bash
# efscli system status 
ServerID 0BB3CBC69F1727D1FDD4A3E0285863B6 worker3:rook-edgefs-target-0-0 ONLINE 
ServerID FACE8E0BBE22B723E4530FAB11F566AD worker1:rook-edgefs-target-1-0 ONLINE 
ServerID 89CC529B2CB846199F37FE6594224118 worker2:rook-edgefs-target-2-0 ONLINE
```

EdgeFSを初期化するコマンドを実行したのですが、すでに初期化されている旨のメッセージが出力されました。ドキュメントの反映が追いついていないのか、振る舞いが変わったのでしょう。

```bash
root@rook-edgefs-mgr-795c59c456-pgdrm:/opt/nedge# efscli system init   Already initialized  
System GUID: 30CB31D57B0D491FAFFD81AA62892445 ccow_system_init err=-17
```

クラスタ、テナント、バケットを作ります。

(見づらいのでプロンプトを削ります。）

```bash
# efscli cluster create japan   
# efscli tenant create japan/tokyo   
# efscli bucket create japan/tokyo/bucket1   
# efscli tenant create japan/osaka   
# efscli bucket create japan/osaka/bucket1`
```

クラスタが一番上の概念で、複数のテナントがクラスタ配下にある。  
バケットはテナントごとにあるとというイメージです。

作成したバケットごとにNFSサービスを作成します。

```bash
# efscli service create nfs nfs-tokyo root@rook-edgefs-mgr-
# efscli service serve nfs-tokyo japan/tokyo/bucket1 
Serving new export 2,tokyo/bucket1@japan/tokyo/bucket1 
# efscli service create nfs nfs-osaka 
# efscli service serve nfs-osaka japan/osaka/bucket1 
Serving new export 2,osaka/bucket1@japan/osaka/bucket1
```

有効にしたNFSサービスを確認する
```bash
# efscli service show nfs-tokyo 
X-Service-Name: nfs-tokyo 
X-Service-Type: nfs 
X-Description: NFS Server 
X-Servers: - 
X-Status: disabled 
X-Auth-Type: disabled 
X-MH-ImmDir: 1 
[   
  2,tokyo/bucket1@japan/tokyo/bucket1
]
```

exit でKubernetesの操作へ戻ります。

## NFS CRDの作成・適応

以下のようなCRDを作成します。以下のマニフェストは `tokyo` のみですが、osaka も同様に作成しました。


EdgeFS NFS CRD

```yaml
apiVersion: edgefs.rook.io/v1
kind: NFS
metadata:
  name: nfs-tokyo
  namespace: rook-edgefs
spec:
  instances: 1
```



metadata.nameに作成したNFSサービス名を入れます。  
instances はアクティブに動くNFSサービスの個数です。今回はお試しということで１で実施しています。今回のマニフェストはシンプルですが、より多くの設定項目をすることもできます。  
上記CRDを適応すると以下のような結果になります。


tokyo/osakaのNFSサービスを確認

```bash
❯ kubectl get svc --all-namespaces
NAMESPACE     NAME                        TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                                                                               AGE
default       kubernetes                  ClusterIP   10.96.0.1        <none>        443/TCP                                                                                                               47h
kube-system   kube-dns                    ClusterIP   10.96.0.10       <none>        53/UDP,53/TCP,9153/TCP                                                                                                47h
rook-edgefs   rook-edgefs-mgr             ClusterIP   10.97.189.186    <none>        6789/TCP                                                                                                              9h
rook-edgefs   rook-edgefs-nfs-nfs-osaka   ClusterIP   10.108.69.77     <none>        49000/TCP,2049/TCP,2049/UDP,32803/TCP,32803/UDP,20048/TCP,20048/UDP,111/TCP,111/UDP,662/TCP,662/UDP,875/TCP,875/UDP   14s
rook-edgefs   rook-edgefs-nfs-nfs-tokyo   ClusterIP   10.99.230.182    <none>        49000/TCP,2049/TCP,2049/UDP,32803/TCP,32803/UDP,20048/TCP,20048/UDP,111/TCP,111/UDP,662/TCP,662/UDP,875/TCP,875/UDP   25s
rook-edgefs   rook-edgefs-restapi         ClusterIP   10.107.169.160   <none>        8881/TCP,8080/TCP,4443/TCP                                                                                            9h
rook-edgefs   rook-edgefs-target          ClusterIP   None             <none>        <none>                                                                                                                9h
rook-edgefs   rook-edgefs-ui              ClusterIP   10.108.180.155   <none>        3000/TCP,3443/TCP                                                                                                     9h

```

rook-edgefs-nfs-nfs-tokyo/osaka ができている ことが確認できました。

## IPとマウントポイントの確認

NFSのマウントポイントとIPを確認します。  
IPはCluster IP として提供されます。取得したIPをめがけてshowount -e を実行するとパスが確認できます。

```yaml
master1:~$ showmount -e 10.99.230.182
 Export list for 10.99.230.182: /tokyo/bucket1 (everyone) 
master1:~$ showmount -e 10.108.69.77 
 
 Export list for 10.108.69.77: /osaka/bucket1 (everyone)
```

## 実際にNFSマウントしてみる

export パスがわかったので、マスターノードからNFSマウントしてみました。

```bash
master1:~/mnt$ df -h
Filesystem                         Size  Used Avail Use% Mounted on
udev                               1.9G     0  1.9G   0% /dev
tmpfs                              395M  1.7M  393M   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv   25G  5.6G   18G  24% /
tmpfs                              2.0G     0  2.0G   0% /dev/shm
tmpfs                              5.0M     0  5.0M   0% /run/lock
tmpfs                              2.0G     0  2.0G   0% /sys/fs/cgroup
/dev/loop0                          90M   90M     0 100% /snap/core/8213
/dev/loop1                          90M   90M     0 100% /snap/core/8268
/dev/vda2                          976M   77M  832M   9% /boot
tmpfs                              395M     0  395M   0% /run/user/1000
10.99.230.182:/tokyo/bucket1       512T     0  512T   0% /home/makotow/mnt/tokyo
10.108.69.77:/osaka/bucket1        512T     0  512T   0% /home/makotow/mnt/osaak
```


NFSとしての稼働は確認できました。

ちなみにEdgeFSはIDをLDAP, AD,Keystoneとの連携が可能そうでした。

上記の設定だとNFSｖ３を使っているようなのでユーザ制限はない状態でした。

では、PVC・PVとしてKubernetesへ見せる方法をやってみます。

## PV として割り当てる

サンプルにあった[storage-class.yaml](https://github.com/rook/rook/blob/master/cluster/examples/kubernetes/edgefs/storage-class.yaml)と[persistent-volume.yaml](https://github.com/rook/rook/blob/master/cluster/examples/kubernetes/edgefs/persistent-volume.yaml)を利用します。

```bash
❯ kubectl create -f storage-class.yaml
❯ kubectl create -f persistent-volume.yaml
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
edgefs-data-0 100Gi RWO Retain Available local-storage 23h
edgefs-data-1 100Gi RWO Retain Available local-storage 23h
```

PVをdescribeしてみます。

```bash
❯ kubectl describe pv edgefs-data-0
Name: edgefs-data-0
Labels: type=local
Annotations: <none>
Finalizers: [[kubernetes.io/pv-protection](http://kubernetes.io/pv-protection)]
StorageClass: local-storage
Status: Available
Claim:
Reclaim Policy: Retain
Access Modes: RWO
VolumeMode: Filesystem
Capacity: 100Gi
Node Affinity: <none>
Message:
Source:
Type: HostPath (bare host directory volume)
Path: /mnt/edgefs
HostPathType:
Events: <none>
```

ここまででPVへの割当ができました。あとは普通通りPVCを作成してあげればBindされるはずです。

## まとめ

NFSのサービスを立ち上げてPVに紐付けるまでを実施しました。

中身を見てみると、Service ではNFSv3に必要なポートが開いているため、クライアントからはSVC経由でNFSマウントをするようなイメージになります。

今までやってきてEdgeFS自体は**とりあえず試す**には簡単という印象です。Productionでどうやるかはしっかりした設計が必要そうです。

明日は今までの内容を深堀してデータの分散方法などを見ていきたいと思います。（VDEV management というキーワードです）

このあたりを読み解く予定です。

*   [https://rook.io/docs/rook/master/edgefs-vdev-management.html](https://rook.io/docs/rook/master/edgefs-vdev-management.html)
