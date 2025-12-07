import process from "node:process"
import { Interval } from "./consts"
import { typeSafeObjectFromEntries } from "./type.util"
import type { OriginSource, Source, SourceID } from "./types"

const Time = {
  Test: 1,
  Realtime: 2 * 60 * 1000,
  Fast: 5 * 60 * 1000,
  Default: Interval, // 10min
  Common: 30 * 60 * 1000,
  Slow: 60 * 60 * 1000,
}

export const originSources = {
  // ==================== Canadian News ====================
  "cbc": {
    name: "CBC News",
    color: "red",
    column: "canada",
    type: "realtime",
    home: "https://www.cbc.ca",
  },
  "ctv": {
    name: "CTV News",
    color: "blue",
    column: "canada",
    type: "realtime",
    home: "https://www.ctvnews.ca",
  },
  "globalnews": {
    name: "Global News",
    color: "green",
    column: "canada",
    type: "realtime",
    home: "https://globalnews.ca",
  },
  "globeandmail": {
    name: "The Globe and Mail",
    color: "gray",
    column: "canada",
    type: "realtime",
    home: "https://www.theglobeandmail.com",
  },
  "nationalpost": {
    name: "National Post",
    color: "blue",
    column: "canada",
    type: "realtime",
    home: "https://nationalpost.com",
  },
  "torontostar": {
    name: "Toronto Star",
    color: "blue",
    column: "canada",
    type: "realtime",
    home: "https://www.thestar.com",
  },
  "financialpost": {
    name: "Financial Post",
    color: "blue",
    column: "canada",
    type: "realtime",
    home: "https://business.financialpost.com",
  },
  "reddit-canada": {
    name: "Reddit",
    color: "orange",
    column: "canada",
    type: "hottest",
    home: "https://www.reddit.com/r/canada",
    title: "r/canada",
  },

  // ==================== Weather ====================
  "weathernetwork": {
    name: "The Weather Network",
    color: "blue",
    column: "weather",
    type: "realtime",
    home: "https://www.theweathernetwork.com",
  },
  "accuweather": {
    name: "AccuWeather Canada",
    color: "orange",
    column: "weather",
    type: "realtime",
    home: "https://www.accuweather.com/en/ca/weather-news",
  },

  // ==================== General News ====================
  "bbc": {
    name: "BBC News",
    color: "red",
    column: "world",
    type: "realtime",
    home: "https://www.bbc.com/news",
  },
  "cnn": {
    name: "CNN",
    color: "red",
    column: "world",
    type: "hottest",
    home: "https://www.cnn.com",
  },
  "reuters": {
    name: "Reuters",
    color: "orange",
    column: "world",
    type: "realtime",
    home: "https://www.reuters.com",
  },
  "guardian": {
    name: "The Guardian",
    color: "blue",
    column: "world",
    type: "realtime",
    home: "https://www.theguardian.com",
  },
  "npr": {
    name: "NPR",
    color: "blue",
    column: "world",
    type: "realtime",
    home: "https://www.npr.org",
  },
  "apnews": {
    name: "AP News",
    color: "red",
    column: "world",
    type: "realtime",
    home: "https://apnews.com",
  },
  "nytimes": {
    name: "New York Times",
    color: "gray",
    column: "world",
    type: "hottest",
    home: "https://www.nytimes.com",
  },
  "huffpost": {
    name: "HuffPost",
    color: "green",
    column: "world",
    type: "realtime",
    home: "https://www.huffpost.com",
  },

  // ==================== Tech ====================
  "hackernews": {
    name: "Hacker News",
    color: "orange",
    column: "tech",
    type: "hottest",
    home: "https://news.ycombinator.com/",
  },
  "github": {
    name: "Github",
    color: "gray",
    home: "https://github.com/",
    column: "tech",
    sub: {
      "trending-today": {
        title: "Today",
        type: "hottest",
      },
    },
  },
  "techcrunch": {
    name: "TechCrunch",
    color: "green",
    column: "tech",
    type: "realtime",
    home: "https://techcrunch.com",
  },
  "theverge": {
    name: "The Verge",
    color: "purple",
    column: "tech",
    type: "realtime",
    home: "https://www.theverge.com",
  },
  "arstechnica": {
    name: "Ars Technica",
    color: "orange",
    column: "tech",
    type: "realtime",
    home: "https://arstechnica.com",
  },
  "wired": {
    name: "Wired",
    color: "gray",
    column: "tech",
    type: "realtime",
    home: "https://www.wired.com",
  },
  "engadget": {
    name: "Engadget",
    color: "blue",
    column: "tech",
    type: "realtime",
    home: "https://www.engadget.com",
  },
  "simplecast": {
    name: "The Daily (Tech)",
    color: "gray",
    column: "tech",
    type: "realtime",
    home: "https://feeds.simplecast.com/54nAGcIl",
  },

  // ==================== Finance ====================
  "bloomberg": {
    name: "Bloomberg",
    color: "gray",
    column: "finance",
    type: "realtime",
    home: "https://www.bloomberg.com",
  },
  "cnbc": {
    name: "CNBC",
    color: "blue",
    column: "finance",
    type: "hottest",
    home: "https://www.cnbc.com",
  },
  "yahoofinance": {
    name: "Yahoo Finance",
    color: "purple",
    column: "finance",
    type: "hottest",
    home: "https://finance.yahoo.com",
  },
  "seekingalpha": {
    name: "Seeking Alpha",
    color: "orange",
    column: "finance",
    type: "realtime",
    home: "https://seekingalpha.com",
  },

  // ==================== Reddit ====================
  "reddit": {
    name: "Reddit",
    color: "orange",
    home: "https://www.reddit.com",
    sub: {
      news: {
        title: "r/news",
        column: "world",
        type: "hottest",
      },
      worldnews: {
        title: "r/worldnews",
        column: "world",
        type: "hottest",
      },
      technology: {
        title: "r/technology",
        column: "tech",
        type: "hottest",
      },
      programming: {
        title: "r/programming",
        column: "tech",
        type: "hottest",
      },
      science: {
        title: "r/science",
        column: "academic",
        type: "hottest",
      },
    },
  },

  // ==================== Academic ====================
  "phys": {
    name: "Phys.org",
    color: "blue",
    column: "academic",
    type: "realtime",
    home: "https://phys.org",
  },
  "sciencedaily": {
    name: "Science Daily",
    color: "green",
    column: "academic",
    type: "realtime",
    home: "https://www.sciencedaily.com",
  },
  "theconversation": {
    name: "The Conversation",
    color: "red",
    column: "academic",
    type: "realtime",
    home: "https://theconversation.com",
  },
  "universityaffairs": {
    name: "University Affairs",
    color: "blue",
    column: "academic",
    type: "realtime",
    home: "https://www.universityaffairs.ca",
    desc: "Canadian higher education news",
  },
  "uoftoronto": {
    name: "U of T News",
    color: "blue",
    column: "academic",
    type: "realtime",
    home: "https://www.utoronto.ca/news",
    desc: "University of Toronto",
  },
  "ubcnews": {
    name: "UBC News",
    color: "blue",
    column: "academic",
    type: "realtime",
    home: "https://news.ubc.ca",
    desc: "University of British Columbia",
  },
  "mcgillnews": {
    name: "McGill News",
    color: "red",
    column: "academic",
    type: "realtime",
    home: "https://www.mcgill.ca/newsroom",
    desc: "McGill University",
  },

  // ==================== Lifestyle ====================
  "megaphone": {
    name: "Joe Rogan Experience",
    color: "red",
    column: "lifestyle",
    type: "realtime",
    home: "https://feeds.megaphone.fm/GLT1412515089",
  },
  "thedaily": {
    name: "The Daily",
    color: "gray",
    column: "lifestyle",
    type: "realtime",
    home: "http://rss.art19.com/the-daily",
  },
} as const satisfies Record<string, OriginSource>

export function genSources() {
  const _: [SourceID, Source][] = []

  Object.entries(originSources).forEach(([id, source]: [any, OriginSource]) => {
    const parent = {
      name: source.name,
      type: source.type,
      disable: source.disable,
      desc: source.desc,
      column: source.column,
      home: source.home,
      color: source.color ?? "primary",
      interval: source.interval ?? Time.Default,
    }
    if (source.sub && Object.keys(source.sub).length) {
      Object.entries(source.sub).forEach(([subId, subSource], i) => {
        if (i === 0) {
          _.push([
            id,
            {
              redirect: `${id}-${subId}`,
              ...parent,
              ...subSource,
            },
          ] as [any, Source])
        }
        _.push([`${id}-${subId}`, { ...parent, ...subSource }] as [
          any,
          Source,
        ])
      })
    } else {
      _.push([
        id,
        {
          title: source.title,
          ...parent,
        },
      ])
    }
  })

  return typeSafeObjectFromEntries(
    _.filter(([_, v]) => {
      if (v.disable === "cf" && process.env.CF_PAGES) {
        return false
      } else {
        return v.disable !== true
      }
    }),
  )
}
