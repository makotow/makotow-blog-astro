---
author: "makotow"
pubDatetime: 2017-03-23T07:12:26.115Z
modDatetime: 2020-01-04T18:11:04.000Z
title: "E-Series Grafana-Graphite Integration"
draft: false
tags:
  - "Docker"
  - "Grafana"
  - "Graphite"
  - "E Series"
  - "Tech"
aliases:
  - "/e-series-grafana-graphite-integration-112ece220b48"
ogImage: "1.png"
description: "E-Series Grafana-Graphite Integration"
timezone: "Asia/Tokyo"
---

## [E-Series Grafana Graphite Integration](https://github.com/plz/E-Series-Graphite-Grafana) でモニタリング

*   [https://github.com/plz/E-Series-Graphite-Grafana](https://github.com/plz/E-Series-Graphite-Grafana)

今回 は ONTAP の Grafana 連携である harvest を参考に作成された E-Series-Graphite-Grafana の紹介、構築手順を紹介します。

E-Series 単体のパフォーマンスメトリクスを取得するツールだと一時的な性能情報しか取れず後に確認したい場合などに困ることがあります。E-Series-Graphite-Grafana を使用すれば、データは時系列DBの Graphiteに保存でき、可視化は Grafana を使用して直感的にわかりやすいGUIを提供します。

## 完成形の画面


![完成形](1.png)



## 必要スペック(稼働確認したスペック）

今回紹介する環境を稼働させたスペック、サーバ構成を記載します。

今回は簡易的に性能情報を取得する目的であったため、1VMにすべてを詰め込んだ構成になっています。

*   CentOS 7 (server platformをインストール)
*   SELinux は disable
*   E-Series WebService Proxy 2.0
*   Grafana
*   Perl 5.18cpanモジュールは以下を導入しています。
	*   LWP::UserAgent
	*   MIME::Base64
	*   JSON
	*   Config::Tiny
	*   Benchmark
	*   Scalar::Util

## 今回構築する環境

今回は簡易化のために Grafana/Graphite は Docker Hub で公開されている docker image を使用しました。選定したポイントとしては環境変数で様々な設定ができるようになっている Docker イメージを使用しています。

「E-Series Graphite Grafana」 は CentOS へインストールしています。

Perl 5.18 で稼働を確認しているため plenv を使用し、

必要な CPAN モジュールのインストールには cpanm を使用しています。

## 使用するGrafana + Graphite docker image

以下の２つの Docker イメージを使用しました。

*   [Docker Image for Graphite &amp; Statsd](https://github.com/hopsoft/docker-graphite-statsd)
*   [Grafana XXL](https://github.com/monitoringartist/grafana-xxl)

データ永続化のため以下のフォルダを作成します。

*   /opt/graphite-grafana/grafana
*   /opt/graphite-grafana/graphite/configs
*   /opt/graphite-grafana/graphite/data
*   /opt/graphite/storage

## Grafanaの起動

```bash
docker run -d -p 3000:3000 -v /opt/graphite-grafana/grafana:/var/lib/grafana  -e "GF_SERVER_ROOT_URL=http://10.128.221.213" -e "GF_SECURITY_ADMIN_PASSWORD=admin" monitoringartist/grafana-xxl:latest
```

## Graphite の起動

```bash
docker run -d --name graphite --restart=always -p 80:80 -p 2003-2004:2003-2004 -p 2023-2024:2023-2024 -p 8125:8125/udp -p 8126:8126 -v /opt/graphite-grafana/graphite/configs:/opt/graphite/conf -v /opt/graphite-grafana/graphite/data:/opt/graphite/storage -v /opt/graphite-grafana/graphite/statsd:/opt/statsd hopsoft/graphite-statsd
```

**Docker volume を指定するときのホスト側のパスは絶対パスであることに注意してください**

## SANTricity Manager の設定

E-Series SANTricityから以下の２つの設定を行います。

admin のパスワード設定

「SetUp」 タブから administrator パスワードの変更


![パスワード設定](2.png)

Setup タブから Administratorのパスワード変更

「Performance」タブから 性能情報取得用のカウンタ起動


![パフォーマンスカウント起動](3.png)

SANTricity Managerの画面（性能情報）

![スタートをクリック](4.png)

統計情報収集のモニタ起動

## WebService Proxy (WSP) の設定

E-Series-Graphite-Grafana は性能情報を取得するため、 WebService Proxy を使用します。

WebService Proxy とは E-Series のプロビジョニング・構成情報取得をREST APIで可能にする API エンドポイントです。

*   WSP 自体のインストールはマニュアル参照
*   WSP の設定 (/opt/netapp/santricity_web_services_proxy/wsconfig.xml) の設定

以下に wsconfig.xml のサンプルを記載します。
```xml
<config version=”1">``<! — non-ssl port if not specified, no listener is made -->  
 <sslport clientauth=”request”>8443</sslport>  
 <! — comma seperated list of protocols Possible values: SSLv3,TLSv1,TLSv1.1 -->  
 <exlude-protocols>SSLv3</exlude-protocols><port>8080</port>  
 <workingdir>/opt/netapp/santricity_web_services_proxy/working</workingdir>  
 <datadir>data</datadir>  
 <appkey>webapi-2.0</appkey>  
 <enable-auto-update>false</enable-auto-update><msgqueue-port>61616</msgqueue-port>  
 <env-entries>  
 <! — Logger configuration. Use INFO (standard) or FINE (debugging). -->  
 <! — Both stats.poll keys must be set to collect analyzed stats. -->  
 <! — stats.poll.interval is expressed in seconds. -1 means disabled. 0 is no delay. -->  
 <! — stats.poll.save.history is expressed in days. 0 means disabled. -->  
 <env key=”trace.level”>INFO</env>  
 <env key=”audit.level”>INFO</env>  
 <env key=”system.level”>INFO</env>  
 <env key=”webserver.level”>INFO</env>  
 <env key=”enable-basic-auth”>true</env>  
 <env key=”mel.events.cache.max”>8192</env>  
 <env key=”autodiscover.ipv6.enable”>false</env>  
 <env key=”autodiscover.ipv4.enable”>true</env>  
 <env key=”stats.poll.interval”>60</env>  
 <env key=”stats.poll.save.history”>1</env>  
 <env key=”firmware.repository.path”>firmware</env>  
 </env-entries>  
</config>
```

*   WSP は systemctl で起動、標準で自動実行で設定されています。

## E-Series Grafana Graphite

GitHub からダウンロードしたモジュールはそのままは使用できないため3ファイル変更しました。

*   eseries-metrics-collector.pl の 起動シェルの変更
*   Systemctl に登録する際のパスの変更
*   plenv で入れたPerl のパスに変更 (本番運用時は要検討）

設定項目としては WSPの接続先アドレス、接続時の接続情報の設定、graphiteの接続ポートの変更( docker image のものと揃える）

一連のインストール方法は以下の通りです。
```bash
$ cd /opt/  
$ mkdir netapp  
$ cd netapp/  
$ git clone [https://github.com/plz/E-Series-Graphite-Grafana.git](https://github.com/plz/E-Series-Graphite-Grafana.git)
```

以下に変更したファイルのdiff を提示します。
```bash
$ git diff  
diff --git a/graphite-collector/eseries-metrics-collector.pl b/graphite-collector/eseries-metrics-collector.pl  
index ab53561..ab39313 100755  
--- a/graphite-collector/eseries-metrics-collector.pl  
+++ b/graphite-collector/eseries-metrics-collector.pl  
@@ -1,4 +1,4 @@  
-#!/usr/bin/perl  
+#!/root/.plenv/shims/perl  

Copyright 2016 Pablo Luis Zorzoli  
@@ -28,7 +28,7 @@ use Benchmark;  
 use Sys::Syslog;  
 use Scalar::Util qw(looks_like_number);  

-my $DEBUG            = 0;  
+my $DEBUG            = 1;  # debug info  
 my $API_VER          = "/devmgr/v2";  
 my $API_TIMEOUT      = 15;  
 my $PUSH_TO_GRAPHITE = 1;  
diff --git a/graphite-collector/proxy-config.conf b/graphite-collector/proxy-config.conf  
index aed59ed..52e7b86 100644  
--- a/graphite-collector/proxy-config.conf  
+++ b/graphite-collector/proxy-config.conf  
@@ -1,7 +1,7 @@  

Santricity Web Services Proxy hostname, FQDN, or IP  

-proxy = mywebservice.example.com  
+proxy = localhost  

Protocol (http|https)  
@@ -20,14 +20,14 @@ port = 8080  
User and password to connect with  

 user        = ro  
-password    = XXXXXXXXXXXXXXX  
+password    = ro  

Graphite Details  

 [graphite]  
 server      = localhost  
-port        = 3002  
+port        = 2003  
 proto       = tcp  
 root        = storage.eseries  
 timeout     = 5  
diff --git a/misc/eseries-metrics-collector.service b/misc/eseries-metrics-collector.service  
index a32455d..4e4ba3e 100644  
--- a/misc/eseries-metrics-collector.service  
+++ b/misc/eseries-metrics-collector.service  
@@ -11,7 +11,8 @@ StandardOutput=syslog  
 StandardError=syslog  
 SyslogIdentifier=eseries  
 SyslogLevel=notice  
-ExecStart=/bin/dash -c "while true; do ./eseries-metrics-collector.pl -c proxy-config.conf ; sleep 60 ; done"  
+#ExecStart=/bin/dash -c "while true; do ./eseries-metrics-collector.pl -c proxy-config.conf ; sleep 60 ; done"  
+ExecStart=/bin/bash -c "while true; do ./graphite-collector/eseries-metrics-collector.pl -c ./graphite-collector/proxy-config.conf ; sleep 60 ; done" # /bin/dash -> /bin/bash へ変更、confファイルのパスを変更  
 Restart=on-failure  

man systemd.unit
```

E-series-metrics-collector を systemctl でサービスに登録します。

```bash
systemctl enable /opt/netapp/E-Series-Graphite-Grafana/eseries-metrics-collector.service  
systemctl start eseries-metrics-collector
```

## Grafana + Graphite の設定

ここまで設定ができたらGrafana から Graphite をデータソースとして登録します。

Graphite 起動時のパラメータで指定した URL を指定します。


![Grafana設定](5.png)

Grafana データソース登録画面

データソースを登録するとダッシュボード上で性能値を見ることができるようになります。

GrafanaにインポートするダッシュボードはGitHub上に公開されています。必要に応じてインポートしてください。

*   [https://github.com/plz/E-Series-Graphite-Grafana/tree/master/grafana-dashboards](https://github.com/plz/E-Series-Graphite-Grafana/tree/master/grafana-dashboards)

参考までにダッシュボードインポートの機能を説明します。

ダッシュボードのインポート方法は Grafana ログイン後に「Home」をクリックするとダッシュボードのインポート機能があります。

![ダッシュボードのインポート](6.png)

ダッシュボードインポート画面
インポートボタンをクリックすると jsonファイルをアップロードできるのでこの機能を使ってGrafanaにダッシュボードを追加します。

![ダッシュボードのインポート(JSON)](7.png)

ダッシュボードインポート画面

## トラブルシューティング

動作しないときの切り分けです。

*   E-Series コレクタが動いているか
*   ディスク容量が不足していないか
*   WSP の wsconfig.xml に設定されている stats.poll.save.history の設定値によってはメトリックス取得の頻度、保管期間によっては WSP で HTTP 503 エラーが発生しメトリックスが取得できなくなります。

## E-Series のコレクタが動いているか？

Systemctl のサービスとして登録しているのであれば以下のコマンドでログを確認

```bash
journalctl -xef -u eseries-metrics-collector
```

E-Series collectorが動作している場合は以下のスクリーンショットのように Graphite にStatistics が登録されています。


![Graphite 設定](8.png)

GraphiteにE-Series の Statistics が登録されていることを確認

## WebService Proxy に対象のE-Series を登録しているか

### 確認方法

```bash
$ curl -X GET --header "Accept: application/json" "http://10.128.221.213:8080/devmgr/v2/storage-systems" -u ro | jq .
```

### 実行結果

上記コマンドの結果を記載します。

```bash
$ curl -X GET --header "Accept: application/json" "http://10.128.221.213:8080/devmgr/v2/storage-systems" -u ro | jq .  

Enter host password for user "ro":  
 % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current  
								 Dload  Upload   Total   Spent    Left  Speed  
100  1582  100  1582    0     0  32308      0 --:--:-- --:--:-- --:--:-- 32958  
’[  
 {  
	"id": "1",  
	        "name": "nsc-e5660-02",  
	        "wwn": "60080E500029C65800000000567C8CB3",  
	        "passwordStatus": "valid",  
	        "passwordSet": true,  
	        "status": "optimal",  
	        "ip1": "10.128.223.45",  
	        "ip2": "10.128.223.46",  
	        "managementPaths": [  
	          "10.128.223.45",  
	          "10.128.223.46"  
	        ],  
	        "driveCount": 60,  
	        "trayCount": 1,  
	        "traceEnabled": false,  
	        "types": "",  
	        "model": "5600",  
	        "metaTags": [],  
	        "hotSpareSize": "0",  
	        "usedPoolSpace": "118747255799808",  
	        "freePoolSpace": "16355235463168",  
	        "unconfiguredSpace": "0",  
	        "driveTypes": [  
	          "sas"  
	        ],  
	        "hostSpareCountInStandby": 0,  
	        "hotSpareCount": 0,  
	        "hostSparesUsed": 0,  
	        "bootTime": "2017-02-07T03:23:13.000+0000",  
	        "fwVersion": "08.30.01.00",  
	        "appVersion": "08.30.01.00",  
	        "bootVersion": "08.30.01.00",  
	        "nvsramVersion": "N5600-830834-D01",  
	        "chassisSerialNumber": "1203FGK04651",  
	        "accessVolume": {  
	          "enabled": true,  
	          "volumeHandle": 16384,  
	          "capacity": "20971520",  
	          "accessVolumeRef": "2100000060080E5000437864000039EA5898DF68",  
	          "reserved1": "",  
	          "objectType": "accessVolume",  
	          "name": "Access",  
	          "id": "2100000060080E5000437864000039EA5898DF68",  
	          "wwn": "",  
	          "preferredControllerId": "",  
	          "totalSizeInBytes": "0",  
	          "listOfMappings": [],  
	          "mapped": false,  
	          "currentControllerId": ""  
	        },  
	        "unconfiguredSpaceByDriveType": {},  
	        "mediaScanPeriod": 30,  
	        "driveChannelPortDisabled": false,  
	        "recoveryModeEnabled": false,  
	        "autoLoadBalancingEnabled": true,  
	        "remoteMirroringEnabled": false,  
	        "fcRemoteMirroringState": "disabled",  
	        "asupEnabled": true,  
	        "securityKeyEnabled": false,  
	        "lastContacted": "2017-02-24T09:21:54.097+0000",  
	        "definedPartitionCount": 4,  
	        "simplexModeEnabled": false,  
	        "freePoolSpaceAsString": "16355235463168",  
	        "hotSpareSizeAsString": "0",  
	        "unconfiguredSpaceAsStrings": "0",  
	        "usedPoolSpaceAsString": "118747255799808"  
	      }  
]
```

### WSP への追加方法

WebService ProxyからE-Seriesを管理するためには、WSP の管理対象として E-Series を追加する必要があります。
```bash
$ curl -X POST --header "Content-Type: application/json" --header "Accept: text/html" -d "{  
 "id": "2",  
 "controllerAddresses": [  
	"10.128.219.103”,   
	"10.128.219.104",   
 ],  
 "password": "password",  
}" "http://10.128.221.213:8080/devmgr/v2/storage-systems" -u rw
```

## まとめ

今回は E-Series Graphite Grafana 連携を紹介しました。E-Seriesの性能評価を行う際にわかりやすく可視化し、長期間性能を取得したい場合に活用いただけるものとなります。Grafana との連携により既存のダッシュボード監視にストレージ監視を統合することができるようになります。
