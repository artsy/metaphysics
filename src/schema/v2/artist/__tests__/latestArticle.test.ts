import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const ARTIST_FIXTURE = {
  _id: "artist-id",
  id: "gerhard-richter",
  name: "Gerhard Richter",
}

const ARTICLE_FIXTURE = {
  id: "some-article-id",
  slug: "some-article",
  title: "Gerhard Richter at the MoMA",
  published_at: "2024-01-15T00:00:00.000Z",
}

describe("Artist#latestArticle", () => {
  it("returns the most recent published article featuring the artist", async () => {
    const query = gql`
      {
        artist(id: "gerhard-richter") {
          latestArticle {
            slug
            title
          }
        }
      }
    `

    const artistLoader = jest.fn().mockResolvedValue(ARTIST_FIXTURE)
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [ARTICLE_FIXTURE],
    })

    const { artist } = await runQuery(query, { artistLoader, articlesLoader })

    expect(artist.latestArticle).toEqual({
      slug: "some-article",
      title: "Gerhard Richter at the MoMA",
    })

    expect(articlesLoader).toBeCalledWith({
      published: true,
      artist_id: "artist-id",
      sort: "-published_at",
      limit: 1,
    })
  })

  it("returns null when no articles feature the artist", async () => {
    const query = gql`
      {
        artist(id: "gerhard-richter") {
          latestArticle {
            slug
          }
        }
      }
    `

    const artistLoader = jest.fn().mockResolvedValue(ARTIST_FIXTURE)
    const articlesLoader = jest.fn().mockResolvedValue({ results: [] })

    const { artist } = await runQuery(query, { artistLoader, articlesLoader })

    expect(artist.latestArticle).toBeNull()
  })

  it("does not call articlesLoader when latestArticle is not requested", async () => {
    const query = gql`
      {
        artist(id: "gerhard-richter") {
          name
        }
      }
    `

    const artistLoader = jest.fn().mockResolvedValue(ARTIST_FIXTURE)
    const articlesLoader = jest.fn()

    await runQuery(query, { artistLoader, articlesLoader })

    expect(articlesLoader).not.toHaveBeenCalled()
  })
})
