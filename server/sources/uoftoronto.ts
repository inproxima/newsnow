import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://www.utoronto.ca"
  const html: any = await myFetch(`${baseURL}/news`)
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  $("article a, .news-item a, [class*='news'] a, a[href*='/news/']").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href")
    const title = $el.find("h2, h3, .title").text().trim()
      || $el.attr("title")
      || $el.text().trim()

    if (title && href && title.length > 15 && !title.includes("Read more")) {
      const url = href.startsWith("http") ? href : `${baseURL}${href}`
      if (url.includes("/news/") && !news.some(n => n.url === url)) {
        news.push({
          id: url,
          title: title.replace(/\s+/g, " ").trim(),
          url,
        })
      }
    }
  })

  if (news.length === 0) throw new Error("No news items found")
  return news.slice(0, 30)
})
