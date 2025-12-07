import type { NewsItem } from "@shared/types"
import { $fetch } from "ofetch"

// University Affairs requires specific handling due to redirects
export default defineSource(async () => {
  const url = "https://universityaffairs.ca/feed/"
  const data = await $fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "Accept": "application/rss+xml, application/xml, text/xml, */*",
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
  const channel = result.rss?.channel

  if (!channel || !channel.item) {
    throw new Error("Cannot fetch University Affairs feed")
  }

  const items = Array.isArray(channel.item) ? channel.item : [channel.item]

  const news: NewsItem[] = items.slice(0, 30).map((item: any) => ({
    id: item.guid?.$text || item.guid || item.link,
    title: item.title?.$text || item.title,
    url: item.link?.$text || item.link,
    pubDate: item.pubDate,
  }))

  return news
})
