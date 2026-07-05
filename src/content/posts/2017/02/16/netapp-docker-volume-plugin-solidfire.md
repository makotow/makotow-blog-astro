---
author: "makotow"
pubDatetime: 2017-02-16T05:59:51.534Z
modDatetime: 2020-01-04T18:10:56.000Z
title: "NetApp Docker Volume Plugin (SolidFire編)"
draft: false
tags:
  - "Tech"
  - "Netapp"
  - "Infrastructure"
  - "Docker"
  - "Docker Volume"
aliases:
  - "/netapp-docker-volume-plugin-solidfire%E7%B7%A8-5163b0d65ba3"
description: "NetApp Docker Volume Plugin (SolidFire編)"
timezone: "Asia/Tokyo"
---

## 12分で SolidFire Docker Volume Plugin を使う

**2017/7/27 追記時点では以下のURLの情報が最新です。**

* [Docker Managed Plugin でNetApp Docker Volume Plugin (ONTAP, SolidFire) を試す](https://medium.com/makotows-blog/docker-managed-plugin-system-ndvp-ac6aa362aa5b) 


前回([nDVP ONTAP編](http://www.netapp.com/jp/communities/tech-ontap/jp-tot-201612-netapp-docker.aspx))に引き続き、SolidFire編となります。

docker のバージョン、ホストOS, nDVP などのインストールは 前回([nDVP ONTAP編](http://www.netapp.com/jp/communities/tech-ontap/jp-tot-201612-netapp-docker.aspx))と同様の環境で行います。

今回は DockerホストからSolidFireの設定、Docker Volume を SolidFire上に作成する方法について説明します。

SolidFire 自体をご存知無い方は以下の記事を読んでいただくことをおすすめ致します。

* [SolidFire：次世代データセンターのためのオールフラッシュ](http://www.netapp.com/jp/communities/tech-ontap/jp-201607-tot-solidfire-all-flash-for-the-next-generation-data-center.aspx)

NetApp のフラッシュストレージの使い分けについては過去の記事が参考になります。

* [最適なフラッシュ システムを選択するためのアプリケーション ニーズの優先順位付け](http://www.netapp.com/jp/communities/tech-ontap/jp-201608-tot-choosing-the-right-flash.aspx)

## NetApp Docker Volume Plugin とは( 前回と同じ内容）

NetApp が提供しているすべてのフラッシュストレージ (All Flash FAS, E-series, SolidFire) を Docker へ統合し Docker Engine を拡張出来るようにしたものです。

nDVP の実現には Docker 社から提供されている Docker Volume Plugin という仕組みを使用しています。Docker Volume Plugin は永続化の仕組み である「 Docker Volume 」 のデータ保存先をホストOSだけではなく外部ストレージへのデータ永続化を提供する仕組みです。

当初は Docker からホスト OS 上にデータを永続化する仕組みを提供していましたが、 Docker version 1.8 から Docker Volume の保存先を外部ストレージへ永続化できるようにプラグインフレームワーク (Docker Volume Plugin) が提供されました。（図１：Docker Volume Plugin と nDVP の関係）


![図１: Docker Volume Plugin と nDVP の関係](1.png)

図１: Docker Volume Plugin と nDVP の関係


nDVP は Docker ホストOSに対してストレージリソースのプロビジョニング・管理をサポートしています。  
主な機能としては以下の通りです。

*   ストレージリソースのプロビジョニング/デプロビジョニング
*   ボリューム(Docker Volume, FlexVol)の作成・削除）
*   Docker Volume と FlexVol の紐付け
*   作成したFlexVolに対してデータ管理機能の設定
*   Docker ホストOS に対するボリュームの自動マウント/アンマウント

上記の機能を使用することで Docker Volume を使用する感覚で Docker コンテナから外部ストレージ(ONTAP FlexVol)へのデータ永続化を可能とします。

## Docker Volume Plugin を使用するまでの流れ

*   Docker ホストOS設定 (必要パッケージのインストール )
*   nDVP の conf ファイル設定
*   nDVP SolidFire の起動
*   docker volume の作成
*   docker 起動

今回は curl を使用して REST API のリクエストを発行します、返り値は json となります。今回はREST APIの結果を見やすくするため jq を使用します。

```bash
apt-get intall jq
```

## 検証環境(SolidFire クラスタの追加）

今回使用する環境は以下の通りです。（図２: 検証環境) クライアント部分は前回と同じです。 SolidFire クラスタが追加になりました。


![image](2.png)

図２: 検証環境



nDVP で使用する SolidFire の IP は以下の２つです。

マネジメント用の MVIP、ストレージ通信用のSVIP になります。

*   MVIP:192.168.199.224
*   SVIP:192.168.199.225

## SolidFire ユーザアカウント設定

SolidFire のコンフィグレーションは WebUI からオペレーションを行うか、REST API を使用してオペレーションを行います。

今回は REST API を使用してアカウントを作成します。

任意の作業ディレクトリに以下の json ファイルを作成してください。

json ファイル (create-account.json) を作成し curl で実行します。

```json
{  
        "method": "AddAccount",  
        "params": {  
	    "username": "docker",  
            "attributes": “”,   
        },  
        "id": 1  
}
```

実行コマンド

```bash
$ curl -k -X POST -H "Content-type: application/json-rpc" --data @create-account.json "https://admin:solidfire@192.168.199.224/json-rpc/7.0" | jq .
```

結果

```json
{  
        "id": 1,  
        "result": {  
                "accountID": 1  
                }  
}
```

作成できたことをREST API から確認します。

json ファイル (get-account.json) を作成し curl で実行します。

```text
json get-account.json
{  
        "method": "GetAccountByName",  
        "params": {  
                "username": "docker"  
        },  
        "id": 1  
}
```

実行コマンド

```bash
$ curl -k -X POST -H "Content-type: application/json-rpc" --data @get-account.json "https://admin:solidfire@192.168.199.224/json-rpc/7.0" | jq .
{  
    "id": 1,  
    "result": {  
        "account": {  
            "accountID": 1,  
            "attributes": {},  
            "initiatorSecret": "e!%V(17DkZH5[cen",  
            "status": "active",  
            "targetSecret": "7!##H8KzA6wQ3lmY",  
            "username": "docker",  
            "volumes": []  
        }  
    }  
}
```

WebUI から確認すると以下のように docker ユーザが作成されています。


![docker ユーザ作成](3.png)



## Docker ホストOSの設定

iscsi 接続をするために必要なパッケージを導入します。

```bash
sudo apt-get -y install open-iscsi
```

## NetApp docker volume plugin の設定

SolidFire用の設定ファイルを記載します。

以下のパスに jsonファイルを作成します。内容は以下の通りです。

*   /etc/netappdvp/solidfire.json
    
```json
{  
       "version": 1,  
       "storageDriverName": "solidfire-san",  
       "debug": true,  
       "Endpoint": "https://admin:solidfire@192.168.199.224/json-rpc/7.0",  
       "SVIP": "192.168.199.225:3260",  
       "TenantName": "docker",  
       "DefaultVolSz": 1,  
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
```

パラメータについて説明します。

* TenantName: 「SolidFire ユーザアカウント設定」で作成したユーザとなります。今回は「docker」としました。
* DefaultVolSz: オプションでボリュームサイズを指定しなかった場合に使用されるデフォルトサイズ。
* InitiatorIFace: iSCSI 通信を行うネットワークインターフェースを指定します。今回はインターフェースを１つのみの準備のため “default”としています。
* Types: docker volume 作成時に指定できる QoS のタイプ。ここではサービスカタログとしてボリュームのQoSを定義しています。

ndvp を起動します。

```bash
$ sudo netappdvp --volume-driver=solidfire-san --config=/etc/netappdvp/solidfire.json&  
[1] 4403  
/etc/netappdvp$ INFO[0000] Successfully initialized SolidFire Docker driver version 1.3
```

**Successfully initialized** で作成成功です。

SolidFire のボリュームを作成して、docker 起動時にコンテナにマウントします。

-o でオプション指定が可能で type=XXXX で solidfire.json に定義したボリュームのQoSタイプを指定できます。 size=XX でボリュームのサイズを指定します。

例として、サイズ10GBで MinQoS 6000IOPS、MaxQoS 8000IOPS、 BurstIOPS 10000IOPS のボリュームを作成します。

```bash
$ sudo docker volume create --driver solidfire-san --name vol-solid-1 -o size=10 -o type=Gold   
vol-solid-1  
$ cd /etc/netappdvp  
$ ls  
ontap-nas.json  solidfire.json  
$ sudo docker volume ls  
DRIVER              VOLUME NAME  
solidfire-san       vol-solid-1  
ontap-nas           vol1  
ontap-nas           vol2  
ontap-nas           vol3
```

Web UI からQoSの設定状況を確認します。(4kbのQoS が Gold で定義しているものになっている)

![QoS](4.png)

コンテナ起動とボリュームマウントをします。

永続化できていることを確認するためファイルの作成をします。

```bash
$ sudo docker run --rm -it --volume-driver solidfire-san --volume vol-solid-1:/mnt alpine ash  
/ # ls  
bin      dev      etc      home     lib      linuxrc  media    mnt      proc     root     run      sbin     srv      sys      tmp      usr      var  
/ # cd mnt  
/mnt # touch test  
/mnt # ls  
lost+found  test  
/mnt # echo "persistent storage" &gt; test  
/mnt # exit
```

一度コンテナを削除した後に上記で書き込んだテストファイルが存在するか、内容が永続化されているかを確認します。
```bash
$ sudo docker ps  
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES  
$ sudo docker ps -a  
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES  
$ sudo docker run --rm -it --volume-driver solidfire-san --volume vol-solid-1:/mnt alpine ash  
/ # cd /mnt  
/mnt # ls  
lost+found  test  
/mnt # cat test  
persistent storage  
/mnt #
```

/mnt/test ファイルが存在し、内容が永続化されていることを確認できました。

## エラー発生時の対処方法

solidfire docker voluem plugin の以下のログファイルに出力されています。

*   /var/log/netappdvp/solidfire-san.log

## 技術情報

*   [Volume Options with the NetApp Docker Volume Plugin](https://netapp.github.io/blog/2016/06/16/volume-options-with-the-netapp-docker-volume-plugin/)
*   [Announcing the NetApp Docker Volume Plugin SolidFire Driver](https://netapp.github.io/blog/2016/06/29/announcing-netapp-docker-volume-plugin-solidfire-driver/)

## まとめ

ここまで10分程度で読めたかと思います。

実際に設定を行い、 docker volume plugin からSolidFire上にボリュームを作成するまで１時間もかからずできます。

NetApp Docker Volume Plugin を使用することでdocker volume から透過的に SolidFire のボリュームを使用することができ堅牢なデータ永続化を提供します。
