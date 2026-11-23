# A2UI 1.0 ハンズオン検証コード

- ts/ : Node で実行する検証（01 サーフェス / 02 Express / 02b ストリーミング / 03 カタログ混在 / 04 互換性）
- web/ : React レンダラー ⇄ ブラウザ内モックエージェントの双方向RPCデモ（esbuild でバンドル、Playwright で自動操作）
- python/ : Python Agent SDK（PyPI a2ui-agent-sdk 0.11.0）の Macros / agent function

## 前提

TS 側は github.com/a2ui-project/a2ui main @3ed9601 (2026-11-13) をビルドした web_core / react / agent を使用。
npm 公開版 (@a2ui/web_core 0.15.0, @a2ui/agent 0.1.0) では @accessibility や RendererToAgentMessageProcessor が未対応。

    git clone https://github.com/a2ui-project/a2ui.git && cd a2ui
    git checkout --detach 3ed9601
    yarn install
    (cd typescript/core/web_core && yarn build)
    (cd typescript/agents/a2ui_agent && yarn build)
    (cd typescript/renderers/react && yarn build)
    # ts/*.mjs と web/ はこのワークスペースの node_modules を解決できる場所に置いて実行
    # スクリプト内の /home/claude/a2ui-src は clone 先パスに置き換えてください

    pip install a2ui-agent-sdk==0.11.0
    python3 python/macros_demo.py
