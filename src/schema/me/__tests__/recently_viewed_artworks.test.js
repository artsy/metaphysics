import { runAuthenticatedQuery } from "test/utils"
import gql from "test/gql"

describe("RecentlyViewedArtworks", () => {
  let rootValue = null
  const me = {
    recently_viewed_artwork_ids: ["percy", "matt"],
  }
  const artworks = [
    { id: "percy", title: "Percy the Cat" },
    { id: "matt", title: "Matt the Person" },
  ]
  beforeEach(() => {
    rootValue = {
      meLoader: () => Promise.resolve(me),
      artworksLoader: () => Promise.resolve(artworks),
    }
  })

  it("returns an artwork connection", () => {
    const query = gql`
      {
        me {
          recentlyViewedArtworks(first: 1) {
            edges {
              node {
                id
                title
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    expect.assertions(1)
    return runAuthenticatedQuery(query, rootValue).then(
      ({ me: { recentlyViewedArtworks } }) => {
        expect(recentlyViewedArtworks).toEqual({
          edges: [
            {
              node: {
                id: "percy",
                title: "Percy the Cat",
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
          },
        })
      }
    )
  })
})
