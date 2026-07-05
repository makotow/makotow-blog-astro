---
author: "makotow"
pubDatetime: 2018-02-11T17:49:59.791Z
modDatetime: 2020-01-04T18:11:45.000Z
title: "Kubernetes Container Storage Interface（CSI）とは？"
draft: false
tags:
  - "Kubernetes"
  - "Csi"
  - "Volume"
  - "Tech"
aliases:
  - "/https-medium-com-makotow-kubernetes-contaienr-storage-interface-a0c4a0d04bad"
description: "Kubernetes Container Storage Interface（CSI）とは？"
timezone: "Asia/Tokyo"
---

# CSI について学んだことをメモ

## Kubernetes 1.9 Release

今回は興味深い記事が kubernetes のブログで出ていたので勉強も兼ねて翻訳・意訳してみました。個人的なメモを公開します。誤訳などがある場合はコメントいただければと思います。最後の開発者へのリンクやコミュニテへの参加方法についてはこのブログでは割愛しました。

*   [Introducing Container Storage Interface (CSI) Alpha for Kubernetes](http://blog.kubernetes.io/2018/01/introducing-container-storage-interface.html)

k8s 1.9 のリリースでは主に以下の機能がリリースされました。その中のα版の Container Storage Interface のことをメインに解説している記事です。

* Workloads API GA: DaemonSet, Deployment, ReplicaSet, and StatefulSet APIs が GA  
* Container Storage Interface (CSI) のα版の開始  
* Windows ワークロードのサポート

その中のCSIについて書いていきます。

Kubernetesのための重要な違いは強力なボリュームプラグインシステムです。多くの異なるストレージに以下のストレージシステムを有効にするものです。

*   オンデマンドにストレージをプロビジョニング
*   コンテナがデプロイされるところから使用可能とする
*   不要になったときに自動削除

Kubernetesに新しいストレージシステムを追加していますが、チャレンジングなものとなっております。

Kubernetes 1.9 で [コンテナストレージインタフェース（CSI）](https://github.com/kubernetes/features/issues/178) のアルファ版が実装されました。ポッドにデプロイするのと同じくらい簡単に新しいボリュームプラグインをインストールすることができます。また、3rd party のストレージについてもKubernetesのコードベースにコード追加することなく、ソリューションを開発することができます。

機能は1.9で、アルファなので、明示的に有効にする必要があります。アルファステージの機能はプロダクション利用は推奨しませんが、プロジェクトがやろうとしていることを確認するために使うのは良いことです。今回はより高い拡張性と標準化されたkubernetesストレージのエコシステムを確認できます。

## Why Kubernetes CSI？

Kubernetesボリュームのプラグインは 「in-tree」で開発されています。つまり、kubernetes と密接に関係しており、コンパイル、ビルド、リリースはkubernetesのコアバイナリと一緒にリリースされます。  
 新しいストレージシステムを kubernetes コアのコードリポジトリにコードを追加する必要があります。しかし、kubernetes のリリースプロセスとあうように調整することは多くのプラグイン開発者にとっては苦痛となります。

既存の[Flex Volume plugin](https://github.com/kubernetes/community/blob/master/contributors/devel/flexvolume.md) は、external volume plugin 用のexecベースのAPIを公開することによって、この問題に対処しようとしました。  
 しかしながら、APIを公開することによってサードパーティのストレージベンダーが 「out-of-tree」のドライバをデプロイするために、ノードとマスタのルートファイルシステムへのアクセスが必要になってしまいます。

デプロイメントに課題があることに加えて、Flexはプラグインの依存関係の課題に対処ができていない状態でした。  
 Volume Plugin は外部への要求が多くある傾向があります。 例えば マウントとファイルシステムのツールになどです。  
 これらの依存関係は、多くの場合、ベースとなるホストOS上で利用可能であると仮定されます。これらはノード・マシンのルートファイルシステムへのアクセスが必要です。

CSI は out-of-treeのストレージプラグインを開発し、コンテナ化してKubernetesプリミティブを経由してデプロイ、そしてユーザーがよく知り、使っているKubernetesプリミティブ(StorageClasses、PersistentVolumeClaims、PersistentVolumes） を通してリソースを消費することで上記のすべての問題を解決します。

## What is CSI?

CSIの目的は、コンテナオーケストレーションシステム（COs）がコンテナ化されたワークロードに任意のストレージシステムを公開するための標準化されたメカニズムを確立することです。 CSIの仕様は、Kubernetes、Mesos、Docker、Cloud Foundryなどのさまざまなコンテナオーケストレーションシステム（COs）のコミュニティメンバー間の協力から生まれました。 仕様はKubernetesから独立して開発され、[https://github.com/container-storage-interface/spec/blob/master/spec.md](https://github.com/container-storage-interface/spec/blob/master/spec.md) 管理されています。

Kubernetesのv1.9はKubernetesにデプロイおよびKubernetesワークロードによって消費されるCSI互換ボリュームドライバをイネーブルCSI指定のアルファ実装を公開します。

## どのように私はKubernetesクラスタ上のCSIのドライバをデプロイすればよいですか？

CSIプラグインの作者はKubernetesに自分のプラグインを導入するための独自の指示を提供します。

## どのように私はCSIボリュームを使用していますか？

CSIストレージプラグインがすでにクラスタ上で展開されていると仮定すると、あなたはおなじみのKubernetesストレージプリミティブを通してそれを使用することができますPersistentVolumeClaims、PersistentVolumes、およびStorageClasses。

CSIはKubernetes v1.9デベロッパーでアルファの機能です。これを有効にするには、次のフラグを設定します。

*   API server binary:
*   –feature-gates=CSIPersistentVolume=true
*   –runtime-config=storage.k8s.io/v1alpha1=true
*   API server binary and kubelet binaries:
*   –feature-gates=MountPropagation=true
*   –allow-privileged=true

## 動的なプロビジョニング

CSI plugin を 指定するようStorrage class 作成することによって、動的プロビジョニングをサポートしボリュームの自動作成/削除有効にすることができ瑠葉になります。

例として、次の StorageClass は、provisoner に 「com.example.team/csi-driver」を指定して「高速ストレージ」ボリュームを動的に作成することができます。

```yaml
kind: StorageClass  
apiVersion: storage.k8s.io/v1  
metadata:  
  name: fast-storage  
provisioner: com.example.team/csi-driver  
parameters:  
  type: pd-ssd
```

動的プロビジョニングをトリガするために、PersistentVolumeClaimのオブジェクトを作成します。  
 以下のPersistentVolumeClaimは、StorageClassを使って動的プロビジョニングをトリガするものです。

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

ボリュームのプロビジョニングが呼び出されると、パラメータ「type: pd-ssd」がCSIプラグイン「com.example.team/csi-driver」に 「CreateVolume」コールを経由して渡されます。  
 結果として、外部ボリュームプラグインは新規のボリュームの作成と、 PersistentVolumeをオブジェクトを新規ボリュームを表現しています。  
 Kubernetesは、新しいPersistentVolumeをPersistentVolumeClaimにバインドして、利用可能となります。

StorageClass 「高速ストレージ」がデフォルトならば、PersistentVolumeClaimに定義しなかった場合、StorageClass 「高速ストレージ」がデフォルトで使用されます。

## 事前プロビジョニングされたボリューム

既存のボリュームをkubernetes 内で利用するためには PersistentVolume オブジェクトを手動で作成することにより、Kubernetesにおける既存のボリュームをいつでも公開することができます。  
 次のPersistentVolumeの例は「existingVolumeName」というボリューム名をCSIストレージプラグインの「com.example.team/csi-driver」で表すものです。

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
    driver: com.example.team/csi-driver  
    volumeHandle: existingVolumeName  
    readOnly: false
```

## アタッチとマウント

任意のポッドまたはポッドテンプレート内のCSIボリュームにバインドしているPersistentVolumeClaimを参照できます。

```yaml
kind: Pod  
apiVersion: v1  
metadata:  
  name: my-pod  
spec:  
  containers:  
    - name: my-frontend  
      image: dockerfile/nginx  
      volumeMounts:  
      - mountPath: &#34;/var/www/html&#34;  
        name: my-csi-volume  
  volumes:  
    - name: my-csi-volume  
      persistentVolumeClaim:  
        claimName: my-request-for-storage
```

CSIのボリュームを参照するポッドがスケジュールされたら、Kubernetesは外部CSIプラグイン(External CSI plugin: ControllerPublishVolume, NodePublishVolume, etc.)に対して適切な操作を開始して指定されたボリュームがポッド内のコンテナによって接続され、マウントされ、使用可能になるようにします。

詳細については[CSI設計ドキュメント](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/container-storage-interface.md) と[ドキュメント](https://github.com/kubernetes-csi/docs/wiki/Setup)を参照してください。

## CSIドライバの作成方法

Kubernetesは、可能な限りCSIボリュームドライバのパッケージ化とデプロイメントを最小限に抑えています。  
 Kubernetes上にCSIボリュームドライバを展開するための最小要件が[ここ](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/container-storage-interface.md#third-party-csi-volume-drivers) に文章化されています。

最小要件文書には Kubernetes上に任意のコンテナ化されたCSIドライバを展開するために提案されたメカニズムを説明する[セクション](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/container-storage-interface.md#recommended-mechanism-for-deploying-csi-drivers-on-kubernetes) が含まれています。  
 このメカニズムはストレージプロバイダがKubernetes上にコンテナ化されたCSI互換のボリュームドライバの導入を簡易化のために使用することができます。

この推奨される展開プロセスの一環として、Kubernetesチームは、次のsidecar (helper)コンテナを提供しています。

*   [external-attacher](https://github.com/kubernetes-csi/external-attacher)
*   Kubernetes VolumeAttachmentオブジェクトを監視するSidercar コンテナがCSIエンドポイントに対してControllerPublishとControllerUnpublish 操作をトリガーします。
*   [external-provisioner](https://github.com/kubernetes-csi/external-provisioner)
*   Kubernetes PersistentVolumeClaimのオブジェクトを管理するSidercar コンテナが CSIエンドポイントに対してCreateVolumeとDeleteVolume 操作をトリガーします。
*   [driver-registrar](https://github.com/kubernetes-csi/driver-registrar)
*   （将来的な話) kubeletでCSIドライバを登録し、Kubernetes Node API オブジェクトのannotationに対してドライバのカスタムNodeId を追加するsidecar コンテナです。NodeIdはCSI endpointに対して GetNodeID を呼び出して取得します。

CSIドライバを使用することでkubernetesの構造を知らなくとも上記のメカニズムを使用することでストレージベンダーは彼らのプラグインをデプロイすることができます。

## どこでCSIのドライバを見つけることができますか？

CSIドライバはサードパーティで開発、メンテナンスされています。  
 サンプルのCSIのドライバは[ここ](https://github.com/kubernetes-csi/drivers)で見つけることができます。  
 しかし、これらは例示的な目的のために提供されており、本番環境で使用されることを意図されていません。

## Flex Volumeについてはどうなのでしょうか？

[Flex Volume Plugin](https://github.com/kubernetes/community/blob/master/contributors/devel/flexvolume.md) は、「out-of-tree」ボリュームプラグインを作成するための exec ベースのメカニズムとして存在します。上記で言及したいくつかの欠点がありますが、Flex Volume Plugin は、新しいCSIボリュームプラグインと共存します。SIG Storageは既存のすでに本番環境で稼働しているサードパーティ製のFlexのドライバが動作し続けるようにするFlex APIを維持していきます。将来的には、新しいボリュームの機能は、CSIのみに追加されます。

## in-tree volume plugins には何が起こりますか？

CSIがstable に達すると、CSIへin-tree volume plugin のほとんどを移行する計画をしています。詳細についてはKubernetes CSIの実装が stable に近づくのをお楽しみに。

## アルファの制限は何ですか？

CSIの alpha implementationは次の制限があります。

*   CreateVolume、NodePublishVolume、およびControllerPublishVolumeのCredential フィールド呼び出しはサポートされていません。
*   ブロックボリュームはサポートされていません。ファイルのみ。
*   ファイルシステムの指定はサポートされていません。デフォルトはext4。
*   CSIドライバは、「external-attacher」ででデプロイされる必要がある、「ControllerPublishVolume」を実装していなくてもだ。
*   Kubernetesスケジューラトポロジは、CSIボリュームはサポートされていません。要するに、k8sスケジューラが賢くスケジューリングの決定を行うことができるようにプロビジョニングされたボリュームに関する情報(zone, regions, etc)を共有するべきです。

## 次は何ですか？

フィードバックと採用率によって、Kubernetesチームが1.10または1.11のいずれかでCSIの実装をベータにプッシュする予定です。
