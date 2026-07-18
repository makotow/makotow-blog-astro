import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Home",
    posts: "Posts",
    tags: "Tags",
    about: "About",
    archives: "Archives",
    search: "Search",
  },
  post: {
    publishedAt: "Published",
    updatedAt: "Updated",
    sharePostIntro: "Share this post:",
    sharePostOn: "Share this post on {{platform}}",
    sharePostViaEmail: "Share this post via email",
    tagLabel: "Tags",
    backToTop: "Back to top",
    goBack: "Go back",
    editPage: "Edit page",
    previousPost: "Previous post",
    nextPost: "Next post",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
    page: "Page",
  },
  home: {
    socialLinks: "Links",
    featured: "Featured",
    recentPosts: "Recent Posts",
    allPosts: "All Posts",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "All rights reserved.",
    privacy: "プライバシーポリシー",
  },
  pages: {
    tagTitle: "Tag",
    tagDesc: "Articles tagged with",

    tagsTitle: "Tags",
    tagsDesc: "Tags used in posts.",

    postsTitle: "Posts",
    postsDesc: "All articles.",

    archivesTitle: "Archives",
    archivesDesc: "All archived articles.",

    searchTitle: "Search",
    searchDesc: "Search articles.",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle theme",
    searchPlaceholder: "Search posts...",
    noResults: "No results found",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
  },
  notFound: {
    title: "404 Not Found",
    message: "Page not found",
    goHome: "Go back home",
  },
} satisfies UIStrings;
