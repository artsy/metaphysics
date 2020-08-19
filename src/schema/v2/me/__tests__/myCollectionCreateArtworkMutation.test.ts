import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("myCollectionCreateArtworkMutation", () => {
  it("creates an artwork", async () => {
    const mutation = gql`
      mutation {
        myCollectionCreateArtwork(
          input: {
            artistIds: ["4d8b92b34eb68a1b2c0003f4"]
            medium: "Painting"
            dimensions: "20x20"
          }
        ) {
          artwork {
            medium
          }
        }
      }
    `
    const context = {
      myCollectionCreateArtworkLoader: () => Promise.resolve({ id: "foo" }),
      myCollectionArtworkLoader: () =>
        Promise.resolve({
          medium: "Painting",
        }),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      myCollectionCreateArtwork: {
        artwork: {
          medium: "Painting",
        },
      },
    })
  })
})
