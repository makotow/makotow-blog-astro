---
author: "makotow"
pubDatetime: 2017-03-20T12:05:34.394Z
modDatetime: 2020-01-04T18:11:01.000Z
title: "Docker Store に NetApp Docker Volume Plugin 登場"
draft: false
tags:
  - "Docker"
  - "Docker Store"
  - "Ndvp"
  - "Tech"
aliases:
  - "/docker-store-netapp-docker-volume-plugin-cf5fc5422613"
description: "Docker Store に NetApp Docker Volume Plugin 登場"
timezone: "Asia/Tokyo"
---

## Docker Engine Managed plugin system

Docker CE/EEが発表されたと同時にdocker store に NetApp Docker Volume Plugin が登録されています。


![image](1.png)

nDVP at Docker Store



今までGitHub からバイナリをダウンロードしてインストールしていた方法と同じことを行うためにはどのようにすべきかを説明していきます。

この記事の目的は Docker Engine managed plugin systemを使用した nDVP の使い方を習得できるようになることです。

## Docker Managed Plugin System

Docker Managed Plugin system については以下の本家のページを参考にしてください。Docker イメージで plugin を配布する方法です。Docker Engine を使用してplugin のインストール、開始・停止・削除を 行うことができるようになります。

*   [https://docs.docker.com/engine/extend/](https://docs.docker.com/engine/extend/)

## インストール方法

Docker plugin コマンドでインストールが非常に簡単になっています。

3/11 現在では公式サイトのインストールコマンドに記載ミスがあり、正しくは以下の通りです。現在修正中のステータスとのことです。

```bash
修正前: docker plugin install store/netapp/ndvp-plugin:1.4.0  
修正後: docker plugin install netapp/ndvp-plugin:1.4.0
```

2017/4/12 追記

docker store記載の方法でも動作することを確認いたしました。

```bash
dokcer plugin install store/netapp/ndvp-plugin:1.4.0 
```

追記ここまで

以下にインストール時のログを記載します。必要となる権限やホストOS側にマウントされるパスが表示されます。

```bash
$ docker plugin install netapp/ndvp-plugin:1.4.0  
Plugin &#34;netapp/ndvp-plugin:1.4.0&#34; is requesting the following privileges:  
 - network: [host]  
 - mount: [/]  
 - mount: [/dev]  
 - mount: [/etc/netappdvp]  
 - mount: [/etc/iscsi]  
 - allow-all-devices: [true]  
 - capabilities: [CAP_SYS_ADMIN]  
Do you grant the above permissions? [y/N] y  
1.4.0: Pulling from netapp/ndvp-plugin  
379c219698bb: Download complete  
Digest: sha256:3ad1d542924f887c10be8b36c543544ceae87f147a87fae3934c6b3a63f04dfa  
Status: Downloaded newer image for netapp/ndvp-plugin:1.4.0  
Installed plugin netapp/ndvp-plugin:1.4.0  
$ sudo docker plugin ls  
ID                  NAME                       DESCRIPTION                          ENABLED  
11574b1ef056        netapp/ndvp-plugin:1.4.0   nDVP - NetApp Docker Volume Plugin   true
```

## docker plugin を使用した nDVPの使用方法について

docker plugin を使用した nDVP を試します。

まずはインストールをします。


```bash
$ docker plugin install netapp/ndvp-plugin:1.4.0 --alias ontap-nas --grant-all-permissions  
1.4.0: Pulling from netapp/ndvp-plugin  
379c219698bb: Download complete  
Digest: sha256:3ad1d542924f887c10be8b36c543544ceae87f147a87fae3934c6b3a63f04dfa  
Status: Downloaded newer image for netapp/ndvp-plugin:1.4.0  
Installed plugin netapp/ndvp-plugin:1.4.0
```

プラグインの設定を変更するため一旦無効化します

```bash
$ docker plugin disable ontap-nas:latest  
ontap-nas:latest
```

docker plugin コマンドを使用して設定変数を変更します。

ここではデバッグ実行を有効化して nDVP の設定ファイルのパスを個別に指定します。いままでのバイナリを起動する際のオプションでしていたことはすべて docker plugin set コマンドで指定することになります。

```bash
$ docker plugin set ontap-nas:latest debug=true config=/etc/netappdvp/ontap-nas.json  
$ docker plugin ls  
ID                  NAME                DESCRIPTION                          ENABLED  
663c0ac7039f        ontap-nas:latest    nDVP - NetApp Docker Volume Plugin   false
```

docker plugin を有効化して plugin として起動できるようにします。

```bash
$ docker plugin enable ontap-nas:latest  
ontap-nas:latest
```

実際にボリュームを作成します。

まずはボリュームが無いことを確認します。

```bash
$ docker volume ls  
DRIVER              VOLUME NAME
```

ボリュームの作成は今までと同じ方法です。

```bash
$ docker volume create -d ontap-nas --name=vol5 -o size=1g  
vol5  
$ docker volume ls  
DRIVER              VOLUME NAME  
ontap-nas:latest    vol5
```

## Docker plugin を複数ストレージに対応させる

Plugin 配布前の バイナリ版だと、設定ファイルをストレージバックエンドごとに準備し起動する形でした。

Plugin 形式になったことにより alias を設定することで複数のバックエンドストレージを登録します。

```bash
$ docker plugin install netapp/ndvp:1.4.0 alias=ontap  
$ docker plugin install netapp/ndvp:1.4.0 alias=solid
```

## まとめ

今回はいつもより短めで最近の話題について記事にしてみました。

Docker store ができたことで nDVP のインストールが楽になりました。

使い方も docker plugin として使用する形となるため自身で Linux のサービス登録等が必要なくなり、 docker のシステムへシームレスに統合され始めているものをご紹介しました。
