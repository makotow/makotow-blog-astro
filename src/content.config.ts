import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";
import {
  hasUniqueValues,
  isAbsoluteHttpsUrl,
  isAbsolutePath,
  isIanaTimezone,
  SUPPORTED_CONTENT_LANGUAGES,
} from "@/utils/contentMetadata";

export const BLOG_PATH = "src/content/posts";

const httpsUrl = z.string().refine(isAbsoluteHttpsUrl, {
  message: "Must be an absolute HTTPS URL",
});
const aliases = z
  .array(
    z.string().refine(isAbsolutePath, {
      message: "Alias must start with a single slash",
    })
  )
  .refine(hasUniqueValues, { message: "Aliases must not contain duplicates" });
const timezone = z.string().refine(isIanaTimezone, {
  message: "Must be a supported IANA timezone",
});
const lang = z.enum(SUPPORTED_CONTENT_LANGUAGES).default("ja");

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(config.site.author),
      pubDatetime: z.coerce.date(),
      modDatetime: z.coerce.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      categories: z.array(z.string()).optional(),
      aliases: aliases.optional(),
      ogImage: image().or(httpsUrl).optional(),
      description: z.string(),
      canonicalURL: httpsUrl.optional(),
      hideEditPost: z.boolean().optional(),
      timezone: timezone.optional(),
      lang,
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      ogImage: image().or(httpsUrl).optional(),
      canonicalURL: httpsUrl.optional(),
      lang,
    }),
});

export const collections = { posts, pages };
