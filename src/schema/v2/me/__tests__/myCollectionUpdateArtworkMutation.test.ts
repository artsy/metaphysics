import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("myCollectionUpdateArtworkMutation", () => {
  it("updates an artwork", async () => {
    const mutation = gql`
      mutation {
        myCollectionUpdateArtwork(
          input: {
            artworkId: "foo"
            artistIds: ["4d8b92b34eb68a1b2c0003f4"]
            medium: "Painting"
            dimensions: "20x20"
            title: "hey now"
            year: "1990"
          }
        ) {
          artwork {
            medium
          }
        }
      }
    `
    const context = {
      myCollectionUpdateArtworkLoader: () => Promise.resolve({ id: "foo" }),
      myCollectionArtworkLoader: () =>
        Promise.resolve({
          medium: "Updated",
        }),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      myCollectionUpdateArtwork: {
        artwork: {
          medium: "Updated",
        },
      },
    })
  })
})
