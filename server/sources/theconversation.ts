import type { NewsItem } from "@shared/types"
import { $fetch } from "ofetch"

// The Conversation uses Atom format, handle it with a custom parser
export default defineSource(async () => {
  const url = "https://theconversation.com/us/articles.atom"
  const data = await $fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "Accept": "application/atom+xml, application/xml, text/xml, */*",
    },
    responseType: "text",
    timeout: 10000,
    retry: 3,
  })

  const { XMLParser } = await import("fast-xml-parser")
  const parser = new XMLParser({
    attributeNamePrefix: "",
    textNodeName: "$text",
    ignoreAttributes: false,
  })

  const result = parser.parse(data)
  const feed = result.feed

  if (!feed || !feed.entry) {
    throw new Error("Cannot fetch The Conversation feed")
  }

  const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry]

  const news: NewsItem[] = entries.slice(0, 30).map((entry: any) => ({
    id: entry.id || entry.link?.href,
    title: entry.title?.$text || entry.title,
    url: entry.link?.href || entry.link,
    pubDate: entry.published || entry.updated,
  }))

  return news
})
