import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://nationalpost.com"
  const html: any = await myFetch(`${baseURL}/category/news/`)
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  $("article a, .article-card a, [class*='story'] a, .card a").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href")
    const title = $el.find("h3, h2, .article-card__headline, [class*='title']").text().trim()
      || $el.attr("title")
      || $el.text().trim()

    if (title && href && title.length > 15 && !news.some(n => n.url === href)) {
      const url = href.startsWith("http") ? href : `${baseURL}${href}`
      news.push({
        id: url,
        title: title.replace(/\s+/g, " ").trim(),
        url,
      })
    }
  })

  return news.slice(0, 30)
})
