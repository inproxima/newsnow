import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://www.accuweather.com"
  const html: any = await myFetch(`${baseURL}/en/weather-news`)
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  $("a.featured-story, a.story-card, article a, [class*='story'] a").each((_, el) => {
    const $el = $(el)
    const title = $el.find("h2, h3, .headline, [class*='title'], .story-title").text().trim() || $el.attr("title") || $el.text().trim()
    const href = $el.attr("href")

    if (title && href && title.length > 10) {
      const url = href.startsWith("http") ? href : `${baseURL}${href}`
      if (!news.some(n => n.url === url) && url.includes("weather-news")) {
        news.push({
          id: url,
          title,
          url,
        })
      }
    }
  })

  return news.slice(0, 30)
})
