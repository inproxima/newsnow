import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://www.bloomberg.com"
  const html: any = await myFetch(`${baseURL}/markets`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    },
  })
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  $("article").each((_, el) => {
    const $el = $(el)
    const $link = $el.find("a[href^='/news/']").first()
    const title = $el.find("h3, h2").first().text().trim() || $link.text().trim()
    const href = $link.attr("href")

    if (title && href) {
      news.push({
        id: href,
        title,
        url: href.startsWith("http") ? href : `${baseURL}${href}`,
      })
    }
  })

  // Fallback selector
  if (news.length === 0) {
    $("a[href*='/news/articles/']").each((_, el) => {
      const $el = $(el)
      const title = $el.text().trim()
      const href = $el.attr("href")

      if (title && href && title.length > 20) {
        news.push({
          id: href,
          title,
          url: href.startsWith("http") ? href : `${baseURL}${href}`,
        })
      }
    })
  }

  return news.slice(0, 30)
})
