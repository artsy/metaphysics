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
        href
        slug
      }
    }
  }
`

describe("Artist#vanguardArticle", () => {
  it("returns the Vanguard article link for a mapped artist", async () => {
    const artistLoader = jest.fn().mockResolvedValue({
      _id: "artist-id",
      id: vanguardArtistSlug,
    })

    const { artist } = await runQuery(query, { artistLoader })

    expect(artist.vanguardArticle).toEqual({
      href: `/article/${vanguardArticleSlug}`,
      slug: vanguardArticleSlug,
    })
  })

  it("returns null for an artist without a Vanguard article", async () => {
    const artistLoader = jest
      .fn()
      .mockResolvedValue({ _id: "artist-id", id: "artist-slug" })

    const { artist } = await runQuery(query, { artistLoader })

    expect(artist.vanguardArticle).toBeNull()
  })
})
