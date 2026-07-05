---
author: "makotow"
pubDatetime: 2017-03-11T15:23:21.715Z
modDatetime: 2020-01-04T18:10:58.000Z
title: "Docker に Community Edition と Enterprise Edition が登場、バージョニングポリシーも変更に"
draft: false
tags:
  - "Docker"
aliases:
  - "/docker-%E3%81%AB-community-edition-%E3%81%A8-enterprise-edition-%E3%81%8C%E7%99%BB%E5%A0%B4-%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%8B%E3%83%B3%E3%82%B0%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC%E3%82%82%E5%A4%89%E6%9B%B4%E3%81%AB-43cf4c394858"
description: "Docker に Community Edition と Enterprise Edition が登場、バージョニングポリシーも変更に"
timezone: "Asia/Tokyo"
---

## Docker がエンタープライズレディに

少しまえの話になりますが docker store を試してみようと思いDockerのページに行ったら docker enterprise と community が発表されていました。

同時にバージョニングのポリシーも変更になり、今までは 1.12 など数字を積み上げていくバージョニングでしたが、これからは YY.MM 形式になります。(2017年3月リリースならば、17.3 など、IntelliJのようなバージョンポリシー）

今までの Docker を Community Edition として提供。

Enterprise 用途として Enterprise Edition を提供。

Enterprise Edition では Docker Datacenterなど統合的に管理する仕組み、マルチテナント、認証等が可能になっています（Enterprise も更に3つに細分化されている）

プライベートリポジトリが community では使えないように見えるのでさらなる確認が必要。

詳細は以下のURLに。

*   アナウンス：https://blog.docker.com/2017/03/docker-enterprise-edition/
*   料金、CE/EE の違い：https://www.docker.com/pricing

Docker をビジネスでつかう準備が整ったという状況と考えられます。

## docker コマンドからバージョン確認

実際 docker のバージョンを上げ、コマンドで確認しました。

```bash
$ sudo docker version  
Client:  
 Version:      17.03.0-ce  
 API version:  1.26  
 Go version:   go1.7.5  
 Git commit:   60ccb22  
 Built:        Thu Feb 23 11:02:43 2017  
 OS/Arch:      linux/amd64  

Server:  
 Version:      17.03.0-ce  
 API version:  1.26 (minimum version 1.12)  
 Go version:   go1.7.5  
 Git commit:   60ccb22  
 Built:        Thu Feb 23 11:02:43 2017  
 OS/Arch:      linux/amd64  
 Experimental: false
 ```
