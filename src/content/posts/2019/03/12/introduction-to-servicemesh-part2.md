---
author: "makotow"
pubDatetime: 2019-03-12T16:24:08.988Z
modDatetime: 2020-01-04T18:12:13.000Z
title: "ゼロから始めるサービスメッシュ入門 Part2"
draft: false
tags:
  - "Kubernetes"
  - "Istio"
  - "Service Mesh"
  - "Tech"
aliases:
  - "/%E3%82%BC%E3%83%AD%E3%81%8B%E3%82%89%E5%A7%8B%E3%82%81%E3%82%8B%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9%E3%83%A1%E3%83%83%E3%82%B7%E3%83%A5%E5%85%A5%E9%96%80-part2-5a5252f6d8d1"
description: "ゼロから始めるサービスメッシュ入門 Part2"
timezone: "Asia/Tokyo"
---
## 概要

前回はIstio、サービスメッシュの超概要を調べました。

その後に気づいたのですが、GitHub上のトップページのほうが簡潔にわかりやすく記載している気がします。

[istio/istio](https://github.com/istio/istio)


今回は実際にインストールするところとIstioがサイドカーコンテナとして動作するところまでを確認します。

注: 2018/12末の情報です。一部バージョン等は古い可能性があるので正式な手順等は本家マニュアルを参照ください。

<!--more-->
<!--toc-->


## 事前準備

*   Kubernetesクラスタの準備
*   Istio関係のインストール

istioctl のインストール、公式を参照して以下のコマンドでリポジトリから取得します。
``curl -L https://git.io/getLatestIstio | sh -``

General な kubernetes環境を想定しているのと、できる限り推奨をつかいたいのでHelm + pure kubernetesで実施、環境自体はAWSを使用するがIaaSとして使用、一部ServiceのタイプでLoadBalancerを使用します。

実際のところLoadBalancerはどうするか悩ましいところです。

NodePortを使う場合は以下の通り設定可能と記載があるので備忘としてURLと一部文言抜粋しておきます。

[https://istio.io/docs/setup/kubernetes/helm-install/](https://istio.io/docs/setup/kubernetes/helm-install/)
> _Istio by default uses LoadBalancer service object types. Some platforms do not support LoadBalancer service objects. For platforms lacking LoadBalancer support, install Istio with NodePort support instead with the flags — set gateways.istio-ingressgateway.type=NodePort — set gateways.istio-egressgateway.type=NodePort appended to the end of the Helm operation._

## クラスタの状況確認

今回試している環境の確認。
```bash
$ kubectl version --short
```

```bash
Client Version: v1.13.1  
Server Version: v1.12.3
```

```bash
$ kubectl get all --all-namespaces
```

```bash
NAMESPACE     NAME                                                                          READY   STATUS    RESTARTS   AGE  
kube-system   pod/coredns-576cbf47c7-8x2bg                                                  1/1     Running   0          8m38s  
kube-system   pod/coredns-576cbf47c7-cr9gc                                                  1/1     Running   0          8m38s  
kube-system   pod/dashboard-proxy-79787b76d4-pqkhj                                          1/1     Running   0          6m44s  
kube-system   pod/heapster-5459947ccc-v9rth                                                 1/1     Running   0          6m45s  
kube-system   pod/kube-apiserver-ip-172-23-1-136.ap-northeast-1.compute.internal            1/1     Running   0          7m57s  
kube-system   pod/kube-controller-manager-ip-172-23-1-136.ap-northeast-1.compute.internal   1/1     Running   0          7m53s  
kube-system   pod/kube-flannel-ds-dd7zz                                                     1/1     Running   0          8m27s  
kube-system   pod/kube-flannel-ds-gbpxk                                                     1/1     Running   0          7m57s  
kube-system   pod/kube-flannel-ds-vcvmf                                                     1/1     Running   1          7m56s  
kube-system   pod/kube-proxy-csnvm                                                          1/1     Running   0          7m56s  
kube-system   pod/kube-proxy-dtsd2                                                          1/1     Running   0          7m57s  
kube-system   pod/kube-proxy-gpc5n                                                          1/1     Running   0          8m38s  
kube-system   pod/kube-scheduler-ip-172-23-1-136.ap-northeast-1.compute.internal            1/1     Running   0          7m56s  
kube-system   pod/kubernetes-dashboard-778d4ccc65-r2s4t                                     1/1     Running   0          6m44s  
kube-system   pod/tiller-deploy-6fb6d4777d-7jrj5                                            1/1     Running   0          7m16s````NAMESPACE     NAME                           TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)         AGE  
default       service/kubernetes             ClusterIP   10.3.0.1     &lt;none&gt;        443/TCP         8m58s  
kube-system   service/heapster               ClusterIP   10.3.0.196   &lt;none&gt;        80/TCP          6m45s  
kube-system   service/kube-dns               ClusterIP   10.3.0.10    &lt;none&gt;        53/UDP,53/TCP   8m53s  
kube-system   service/kubernetes-dashboard   ClusterIP   10.3.0.76    &lt;none&gt;        443/TCP         6m44s  
kube-system   service/tiller-deploy          ClusterIP   10.3.0.28    &lt;none&gt;        44134/TCP       7m16s````NAMESPACE     NAME                             DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR                   AGE  
kube-system   daemonset.apps/kube-flannel-ds   3         3         3       3            3           beta.kubernetes.io/arch=amd64   8m27s  
kube-system   daemonset.apps/kube-proxy        3         3         3       3            3           &lt;none&gt;                          8m53s````NAMESPACE     NAME                                   DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE  
kube-system   deployment.apps/coredns                2         2         2            2           8m53s  
kube-system   deployment.apps/dashboard-proxy        1         1         1            1           6m44s  
kube-system   deployment.apps/heapster               1         1         1            1           6m46s  
kube-system   deployment.apps/kubernetes-dashboard   1         1         1            1           6m44s  
kube-system   deployment.apps/tiller-deploy          1         1         1            1           7m16s````NAMESPACE     NAME                                              DESIRED   CURRENT   READY   AGE  
kube-system   replicaset.apps/coredns-576cbf47c7                2         2         2       8m38s  
kube-system   replicaset.apps/dashboard-proxy-79787b76d4        1         1         1       6m44s  
kube-system   replicaset.apps/heapster-5459947ccc               1         1         1       6m45s  
kube-system   replicaset.apps/kubernetes-dashboard-778d4ccc65   1         1         1       6m44s  
kube-system   replicaset.apps/tiller-deploy-6fb6d4777d          1         1         1       7m16s
```

Helmのバージョンを確認

```bash
$ helm version
```

```bash
Client: &amp;version.Version{SemVer:&#34;v2.12.1&#34;, GitCommit:&#34;02a47c7249b1fc6d8fd3b94e6b4babf9d818144e&#34;, GitTreeState:&#34;clean&#34;}  
Server: &amp;version.Version{SemVer:&#34;v2.12.1&#34;, GitCommit:&#34;02a47c7249b1fc6d8fd3b94e6b4babf9d818144e&#34;, GitTreeState:&#34;clean&#34;}``
```

* [Installation with Helm](https://istio.io/docs/setup/kubernetes/helm-install/#installation-steps)

IstioのInstallは上記のページをみて実施します、インストールしたHelmは 2.10.0 以降なので Option1を実施します。

インストール方法は2つあります。

*   Option1はHelm template を使ってデプロイする方法
*   Option2はHelm Tiller を使ってデプロイする方式

今回はOption1でマニフェストを生成して実施します。  
環境はAWSを使うため、Service.TypeはLoadBalancerを使用しELBを作成することとします。

LoadBalancerの場合は特にvaluesを指定せずに実行します。
``helm template istio-1.0.5/install/kubernetes/helm/istio --name istio --namespace istio-system &gt; ./manifest/istio.yaml``

他にもService.TypeをNodePortで実施する方法もあり、Istioのページから抜粋したものが以下の通りです、基本的には外部公開する箇所をすべてNodePortに変更する方法です。
``$ helm template istio-1.0.5/install/kubernetes/helm/istio --name istio --namespace istio-system --set gateways.istio-ingressgateway.type=NodePort --set gateways.istio-egressgateway.type=NodePort &gt; ./manifest/istio-nodeport.yaml``

istioをデプロイするnamespaceを作成します。
``$ kubectl create namespace istio-system````namespace/istio-system created``

istioのマニフェスト投入します。  
（ちょっと長いですが備忘のためすべて記載）
```bash
$ kubectl apply -f manifest/istio.yaml````configmap/istio-galley-configuration created  
configmap/istio-statsd-prom-bridge created  
configmap/prometheus created  
configmap/istio-security-custom-resources created  
configmap/istio created  
configmap/istio-sidecar-injector created  
serviceaccount/istio-galley-service-account created  
serviceaccount/istio-egressgateway-service-account created  
serviceaccount/istio-ingressgateway-service-account created  
serviceaccount/istio-mixer-service-account created  
serviceaccount/istio-pilot-service-account created  
serviceaccount/prometheus created  
serviceaccount/istio-cleanup-secrets-service-account created  
clusterrole.rbac.authorization.k8s.io/istio-cleanup-secrets-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/istio-cleanup-secrets-istio-system created  
job.batch/istio-cleanup-secrets created  
serviceaccount/istio-security-post-install-account created  
clusterrole.rbac.authorization.k8s.io/istio-security-post-install-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/istio-security-post-install-role-binding-istio-system created  
job.batch/istio-security-post-install created  
serviceaccount/istio-citadel-service-account created  
serviceaccount/istio-sidecar-injector-service-account created  
customresourcedefinition.apiextensions.k8s.io/virtualservices.networking.istio.io created  
customresourcedefinition.apiextensions.k8s.io/destinationrules.networking.istio.io created  
customresourcedefinition.apiextensions.k8s.io/serviceentries.networking.istio.io created  
customresourcedefinition.apiextensions.k8s.io/gateways.networking.istio.io created  
customresourcedefinition.apiextensions.k8s.io/envoyfilters.networking.istio.io created  
customresourcedefinition.apiextensions.k8s.io/httpapispecbindings.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/httpapispecs.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/quotaspecbindings.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/quotaspecs.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/rules.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/attributemanifests.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/bypasses.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/circonuses.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/deniers.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/fluentds.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/kubernetesenvs.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/listcheckers.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/memquotas.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/noops.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/opas.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/prometheuses.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/rbacs.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/redisquotas.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/servicecontrols.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/signalfxs.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/solarwindses.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/stackdrivers.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/statsds.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/stdios.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/apikeys.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/authorizations.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/checknothings.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/kuberneteses.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/listentries.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/logentries.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/edges.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/metrics.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/quotas.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/reportnothings.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/servicecontrolreports.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/tracespans.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/rbacconfigs.rbac.istio.io created  
customresourcedefinition.apiextensions.k8s.io/serviceroles.rbac.istio.io created  
customresourcedefinition.apiextensions.k8s.io/servicerolebindings.rbac.istio.io created  
customresourcedefinition.apiextensions.k8s.io/adapters.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/instances.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/templates.config.istio.io created  
customresourcedefinition.apiextensions.k8s.io/handlers.config.istio.io created  
clusterrole.rbac.authorization.k8s.io/istio-galley-istio-system created  
clusterrole.rbac.authorization.k8s.io/istio-egressgateway-istio-system created  
clusterrole.rbac.authorization.k8s.io/istio-ingressgateway-istio-system created  
clusterrole.rbac.authorization.k8s.io/istio-mixer-istio-system created  
clusterrole.rbac.authorization.k8s.io/istio-pilot-istio-system created  
clusterrole.rbac.authorization.k8s.io/prometheus-istio-system created  
clusterrole.rbac.authorization.k8s.io/istio-citadel-istio-system created  
clusterrole.rbac.authorization.k8s.io/istio-sidecar-injector-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/istio-galley-admin-role-binding-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/istio-egressgateway-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/istio-ingressgateway-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/istio-mixer-admin-role-binding-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/istio-pilot-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/prometheus-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/istio-citadel-istio-system created  
clusterrolebinding.rbac.authorization.k8s.io/istio-sidecar-injector-admin-role-binding-istio-system created  
service/istio-galley created  
service/istio-egressgateway created  
service/istio-ingressgateway created  
service/istio-policy created  
service/istio-telemetry created  
service/istio-pilot created  
service/prometheus created  
service/istio-citadel created  
service/istio-sidecar-injector created  
deployment.extensions/istio-galley created  
deployment.extensions/istio-egressgateway created  
deployment.extensions/istio-ingressgateway created  
deployment.extensions/istio-policy created  
deployment.extensions/istio-telemetry created  
deployment.extensions/istio-pilot created  
deployment.extensions/prometheus created  
deployment.extensions/istio-citadel created  
deployment.extensions/istio-sidecar-injector created  
gateway.networking.istio.io/istio-autogenerated-k8s-ingress created  
horizontalpodautoscaler.autoscaling/istio-egressgateway created  
horizontalpodautoscaler.autoscaling/istio-ingressgateway created  
horizontalpodautoscaler.autoscaling/istio-policy created  
horizontalpodautoscaler.autoscaling/istio-telemetry created  
horizontalpodautoscaler.autoscaling/istio-pilot created  
mutatingwebhookconfiguration.admissionregistration.k8s.io/istio-sidecar-injector created  
attributemanifest.config.istio.io/istioproxy created  
attributemanifest.config.istio.io/kubernetes created  
stdio.config.istio.io/handler created  
logentry.config.istio.io/accesslog created  
logentry.config.istio.io/tcpaccesslog created  
rule.config.istio.io/stdio created  
rule.config.istio.io/stdiotcp created  
metric.config.istio.io/requestcount created  
metric.config.istio.io/requestduration created  
metric.config.istio.io/requestsize created  
metric.config.istio.io/responsesize created  
metric.config.istio.io/tcpbytesent created  
metric.config.istio.io/tcpbytereceived created  
prometheus.config.istio.io/handler created  
rule.config.istio.io/promhttp created  
rule.config.istio.io/promtcp created  
kubernetesenv.config.istio.io/handler created  
rule.config.istio.io/kubeattrgenrulerule created  
rule.config.istio.io/tcpkubeattrgenrulerule created  
kubernetes.config.istio.io/attributes created  
destinationrule.networking.istio.io/istio-policy created  
destinationrule.networking.istio.io/istio-telemetry created````$ kubectl get all -n istio-system````NAME                                         READY   STATUS      RESTARTS   AGE  
pod/istio-citadel-55cdfdd57c-98sqs           1/1     Running     0          45s  
pod/istio-cleanup-secrets-46wlx              0/1     Completed   0          52s  
pod/istio-egressgateway-7798845f5d-9pcg2     1/1     Running     0          46s  
pod/istio-galley-76bbb946c8-zhl49            1/1     Running     0          46s  
pod/istio-ingressgateway-78c6d8b8d7-xndll    1/1     Running     0          46s  
pod/istio-pilot-5fcb895bff-lw9gq             2/2     Running     0          45s  
pod/istio-policy-7b6cc95d7b-55zn8            2/2     Running     0          46s  
pod/istio-security-post-install-6j4ml        0/1     Completed   0          51s  
pod/istio-sidecar-injector-9c6698858-jrgfr   1/1     Running     0          45s  
pod/istio-telemetry-bfc9ff784-qsx2t          2/2     Running     0          46s  
pod/prometheus-65d6f6b6c-cthjt               1/1     Running     0          45s````NAME                             TYPE           CLUSTER-IP   EXTERNAL-IP                                                                   PORT(S)                                                                                                                   AGE  
service/istio-citadel            ClusterIP      10.3.0.116   &lt;none&gt;                                                                        8060/TCP,9093/TCP                                                                                                         46s  
service/istio-egressgateway      ClusterIP      10.3.0.199   &lt;none&gt;                                                                        80/TCP,443/TCP                                                                                                            47s  
service/istio-galley             ClusterIP      10.3.0.112   &lt;none&gt;                                                                        443/TCP,9093/TCP                                                                                                          47s  
service/istio-ingressgateway     LoadBalancer   10.3.0.235   aafdd88330c5011e9b0fd0625a0a3aa5-416663906.ap-northeast-1.elb.amazonaws.com   80:31380/TCP,443:31390/TCP,31400:31400/TCP,15011:30988/TCP,8060:31757/TCP,853:32724/TCP,15030:31740/TCP,15031:32228/TCP   47s  
service/istio-pilot              ClusterIP      10.3.0.150   &lt;none&gt;                                                                        15010/TCP,15011/TCP,8080/TCP,9093/TCP                                                                                     46s  
service/istio-policy             ClusterIP      10.3.0.45    &lt;none&gt;                                                                        9091/TCP,15004/TCP,9093/TCP                                                                                               47s  
service/istio-sidecar-injector   ClusterIP      10.3.0.89    &lt;none&gt;                                                                        443/TCP                                                                                                                   46s  
service/istio-telemetry          ClusterIP      10.3.0.73    &lt;none&gt;                                                                        9091/TCP,15004/TCP,9093/TCP,42422/TCP                                                                                     46s  
service/prometheus               ClusterIP      10.3.0.197   &lt;none&gt;                                                                        9090/TCP                                                                                                                  46s````NAME                                     DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE  
deployment.apps/istio-citadel            1         1         1            1           45s  
deployment.apps/istio-egressgateway      1         1         1            1           46s  
deployment.apps/istio-galley             1         1         1            1           46s  
deployment.apps/istio-ingressgateway     1         1         1            1           46s  
deployment.apps/istio-pilot              1         1         1            1           45s  
deployment.apps/istio-policy             1         1         1            1           46s  
deployment.apps/istio-sidecar-injector   1         1         1            1           45s  
deployment.apps/istio-telemetry          1         1         1            1           46s  
deployment.apps/prometheus               1         1         1            1           45s````NAME                                               DESIRED   CURRENT   READY   AGE  
replicaset.apps/istio-citadel-55cdfdd57c           1         1         1       45s  
replicaset.apps/istio-egressgateway-7798845f5d     1         1         1       46s  
replicaset.apps/istio-galley-76bbb946c8            1         1         1       46s  
replicaset.apps/istio-ingressgateway-78c6d8b8d7    1         1         1       46s  
replicaset.apps/istio-pilot-5fcb895bff             1         1         1       45s  
replicaset.apps/istio-policy-7b6cc95d7b            1         1         1       46s  
replicaset.apps/istio-sidecar-injector-9c6698858   1         1         1       45s  
replicaset.apps/istio-telemetry-bfc9ff784          1         1         1       46s  
replicaset.apps/prometheus-65d6f6b6c               1         1         1       45s````NAME                                                       REFERENCE                         TARGETS         MINPODS   MAXPODS   REPLICAS   AGE  
horizontalpodautoscaler.autoscaling/istio-egressgateway    Deployment/istio-egressgateway    &lt;unknown&gt;/80%   1         5         1          45s  
horizontalpodautoscaler.autoscaling/istio-ingressgateway   Deployment/istio-ingressgateway   &lt;unknown&gt;/80%   1         5         1          45s  
horizontalpodautoscaler.autoscaling/istio-pilot            Deployment/istio-pilot            &lt;unknown&gt;/80%   1         5         1          45s  
horizontalpodautoscaler.autoscaling/istio-policy           Deployment/istio-policy           &lt;unknown&gt;/80%   1         5         1          45s  
horizontalpodautoscaler.autoscaling/istio-telemetry        Deployment/istio-telemetry        &lt;unknown&gt;/80%   1         5         1          45s````NAME                                    COMPLETIONS   DURATION   AGE  
job.batch/istio-cleanup-secrets         1/1           14s        52s  
job.batch/istio-security-post-install   1/1           11s        51s
```

ここまででIstioインストール完了です。

### Injetion

サービスメッシュ内のPodではIstio互換のサイドカーが動作している状態とします。  
Istio side car を podにインジェクションする方法はistioctlを使って手動で行う方法とistio side car injectorを使って自動で行う方法があります。

[Installing the sidecar](https://istio.io/docs/setup/kubernetes/sidecar-injection/#injection)

k8s 1.9 以降の `mutating webhook admission controller` を使うことで自動Inejectionを行うことができます。今回は自動Injectionで実施します。なお、インストール時点でMutating webhook admission cotrollerは有効となっていました。

Dynamic Admission Controlについては下のページへ。

[Dynamic Admission Control](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/)


### サンプルのアプリをデプロイする。

Inject は namespaceに付与されているlabelで行われるため、namespace defaultにistio-injection=enabledを付与します。

```bash
$ kubectl apply -f istio-1.0.5/samples/sleep/sleep.yaml````service/sleep created  
deployment.extensions/sleep created  
 ~/s/istio-sandbox $ kubectl get pod  
NAME                     READY   STATUS    RESTARTS   AGE  
sleep-86cf99dfd6-xk9b2   1/1     Running   0          5s````$ kubectl label namespace default istio-injection=enabled````namespace/default labeled````$ kubectl get ns -L istio-injection````NAME                STATUS   AGE    ISTIO-INJECTION  
default             Active   2d7h   enabled  
istio-system        Active   8h  
kube-public         Active   2d7h  
kube-system         Active   2d7h  
stackpoint-system   Active   2d7h
```

InjectionはPodの作成時に行われるためポッドを削除し、1/1 Ready → 2/2 Readyになることを確認します。

まずは削除を実施します。その後自動起動してくるところを確認します。
``$ kubectl delete pod sleep-86cf99dfd6-xk9b2````pod &#34;sleep-86cf99dfd6-xk9b2&#34; deleted``

しばらくするとPod Status は2/2になり、サービスを提供するコンテナとside car コンテナが起動していることが確認できます。
```bash
$ kubectl get pod
```

```bash
NAME                     READY   STATUS    RESTARTS   AGE  
sleep-86cf99dfd6-xfvmk   2/2     Running   0          37s
```

```bash
$ kubectl describe pod
```

```bash
Name:               sleep-86cf99dfd6-xfvmk  
Namespace:          default  
Priority:           0  
PriorityClassName:  &lt;none&gt;  
Node:               ip-172-23-1-146.ap-northeast-1.compute.internal/172.23.1.146  
Start Time:         Mon, 31 Dec 2018 00:00:55 +0900  
Labels:             app=sleep  
                    pod-template-hash=86cf99dfd6  
Annotations:        sidecar.istio.io/status:  
                      {&#34;version&#34;:&#34;50128f63e7b050c58e1cdce95b577358054109ad2aff4bc4995158c06924a43b&#34;,&#34;initContainers&#34;:[&#34;istio-init&#34;],&#34;containers&#34;:[&#34;istio-proxy&#34;]...  
Status:             Running  
IP:                 10.2.1.11  
Controlled By:      ReplicaSet/sleep-86cf99dfd6  
Init Containers:  
  istio-init:  
    Container ID:  docker://a874daeb8d09930c01d647f2c6a911f6b74648a770b021fa7d89a486d90c3f9f  
    Image:         docker.io/istio/proxy_init:1.0.5  
    Image ID:      docker-pullable://istio/proxy_init@sha256:6acdf7ffa6b6615b3fd79028220f0550f705d03ba97b66126e0990639a9f3593  
    Port:          &lt;none&gt;  
    Host Port:     &lt;none&gt;  
    Args:  
      -p  
      15001  
      -u  
      1337  
      -m  
      REDIRECT  
      -i  
      *  
      -x````      -b````      -d````    State:          Terminated  
      Reason:       Completed  
      Exit Code:    0  
      Started:      Mon, 31 Dec 2018 00:01:02 +0900  
      Finished:     Mon, 31 Dec 2018 00:01:02 +0900  
    Ready:          True  
    Restart Count:  0  
    Environment:    &lt;none&gt;  
    Mounts:         &lt;none&gt;  
Containers:  
  sleep:  
    Container ID:  docker://8f4c3a7985af36fcbb18d90ab8c4ae4c0189909e7f9b4bd2e51ef89c0a2e8772  
    Image:         pstauffer/curl  
    Image ID:      docker-pullable://pstauffer/curl@sha256:2663156457abb72d269eb19fe53c2d49e2e4a9fdcb9fa8f082d0282d82eb8e42  
    Port:          &lt;none&gt;  
    Host Port:     &lt;none&gt;  
    Command:  
      /bin/sleep  
      3650d  
    State:          Running  
      Started:      Mon, 31 Dec 2018 00:01:03 +0900  
    Ready:          True  
    Restart Count:  0  
    Environment:    &lt;none&gt;  
    Mounts:  
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-hq47k (ro)  
  istio-proxy:  
    Container ID:  docker://694b7be9a038ec0f572ab540052e9141ea9964fe6bacb7f644c3ed5a0d543d82  
    Image:         docker.io/istio/proxyv2:1.0.5  
    Image ID:      docker-pullable://istio/proxyv2@sha256:8b7d549100638a3697886e549c149fb588800861de8c83605557a9b4b20343d4  
    Port:          15090/TCP  
    Host Port:     0/TCP  
    Args:  
      proxy  
      sidecar  
      --configPath  
      /etc/istio/proxy  
      --binaryPath  
      /usr/local/bin/envoy  
      --serviceCluster  
      sleep  
      --drainDuration  
      45s  
      --parentShutdownDuration  
      1m0s  
      --discoveryAddress  
      istio-pilot.istio-system:15007  
      --discoveryRefreshDelay  
      1s  
      --zipkinAddress  
      zipkin.istio-system:9411  
      --connectTimeout  
      10s  
      --proxyAdminPort  
      15000  
      --controlPlaneAuthPolicy  
      NONE  
    State:          Running  
      Started:      Mon, 31 Dec 2018 00:01:03 +0900  
    Ready:          True  
    Restart Count:  0  
    Requests:  
      cpu:  10m  
    Environment:  
      POD_NAME:                      sleep-86cf99dfd6-xfvmk (v1:metadata.name)  
      POD_NAMESPACE:                 default (v1:metadata.namespace)  
      INSTANCE_IP:                    (v1:status.podIP)  
      ISTIO_META_POD_NAME:           sleep-86cf99dfd6-xfvmk (v1:metadata.name)  
      ISTIO_META_INTERCEPTION_MODE:  REDIRECT  
      ISTIO_METAJSON_LABELS:         {&#34;app&#34;:&#34;sleep&#34;,&#34;pod-template-hash&#34;:&#34;86cf99dfd6&#34;}````    Mounts:  
      /etc/certs/ from istio-certs (ro)  
      /etc/istio/proxy from istio-envoy (rw)  
Conditions:  
  Type              Status  
  Initialized       True  
  Ready             True  
  ContainersReady   True  
  PodScheduled      True  
Volumes:  
  default-token-hq47k:  
    Type:        Secret (a volume populated by a Secret)  
    SecretName:  default-token-hq47k  
    Optional:    false  
  istio-envoy:  
    Type:    EmptyDir (a temporary directory that shares a pod&#39;s lifetime)  
    Medium:  Memory  
  istio-certs:  
    Type:        Secret (a volume populated by a Secret)  
    SecretName:  istio.default  
    Optional:    true  
QoS Class:       Burstable  
Node-Selectors:  &lt;none&gt;  
Tolerations:     node.kubernetes.io/not-ready:NoExecute for 300s  
                 node.kubernetes.io/unreachable:NoExecute for 300s  
Events:  
  Type    Reason     Age    From                                                      Message  
  ----    ------     ----   ----                                                      -------  
  Normal  Scheduled  4m46s  default-scheduler                                         Successfully assigned default/sleep-86cf99dfd6-xfvmk to ip-172-23-1-146.ap-northeast-1.compute.internal  
  Normal  Pulling    4m44s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  pulling image &#34;docker.io/istio/proxy_init:1.0.5&#34;  
  Normal  Pulled     4m39s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  Successfully pulled image &#34;docker.io/istio/proxy_init:1.0.5&#34;  
  Normal  Created    4m39s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  Created container  
  Normal  Started    4m39s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  Started container  
  Normal  Pulled     4m38s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  Container image &#34;pstauffer/curl&#34; already present on machine  
  Normal  Created    4m38s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  Created container  
  Normal  Started    4m38s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  Started container  
  Normal  Pulled     4m38s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  Container image &#34;docker.io/istio/proxyv2:1.0.5&#34; already present on machine  
  Normal  Created    4m38s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  Created container  
  Normal  Started    4m38s  kubelet, ip-172-23-1-146.ap-northeast-1.compute.internal  Started container
 ```

### まとめ

Istio-proxyがコンテナとして稼働していることが確認できました。

MutatingWebhookConfigurationを使うことでnamespaceに付与されているLabelをみて istio-injection=enabled が自動でWebhookを稼働するという動きになります。  
既存のコンテナに変更を加えることなく実現することができました。

次回はトラフィック管理などを試してみたいと思います。
