import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const ARTIST_FIXTURE = {
  _id: "artist-id",
  id: "gerhard-richter",
  name: "Gerhard Richter",
}

const recentDate = new Date()
recentDate.setMonth(recentDate.getMonth() - 1)
const RECENT_DATE = recentDate.toISOString()

const exactlyOneYearAgo = new Date()
exactlyOneYearAgo.setFullYear(exactlyOneYearAgo.getFullYear() - 1)
exactlyOneYearAgo.setDate(exactlyOneYearAgo.getDate() - 1)
const JUST_EXPIRED_DATE = exactlyOneYearAgo.toISOString()

const oldDate = new Date()
oldDate.setFullYear(oldDate.getFullYear() - 2)
const OLD_DATE = oldDate.toISOString()

const query = gql`
  {
    artist(id: "gerhard-richter") {
      latestArticle {
        href
      }
    }
  }
`

const legacyQueryWithId = gql`
  {
    artist(id: "gerhard-richter") {
      latestArticle {
        href
        id
      }
    }
  }
`

describe("Artist#latestArticle", () => {
  it("returns href when article was published within the last year", async () => {
    const artistLoader = jest.fn().mockResolvedValue({
      ...ARTIST_FIXTURE,
      latest_article_href: "/article/gerhard-richter-moma",
      latest_article_published_at: RECENT_DATE,
    })

    const { artist } = await runQuery(query, { artistLoader })

    expect(artist.latestArticle).toEqual({
      href: "/article/gerhard-richter-moma",
    })
  })

  it("returns null when no article is stored", async () => {
    const artistLoader = jest.fn().mockResolvedValue(ARTIST_FIXTURE)

    const { artist } = await runQuery(query, { artistLoader })

    expect(artist.latestArticle).toBeNull()
  })

  it("returns null when latest_article_href is missing but published_at is present", async () => {
    const artistLoader = jest.fn().mockResolvedValue({
      ...ARTIST_FIXTURE,
      latest_article_href: null,
      latest_article_published_at: RECENT_DATE,
    })

    const { artist } = await runQuery(query, { artistLoader })

    expect(artist.latestArticle).toBeNull()
  })

  it("returns null when the article was published more than a year ago", async () => {
    const artistLoader = jest.fn().mockResolvedValue({
      ...ARTIST_FIXTURE,
      latest_article_href: "/article/old-article",
      latest_article_published_at: OLD_DATE,
    })

    const { artist } = await runQuery(query, { artistLoader })

    expect(artist.latestArticle).toBeNull()
  })

  it("returns null for the deprecated id field (backwards compat for old cached clients)", async () => {
    const artistLoader = jest.fn().mockResolvedValue({
      ...ARTIST_FIXTURE,
      latest_article_href: "/article/gerhard-richter-moma",
      latest_article_published_at: RECENT_DATE,
    })

    const { artist } = await runQuery(legacyQueryWithId, { artistLoader })

    expect(artist.latestArticle.id).toBeNull()
  })

  it("returns null when the article is just over a year old", async () => {
    const artistLoader = jest.fn().mockResolvedValue({
      ...ARTIST_FIXTURE,
      latest_article_href: "/article/just-expired",
      latest_article_published_at: JUST_EXPIRED_DATE,
    })

    const { artist } = await runQuery(query, { artistLoader })

    expect(artist.latestArticle).toBeNull()
  })
})
