---
author: "makotow"
pubDatetime: 2020-04-12T14:30:49+09:00
title: "Webassembly に入門してみた。"
draft: false
tags:
  - "wasm"
  - "tech"
categories:
  - "wasm-getting-started"
ogImage: "https://github.com/carlosbaraza/web-assembly-logo/blob/master/dist/logo/web-assembly-logo-512px.png?raw=true"
description: "WebAssembly と聞いて「あーあれね」から脱するが目的"
timezone: "Asia/Tokyo"
---

WebAssembly に入門した記事。
まとめながら書くと自分の理解に役立つためそういう目的です。

## TL;DR

WebAssembly に入門してみた記事。

WebAssembly 自体はW3Cが定義するウェブブラウザ上でバイナリを動かす仕様のこと。

* ウェブブラウザ上でバイナリを動かす仕様
* https://webassembly.org/ を読むとすぐ理解可能

<!-- toc -->

<!--more-->

---

## What is WebAssembly?

一番最初の疑問としては「プログラミング言語の類なのか？」でしたが、検索すれば３秒で理解できました。
ウェブブラウザ上でバイナリを動かす仕様というのはすぐわかりました。

* https://webassembly.org/
* https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts
* https://www.w3.org/TR/wasm-core-1/

公式の定義としては以下の通り
    
    WebAssembly (abbreviated Wasm) is a binary instruction format for a stack-based virtual machine. Wasm is designed as a portable target for compilation of high-level languages like C/C++/Rust, enabling deployment on the web for client and server applications.
    (参考訳）    
    WebAssembly（略称Wasm）は、スタックベースの仮想マシン用のバイナリ命令フォーマットです。 
    Wasmは、C / C ++ / Rustのような高水準言語のコンパイル用のポータブルターゲットとして設計されており、
    クライアントおよびサーバーアプリケーションのWebへの展開を可能にします。    

## WebAssembly の目指すところ

WebAssembly が仕様ということがわかったので、そもそもどのような目的で作られているかを見ていきます。

ドキュメントを見ていくと https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts を発見しました。
このドキュメントが非常にまとまっておりとても理解が進みました。

WebAssembly が目指すところとしては以下のようなところです。
* 高速、効率的、ポータブル: 共通のハードウェア機能を利用することで、WebAssemblyコードを異なるプラットフォーム間でネイティブに近い速度で実行
* 読み取り可能でデバッグ可能: WebAssemblyは低レベルのアセンブリ言語だが、人間が読み取れるテキスト形式（仕様はまだ最終決定中）があり、コードを手動で記述、表示、デバッグ可能
* 安全を保つ: WebAssemblyは、安全でサンドボックス化された実行環境で実行可能。 他のWebコードと同様に、ブラウザーの同一生成元とアクセス許可のポリシーを適用。
* Webを壊さない— WebAssemblyは、他のWebテクノロジーとうまく機能し、下位互換性を維持するように設計

## やってみる 

C言語で記載したプログラムをブラウザ上で動かすサンプルを試してみた。
このドキュメントを試しました。

* https://webassembly.org/getting-started/developers-guide/

コンパイルのためのツールチェインの Emscripten SDK をインストール。

ためした環境は Ubuntu 18.04です。

```text
shell script
git clone https://github.com/emscripten-core/emsdk.git
alias-tips: g clone https://github.com/emscripten-core/emsdk.git
Cloning into 'emsdk'...
remote: Enumerating objects: 30, done.
remote: Counting objects: 100% (30/30), done.
remote: Compressing objects: 100% (22/22), done.
remote: Total 1839 (delta 14), reused 14 (delta 8), pack-reused 1809
Receiving objects: 100% (1839/1839), 1.01 MiB | 1.20 MiB/s, done.
Resolving deltas: 100% (1162/1162), done.
```

cmake が必要なのでインストール。

```text
shell script
sudo apt install cmake
```

ドキュメントどおりでは動かないので以下の通り。
Issueにあがっていてもうじき直る想定

https://github.com/emscripten-core/emscripten/issues/10063

```text
shell script
❯  cd emsdk
❯ ./emsdk install sdk-upstream-incoming-64bit
Error: No tool or SDK found by name 'sdk-upstream-incoming-64bit'.

❯ ./emsdk install latest
Installing SDK 'sdk-releases-upstream-6584e2d88570ee55914db92a3bad84f99e5bdd82-64bit'..
Installing tool 'node-12.9.1-64bit'..
Downloading: /home/makotow/data/src/emsdk/zips/node-v12.9.1-linux-x64.tar.xz from https://storage.googleapis.com/webassembly/emscripten-releases-builds/deps/node-v12.9.1-linux-x64.tar.xz, 13918928 Bytes
Unpacking '/home/makotow/data/src/emsdk/zips/node-v12.9.1-linux-x64.tar.xz' to '/home/makotow/data/src/emsdk/node/12.9.1_64bit'
Done installing tool 'node-12.9.1-64bit'.
Installing tool 'releases-upstream-6584e2d88570ee55914db92a3bad84f99e5bdd82-64bit'..
Downloading: /home/makotow/data/src/emsdk/zips/6584e2d88570ee55914db92a3bad84f99e5bdd82-wasm-binaries.tbz2 from https://storage.googleapis.com/webassembly/emscripten-releases-builds/linux/6584e2d88570ee55914db92a3bad84f99e5bdd82/wasm-binaries.tbz2, 167002827 Bytes
Unpacking '/home/makotow/data/src/emsdk/zips/6584e2d88570ee55914db92a3bad84f99e5bdd82-wasm-binaries.tbz2' to '/home/makotow/data/src/emsdk/upstream'
Done installing tool 'releases-upstream-6584e2d88570ee55914db92a3bad84f99e5bdd82-64bit'.
Running post-install step: npm ci ...
Done running: npm ci
Done installing SDK 'sdk-releases-upstream-6584e2d88570ee55914db92a3bad84f99e5bdd82-64bit'.
./emsdk install latest  22.35s user 3.39s system 30% cpu 1:23.33 total

emsdk took 1m 24s 
❯ ./emsdk activate latest
Writing .emscripten configuration file to user home directory /home/makotow/
The Emscripten configuration file /home/makotow/.emscripten has been rewritten with the following contents:

NODE_JS = '/home/makotow/data/src/emsdk/node/12.9.1_64bit/bin/node'
LLVM_ROOT = '/home/makotow/data/src/emsdk/upstream/bin'
BINARYEN_ROOT = '/home/makotow/data/src/emsdk/upstream'
EMSCRIPTEN_ROOT = '/home/makotow/data/src/emsdk/upstream/emscripten'
TEMP_DIR = '/tmp'
COMPILER_ENGINE = NODE_JS
JS_ENGINES = [NODE_JS]

To conveniently access the selected set of tools from the command line, consider adding the following directories to PATH, or call 'source ./emsdk_env.sh' to do this for you.

   /home/makotow/data/src/emsdk:/home/makotow/data/src/emsdk/node/12.9.1_64bit/bin:/home/makotow/data/src/emsdk/upstream/emscripten

Set the following tools as active:
   node-12.9.1-64bit
   releases-upstream-6584e2d88570ee55914db92a3bad84f99e5bdd82-64bit
```

path 通して実行。

```text
shell script
❯ source ./emsdk_env.sh --build=Release
Adding directories to PATH:
PATH += /home/makotow/data/src/emsdk
PATH += /home/makotow/data/src/emsdk/upstream/emscripten
PATH += /home/makotow/data/src/emsdk/node/12.9.1_64bit/bin

Setting environment variables:
EMSDK = /home/makotow/data/src/emsdk
EM_CONFIG = /home/makotow/.emscripten
EMSDK_NODE = /home/makotow/data/src/emsdk/node/12.9.1_64bit/bin/node

❯ mkdir hello
❯ cd hello
❯ cat << EOF > hello.c
#include <stdio.h>
int main(int argc, char ** argv) {
  printf("Hello, world!\n");
}
EOF
❯ emcc hello.c -o hello.html
cache:INFO: generating system library: libcompiler_rt.a... (this will be cached in "/home/makotow/.emscripten_cache/wasm/libcompiler_rt.a" for subsequent builds)
cache:INFO:  - ok
cache:INFO: generating system library: libc-wasm.a... (this will be cached in "/home/makotow/.emscripten_cache/wasm/libc-wasm.a" for subsequent builds)
cache:INFO:  - ok
cache:INFO: generating system library: libdlmalloc.a... (this will be cached in "/home/makotow/.emscripten_cache/wasm/libdlmalloc.a" for subsequent builds)
cache:INFO:  - ok
cache:INFO: generating system library: libpthread_stub.a... (this will be cached in "/home/makotow/.emscripten_cache/wasm/libpthread_stub.a" for subsequent builds)
cache:INFO:  - ok
cache:INFO: generating system library: libc_rt_wasm.a... (this will be cached in "/home/makotow/.emscripten_cache/wasm/libc_rt_wasm.a" for subsequent builds)
cache:INFO:  - ok
cache:INFO: generating system library: libsockets.a... (this will be cached in "/home/makotow/.emscripten_cache/wasm/libsockets.a" for subsequent builds)
cache:INFO:  - ok
emcc hello.c -o hello.html  13.70s user 3.76s system 421% cpu 4.147 total
```

C言語をemcc に通すと、html, js, wasm が生成される。

```text
shell script
❯ ls
hello.c  hello.html  hello.js  hello.wasm

emsdk/hello via ⬢ v12.9.1 
❯  emrun --no_browser --port 8080 .
Web server root directory: /home/makotow/data/src/emsdk/hello
Now listening at http://0.0.0.0:8080/
```

完全に理解した。


## 次回

この記事では定義やコンセプト、ゴールを見てきました。

ここまでで知識としてはなんとなく理解しましたが、次の記事（？）では Rust を WebAssembly にするというところをやっていきたいと思います。

つづく
