---
pubDatetime: 2026-09-13T01:34:00+09:00
modDatetime: 2026-09-13T01:34:00+09:00
title: "AI Agentの評価を「スコアリング」から「デバッグ」へ — どこで最初に壊れたかを評価する"
tags:
  - AI Agent
  - Agent Evaluation
  - Observability
  - Testing
  - CI/CD
categories:
  - AI Agent
  - Engineering
description: "Multi-turn AI Agentでは成功率だけでは不十分です。Outcome・Behavior・Root Cause Attribution・Execution Trace・CI Quality Gateをつなぎ、評価をデバッグへ進化させる考え方を整理します。"
draft: true
---

前編: [AI Agentの品質はモデルだけでは決まらない — Harness Engineeringとは何か](/2026/09/13/harness-engineering/)

AI Agentを評価するとき、最も分かりやすい指標はTask Success Rateだ。

Agentに仕事を与えて、

**成功したか、失敗したか。**

Coding Agentなら、

- Issueを修正できた
- テストが通った
- 正しいPull Requestを作れた

といった結果を見る。

これは必要な評価だ。

しかしAgentが長時間動き、複数のToolを使い、Multi-turnで処理するようになると、成功率だけではAgentを改善するための情報が足りなくなる。

例えば、5 Turnのうち4 Turnが失敗したとする。

このAgentには4つの問題があるのだろうか。

実際には、

**Turn 2で発生した1つのTool parameterの間違いが、Turn 3〜5をすべて壊しているだけ**

かもしれない。

この場合、本当に直すべき問題は1つだ。

Agent Evaluationで重要になるのは、

**「何回失敗したか」ではなく「どこで最初に壊れたか」**

ではないだろうか。

## Agentの失敗は連鎖する

通常のSoftwareでも、上流のエラーが下流へ伝播することはある。

Agentではこの問題がさらに大きくなる。

例えば旅行を手配するAgentを考えてみる。

```text
Turn 1
目的地を確認
      ↓
Turn 2
日付をToolへ渡す
      ↓
Turn 3
ホテルを検索
      ↓
Turn 4
旅程を作成
      ↓
Turn 5
ユーザーへ回答
```

Turn 2で日付を間違えたとする。

するとTurn 3のホテル検索結果も間違う。

Turn 4の旅程も間違う。

Turn 5の回答も間違う。

結果だけを見ると、

```text
Turn 1  OK
Turn 2  NG
Turn 3  NG
Turn 4  NG
Turn 5  NG
```

なので成功率は20%になる。

しかし、これは4つの独立した失敗ではない。

```text
Turn 1  OK

Turn 2  Parameter Error
        ↑
        Root Cause

Turn 3  Failed
        ↑
        Cascade

Turn 4  Failed
        ↑
        Cascade

Turn 5  Failed
        ↑
        Cascade
```

直すべきなのはTurn 2だ。

この区別ができなければ、Agentの改善ポイントを正しく特定できない。

## AWSのAgent Evaluation Metric

AWSが公開したmulti-turn Agent向けのAgent Evaluation Metric（AEM）は、この問題を扱っている。

AEMではAgentの実行をTurn単位で評価し、単純な成功・失敗だけでなくFailure Typeを分類する。

例えばAction Turnなら、

- `tool_mismatch`
- `action_mismatch`
- `missing_parameters`
- `extra_parameters`
- `inconsistent_parameter_values`

などだ。

そして重要なのが、

`prior_action_failed`

という分類だ。

現在のTurnそのものが悪いのではなく、

**以前のActionが失敗した結果を引き継いだために失敗した**

ことを区別できる。

すると、

```text
first_failure_turn = 2
root_cause = inconsistent_parameter_values
root_cause_count = 1
cascading_count = 3
```

のようにAgentの失敗を分析できる。

単純に、

> 成功率20%

と言われるのと、

> Turn 2のparameter生成に1つのRoot Causeがあり、その結果3つのCascade Failureが発生した

と言われるのでは、Engineering上の情報量が大きく違う。

後者なら、次にどこを直せばよいかが分かる。

## Agent Evaluationを3つのLayerで考える

Harness Engineeringと、このようなTurn-level Evaluationを組み合わせると、Agent Evaluationを3つのLayerに整理できると思う。

### Layer 1: Outcome Evaluation

最も外側にあるのがOutcomeだ。

**最終的にタスクを達成できたか。**

例えば、

- Issueを修正できた
- Testが通った
- 正しい回答を返した
- User Goalを達成した

などだ。

End-to-End BenchmarkやTask Success Rateが主に見る領域になる。

これは「Agentは使えるのか」を判断するために重要だ。

しかし「なぜ失敗したのか」は分からない。

### Layer 2: Behavioral Evaluation

次にAgentの途中のBehaviorを見る。

例えば、

- 正しいToolを選んだか
- 必要なvalidatorを実行したか
- 禁止Actionを実行しなかったか
- 必要なparameterを渡したか

などだ。

これは前の記事で扱ったHarness Engineeringと密接に関係する。

Harnessを変更した結果、期待していたBehaviorが壊れていないかを確認する。

Outcomeだけでは見えないRegressionを検出するためのLayerだ。

### Layer 3: Root Cause Attribution

さらにMulti-turn Agentでは、

**どのBehaviorが最初に失敗したか**

を見る必要がある。

```text
Tool Selection
      ↓
Parameter Generation  ← Root Cause
      ↓
Tool Result
      ↓
Analysis              ← Cascade
      ↓
Final Answer           ← Cascade
```

これによって、

**Failure Detection**

から、

**Failure Diagnosis**

へ進める。

ここまで来ると、Agent Evaluationは単なる採点ではない。

Debuggingに近い。

## 「失敗率を下げる」だけでは改善できない

例えばAgentのTask Success Rateが、

```text
72% → 78%
```

へ改善したとする。

良い変化に見える。

しかし、なぜ改善したのか分からなければ再現性がない。

逆に、

```text
78% → 74%
```

へ低下した場合も、原因が分からなければ修正できない。

モデルを変更したからなのか。

Promptを変更したからなのか。

Tool schemaを変更したからなのか。

Contextが不足したからなのか。

特定のTool parameter生成だけが悪化したのか。

Agentを継続的に改善するなら、

**ScoreだけでなくFailure Distributionを見る**

必要がある。

例えば、

```text
tool_mismatch                  12%
missing_parameters              8%
inconsistent_parameter_values  31%
prior_action_failed            38%
other                          11%
```

という結果なら、

`prior_action_failed`

を38%改善しようとするのは間違いかもしれない。

それはRoot CauseではなくCascadeだからだ。

先に`inconsistent_parameter_values`を直せば、その結果として`prior_action_failed`も大きく減る可能性がある。

これはAgent Evaluationを運用するときにかなり重要な視点だと思う。

## EvaluationにはExecution Traceが必要になる

ここまで評価しようとすると、最終回答だけ保存していても足りない。

必要になるのはAgentのExecution Traceだ。

例えば、

```text
Agent Run
  │
  ├─ Turn 1
  │    └─ Tool A
  │
  ├─ Turn 2
  │    └─ Tool B(parameters...)
  │
  ├─ Turn 3
  │    └─ Tool C
  │
  └─ Final Response
```

という実行履歴が必要になる。

するとAgent ObservabilityとAgent Evaluationの境界が近づいてくる。

Observabilityでは、

> Agentで何が起きたのか

を見る。

Evaluationでは、

> 起きたBehaviorは正しかったのか

を見る。

つまり同じTraceに対して、

```text
Execution Trace
      │
      ├──── Observability
      │       └─ What happened?
      │
      └──── Evaluation
              └─ Was it correct?
```

という2つの見方ができる。

Agent Evaluationを考えるほど、Observabilityが単なる運用監視ではなく**品質保証の基盤**にもなってくる。

## 最終的にはCIでRegressionを止める

Root Causeを分析できても、人間がDashboardを時々確認するだけではRegressionを防げない。

そこで次に必要になるのがCI/CDとの統合だ。

AWSはAmazon Bedrock AgentCore EvaluationsとGitHub Actionsを組み合わせ、Agentの変更を自動評価するreference architectureも公開している。

例えば、

- System Prompt
- Model
- Tool
- Agent code

を変更したPull Requestに対して、

```text
Pull Request
     ↓
Test AgentをDeploy
     ↓
Evaluation Scenario実行
     ↓
Execution Trace
     ↓
Evaluate
     ↓
Regression?
   /       \
 Yes       No
  ↓         ↓
Fail       Pass
 PR        PR
```

というQuality Gateを作る。

これによってAgent Evaluationは、

**「リリース後に品質を見るもの」**

ではなく、

**「品質が悪化した変更をリリースさせないもの」**

になる。

これは通常のSoftware EngineeringにおけるUnit TestやIntegration Testと同じ位置付けだ。

## Agent EvaluationはObservabilityとCIをつなぐ

ここまでをまとめると、Agent EngineeringのLoopは次のようになる。

```text
Harness Change
      ↓
Agent Execution
      ↓
Execution Trace
      ↓
┌─────────────────────────┐
│ Evaluation              │
│                         │
│ Outcome                 │
│ Behavior                │
│ Root Cause Attribution  │
└────────────┬────────────┘
             ↓
        Regression?
         /       \
       Yes       No
        ↓         ↓
    Fix Harness  Release
        │
        └──────────────→
```

これはかなりSoftware Engineeringらしい。

Agentが失敗する。

Traceを見る。

Root Causeを特定する。

Regression Testを追加する。

Harnessを修正する。

CIで再発を防ぐ。

このLoopが回るようになれば、Agent Evaluationは単なるBenchmarkではなくなる。

## Agent Evaluationを「採点」から「デバッグ」へ

Agent Evaluationというと、

> Agentのスコアはいくつか

という話になりやすい。

しかし本番Agentを改善するために本当に知りたいのは、

> **なぜこのAgentは失敗したのか**

ではないだろうか。

そしてMulti-turn Agentでは、さらに、

> **どこで最初に失敗したのか**

を知る必要がある。

そのためには、

```text
Outcome
   ↓
Behavior
   ↓
Root Cause
   ↓
Regression Test
   ↓
CI Gate
```

まで一続きで設計する必要がある。

Software Engineeringで役に立つテストは、単に赤くなるテストではない。

赤くなったときに、**何が壊れたのかを特定できるテスト**だ。

Agent Evaluationも同じ方向へ進んでいくと思う。

Agentを本番システムとして扱うなら、Evaluationの目的は高いスコアを作ることではない。

**失敗を観測し、原因を特定し、同じ失敗を二度起こさないこと。**

Agent EvaluationはBenchmarkingからTestingへ、そしてDebuggingへ進み始めている。

## 参考

- [AWS — Agent Evaluation Metric for multi-turn conversations](https://aws.amazon.com/blogs/machine-learning/agent-evaluation-metric-for-multi-turn-conversations/)
- [AWS — Automated agent evaluation with Amazon Bedrock AgentCore and GitHub Actions](https://aws.amazon.com/blogs/machine-learning/automated-agent-evaluation-with-amazon-bedrock-agentcore-and-github-actions/)
- [Google Developers Blog — The Anatomy of Harness Engineering: How to Evaluate, Iterate, and Guard AI Coding Agents](https://developers.googleblog.com/the-anatomy-of-harness-engineering-how-to-evaluate-iterate-and-guard-ai-coding-agents/)
