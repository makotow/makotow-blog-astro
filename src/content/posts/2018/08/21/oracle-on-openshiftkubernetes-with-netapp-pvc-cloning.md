---
author: "makotow"
pubDatetime: 2018-08-21T01:17:45.191Z
modDatetime: 2020-01-04T18:11:59.000Z
title: "Oracle on OpenShift/Kubernetes with NetApp PVC Cloning"
draft: false
tags:
  - "Tech"
  - "K8s"
  - "Openshift"
  - "Netapp"
  - "Storage"
aliases:
  - "/oracle-on-openshift-kubernetes-with-netapp-pvc-cloning-26859a442631"
ogImage: "1.png"
description: "30 sec 1.5TB oracle fast deploy"
timezone: "Asia/Tokyo"
---

## Instant clone and without requiring additional storage

![image](1.png)

今回試したのは２つ。

1.  Oracle(今回はシングル)をコンテナ化し、kubernetes（あとからOpenShiftを使用）上で稼働させる。
2.  1.5TBのデータベースを複数して稼働させる。約20秒から30秒で起動可能。

## Oracleをコンテナ化する

久しぶりにOracleを触ろうとおもったら最初からわからない用語が出てきて躓いた。  
 CDB/PDB といった概念がわからずとりあえずその理解から開始。

以下のURLが非常にわかりやすい。

*   [https://docs.oracle.com/database/121/CNCPT/cdbovrvw.htm#CNCPT-GUID-DCE7F725-450E-4B58-ADBC-F51BED0637DE](https://docs.oracle.com/database/121/CNCPT/cdbovrvw.htm#CNCPT-GUID-DCE7F725-450E-4B58-ADBC-F51BED0637DE)

実際のコンテナ化はスクラッチからやったわけではなく、GitHubで公開されているリポジトリの通り実施。  
 Oracle公式？のリポジトリで様々なOracleのソフトウェアが公開されている。

その中の OracleDatabase を利用。リポジトリにはシングルもRACも存在するが、今回はまずはシングル構成で実施。

*   [https://github.com/oracle/docker-images](https://github.com/oracle/docker-images)

## Docker image のビルドと対応した内容

ビルドは以下のURLに書いてあるとおり実施。

事前準備として、ビルドに必要なOracleのバイナリは本家からダウンロードしておく。

*   [https://github.com/oracle/docker-images/blob/master/OracleDatabase/SingleInstance/README.md](https://github.com/oracle/docker-images/blob/master/OracleDatabase/SingleInstance/README.md)

ビルド中に失敗するケースがあり、1つ解決してまた１つ発生していく。

*   swap領域がないことでエラー(swap領域がない理由はこの記事の最後に記載）
*   VMのメモリが足りずにエラー

## Kubernetes 用のマニフェストを定義

以下の進化を経て最終的にはテンプレートから既存PVCをクローンするマニフェストが完成。

1.  シンプルなマニフェスト(ほとんどべた書き）
2.  PVC を外部ストレージに保管（クローニングの布石)
3.  OpenShift を使って Template のマニフェスト（パラメータはそとから注入することを可能に）

コンテナのイメージレジストリは OpenShift のレジストリを利用しました。

## データの永続化については Tridentを利用

クローニング元のデータベースを作成、`/opt/oracle/oradata`を永続化するようPVCを作成。

利用したマニフェストは以下の通り。

```yaml
apiVersion: apps/v1  
kind: Deployment  
metadata:  
  name:  oracle-se2  
  labels:  
    app:  database
spec:  
  selector:  
    matchLabels:  
      app: database  
  template:  
    metadata:  
      labels:  
        app:  database  
    spec:  
      containers:  
      - image: docker-registry.default.svc:5000/default/oracledb:12.2.0.1-se2  
        name: oracle-se2  
        env:  
        - name: ORACLE_SID  
          value: "tridentsid"  
        - name: ORACLE_PDB  
          value: tridentpdb  
        - name: ORACLE_PWD  
          value: "PASSWORD"  
        ports:  
        - containerPort:  1521  
          name:  oraclelistener  
        - containerPort:  5500  
          name:  manager  
        volumeMounts:  
        - mountPath: /opt/oracle/oradata  
          name: oradata  
      volumes:  
        - name: oradata  
          persistentVolumeClaim:  
            claimName: oracle-pv-claim
```

PVC は以下の通りデータベースを作成するため2TiBのボリュームを作成している。
```yaml
apiVersion: v1  
kind: PersistentVolumeClaim  
metadata:  
  name: oracle-pv-claim  
  labels:  
    app: backend  
  annotations:  
    trident.netapp.io/reclaimPolicy: Retain  
    trident.netapp.io/exportPolicy: default  
spec:  
  accessModes:  
    - ReadWriteOnce  
  resources:  
    requests:  
      storage: 2Ti  
  storageClassName: ontap-gold
```

上記のマニフェストから`deployment`を作成。

## OracleDatabase でデータを生成

上記のPVC上のデータに1.5TBのOracleDBテストデータの作成をするため以下の通りテストデータを作成。

sqlplusでログインしsqlを実行し、PDBを切り替えて接続を確認する。

```sql
SQL< select name, open_mode from v$pdbs;  

NAME  
--------------------------------------------------------------------------------  
OPEN_MODE  
----------  
PDB$SEED  
READ ONLY  

TRIDENTPDB  
READ WRITE  

SQL&gt; alter session set container =TRIDENTPDB;  

Session altered.  

set linesize 200  
@usage  

SQL&gt; show con_name  

CON_NAME  
------------------------------  
TRIDENTPDB  
```

1.5TBのテーブルスペースの作成。

```sql
sqlplus sys/password@tridentsid as sysdba  

create bigfile tablespace hugetbs datafile '/opt/oracle/oradata/tridentsid/tridentpdb/hugetbs.dbf' size 1536G autoextend on next 10G maxsize 1638G;
```

デフォルトのテーブルスペースを`hugetbs`へ変更。

```sql
ALTER USER SYS DEFAULT TABLESPACE HUGETBS`
```

テストデータを投入するテーブルを作成。

```sql
CREATE TABLE testdata  
(  
    DT            DATE,  
    CD            VARCHAR2(10),  
    KIN           NUMBER(9,0)  
);
```

`testdata`テーブルのテーブルスペースの変更

```sql
ALTER TABLE testdata MOVE TABLESPACE hugetbs;
```

テストデータ作成。これで大体1.5GBくらいになるので、あとはテーブルを必要数分コピーして1.5TBまで増やす。

```sql
INSERT /*+ APPEND */ INTO testdata NOLOGGING  
SELECT   
TO_DATE('20040101','YYYYMMDD')  
+MOD(ABS(DBMS_RANDOM.RANDOM())  
,TO_DATE('20190101','YYYYMMDD')-TO_DATE('20040101','YYYYMMDD')) DT  
,TO_CHAR(ABS(DBMS_RANDOM.RANDOM()),'FM0000000000') CD  
,MOD(DBMS_RANDOM.RANDOM(),100000) KIN  
FROM  
(SELECT 0 FROM ALL_CATALOG WHERE ROWNUM <= 10000)   
,(SELECT 0 FROM ALL_CATALOG WHERE ROWNUM <= 10000)  

commit;
```

以下のSQLを実行してテーブルを作成する。

**testdata_1** の1の部分を変更することで1.5GBのテストデータをそのままコピーすることが可能。

```sql
CREATE TABLE testdata_1 NOLOGGING PARALLEL AS SELECT * FROM testdata;  
commit;
```

## 高速クローニング

今回ためしたいことの１つとしてPVCクローニング機能。これを実現するために[Trident 18.04](http://netapp-trident.readthedocs.io/en/stable-v18.04/)を使う。

クローニングの記述はこちら[Kubernetes PersistentVolumeClaim objects](https://netapp-trident.readthedocs.io/en/stable-v18.04/kubernetes/concepts/objects.html?highlight=clone#kubernetes-persistentvolumeclaim-objects)

OpenShiftのTemplateを使ってカタログ登録をして、コマンドラインから9個のOracleデータベースを起動する。

```yaml
apiVersion: v1  
kind: Template  
metadata:  
  annotations:  
    description: Oracledatabase rapid cloning with NetApp FlexClone  
    tags: database,netapp  
  name: oracle-netapp-clone  
objects:  
- apiVersion: v1  
  kind: PersistentVolumeClaim  
  metadata:  
    annotations:  
      trident.netapp.io/cloneFromPVC: ${CLONE_FROM_PVC}  
      trident.netapp.io/exportPolicy: default  
      trident.netapp.io/reclaimPolicy: Delete  
    labels:  
      app: database-cloned  
    name: ${DEPLOY_NAME}-clone-data  
  spec:  
    accessModes:  
    - ReadWriteOnce  
    resources:  
      requests:  
        storage: ${VOLUME_CAPACITY}  
    storageClassName: ontap-gold  
- apiVersion: apps/v1  
  kind: Deployment  
  metadata:  
    labels:  
      app: database-cloned  
    name: ${DEPLOY_NAME}  
  spec:  
    replicas: 1  
    selector:  
      matchLabels:  
        app: database-cloned  
    template:  
      metadata:  
        labels:  
          app: database-cloned  
      spec:  
        containers:  
        - env:  
          - name: ORACLE_SID  
            value: ${ORACLE_SID}  
          - name: ORACLE_PDB  
            value: ${ORACLE_PDB}  
          - name: ORACLE_PWD  
            value: ${ORACLE_PWD}  
          image: docker-registry.default.svc:5000/default/oracledb:12.2.0.1-se2  
          imagePullPolicy: IfNotPresent  
          name: ${DEPLOY_NAME}  
          ports:  
          - containerPort: 1521  
            name: oraclelistener  
            protocol: TCP  
          - containerPort: 5500  
            name: manager  
            protocol: TCP  
          readinessProbe:  
            exec:  
              command:  
              - /bin/sh  
              - -c  
              - echo 'select * from dual;'  
              - '|'  
              - sqlplus  
              - sys/netapp123@tridentsid  
              - as  
              - sysdba  
              initialDelaySeconds: 20  
              periodSecond: 10  
              timeoutSeconds: 1  
          volumeMounts:  
          - mountPath: /opt/oracle/oradata  
            name: oradata  
        restartPolicy: Always  
        volumes:  
        - name: oradata  
          persistentVolumeClaim:  
            claimName: ${DEPLOY_NAME}-clone-data  
parameters:  
- description: deployment name  
  displayName: name  
  name: DEPLOY_NAME  
  required: true  
  value: oracle-clone-1  
- description: Oralce SID  
  displayName: Oralce SID  
  name: ORACLE_SID  
  required: true  
  value: tridentsid  
- description: Oralce PDB  
  displayName: Oralce PDB  
  name: ORACLE_PDB  
  required: true  
  value: tridentpdb  
- description: Oralce Password  
  displayName: Oralce Password  
  name: ORACLE_PWD  
  required: true  
  value: netapp123  
- description: Base PVC for cloning  
  displayName: FROM PVC  
  name: CLONE_FROM_PVC  
  required: true  
  value: oracle-pv-claim  
- description: Volume space available for data, e.g. 512Mi, 2Gi, 2Ti.  
  displayName: Volume Capacity  
  name: VOLUME_CAPACITY  
  required: true  
  value: 2Ti
```

templateの登録。

```bash
$ oc create -f oc-oracle-template.yaml -n trident-demo  

_template'oracle-netapp-clone' created_  

$ oc get template -n trident-demo  

_NAME                  DESCRIPTION                                          PARAMETERS    OBJECTS  
oracle-netapp-clone   Oracledatabase rapid cloning with NetApp FlexClone   6 (all set)   2_
```

複数Template展開できるようにスクリプト作成

```ruby
for i in start..limit  
      cmd = "oc process oracle-netapp-clone -p DEPLOY_NAME=oracle-clone-#{i} | oc create -f "  
       system(cmd)  
end
```

これで1.5TBのテーブルスペースをもつOracleDatabaseを20–30秒でプロビジョニング可能になった。

以下の動画が実際の1.5TBのデータを持ったデータベースの複製をデモしたもの。


## ハマりポイントまとめ

主に個人向けのメモとハマったときに振り返るためのメモ。

## OpenShiftで稼働させるコンテナでroot ユーザが必要な場合

セキュリティポリシーを変更する必要あり。

本来はrootでコンテナを動かすのは望ましくないが稼働確認のため以下のコマンドで許可。

```bash
$  oc adm policy add-scc-to-group anyuid system:authenticated  
$  oc adm policy add-scc-to-user anyuid system:serviceaccount:default:root
```

#### Oracleのコンテナイメージを作成時の仮想マシンのメモリ量/Swapの有効化

kubernetesの要件として swap を無効にするというものがあるため無効化していた。。  
 同じホストでOracleのイメージビルドも行っていたためエラーで落ちるという話。
