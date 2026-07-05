---
author: "makotow"
pubDatetime: 2017-06-11T15:54:53.353Z
modDatetime: 2020-01-04T18:11:14.000Z
title: "Ansible で sudo を実行する"
draft: false
tags:
  - "Ansible"
  - "Tech"
aliases:
  - "/ansible-%E3%81%A7-sudo-%E3%82%92%E5%AE%9F%E8%A1%8C%E3%81%99%E3%82%8B-bf7075c6feb0"
ogImage: "1.png"
description: "Ansible で sudo を実行する"
timezone: "Asia/Tokyo"
---

## Ansibleの基礎的なところ


![](1.png)



sudo実行時のパスワードをどうするかという話、調べた内容をメモとして残す。

以下のように、 become:true とした場合にいつどのようにパスワードを設定する方法を調べた。

```yaml
- name: common packages and utility tools install  
  become: true  
  apt:  
    pkg: “{{ item }}”  
    state: present  
    update_cache: yes  
    cache_valid_time: 3600  
   with_items: “{{ ndvp_packages }}”  
   notify:  
     - enable and start iscsi services
```

やり方は様々ある。

ケースに応じて適切に使えばいいと思う、調べたところ主に以下の３つを使うことができる。

1.  sudo時にパスワードを聞かれないようにする
2.  Ansible vaultを使う方法
3.  ansible-playbook 実行時にパスワード入力する方法## sudo 時にパスワードを聞かれないようにする方法

対象のホストで設定、sudo時にパスワードを聞かれないようにする。

sudoers(visudo) で編集で以下のように定義

```bash
ansibleuser ALL=NOPASSWD: ALL
```

ただし、上記の状態だとansibleuserであればすべてのコマンドがパスワードなしで実行できてしまうので以下のようにコマンドごとにパスワードなし実行とすることができる。

```bash
ansibleuser ALL=NPPASSWD: /path/to/cmd
```

プロビジョニングのホストに対して多く操作が必要になるので個人的にはあまり好まないやり方。

## Ansible Vault を使う方法

変数として定義する方法、平文で書くのは色々と問題があるのでそれを暗号化し保存するもの。ファイル単位の暗号化。

```bash
$ ansible-vault encrypt /path/to/file
```

Playbook を実行する際にパスワードを指定する必要あり。

ベストプラクティスはいかに記載があり。

暗号化するものと、平文のものを分けて保存する。group_vars以下に vars.yml, vault.ymlのように2つにファイルを分けて保存する方法があった。

[Best Practices - Ansible Documentation](http://docs.ansible.com/ansible/playbooks_best_practices.html#variables-and-vaults)


このやり方が一番綺麗にできると思う。暗号の復元パスワードは playbook実行にask-vault-pass をオプションでつけるか、ansible.cfg に ask_vault_pass = Trueを追加することで実行時にパスワードを求められる。

```bash
[defaults]  
ask_vault_pass = True`## ansible-playbook 実行時にパスワード入力する方法
```

最後のは非常にシンプルで playbook実行時にログイン先のsudo のパスワードを入力するやり方。

playbook実行時に `--ask-become-pass` をオプションで指定
```bash
$ ansible-playbook -i inventory site.yml --private-key ~/path/to/private-key  --ask-become-pass
```

ansible -vault使う手数とほぼ同じなのでシンプルに環境構築したい場合などはこれでいいと思う。## まとめ

個人的には

*   簡単に検証環境つくる際には ansible-playbook時にsudo パスワード入力
*   しっかり作り込む場合には Ansible Vault

という使い分けにしたい。
