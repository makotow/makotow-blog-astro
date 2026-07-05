---
author: "makotow"
pubDatetime: 2019-11-06T22:52:17.217Z
modDatetime: 2020-01-04T18:12:26.000Z
title: "Kubernetesで private registry のイメージをPull する場合には ImagePullSecretsを使う"
draft: false
tags:
  - "Kubernetes"
  - "Containers"
  - "Container Registry"
aliases:
  - "/kubernetes-private-registry-tips-image-pullsecretse-20dfb808dfc-e20dfb808dfc"
description: "PrivateRegistryからImagePullをする場合のマニフェストの書き方"
timezone: "Asia/Tokyo"
---

結果的にプライベートレジストリへのログイン方法をKubernetesのマニフェストから実施する方法。

## なにに困って、どのように解決したか

CI/CD のパイプラインを作成時に、イメージ置き場をプライベートレジストリに変えたあとにログインが必要になり、イメージPullが失敗しビルドが通らなくなりました。

プライベートレジストリからイメージをPullするためにはログインが必要になります。

複数のログイン方法がありますが（詳細は「[Pull an Image from a Private Registry](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)」を参考）ここではCI/CDパイプラインでイメージをビルドするときや、コンテナをデプロイするときにプライベートレジストリからイメージをダウンロードする際にログインしておらず、エラーで停止してしまうことを防ぐための方法を記載します。


## やるべきこと

プライベートレジストリから Pull するときにはコンテナレジストリの認証のためのSecretを作って、ServiceAccount に `IamgepullSecrets` を追加します。  
こうすることでServiceAccount に追加されたImagepullSecretsがPod作成時に自動で付与されるようになります。

各マニフェストに`imagePullSecrets`に記載する方法もあります。

## imagePullSecrets

`spec.Pod.imagePullSecrets` が準備されており、こちらにpull時に使用するSecretを設定するとクレデンシャルとして使用するようになります。

imagePullSecretsの設定方法としては２つあります。

*   マニフェスト作成者が `imagePullSecrets` を記述
*   namespace の default service account を作成したSecretをimagePullSecretとして使うよう変更

## 手順

1.  Secretを作成する
2.  default service account の ImagePullSecrets を変更する。 （マニフェストに直接書く場合は不要）

## コマンド

Secretの作成を実施します。  
ここではGCRからコンテナイメージを取得することを想定しています。  
そのため `--docker-server` に指定しているレジストリはGCRのアドレスとなっています。

プライベートレジストリなら方法は同じです。 `--docker-server ` に指定しているURLを適宜変更してください

コマンドラインからSecret作成時にユーザ名、パスワードを設定します。

```bash
$ kubectl create secret docker-registry regcred --docker-server=asia.gcr.io --docker-username=_json_key --docker-password=$(cat key.json)" --docker-email=email-address@address -n namespace
```

default service account に `imagePullSecrets` を追加します。上記で作成したSecret名をnameに設定します。
```bash
$ kubectl patch serviceaccount default -p '{\"imagePullSecrets\": [{\"name\": \"regcred\"}]}' -n namespace
```

以下のURLで公開されているマニフェストを例に説明します。

*   [https://k8s.io/examples/pods/private-reg-pod.yaml](https://k8s.io/examples/pods/private-reg-pod.yaml)

サンプルでは `imagePullSecrets`が記載されており、`name: regcred` が指定されています。  
この場合、Secretオブジェクトの regcred をイメージPull時に使用します。
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: private-reg
spec:
  containers:
  - name: private-reg-container
    image: <your-private-image>
  imagePullSecrets:
  - name: regcred
```

default service account の imagePullSecretを変更した場合は次のようにマニフェストを定義しても（imagePullSecrets がない）、実際は上記のマニフェストと同じようになります。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: private-reg
spec:
  containers:
  - name: private-reg-container
    image: <your-private-image>
```

## 所感

個人的には今回の用途としては、ImagePullSecretをサービスアカウントに設定し問題を解決しました。

運用時にはどちらがいいかと言われると、ケースバイケースという回答になりそうです。  
いくつか方法があるということと、デプロイ時に追加できるということを覚えておくことで類似の問題は解決できるのではと考えます。

他にもトークンを設定してログインする方法もあります。  
セキュリティ上、本来はトークンを都度生成したほうがいいのかなとも今回考えました。  
最適な姿についてはもう少し検討したいと思います。

## 参考

*   [Pull an Image from a Private Registry](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)
*   [Add ImagePullSecrets to a service account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#add-imagepullsecrets-to-a-service-account)
