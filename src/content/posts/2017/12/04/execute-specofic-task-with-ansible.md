---
author: "makotow"
pubDatetime: 2017-12-04T07:35:44.029Z
modDatetime: 2020-01-04T18:11:33.000Z
title: "Ansible で特定のタスクだけを行いたい (進行中)"
draft: false
tags:
  - "Ansible"
  - "Tech"
  - "Automation"
aliases:
  - "/ansible-%E3%81%A7%E7%89%B9%E5%AE%9A%E3%81%AE%E3%82%BF%E3%82%B9%E3%82%AF%E3%81%A0%E3%81%91%E3%82%92%E8%A1%8C%E3%81%84%E3%81%9F%E3%81%84-%E9%80%B2%E8%A1%8C%E4%B8%AD-29b22360b8ad"
description: "Ansibleで一部分だけ実行する方法を調べた"
timezone: "Asia/Tokyo"
---

## playbook がおおきくなると…

playbook に多くの roles やタスクが増えて来ると時間がかかるので一部分だけ使いたいというときに待つ時間が長くなることがある。

どうやって解決するかを調べた。  
 具体的には以下の２つで殆どの場合は解決できそう。  

* tags を活用  
* 対象ホスト、タスクを指定する方法

## tagsを活用

```bash
$ ansible-playbook -i lab site.yml --tags &#34;docker&#34; --private-key ~/.ssh/lab_id_rsa  --ask-become-pass  -vvv
```

playbookの内容は以下のとおり。

[Add tags to provision partially. · makotow/ndvp-provisioning@ea635f9](https://github.com/makotow/ndvp-provisioning/commit/ea635f9e3086cee4dab38d4c4c57e0527fee0719)


## 対象のホスト、タスクを指定

以下の記事がわかりやすい。

```text
--l : 対象のホストパターン  
--start-at: 実行したタスク名  
--step: 上記の–start-at で指定したタスク以降実行されるので、ステップ実行する。
```

[ansibleで特定のtaskを特定のhostに実行する - Qiita](https://qiita.com/346@github/items/00122556cb2bd6f57998)
