---
author: "makotow"
pubDatetime: 2019-05-05T01:23:09.429Z
modDatetime: 2020-01-04T18:12:18.000Z
title: "Trident 19.04 & 19.04.1 Update"
draft: false
tags:
  - "Kubernetes"
  - "Trident"
  - "Netapp"
  - "Technology"
aliases:
  - "/trident-1904-release-overview-12f1ceb5ae5b"
description: "Trident 19.04 & 19.04.1 Update"
timezone: "Asia/Tokyo"
---

k8s dynamic storage povisioner: Volume Import機能が目玉か
Trident 19.04がリリースされました。

[NetApp/trident 19.04](https://github.com/NetApp/trident/releases/tag/v19.04.0)

[NetApp/trident 19.04.1](https://github.com/NetApp/trident/releases/tag/v19.04.1)


リリースノートを見ると細かいバグや利便性向上が入っています。

また、アップグレードに伴う問題がありGitHubのリリースページでは以下の文言が出ています。

これから導入する場合、アップグレードする場合はv19.04.01を使いましょう。

> Attention> An issue with **upgrades** to 19.04.0 has been identified that may cause existing backends to get set to an `unknown` state. That issue is resolved in 19.04.1.

<!--more-->
<!--toc-->

### リリース内容

原文抜粋は以下の通り。

**Fixes:**

*   Fixed panic if no aggregates are assigned to an ONTAP SVM.
*   **Kubernetes:** Updated CSI driver for 1.0 spec and Kubernetes 1.13. (Alpha release — unsupported)
*   **Kubernetes:** Allow Trident to start if one or more backend drivers fail to initialize.
*   **Kubernetes:** Fixed Trident to install on Kubectl 1.14. (Issue [#241](https://github.com/NetApp/trident/issues/241))

**Enhancements:**

*   Trident driver for NetApp Cloud Volumes Service in AWS.
*   **Kubernetes:** Import pre-existing volumes using the `ontap-nas`, `ontap-nas-flexgroup`, `solidfire-san`, and `aws-cvs` drivers. (Issue [#74](https://github.com/NetApp/trident/issues/74))
*   **Kubernetes:** Added support for Kubernetes 1.14.
*   **Kubernetes:** Updated etcd to v3.3.12.

External Snapshotterが入ると思っていましたが入っていない状況です。

１つ１つ内容を見ていきます。

## Fixes

*   **Fixed panic if no aggregates are assigned to an ONTAP SVM.**
通常SVMへ編集可能なaggregate(aggr-list)を割り当てるが、割当されていない場合にパニックになっていたのを直した。
*   **Kubernetes: Updated CSI driver for 1.0 spec and Kubernetes 1.13. (Alpha release — unsupported)** 
CSI 1.0 kubernetes 1.13 に対応、これはCSI 0.3 → 1.0 への対応の模様。
*   **Kubernetes: Allow Trident to start if one or more backend drivers fail to initialize.
** バックエンドにドライバ複数登録されている場合、１つでもフェイルするとすべてのバックエンドをスタートしなかったが動作できるものは動作させるように変更
*   **Kubernetes: Fixed Trident to install on Kubectl 1.14. (Issue** [**#241**](https://github.com/NetApp/trident/issues/241)**) 
**kubectl v1.14 でTrident Installer が失敗していたのものを修正。

## Enhancements

*   **Trident driver for NetApp Cloud Volumes Service in AWS.**
Cloud Volumes Service for AWS (a.k.a. CVS) をバックエンドに追加可能に。 
* CVS: AWS上でManaged Volume を提供するサービス、データ管理や、性能のSLAを提供
*   Kubernetes: Import pre-existing volumes using the ontap-nas, `ontap-nas-flexgroup`, `solidfire-san`, and `aws-cvs` drivers. (Issue [#74](https://github.com/NetApp/trident/issues/74)) Existing Volume import 機能を追加、Kubernetes クラスタ外からデータの持ち込みをストレージレイヤで可能になったもの。ずっと要望されていたものがようやく実装された。後ほど細かく見てみる。
*   Kubernetes: Added support for Kubernetes 1.14. 
そのまま k8s 1.14に対応
*   Kubernetes: Updated etcd to v3.3.12. 
そのまま etcd v3.3.12へアップデート。(Tridentは独自にPod内にetcdを持っている。）

## Import pre-existing volumes

一番待っていたこの機能。

既存のボリュームをKubernetesへインポートできる。

詳細は別で説明予定。（別記事 or 追記）

[https://netapp-trident.readthedocs.io/en/stable-v19.04/kubernetes/operations/tasks/volumes.html#importing-a-volume](https://netapp-trident.readthedocs.io/en/stable-v19.04/kubernetes/operations/tasks/volumes.html#importing-a-volume)

[https://netapp-trident.readthedocs.io/en/stable-v19.04/kubernetes/operations/tasks/volumes.html#behavior-of-drivers-for-volume-import](https://netapp-trident.readthedocs.io/en/stable-v19.04/kubernetes/operations/tasks/volumes.html#behavior-of-drivers-for-volume-import)

## Trident 19.04.1 が 5/4 にリリース

[NetApp/trident](https://github.com/NetApp/trident/releases/tag/v19.04.1)

[https://github.com/NetApp/trident/releases/tag/v19.04.1](https://github.com/NetApp/trident/releases/tag/v19.04.1)

これは前述したアップグレード関係の対応とその他の失敗時の動作を改善するような対応がほとんど。
