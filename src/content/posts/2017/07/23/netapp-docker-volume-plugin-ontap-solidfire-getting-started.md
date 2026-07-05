---
author: "makotow"
pubDatetime: 2017-07-23T14:09:04.307Z
modDatetime: 2020-01-04T18:11:21.000Z
title: "Docker Managed Plugin でNetApp Docker Volume Plugin (ONTAP, SolidFire) を試す"
draft: false
tags:
  - "Tech"
  - "Docker"
  - "Ndvp"
  - "Netapp"
aliases:
  - "/docker-managed-plugin-system-ndvp-ac6aa362aa5b"
ogImage: "1.png"
description: "Docker Managed Plugin でNetApp Docker Volume Plugin (ONTAP, SolidFire) を試す"
timezone: "Asia/Tokyo"
---

## nDVPのインストールからボリューム作成まで


以前は各ホストに Docker Volume Plugin をインストールしていましたが、Docker version 1.13 以降はdocker コマンドで docker volume plugin をインストール可能となりました。

今回は docker volume plugin を使用したNetAppのインテグレーションを再度紹介します。

最後にこの記事で設定している内容を一括で設定する ansible-playbookを公開していますのでお試しで使ってみたい場合はこちらも活用ください。

## Docker Managed Plugin system

Docker Managed Plugin system は Docker イメージで plugin を配布する方法です。Docker Engine を使用してplugin のインストール、開始・停止・削除を行うことができるようになります。

*   [https://docs.docker.com/engine/extend/](https://docs.docker.com/engine/extend/)

## 今回紹介する内容・環境

今回の記事で検証した環境は以下の通りです。  
HostOSから docker コマンドを使用してストレージ側にボリュームの操作ができるところまでの設定を本記事で記載します。

![今回検証した環境](2.png)

事前に docker や必要なパッケージ、設定事項は導入済みである前提です。

*   Docker インストール
*   [nDVPに必要なパッケージ、事前準備](http://netappdvp.readthedocs.io/en/latest/install/host_config.html)

また、ONTAP上ではNFSサービスを提供しているSVMが作成済み、SolidFireでは ndvp用のユーザ（本記事ではdockerユーザ）が作成されていることを前提としています。

参考までに以下のURLにホストOS、ストレージの事前準備コマンドを公開しました。

*   ホストOSに必要なパッケージ等: [https://github.com/NetAppJpTechTeam/ndvp-provisioning/blob/master/docs/osoperations.md](https://github.com/NetAppJpTechTeam/ndvp-provisioning/blob/master/docs/osoperations.md)
*   ストレージバックエンドの設定サンプル: [https://github.com/NetAppJpTechTeam/ndvp-provisioning/blob/master/docs/storageoperations.md](https://github.com/NetAppJpTechTeam/ndvp-provisioning/blob/master/docs/storageoperations.md)

## docker volume plugin を使用して nDVP をインストール

今まで使用していた conf ファイルなどの変更は必要ありません。（詳細は[本家ドキュメント](http://netappdvp.readthedocs.io/en/latest/)参照）

ただし、以前はコマンドラインからプロセスを起動する手法で起動時に設定ファイルを設定できましたが、docker plugin としてインストールした場合はdocker コマンドで設定をします。
```bash
$ docker plugin install netapp/ndvp-plugin:17.07 --alias ontap-nas --grant-all-permissions --disable  
17.07: Pulling from netapp/ndvp-plugin
9d55698a43fb: Download complete
Digest: sha256:561da74049eaaba092c3686111eda7afbd82c6f07a04f05e77c66d305c4d4132
Status: Downloaded newer image for netapp/ndvp-plugin:17.07\
Installed plugin netapp/ndvp-plugin:17.07
```

インストールしたプラグインを確認します。 インストール時に — disable オプションを付与したためplugin は停止している状態(ENABLED列がfalse)です。

設定ファイルのパスをインストール後にpluginへ設定するため今回は無効に設定しています。
```bash
$ docker plugin ls
ID NAME DESCRIPTION ENABLED
3387a7644c11 ontap-nas:latest nDVP — NetApp Docker Volume Plugin **false**
```

SolidFire 用のプラグインをインストールします。
```bash
$ docker plugin install netapp/ndvp-plugin:17.07 --alias sf-san --grant-all-permissions --disable
17.07: Pulling from netapp/ndvp-plugin
9d55698a43fb: Download complete
Digest: sha256:561da74049eaaba092c3686111eda7afbd82c6f07a04f05e77c66d305c4d4132
Status: Downloaded newer image for netapp/ndvp-plugin:17.07
Installed plugin netapp/ndvp-plugin:17.07

$ docker plugin ls
ID NAME DESCRIPTION ENABLED
5c661e08b0fd sf-san:latest nDVP — NetApp Docker Volume Plugin false  
3387a7644c11 ontap-nas:latest nDVP — NetApp Docker Volume Plugin false
```

Docker volume plugin の設定を編集するための以下の手順 で設定を変更します。

1.  ndvp にセットする設定フォルダ・ファイルを作成します。
2.  その後、plugin に設定ファイルのパスを設定します。
    
```bash
$ sudo mkdir /etc/netappdvp  
$ sudo chown ``whoami``:docker /etc/netappdvp  
$ sudo chmod 775 /etc/netappdvp
```

※ /etc/netappdvp のフォルダのオーナー、権限は適切に変更してください。

設定ファイルの作成をします。まずはONTAP用の設定ファイルを作成
```bash
$ cat >> EOF < /etc/netappdvp/ontap-nas.json  
{  
  “version”: 1,  
  “storageDriverName”: “ontap-nas”,  
  “managementLIF”: “192.168.199.228”,  
  “dataLIF”: “192.168.199.227”,  
  “svm”: “ndvpsvm”,  
  “username”: “admin”,  
  “password”: “netapp123”,  
  “aggregate”: “aggr3”  
}  
EOF
```

SolidFire用も作成します。
```bash
$ cat >> EOF < /etc/netappdvp/sf-san.json{  

  "version": 1,  
  "storageDriverName": "solidfire-san",  
  "Endpoint": "https://admin:solidfire@192.168.199.224/json-rpc/7.0",  
  "SVIP": "192.168.199.225:3260",  
  "TenantName": "docker",  
  "InitiatorIFace": "default",  
  "Types": [  
    {  
      "Type": "Bronze",  
      "QoS": {  
        "minIOPS": 1000,  
        "maxIOPS": 2000,  
        "burstIOPS": 4000  
      }  
    },  
    {  
      "Type": "Silver",  
      "Qos": {  
        "minIOPS": 4000,  
        "maxIOPS": 6000,  
        "burstIOPS": 8000  
      }  
    },  
    {  
      "Type": "Gold",  
      "Qos": {  
        "minIOPS": 6000,  
        "maxIOPS": 8000,  
        "burstIOPS": 10000  
      }  
    }  
  ]  
}  
EOF
```

作成した設定ファイルを plugin に設定します。
```bash
$ docker plugin set ontap-nas debug=true config=ontap-nas.json  
$ docker plugin set sf-san debug=true config=sf-san.json
```

設定後に ndvp を有効にします。

```bash
$ docker plugin enable ontap-nas:latest  
ontap-nas:latest  
$ docker plugin enable sf-san:latest  
sf-san:latest
```

plugin が有効化されたことを確認します。
```bash
$ docker plugin ls

ID NAME DESCRIPTION ENABLED
3387a7644c11 ontap-nas:latest nDVP — NetApp Docker Volume Plugin true
5c661e08b0fd sf-san:latest nDVP — NetApp Docker Volume Plugin true
```

Volumeの作成を行います。
```bash
$ docker volume create -d ontap-nas --name=nfsvol -o size=1g  
$ docker volume create -d sf-san --name=sfvol -o size=1g  
sfvol  
$ docker volume ls  
DRIVER VOLUME NAME  
ontap-nas:latest nfsvol  
sf-san:latest sfvol
```

Docker volume create コマンド実行時のドライバを変更することで保存するバックエンドのストレージを変更することができます。

以上で、 docker manged plugin を使用した場合の一連の手順になります。

## 便利なオプション

docker volume create時に -oでオプションを指定することでストレージのネイティブ機能を使用することができます。

ここでは一番わかり易いボリュームのクローンを試します。  
-o で fromでコピー元となるボリュームの指定、fromSnapshot でボリュームが保有するsnapshotを指定することでストレージ側のクローンニングのAPIを実行する動作になります。

```bash
$ docker volume create -d ontap-nas --name mysql_1 -o from=appstack_mysql_base -o fromSnapshot=basedata-1
```

* -d: docker volume ドライバの指定
* -o from: コピーもととなるボリュームの指定
* -o fromSnapshot: ボリュームが保有するSnapshotの指定 (指定しない場合は、その時点のsnapsohtが作成される。

## プロビジョニングの自動化

お試しで使ってみたいという方向けに一括でdocker のインストール、ndvp のインストール、設定を含めて実施できる ansible-playbook を作成しました。

*   [https://github.com/NetAppJpTechTeam/ndvp-provisioning](https://github.com/NetAppJpTechTeam/ndvp-provisioning)

用途に応じて使用いただければと思います。

ぜひスターをつけてください。プルリクエスト大歓迎です。

## 技術情報

*   NetApp Docker Volume plugin の公式サイト: [https://netappdvp.readthedocs.io/en/latest/](https://netappdvp.readthedocs.io/en/latest/)
*   GitHubリポジトリ: [https://github.com/NetApp/netappdvp](https://github.com/NetApp/netappdvp)
*   The Pubコンテナ関連の記事: [http://netapp.io/category/containers/](http://netapp.io/category/containers/)
