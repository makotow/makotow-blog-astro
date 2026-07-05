---
author: "makotow"
pubDatetime: 2019-03-04T16:20:34.770Z
modDatetime: 2020-01-04T18:12:10.000Z
title: "etcd のバックアップをする API v3"
draft: false
tags:
  - "Kubernetes"
  - "Etcd"
  - "Tech"
  - "Backup"
aliases:
  - "/etcd-backup-apiv3-828158cb06e0"
description: "etcd のバックアップをする API v3"
timezone: "Asia/Tokyo"
---

## 主にKubernetes環境におけるバックアップ

公式ドキュメントを確認すると普通に記載があるが少し手間取ったためメモ。

基本的には ETCDCTL_API=3 を環境変数に設定しhelpを見ればOK。

公式ドキュメント  
ボリュームのsnapshotとbuilt-inのsnapshotを使う方法がある

[Operating etcd clusters for Kubernetes](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster)

<!--more-->
<!--toc-->

## 結論から

バックアップは以下の通り。

etcdctl のv2とv3ではコマンドラインの引数が変わる。単純にHelpだけみているとv2のコマンドラインヘルプが表示されている可能性があるので自分がどのAPIバージョンを使っているかは確認すること。

環境変数 ETCDCTL_API＝３とするとv３APIになる。

kubernetesだとv3なので基本的にはv３を使う。
```bash
ETCDCTL_API=3 etcdctl --debug --endpoints [https://ip_address:2379](https://ip_address:2379)  --cert=”server.crt” --key=”server.key” --cacert=”ca.crt” snapshot save backup.db
```

とてもわかり易いドキュメント

[https://github.com/etcd-io/etcd/blob/master/Documentation/op-guide/recovery.md](https://github.com/etcd-io/etcd/blob/master/Documentation/op-guide/recovery.md)

## 気をつけること・ハマったこと

例えば、ヘルプを見るときには以下のように実行すると環境で標準とされているetcdのAPIバージョンとなる。

```bash
$ etcdctl --help  

 NAME:  
 etcdctl — A simple command line client for etcd.  

 WARNING:  
 Environment variable ETCDCTL_API is not set; defaults to etcdctl v2.  
 Set environment variable ETCDCTL_API=3 to use v3 API or ETCDCTL_API=2 to use v2 API.  

 USAGE:  
 etcdctl [global options] command [command options] [arguments…]  

 VERSION:  
 3.3.11  

 COMMANDS:  
 backup backup an etcd directory  
 cluster-health check the health of the etcd cluster  
 mk make a new key with a given value  
 mkdir make a new directory  
 rm remove a key or a directory  
 rmdir removes the key if it is an empty directory or a key-value pair  
 get retrieve the value of a key  
 ls retrieve a directory  
 set set the value of a key  
 setdir create a new directory or update an existing directory TTL  
 update update an existing key with a given value  
 updatedir update an existing directory  
 watch watch a key for changes  
 exec-watch watch a key for changes and exec an executable  
 member member add, remove and list subcommands  
 user user add, grant and revoke subcommands  
 role role add, grant and revoke subcommands  
 auth overall auth controls  
 help, h Shows a list of commands or help for one command  

 GLOBAL OPTIONS:  
 — debug output cURL commands which can be used to reproduce the request  
 — no-sync don’t synchronize cluster information before sending request  
 — output simple, -o simple output response in the given format (simple, `extended` or `json`) (default: “simple”)  
 — discovery-srv value, -D value domain name to query for SRV records describing cluster endpoints  
 — insecure-discovery accept insecure SRV records describing cluster endpoints  
 — peers value, -C value DEPRECATED — “ — endpoints” should be used instead  
 — endpoint value DEPRECATED — “ — endpoints” should be used instead  
 — endpoints value a comma-delimited list of machine addresses in the cluster (default: “[http://127.0.0.1:2379,http://127.0.0.1:4001](http://127.0.0.1:2379,http://127.0.0.1:4001)”)  
 — cert-file value identify HTTPS client using this SSL certificate file  
 — key-file value identify HTTPS client using this SSL key file  
 — ca-file value verify certificates of HTTPS-enabled servers using this CA bundle  
 — username value, -u value provide username[:password] and prompt if password is not supplied.  
 — timeout value connection timeout per request (default: 2s)  
 — total-timeout value timeout for the command execution (except watch) (default: 5s)  
 — help, -h show help  
 — version, -v print the version
 ```

ここで出力されたヘルプがAPIv2だったことに気づかず、ドハマリした。**Warning** にしっかり書いてあるのだがバックアップをしたいのでサブコマンドにしか目が行かなかった。

ここでAPIバージョンを指定することで、指定したバージョンのヘルプを見ることができる。（あたりまであるが…）

```bash
$ ETCDCTL_API=3 etcdctl --help  

 NAME:  
 etcdctl — A simple command line client for etcd3.  

 USAGE:  
 etcdctl  

 VERSION:  
 3.3.11  

 API VERSION:  
 3.3  

 COMMANDS:  
 get Gets the key or a range of keys  
 put Puts the given key into the store  
 del Removes the specified key or range of keys [key, range_end)  
 txn Txn processes all the requests in one transaction  
 compaction Compacts the event history in etcd  
 alarm disarm Disarms all alarms  
 alarm list Lists all alarms  
 defrag Defragments the storage of the etcd members with given endpoints  
 endpoint health Checks the healthiness of endpoints specified in ` — endpoints` flag  
 endpoint status Prints out the status of endpoints specified in ` — endpoints` flag  
 endpoint hashkv Prints the KV history hash for each endpoint in — endpoints  
 move-leader Transfers leadership to another etcd cluster member.  
 watch Watches events stream on keys or prefixes  
 version Prints the version of etcdctl  
 lease grant Creates leases  
 lease revoke Revokes leases  
 lease timetolive Get lease information  
 lease list List all active leases  
 lease keep-alive Keeps leases alive (renew)  
 member add Adds a member into the cluster  
 member remove Removes a member from the cluster  
 member update Updates a member in the cluster  
 member list Lists all members in the cluster  
 snapshot save Stores an etcd node backend snapshot to a given file  
 snapshot restore Restores an etcd member snapshot to an etcd directory  
 snapshot status Gets backend snapshot status of a given file  
 make-mirror Makes a mirror at the destination etcd cluster  
 migrate Migrates keys in a v2 store to a mvcc store  
 lock Acquires a named lock  
 elect Observes and participates in leader election  
 auth enable Enables authentication  
 auth disable Disables authentication  
 user add Adds a new user  
 user delete Deletes a user  
 user get Gets detailed information of a user  
 user list Lists all users  
 user passwd Changes password of user  
 user grant-role Grants a role to a user  
 user revoke-role Revokes a role from a user  
 role add Adds a new role  
 role delete Deletes a role  
 role get Gets detailed information of a role  
 role list Lists all roles  
 role grant-permission Grants a key to a role  
 role revoke-permission Revokes a key from a role  
 check perf Check the performance of the etcd cluster  
 help Help about any command  

 OPTIONS:  
 — cacert=”” verify certificates of TLS-enabled secure servers using this CA bundle  
 — cert=”” identify secure client using this TLS certificate file  
 — command-timeout=5s timeout for short running command (excluding dial timeout)  
 — debug[=false] enable client-side debug logging  
 — dial-timeout=2s dial timeout for client connections  
 -d, — discovery-srv=”” domain name to query for SRV records describing cluster endpoints  
 — endpoints=[127.0.0.1:2379] gRPC endpoints  
 — hex[=false] print byte strings as hex encoded strings  
 — insecure-discovery[=true] accept insecure SRV records describing cluster endpoints  
 — insecure-skip-tls-verify[=false] skip server certificate verification  
 — insecure-transport[=true] disable transport security for client connections  
 — keepalive-time=2s keepalive time for client connections  
 — keepalive-timeout=6s keepalive timeout for client connections  
 — key=”” identify secure client using this TLS key file  
 — user=”” username[:password] for authentication (prompt if password is not supplied)  
 -w, — write-out=”simple” set the output format (fields, json, protobuf, simple, table)
 ```

このようにサブコマンド自体がだいぶ変わっていることがわかる。

#### 結局

ヘルプと公式ドキュメントはちゃんと読みましょう。しっかりと記載されているが解決を急ぐあまりハマったパターン。
