import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://www.theweathernetwork.com"
  const html: any = await myFetch(`${baseURL}/en/news/weather/canada`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  })
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  // Try multiple selector patterns for news links
  $("a[href*='/en/news/']").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href")
    let title = $el.find("h1, h2, h3, h4, span, p").first().text().trim()
    if (!title) title = $el.attr("title") || ""
    if (!title) title = $el.text().trim()

    if (title && href && title.length > 15 && title.length < 200) {
      const url = href.startsWith("http") ? href : `${baseURL}${href}`
      if (!news.some(n => n.url === url) && !url.includes("/video/")) {
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
