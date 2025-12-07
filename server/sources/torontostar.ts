import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://www.thestar.com"
  const html: any = await myFetch(`${baseURL}/news.html`)
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  $("article a, .c-article a, [class*='story'] a, .tnt-headline a").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href")
    const title = $el.find("h3, h2, .tnt-headline, [class*='title']").text().trim()
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
