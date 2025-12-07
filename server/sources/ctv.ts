import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://www.ctvnews.ca"
  const html: any = await myFetch(baseURL)
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  // Main headlines and story cards
  $("article a, .c-list__item a, [class*='card'] a, [class*='story'] a").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href")
    const title = $el.find("h2, h3, [class*='title'], [class*='headline']").text().trim()
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
