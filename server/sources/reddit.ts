import type { NewsItem } from "@shared/types"

interface RedditResponse {
  data: {
    children: Array<{
      data: {
        id: string
        title: string
        permalink: string
        url: string
        score: number
        num_comments: number
        created_utc: number
        subreddit: string
        is_self: boolean
      }
    }>
  }
}

async function fetchSubreddit(subreddit: string): Promise<NewsItem[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=30`
  const response: RedditResponse = await myFetch(url, {
    headers: {
      "User-Agent": "Briefcast/1.0",
    },
  })

  return response.data.children.map((item) => {
    const post = item.data
    return {
      id: post.id,
      title: post.title,
      url: `https://www.reddit.com${post.permalink}`,
      pubDate: post.created_utc * 1000,
      extra: {
        info: `↑ ${post.score} · ${post.num_comments} comments`,
      },
    }
  })
}

const news = defineSource(() => fetchSubreddit("news"))
const worldnews = defineSource(() => fetchSubreddit("worldnews"))
const technology = defineSource(() => fetchSubreddit("technology"))
const programming = defineSource(() => fetchSubreddit("programming"))
const canada = defineSource(() => fetchSubreddit("canada"))
const science = defineSource(() => fetchSubreddit("science"))

export default defineSource({
  "reddit": news,
  "reddit-news": news,
  "reddit-worldnews": worldnews,
  "reddit-technology": technology,
  "reddit-programming": programming,
  "reddit-canada": canada,
  "reddit-science": science,
})
