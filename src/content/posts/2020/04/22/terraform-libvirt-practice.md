---
author: "makotow"
pubDatetime: 2020-04-22T01:39:53+09:00
title: "Terraform で KVM を操作する"
draft: false
tags:
  - "kvm"
  - "libvirt"
  - "terraform"
  - "kubernetes"
categories:
  - "kubernetes-at-home"
description: "Terraform で KVM を操作する"
timezone: "Asia/Tokyo"
---

自宅 Kuberenetes の真心込めた手作りをやめようと思ってはじめた取り組みです。


Terraform から KVMを動プロビジョニングして、KubesprayでKubernetesクラスタを組もうという目的です。

libvirt を Terraformからうまく使うやり方がワカラナイので素振りを初めて見た記事となります。


まずはシンプルにUbuntuをプロビジョニングしてみます。

<!--more-->

<!-- toc -->

---

## やりたいこと

現状と目指すべき姿

* 現状: KVM作って、kubeadm + お手製スクリプトで構成、シングルノードクラスタ
* 目指すべき姿: Kubernetes クラスタをマスタの冗長構成や複数ワーカーで一発で構成
    
今後のステップ
 
* KVM はいい感じで Terraform でプロビジョニング
* Kubernetes は検討中だが、Ansible + kubeadm で自作、または kubespray 

なにより、Terraformとかゴリゴリ書くのが楽しい。

## 試したバージョン

バージョン

```bash
$ lsb_release -a
No LSB modules are available.
Distributor ID:	Ubuntu
Description:	Ubuntu 20.04 LTS
Release:	20.04
Codename:	focal

$ virsh --version
6.0.0

$  terraform --version
Terraform v0.12.24
+ provider.kubernetes v1.11.1
+ provider.libvirt (unversioned)
+ provider.template v2.1.2
```

こちらのリポジトリを素振り用にクローンしました。

https://github.com/fabianlee/terraform-libvirt-ubuntu-examples.git 

## 困ったところ

Terraform のセットアップや KVM, libvirt provider のセットアップは本家のチュートリアル通りに実施して特に問題ありませんでした。

実際にlibvirtを試そうとすると一部困るポイントがあったのでここではそのメモを残しておきます。

ずっとこんな感じのエラーが出ていたが‥

`terraform apply` した際に出力されたエラーメッセージ、全量は多いので抜粋。


```bash
Error: Error defining libvirt domain: virError(Code=9, Domain=20, Message='operation failed: domain 'simple' already exists with uuid 563b3bfa-67cd-481c-803f-2021803fe96c')
```

切り分けていくとどうやらlibvirtをTerraformから呼び出すときの問題というのがわかってきました。

* virsh から同様の操作を実施→OK
* Terraform apply 時のみ起こる

設定を再度見直していると以下のURLを見つけて対処。
以前実施済みのつもりでしたが、OSのアップデートをした際にもどっていたようす 。

* https://medium.com/@niteshvganesh/instructions-on-how-to-use-terraform-to-create-a-small-scale-cloud-infrastructure-8c14cb8603a3

`/etc/libvirt/qemu.conf` の以下の部分を書き換えたら問題は解決。

```shell
#       security_driver = [ "selinux", "apparmor" ]
# value of security_driver cannot contain "dac".  The value "none" is
# a special value; security_driver can be set to that value in
#security_driver = "selinux"
security_driver = "none"
```

## KVM で Ubuntu をデプロイする 

ちょうどよいサンプルがあったのでこちらをみながら実施。

1つ１つのサンプルが小さくまとまっており理解しやすい。

KVM もあまり良くわかっていなかったが、このサンプルを通して学べたのは Terraform で KVM をプロビジョニングするときに必要な最小限のステップ。

* https://github.com/fabianlee/terraform-libvirt-ubuntu-examples

流れとしては、

1. OS イメージの作成は `libvirt-volume` リソースを作成
2. cloud init 使いコンフィグファイルを設定する、`template_file` リソースを作成
3. ネットワーク設定の読み込み方法、`template_file` リソースを作成
4. 上記、cloud initとネットワークの設定リソースを `libvirt_cloudinit_disk` リソース内で設定
5. 仮想マシン作成、CPU、メモリ、ディスク、ネットワークを設定、`libvirt_domain`リソースを作成
    1. domain という名前がピンと来なかったがVMと理解すればスッキリした。

ここまで作って、

`terrafom plan` で問題なければ、`terraform apply` で実行、仮想マシンが作成される。

## terraform 便利サブコマンド

terraform のサブコマンドで以下２つは便利だった。

* terraform validate: ファイルのシンタックスエラーがないか確認
* terraform fmt: *.tf ファイルのフォーマットを実施してくれる。ある程度かいてから `terraform fmt` できれいにすることが可能

## その他

命名規則はスネークケース

* https://www.terraform-best-practices.com/naming

## 参考にしたブログやドキュメント

### Libvirt and KVM

* https://github.com/dmacvicar/terraform-provider-libvirt
* https://github.com/fabianlee/terraform-libvirt-ubuntu-examples
* https://fabianlee.org/2020/02/22/kvm-terraform-and-cloud-init-to-create-local-kvm-resources/

### Terraform 

Terraform 自体は本家のドキュメントがよくできているのでここだけでOKだと思います。

* https://www.terraform.io/docs/index.html