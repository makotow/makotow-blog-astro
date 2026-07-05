---
author: "makotow"
pubDatetime: 2019-04-15T16:42:52.708Z
modDatetime: 2020-01-04T18:12:15.000Z
title: "As of 2019/4 Kubernetes CSI について"
draft: false
tags:
  - "Kubernetes"
  - "Storage"
  - "Containers"
  - "Technology"
  - "csi"
aliases:
  - "/as-of-april-2019-kubernetes-csi-875afa9feac"
description: "CSI current status/CSI の現状を調べてみた"
timezone: "Asia/Tokyo"
---

 CSI (Container Storage Interface)の仕様などの調査
このドキュメントは2019/4時点でCSIの現状を個人的にまとめた資料です。個人の興味の範囲で書いているため一部分抜けていたり、足りていない記述がある可能性があるため、正確な情報を得たい場合は文中で参照している一次情報源を参照いただくほうが確実です。ざっくり、こんな感じらしいを知りたい方はSummaryをご覧ください。

## Summary

CSI 1.0 がGAしており、各種コンテナオーケストレーションが共通したAPIで外部ストレージを使用できる共通仕様が策定されました。

少し前にアナウンスがあったCSI1.0リリースの公式ブログを参照しながら現状について調査してみました。

[Container Storage Interface (CSI) for Kubernetes GA](https://kubernetes.io/blog/2019/01/15/container-storage-interface-ga/)


結論的には以下のバージョンの組み合わせであれば正式リリースです。ただし、CSI1.0GAの中でも仕様としてはAlphaやBetaという機能があるので要注意です。

*   kubernetes v1.13
*   CSI: v0.3.0, v1.0.0
*   ステータス: GA
*   一部機能としてアルファ・ベータがあるので注意### なぜCSIが必要になり、どのように対応したのか？

上記のブログは2019年1月時点の情報のためkubernetes v1.13が最新の状態として記載されています。

CSI以前はKubernetesは強力なボリュームプラグインシステムを提供していましたが、Kubernetesに新しいボリュームプラグインのサポートを追加するのは困難でした。ボリュームプラグインのコードはKubernetesコードの一部であり、Kubernetesと共にリリースされることを意味します。

Kubernetesにストレージシステムのサポートを追加したい、または既存のボリュームプラグインのバグを修正したいベンダーは、Kubernetesのリリースプロセス・サイクルに合わせることを余儀なくされました。さらに、サードパーティのストレージコードがコアとなるKubernetesバイナリに信頼性とセキュリティの問題を引き起こし、Kubernetesのメンテナにとってテストと保守が困難なコードがしばしばありました。

CSIは、任意のブロックおよびファイルストレージシステムをKubernetesのようなContainer Orchestration Systems（CO）上のコンテナ化されたワークロードに公開するための標準として開発されました。 Container Storage Interfaceの採用により、Kubernetesボリュームレイヤは拡張可能になりました。 CSIを使用すると、サードパーティのストレージプロバイダーは、Kubernetesのコアコードに触れることなく、Kubernetesで新しいストレージシステムを公開するプラグインを作成して展開できます。

これによりKubernetesユーザーはより多くのストレージオプションを利用でき、システムの安全性と信頼性が高まります。

ココらへんまでは本家ブログを翻訳・意訳したもので特に補足するところはないというかこのまま今も変わっていないと考えています。
<!--more-->
<!--toc-->


## CSIがGAしたことでなにができるようになったのか？

**Kubernetes1.13はCSI spec v1.0 と v0.3 の互換性に対応**

*   v0.3.0とv1.0.0の間では破壊的変更が入っているが、kubernetes v1.13では両方ともサポートしている。どちらか一方を動かす場合は動作可能
*   CSI 1.0のリリースではCSI 0.3 以前のバージョンはdeprecatedとなり、kubernetes 1.15 で削除される予定です。
*   CSI v0.2とv0.3の間では破壊的変更は入っておらずv0.2を動かすにはkubernetes1.10以上のバージョンが必要
*   CSI v0.1とv0.2の間では破壊的変更が入っている、Kubernetes1.10以上を使い場合には0.2以上にアップデートの必要がある*   Kubernetesの**VolumeAttatchment**オブジェクトが kubernetes v1.13のstorage v1 グループに追加
*   **CSIPersistentVolumeSource**ボリュームタイプがGA
*   Kubeletのデバイスレジストレーションのメカニズム（KubeletがCSIのドライバをディスカバリーする仕組み）がKubernetes 1.13でGA

個人的に気になっていた、上記のページで記載のあるCSI 1.0 and 0.3 supportedの件が以下のページで説明がされています。

CSIドライバはすべてのkubernetesバージョンで互換性があるわけではないのでCSIドライバのドキュメントを参照し、各Kubernetesリリースごとのサポートされるデプロイ方法をチェックし、互換性のマトリックスを確認する必要があります。

[Volumes](https://kubernetes.io/docs/concepts/storage/volumes/#csi)


## Deploy の方法は？

CSI対応ドライバを作成している著者のドキュメントを参照。

## どのようにしてCSIボリュームを使用するのか？

CSIだからといって特別なことはなく、これまでと同様にPersistentVolumeClaims,PersistentVolumes,StorageClassというKubernetesストレージAPIオブジェクトから操作します。

Kubernetes1.13ではKubernetesのAPIサーバーで以下のフラグを設定する必要があります。

*   --allow-privileged=true
*   ほとんどのCSIプラグインは **bidirectional mout propagation**を必要とします。bidirectional mount propagationはPriviledge Pod が有効になっているポッドのみ有効にできます。Priviledge podは、上記のフラグ（ — allow-privileged）がtrueに設定されているクラスタでのみ許可されます（これはGCE、GKE、およびkubeadmのようないくつかの環境でのデフォルトです）。

## Dynamic Provisioning

DynamicProvisioningを使用する際にはStorageClass のProvisionerにCSIに対応したCSI Volume Pluginを指定することでボリュームの作成・削除の自動化を実現できます。

以下がサンプルのマニフェストです。

ポイントは **provisioner** の箇所にCSIプラグインの名前を入れるところです。

parameters配下のcsi.storage.k8s.ioはCSI external-provisionerで予約されているキープレフィックスです。（external-provisionerについては後ほど説明します。）

```yaml
kind: StorageClass  
apiVersion: storage.k8s.io/v1  
metadata:  
  name: fast-storage  
provisioner: csi-driver.example.com &lt;- ここにCSIプラグイン名を記載  
parameters:  
  type: pd-ssd  
  csi.storage.k8s.io/provisioner-secret-name: mysecret   
  csi.storage.k8s.io/provisioner-secret-namespace: mynamespace
```
今まで通りPVCを作成することでCSIプラグインを介してボリュームを動的に作成・削除することができます。

storageClassNameの箇所を上記で作成したStorageClassのmetadata.nameと同一にします。

```yaml
apiVersion: v1  
kind: PersistentVolumeClaim  
metadata:  
  name: my-request-for-storage  
spec:  
  accessModes:  
  - ReadWriteOnce  
  resources:  
    requests:  
      storage: 5Gi  
  storageClassName: fast-storage
```

## Pre-Provisioned Volumes

すでに存在しているボリュームについて手動でPersistentVolumeを作成することでKubernetesへ見せることができるようになります。

ここではspec.csi配下のdriverにCSIプラグイン名を記載し、volumeHandleに既存のボリューム名称を記載します。
```yaml
apiVersion: v1  
kind: PersistentVolume  
metadata:  
  name: my-manually-created-pv  
spec:  
  capacity:  
    storage: 5Gi  
  accessModes:  
    - ReadWriteOnce  
  persistentVolumeReclaimPolicy: Retain  
  csi:  
    driver: csi-driver.example.com  
    volumeHandle: existingVolumeName  
    readOnly: false  
    fsType: ext4  
    volumeAttributes:  
      foo: bar  
    controllerPublishSecretRef:  
      name: mysecret1  
      namespace: mynamespace  
    nodeStageSecretRef:  
      name: mysecret2  
      namespace: mynamespace  
    nodePublishSecretRef  
      name: mysecret3  
      namespace: mynamespace
```

## Attaching and mounting

PersistentVolumeClaimを使う場合と同じ。

CSIを使う・使わないはPVCのマニフェストで吸収されるのでPodやDeploymentからはPVCの名前しか意識しない作りになっています。

## どういう実装をするとCSI対応と言えるのか？

本家へのリンクはこちらです。

[container-storage-interface/spec](https://github.com/container-storage-interface/spec/blob/master/spec.md)


**kubernetes のCSIのドキュメント**

[Introduction - Kubernetes CSI Developer Documentation](https://kubernetes-csi.github.io/docs/)


kubernetes-csiのページに詳しく条件が記載してありますが、ここでは何を実装したらCSI対応と言えるかをまとめておきます。

以下の計６つのコンポーネント（一部オプションもあり）を実装し、それぞれの役割を満たすことでCSIの対応を謳えるようです。

1.  **external-attacher**: Kubernetes VolumeAttachment オブジェクトの監視し、CSIエンドポイントに対してControlPublish/ControlUnpublish オペレーションをトリガーします。
2.  **external-provisioner**: PersistentVolumeClaimの監視をし、CSIエンドポイントに対してVolumeの作成・削除オペレーションをトリガーします。
3.  **node-driver-registrar:** Kubelet device plugin 機構を使ってCSIドライバをkubeletに登録します。
4.  **cluster-driver-registrar(Alpha)**: CSIDriverオブジェクトを創ることでCSIドライバをKubernetesクラスタに登録します。これにより、CSIドライバはkubernetesクラスタと相互に作用することができるようになります。
5.  **external-snapshotter(Alpha)**: VolumeSnapshot CRD オブジェクトを監視し、CSIエンドポイントに対してCreateSnapshot, DeleteSnapshotオペレーションをトリガーします。
6.  **livenessprobe**: CSI plugin のポッドでLiveness Probeを実装する。

ただし、この情報も2019/1時点の情報なので本家のスペックの表記とはやや異なっています。

[container-storage-interface/spec](https://github.com/container-storage-interface/spec/blob/master/spec.md#goals-in-mvp)


こちらにSpecが記載されており、変更がある点を見てみると太字イタリックにした2箇所になります。

基本的な機能に加え、一部ユーティリティが入ってきているという印象です。

The Container Storage Interface (CSI) will

*   Enable SP authors to write one CSI compliant Plugin that “just works” across all COs that implement CSI.
*   Define API (RPCs) that enable:
*   Dynamic provisioning and deprovisioning of a volume.
*   Attaching or detaching a volume from a node.
*   Mounting/unmounting a volume from a node.
*   Consumption of both block and mountable volumes.
*   **_Local storage providers (e.g., device mapper, lvm)._**
*   Creating and deleting a snapshot (source of the snapshot is a volume).
*   **_Provisioning a new volume from a snapshot (reverting snapshot, where data in the original volume is erased and replaced with data in the snapshot, is out of scope)._**
*   Define plugin protocol RECOMMENDATIONS.
*   Describe a process by which a Supervisor configures a Plugin.
*   Container deployment considerations (`CAP_SYS_ADMIN`, mount namespace, etc.).

## これからのCSIについて

トピックとしては以下のようなものが検討されています。基本的な機能を拡充し、より実践的な機能が挙げられ検討されています。VolumeSnapshotに対してはCSI1.0でAlpha Statusとして定義されています。

**Topology-Aware Volume Provisioning in Kubernetes**

[Topology-Aware Volume Provisioning in Kubernetes](https://kubernetes.io/blog/2018/10/11/topology-aware-volume-provisioning-in-kubernetes/)


**Raw block Volume support**

[Raw Block Volume support to Beta](https://kubernetes.io/blog/2019/03/07/raw-block-volume-support-to-beta/)


**Volume Snapshots**

[Volume Snapshots](https://kubernetes.io/docs/concepts/storage/volume-snapshots/)


各ベンダーが現在独自で実装しているものを標準化していっているため利用者は実装は気にせずに使えるようになり相互運用がしやすい形になるメリットが出てきています。

現在ある制約をなくしサポートすることや、マイグレーションについてのロードマップも含まれています。

*   ローカルエフェメラルストレージ対応
*   以前より実装されていたIn-tree volume pluginのCSIへのマイグレーション

## In-Tree Volume Pluginはどうするの？

CSIのへのマイグレーションガイドを参考にマイグレーションしていくという方針です。

**In-tree Storage Plugin to CSI Migration Design Doc**

[kubernetes/community](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/csi-migration.md)


## References

ここまで参照したすべてのリンク集です。

* CSI Volume Plugins in Kubernetes Design Doc、おそらくここが一番情報がまとまっています。 [kubernetes/community](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/container-storage-interface.md)
* CSIの実装すべき一覧も常にアップデートがかかっています。 [container-storage-interface/spec](https://github.com/container-storage-interface/spec/blob/master/spec.md#goals-in-mvp)
* 公式のVolumesのページは必読です。 [Volumes](https://kubernetes.io/docs/concepts/storage/volumes/#csi)
* Protocol bufferの定義はこちらで参照できます。 [container-storage-interface/spec](https://github.com/container-storage-interface/spec/blob/master/csi.proto)
* Volume Snapshots [Volume Snapshots](https://kubernetes.io/docs/concepts/storage/volume-snapshots/)
* Kubernetes CSI Developer Documentation (必読） [Introduction - Kubernetes CSI Developer Documentation](https://kubernetes-csi.github.io/docs/)
