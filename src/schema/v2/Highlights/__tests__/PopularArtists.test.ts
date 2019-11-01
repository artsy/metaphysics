/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("PopularArtists", () => {
  it("makes a call for popular artists", async () => {
    const query = gql`
      {
        highlights {
          popularArtists {
            slug
          }
        }
      }
    `

    const context = {
      popularArtistsLoader: () =>
        Promise.resolve([
          { birthday: "1900", artworks_count: 100, id: "ortina" },
          { birthday: "1900", artworks_count: 100, id: "xtina" },
        ]),
    }

    const { highlights } = await runQuery(query, context)
    expect(highlights.popularArtists).toEqual([
      { slug: "ortina" },
      { slug: "xtina" },
    ])
  })
})
