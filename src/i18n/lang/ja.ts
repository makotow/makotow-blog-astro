import type { UIStrings } from "../types";

export default {
  nav: {
    home: "ホーム",
    posts: "記事",
    tags: "タグ",
    about: "プロフィール",
    archives: "アーカイブ",
    search: "検索",
  },
  post: {
    publishedAt: "公開",
    updatedAt: "更新",
    sharePostIntro: "この記事を共有:",
    sharePostOn: "{{platform}} でこの記事を共有",
    sharePostViaEmail: "メールでこの記事を共有",
    tagLabel: "タグ",
    backToTop: "ページ上部へ戻る",
    goBack: "戻る",
    editPage: "ページを編集",
    previousPost: "前の記事",
    nextPost: "次の記事",
  },
  pagination: {
    prev: "前へ",
    next: "次へ",
    page: "ページ",
  },
  home: {
    socialLinks: "リンク",
    featured: "注目の記事",
    recentPosts: "最近の記事",
    allPosts: "すべての記事",
  },
  footer: {
    copyright: "著作権",
    allRightsReserved: "All rights reserved.",
    privacy: "プライバシーポリシー",
  },
  pages: {
    tagTitle: "タグ",
    tagDesc: "このタグの記事",

    tagsTitle: "タグ",
    tagsDesc: "記事で使われているタグの一覧です。",

    postsTitle: "記事",
    postsDesc: "すべての記事です。",

    archivesTitle: "アーカイブ",
    archivesDesc: "公開済み記事のアーカイブです。",

    searchTitle: "検索",
    searchDesc: "記事を検索します。",
  },
  a11y: {
    skipToContent: "本文へ移動",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
    toggleTheme: "テーマを切り替える",
    searchPlaceholder: "記事を検索...",
    noResults: "検索結果がありません",
    goToPreviousPage: "前のページへ移動",
    goToNextPage: "次のページへ移動",
  },
  notFound: {
    title: "404 ページが見つかりません",
    message: "お探しのページは見つかりませんでした",
    goHome: "ホームへ戻る",
  },
} satisfies UIStrings;
