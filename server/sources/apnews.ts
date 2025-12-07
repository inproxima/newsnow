import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://apnews.com"
  const html: any = await myFetch(baseURL)
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  $(".PageList-items-item").each((_, el) => {
    const $el = $(el)
    const $link = $el.find("a.Link")
    const title = $el.find(".PagePromo-title").text().trim()
    const href = $link.attr("href")

    if (title && href) {
      news.push({
        id: href,
        title,
        url: href.startsWith("http") ? href : `${baseURL}${href}`,
      })
    }
  })

  // Also try alternate selectors
  if (news.length === 0) {
    $("a[data-key='card-headline']").each((_, el) => {
      const $el = $(el)
      const title = $el.text().trim()
      const href = $el.attr("href")

      if (title && href) {
        news.push({
          id: href,
          title,
          url: href.startsWith("http") ? href : `${baseURL}${href}`,
        })
      }
    })
  }

  return news
})
