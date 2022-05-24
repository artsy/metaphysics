import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.myCollectionInfo", () => {
  it("includes info about my collection", async () => {
    const query = gql`
      {
        me {
          myCollectionInfo {
            name
            includesPurchasedArtworks
            artworksCount
            artistsCount
          }
        }
      }
    `
    const context: Partial<ResolverContext> = {
      meLoader: async () => ({
        id: "some-user-id",
      }),
      collectionLoader: async () => ({
        name: "My Collection",
        includes_purchased_artworks: true,
        artworks_count: 20,
        artists_count: 2,
      }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data.me.myCollectionInfo).toMatchInlineSnapshot(`
      Object {
        "artistsCount": 2,
        "artworksCount": 20,
        "includesPurchasedArtworks": true,
        "name": "My Collection",
      }
    `)
  })
})
