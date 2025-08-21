import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("BulkUpdateArtworksMetadataMutation", () => {
  const mutation = gql`
    mutation {
      bulkUpdateArtworksMetadata(
        input: {
          id: "partner123"
          source: ARTWORKS_LIST
          metadata: {
            artistIds: ["artist1", "artist2"]
            availability: SOLD
            hasCertificateOfAuthenticity: true
            coaByGallery: true
            coaByAuthenticatingBody: null
            conditionDescription: "Excellent"
            domesticShippingFeeCents: 20000
            locationId: "location456"
            category: "Painting"
            ecommerce: true
            medium: "Oil on Canvas"
            offer: false
            priceAdjustment: -5
            priceHidden: false
            priceListed: 1000
            displayPriceRange: true
            provenance: "Owned by a famous collector"
            published: true
            signature: "Signed by the artist in the bottom right corner"
            title: "A Beautiful Artwork"
          }
          filters: {
            artworkIds: ["artwork1", "artwork2"]
            availability: FOR_SALE
            locationId: "oldLocation"
            partnerArtistId: "artist789"
            published: true
          }
        }
      ) {
        bulkUpdateArtworksMetadataOrError {
          __typename
          ... on BulkUpdateArtworksMetadataMutationSuccess {
            updatedPartnerArtworks {
              count
              ids
            }
            skippedPartnerArtworks {
              count
              ids
            }
          }
          ... on BulkUpdateArtworksMetadataMutationFailure {
            mutationError {
              error
              message
            }
          }
        }
      }
    }
  `

  it("updates multiple artworks metadata", async () => {
    const context = {
      updatePartnerArtworksMetadataLoader: jest.fn().mockResolvedValue({
        success: 2,
        errors: {
          count: 1,
          ids: ["artwork3"],
        },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          artist_ids: ["artist1", "artist2"],
          condition_description: "Excellent",
          availability: "sold",
          certificate_of_authenticity: true,
          coa_by_gallery: true,
          coa_by_authenticating_body: null,
          domestic_shipping_fee_cents: 20000,
          location_id: "location456",
          category: "Painting",
          ecommerce: true,
          offer: false,
          price_adjustment: -5,
          price_hidden: false,
          price_listed: 1000,
          display_price_range: true,
          published: true,
          provenance: "Owned by a famous collector",
          medium: "Oil on Canvas",
          signature: "Signed by the artist in the bottom right corner",
          title: "A Beautiful Artwork",
        },
        filters: {
          artwork_ids: ["artwork1", "artwork2"],
          availability: "for sale",
          location_id: "oldLocation",
          partner_artist_id: "artist789",
          published: true,
        },
        source: "artworks_list",
      }
    )

    expect(result).toEqual({
      bulkUpdateArtworksMetadata: {
        bulkUpdateArtworksMetadataOrError: {
          __typename: "BulkUpdateArtworksMetadataMutationSuccess",
          updatedPartnerArtworks: {
            count: 2,
            ids: [],
          },
          skippedPartnerArtworks: {
            count: 1,
            ids: ["artwork3"],
          },
        },
      },
    })
  })

  it("respects the filter parameters", async () => {
    const mutationWithFilterOnly = gql`
      mutation {
        bulkUpdateArtworksMetadata(
          input: {
            id: "partner123"
            metadata: { category: "Sculpture" }
            filters: { partnerArtistId: "artist789" }
          }
        ) {
          bulkUpdateArtworksMetadataOrError {
            __typename
          }
        }
      }
    `

    const context = {
      updatePartnerArtworksMetadataLoader: jest.fn().mockResolvedValue({
        success: 5,
        errors: {
          count: 0,
          ids: [],
        },
      }),
    }

    await runAuthenticatedQuery(mutationWithFilterOnly, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          category: "Sculpture",
        },
        filters: {
          partner_artist_id: "artist789",
        },
      }
    )
  })

  it("updates price visibility fields correctly", async () => {
    const priceVisibilityMutation = gql`
      mutation {
        bulkUpdateArtworksMetadata(
          input: {
            id: "partner123"
            metadata: { priceHidden: true, displayPriceRange: false }
          }
        ) {
          bulkUpdateArtworksMetadataOrError {
            __typename
          }
        }
      }
    `

    const context = {
      updatePartnerArtworksMetadataLoader: jest.fn().mockResolvedValue({
        success: 3,
        errors: {
          count: 0,
          ids: [],
        },
      }),
    }

    await runAuthenticatedQuery(priceVisibilityMutation, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          price_hidden: true,
          display_price_range: false,
        },
      }
    )
  })

  it("handles gravity API errors gracefully", async () => {
    const context = {
      updatePartnerArtworksMetadataLoader: () =>
        Promise.reject(new HTTPError(`Forbidden`, 403, "Gravity Error")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      bulkUpdateArtworksMetadata: {
        bulkUpdateArtworksMetadataOrError: {
          __typename: "BulkUpdateArtworksMetadataMutationFailure",
          mutationError: {
            error: null,
            message: "Gravity Error",
          },
        },
      },
    })
  })
})
