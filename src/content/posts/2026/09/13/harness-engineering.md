---
pubDatetime: 2026-09-13T01:34:00+09:00
modDatetime: 2026-09-13T01:34:00+09:00
title: "AI Agentの品質はモデルだけでは決まらない — Harness Engineeringとは何か"
tags:
  - AI Agent
  - Coding Agent
  - Harness Engineering
  - Agent Evaluation
categories:
  - AI Agent
  - Engineering
description: "AI Agentの品質をモデル性能だけで捉えず、Prompt・Tool・Context・Permission・Validationを含むHarness全体をテスト可能なSoftware Systemとして設計する考え方を整理します。"
draft: true
---

AI Agentの性能について考えるとき、最初に注目されるのはモデルではないだろうか。

新しいモデルが出るたびに、Coding Agentの性能がどれくらい向上したのか、ベンチマークのスコアがどれくらい伸びたのかが話題になる。

もちろんモデルの能力は重要だ。

しかし、実際にClaude CodeやCodexのようなCoding Agentを使っていると、Agentの品質はモデルだけでは決まらないことが分かる。

同じモデルを使っていても、

- どのようなSystem Promptを与えるか
- どのToolを利用可能にするか
- どのContextを渡すか
- どのタイミングでValidationするか
- どこまで自律実行を許可するか
- どの操作にHuman Approvalを要求するか

によってAgentの挙動は大きく変わる。

つまり、Agentを本番で安定して動かすには、モデルそのものだけではなく、**モデルの周囲にある実行環境全体をEngineering対象として考える必要がある。**

最近Googleが公開した「Harness Engineering」という考え方は、この問題を整理するうえで興味深い。

## Harnessとは何か

Harnessという言葉は、Agentを実行するためにモデルの周囲に存在する仕組み全体と考えると分かりやすい。

例えばCoding Agentなら、次のようなものが含まれる。

- System Prompt
- Context
- Tool定義
- Tool execution
- Memory
- Execution loop
- Permission
- Retry
- Validation
- Human Approval

単純化すると、次のような構造になる。

```text
               ┌─────────────┐
               │    Model    │
               └──────┬──────┘
                      │
        ┌─────────────▼─────────────┐
        │          Harness          │
        │                           │
        │ Prompt / Context          │
        │ Tools / Permissions       │
        │ Execution / Retry         │
        │ Memory / State            │
        │ Validation                │
        │ Human Approval            │
        └─────────────┬─────────────┘
                      │
                      ▼
               Agent Behavior
                      │
                      ▼
                   Outcome
```

この構造で考えると、Agentの品質問題をすべてモデルの性能に帰属させることが危険だと分かる。

例えばAgentがファイルを変更したのにテストを実行しなかったとする。

これはモデル能力の問題かもしれない。

しかし、

- System Promptでテスト実行を要求していない
- テストToolを適切に提供していない
- Validation stepをHarness側で強制していない

というHarness側の問題かもしれない。

Agentの品質を改善するには、

**Model EvaluationだけではなくHarness Evaluationが必要になる。**

## Outcomeだけを見てもHarnessは改善できない

Coding AgentにIssueを渡し、最終的に正しいコードが生成されたかを見る。

これは重要な評価だ。

しかし、最終結果だけを見ると途中でAgentがどのように行動したかは分からない。

例えば同じ「成功」でも、

```text
要求を理解
  ↓
コードを調査
  ↓
修正
  ↓
テスト
  ↓
成功
```

というケースと、

```text
要求を推測
  ↓
コードを修正
  ↓
テストせず終了
  ↓
偶然成功
```

というケースでは意味が違う。

後者は今回成功していても、別のタスクでは事故につながる可能性がある。

そこで重要になるのが**Behavioral Evaluation**だ。

## AgentのBehaviorをテストする

GoogleがHarness Engineeringの記事で紹介している重要な考え方の1つが、Agentの途中のBehaviorを評価することだ。

例えば、

- 曖昧な要求ならユーザーへ質問したか
- build fileを変更したらvalidatorを実行したか
- 必要なToolを使用したか
- canonicalな情報源を参照したか

といった行動をテストする。

これはSoftware EngineeringにおけるIntegration Testにかなり近い。

例えばCoding Agentに次のルールを与えているとする。

```text
コードを変更した場合は必ずテストを実行する
```

このルールをSystem Promptに書くだけでは、本当に守られるかは分からない。

そこで、

```text
Given:
  コード変更が必要なタスク

When:
  Agentがタスクを実行

Then:
  テストToolが実行されている
```

というBehavioral Evalを作る。

するとHarnessを変更したときに、

**「以前は守れていたBehaviorが壊れていないか」**

を継続的に確認できる。

## Agentの失敗をRegression Testへ変える

Harness Engineeringで特に面白いのは、最初から巨大なEval Suiteを作る必要はないという考え方だ。

まずAgentを使う。

そして失敗を観察する。

例えばCoding Agentが、

> build fileを書き換えたのにvalidatorを実行しなかった

という失敗をしたとする。

この失敗を見つけたら、Behavioral Evalへ変換する。

```text
Failure
   ↓
Failure Modeを特定
   ↓
期待するBehaviorを定義
   ↓
Evalを追加
   ↓
Harnessを修正
   ↓
Regression Test
```

これは通常のSoftware Engineeringで行われていることとほとんど同じだ。

Bugが発生する。

原因を調べる。

Testを書く。

修正する。

同じBugが再発しないようにする。

Agent Engineeringでも、

**Agentの失敗をRegression Testへ変換する**

という習慣が重要になる。

## ただしBehaviorを固定しすぎてはいけない

ここで難しい問題がある。

Agentは通常のプログラムほど決定論的ではない。

例えば、ある問題を解くために、

```text
Tool A
  ↓
Tool B
  ↓
Tool C
```

という経路を取る場合もあれば、

```text
Tool A
  ↓
Tool D
  ↓
Tool C
```

でも正しく解決できる場合がある。

そのため、

> 必ずTool A → Tool B → Tool Cの順番で実行する

というEvalを大量に作ると、Agentの正しい探索能力まで制限してしまう可能性がある。

ここでは**何をDeterministicに評価し、何をProbabilisticに評価するか**を分ける必要がある。

Deterministicな評価に向いているのは、

- 禁止Toolを使っていない
- 必須validatorを実行した
- 必要なparameterが存在する
- 許可されていないファイルを変更していない
- build/testが成功した

といったものだ。

一方、

- 適切な調査戦略だったか
- 回答が十分に分かりやすいか
- 複数の正しい解法から妥当な方法を選んだか

といったものは、LLM-as-a-JudgeなどProbabilisticな評価の方が適している場合がある。

重要なのは、どちらか一方に統一することではない。

**AgentのBehaviorに応じて評価方法を使い分けることだ。**

## Harness EngineeringはAgentをSoftwareとして扱うための考え方

Harness Engineeringという言葉だけを見ると、新しいAgent Frameworkの話に見えるかもしれない。

しかし本質はもっとSoftware Engineeringに近いと思う。

モデルを変更する。

Promptを変更する。

Toolを追加する。

Contextの与え方を変える。

Permissionを変更する。

これらはすべてAgentのBehaviorを変える可能性がある。

つまりAgent HarnessもSoftwareと同じように、

**変更すればRegressionする可能性がある。**

だからテストする。

失敗したらRegression Testへ変える。

継続的に評価する。

この考え方は、AgentをPoCから本番へ持っていくうえで重要になる。

## Agentの品質は「どのモデルを使うか」だけでは決まらない

Agent開発では、どうしてもモデル選択に目が向きやすい。

しかし本番運用では、

```text
Agent Quality
    ≠
Model Quality
```

だと思う。

より実態に近いのは、

```text
Agent Quality
    =
Model
× Harness
× Evaluation
× Operations
```

ではないだろうか。

モデルが高性能でも、危険なToolを無制限に呼び出せるHarnessでは本番運用しにくい。

逆にモデルの能力をHarness側のValidationやContext Engineeringで補える場合もある。

そしてHarnessを改善するには、そのBehaviorを評価できなければならない。

Harness Engineeringが重要なのは、

**Agentを「賢いモデル」としてではなく「テスト可能なSoftware System」として扱うための考え方**

だからだと思う。

次の記事では、ここからさらに一歩進めて、Agent Evaluationについて考えたい。

Agentが5回失敗したとして、本当に5個の問題があるのだろうか。

実際には、最初の1回のTool呼び出しの失敗が、その後の4回の失敗を引き起こしているかもしれない。

Agentが長時間・Multi-turnで動くようになるほど、

**「成功したか」ではなく「どこで最初に壊れたか」**

を評価する必要が出てくる。

Agent Evaluationは、単なるスコアリングからデバッグへ変わり始めている。

続き: [AI Agentの評価を「スコアリング」から「デバッグ」へ](/2026/09/13/agent-evaluation-debugging/)

## 参考

- [Google Developers Blog — The Anatomy of Harness Engineering: How to Evaluate, Iterate, and Guard AI Coding Agents](https://developers.googleblog.com/the-anatomy-of-harness-engineering-how-to-evaluate-iterate-and-guard-ai-coding-agents/)
