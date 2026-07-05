---
author: "makotow"
pubDatetime: 2017-07-04T07:24:18.388Z
modDatetime: 2020-01-04T18:11:18.000Z
title: "NetApp Docker Volume Plugin with Ansible Playbook"
draft: false
tags:
  - "Docker"
  - "Tech"
  - "Ansible"
aliases:
  - "/netapp-docker-volume-plugin-with-ansible-playbook-383d3fad9eae"
ogImage: "1.png"
description: "NetApp Docker Volume Plugin with Ansible Playbook"
timezone: "Asia/Tokyo"
---

## nDVP を一発インストール


[makotow/ndvp-provisioning](https://github.com/makotow/ndvp-provisioning)


## Docker Volume Plugin のAnsible Playbookを作った

手作業で数十台のホストOSへのインストールを簡単にするために作成。

主な用途としてはPoCや自分で試してみようと思った際にAnsible流せば環境出来上がることを目標に作りました。

出来としてはファーストリリースで最低限のモノと理解して使っていただければと思います。（自分でももちろん使います。）

絶賛、エンハンス中です。

## ハマるかもしれないポイント

基本的には README.md [https://github.com/makotow/ndvp-provisioning](https://github.com/makotow/ndvp-provisioning)に細かく書きましたが幾つかはまりそうなところがあるので補足します。

## バックエンドストレージのパラメータ指定

`ndvp-provisioning/roles/ndvp/files/`

このパスに置いてある docker volume plugin の設定ファイルについてですが、現時点では SolidFireのみの提供です、他のバックエンドストレージを設定については今後ファイルを追加していく予定です。

また、ここで指定するマネジメントやストレージ通信用のIPについては、ansible playbook を実行した時点で疎通可能であることを推奨します。

Docker Volume plugin が定期的に疎通を確認しに行くため、疎通ができないとエラーログを出力し続けることになるためです。

## 今後について

機能追加や柔軟性を持たせることはこれからのフェーズで実施します。

まずは最低限のことができるようになったのでここで一旦公開をしたいと思います。

もちろん pull request は大歓迎です。
