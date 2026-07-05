---
author: "makotow"
pubDatetime: 2017-08-15T01:26:00.320Z
modDatetime: 2020-01-04T18:11:28.000Z
title: "Rust 事始め"
draft: false
tags:
  - "Rust"
  - "Tech"
aliases:
  - "/rust-%E4%BA%8B%E5%A7%8B%E3%82%81-9ef6a7b19844"
description: "Rust 事始め"
timezone: "Asia/Tokyo"
---

ツールをつくるのにRustを使っているので基本の勉強  
 勉強元は以下のURL

*   [https://rust-lang-ja.github.io/the-rust-programming-language-ja/1.6/book/getting-started.html](https://rust-lang-ja.github.io/the-rust-programming-language-ja/1.6/book/getting-started.html)

## hello world

main() 関数の中では  

```rust
 println!("Hello, world!");
```  

println! は関数ではない、！がついていたらマクロと考える。

Rustは式指向言語、行はセミコロン (;) で終わる。

## コンパイル・実行方法

コンパイルは rustc で実施  
 ファイル名の実行ファイルが作成される。

```bash
rustc main.rs
./main
```


## Cargo

Cargo は rust のビルドシステム。  
 コードのビルド、依存ライブラリのダウンロード、ダウンロードした依存ライブラリのビルドを実施。

## Hello world を Cargo に変換する。

Cargo は src ディレクトリにソースがあると想定して動作する。  
Cargo.tomlが設定ファイルとなり、プロジェクトフォルダ直下に作成する。  
Cが大文字であることに注意。  
TOML = Tom’s Obvious, Minimal Language

ファイルの内容は以下の通り
```toml
[package]  
 name = "hello_world"  
 version = "0.0.1"  
 authors = [ "あなたの名前 <you@example.com>" ]
 ```

上記ファイルをつくったらコマンド実行

```bash
$ cargo build  
 Compiling hello_world v0.0.1 (file:///Users/makoto/OneDrive/src/rustbyexample)  
Finished debug [unoptimized + debuginfo] target(s) in 1.19 secs  
$ ./target/debug/hello_world  
Hello world!
```

一連の流れは,cargo run でも可能
```bash
$ cargo run  
 Finished debug [unoptimized + debuginfo] target(s) in 0.0 secs  
 Running `target/debug/hello_world`  
 Hello world!
 ```

ファイルの更新が無いのでビルドは行っていないことに注目

## リリースビルドの仕方

cargo build --releaseでリリースビルド実施  
 Cargo.lockファイルが作成される。

## クレート？

いわゆるライブラリと考えて良さそう。  
 tomlの dependenciesに必要なライブラリを記述  
 以下のリポジトリにRustチームのクレートがある。  

* [https://github.com/rust-lang/crates.io-index](https://github.com/rust-lang/crates.io-index)  
   
 Cargo.tomlのクレートのバージョン指定は、  
 ```toml
 rand="0.30"
 ```

 という指定だと0.30 以上のバージョンという指定になることに注意  
 バージョンを固定したいのであれば 
 
```toml
rand=“=0.30"
```

最新であれば

```toml
rand="*"
```

クレートのバージョンが上がってしまい、ビルドするごとに最新版を取得するような動きはしない。  
 ビルド時にCargo.lockファイルにバージョンを記録するので移行はlockファイルにあるバージョンを使用するようになる。

とりあえず、開発周りのメモ。
