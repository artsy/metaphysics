import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.followsAndSaves.artworksConnection", () => {
  it("returns artworks for a collection", async () => {
    const query = gql`
      {
        me {
          followsAndSaves {
            artworksConnection(first: 10) {
              edges {
                node {
                  internalID
                  title
                }
              }
            }
          }
        }
      }
    `
    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      collectionLoader: () =>
        Promise.resolve({
          name: "saved-artwork",
          private: true,
          description: "Some collection",
        }),
      collectionArtworksLoader: () =>
        Promise.resolve({
          body: [
            {
              _id: "58e3e54aa09a6708282022f6",
              title: "some title",
            },
          ],
          headers: {
            "x-total-count": "10",
          },
        }),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data.me.followsAndSaves.artworksConnection.edges[0].node.title).toBe(
      "some title"
    )
  })
})
