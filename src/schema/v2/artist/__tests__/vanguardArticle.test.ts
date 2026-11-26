import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { VANGUARD_ARTICLE_SLUGS } from "schema/v2/artist/helpers"

const [vanguardArtistSlug, vanguardArticleSlug] = Object.entries(
  VANGUARD_ARTICLE_SLUGS
)[0]

const query = gql`
  {
    artist(id: "artist-slug") {
      vanguardArticle {
        title
      }
    }
  }
`

describe("Artist#vanguardArticle", () => {
  const mappedArtistLoader = jest.fn().mockResolvedValue({
    _id: "artist-id",
    id: vanguardArtistSlug,
  })

  it("returns the Vanguard article for a mapped artist", async () => {
    const articleLoader = jest
      .fn()
      .mockResolvedValue({ id: "article-id", title: "Artsy Vanguard" })

    const { artist } = await runQuery(query, {
      artistLoader: mappedArtistLoader,
      articleLoader,
    })

    expect(articleLoader).toHaveBeenCalledWith(vanguardArticleSlug)
    expect(artist.vanguardArticle).toEqual({ title: "Artsy Vanguard" })
  })

  it("returns null for an artist without a Vanguard article", async () => {
    const artistLoader = jest
      .fn()
      .mockResolvedValue({ _id: "artist-id", id: "artist-slug" })
    const articleLoader = jest.fn()

    const { artist } = await runQuery(query, { artistLoader, articleLoader })

    expect(articleLoader).not.toHaveBeenCalled()
    expect(artist.vanguardArticle).toBeNull()
  })

  it("returns null when the article fails to load", async () => {
    const articleLoader = jest.fn().mockRejectedValue(new Error("Not Found"))

    const { artist } = await runQuery(query, {
      artistLoader: mappedArtistLoader,
      articleLoader,
    })

    expect(artist.vanguardArticle).toBeNull()
  })
})
