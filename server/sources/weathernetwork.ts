import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://www.theweathernetwork.com"
  const html: any = await myFetch(`${baseURL}/en/news/weather/canada`)
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  $("article a, .article-card a, [class*='article'] a, [class*='story'] a, a[href*='/news/']").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href")
    const title = $el.find("h2, h3, .headline, [class*='title']").text().trim()
      || $el.attr("title")
      || $el.text().trim()

    if (title && href && title.length > 10 && !news.some(n => n.url === href)) {
      const url = href.startsWith("http") ? href : `${baseURL}${href}`
      if (url.includes("/news/")) {
        news.push({
          id: url,
          title: title.replace(/\s+/g, " ").trim(),
          url,
        })
      }
    }
  })

  return news.slice(0, 30)
})
