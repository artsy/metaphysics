import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkMutation", () => {
  const mutation = gql`
    mutation {
      updateArtwork(
        input: {
          id: "25"
          availability: "sold"
          ecommerce: true
          offer: true
          priceListed: "1000"
          priceHidden: false
          displayPriceRange: false
        }
      ) {
        artworkOrError {
          __typename
          ... on updateArtworkSuccess {
            artwork {
              availability
              isAcquireable
              isOfferable
              price
              priceDisplay
              displayPriceRange
            }
          }
          ... on updateArtworkFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates an artwork", async () => {
    const context = {
      updateArtworkLoader: () =>
        Promise.resolve({
          id: "25",
          availability: "sold",
          acquireable: true,
          offerable: true,
          price: "$1000",
          price_display: "exact",
          display_price_range: false,
        }),
    }

    const artwork = await runAuthenticatedQuery(mutation, context)

    expect(artwork).toEqual({
      updateArtwork: {
        artworkOrError: {
          __typename: "updateArtworkSuccess",
          artwork: {
            availability: "sold",
            isAcquireable: true,
            isOfferable: true,
            price: "$1000",
            priceDisplay: "exact",
            displayPriceRange: false,
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("return an error", async () => {
      const context = {
        updateArtworkLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/some-endpoint - {"type":"error","message":"Error from API"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        updateArtwork: {
          artworkOrError: {
            __typename: "updateArtworkFailure",
            mutationError: {
              message: "Error from API",
            },
          },
        },
      })
    })
  })
})
