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
            artsyShippingDomestic: true
            artsyShippingInternational: false
            attributionClass: "limited edition"
            availability: SOLD
            dates: [2020, 2021]
            editionSetsCount: 2
            hasCertificateOfAuthenticity: true
            coaByGallery: true
            coaByAuthenticatingBody: null
            conditionDescription: "Excellent"
            domesticShippingFeeCents: 20000
            locationId: "location456"
            internationalShippingFeeCents: 30000
            category: "Painting"
            ecommerce: true
            medium: "Oil on Canvas"
            offer: false
            pickupAvailable: true
            priceAdjustment: -5
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
          artsy_shipping_domestic: true,
          artsy_shipping_international: false,
          attribution_class: "limited edition",
          condition_description: "Excellent",
          availability: "sold",
          dates: [2020, 2021],
          edition_sets_count: 2,
          certificate_of_authenticity: true,
          coa_by_gallery: true,
          coa_by_authenticating_body: null,
          domestic_shipping_fee_cents: 20000,
          location_id: "location456",
          international_shipping_fee_cents: 30000,
          category: "Painting",
          ecommerce: true,
          offer: false,
          pickup_available: true,
          price_adjustment: -5,
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

  it("updates price visibility for exact price", async () => {
    const exactPriceMutation = gql`
      mutation {
        bulkUpdateArtworksMetadata(
          input: { id: "partner123", metadata: { exactPrice: true } }
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

    await runAuthenticatedQuery(exactPriceMutation, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          exact_price: true,
        },
      }
    )
  })

  it("updates price visibility for price range", async () => {
    const priceRangeMutation = gql`
      mutation {
        bulkUpdateArtworksMetadata(
          input: { id: "partner123", metadata: { displayPriceRange: true } }
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

    await runAuthenticatedQuery(priceRangeMutation, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          display_price_range: true,
        },
      }
    )
  })

  it("updates price visibility for price on request", async () => {
    const priceOnRequestMutation = gql`
      mutation {
        bulkUpdateArtworksMetadata(
          input: { id: "partner123", metadata: { priceHidden: true } }
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

    await runAuthenticatedQuery(priceOnRequestMutation, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          price_hidden: true,
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

  it("updates artworks with single signature type", async () => {
    const signatureTypeMutation = gql`
      mutation {
        bulkUpdateArtworksMetadata(
          input: {
            id: "partner123"
            metadata: { signatureTypes: [HAND_SIGNED_BY_ARTIST] }
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
        success: 1,
        errors: {
          count: 0,
          ids: [],
        },
      }),
    }

    await runAuthenticatedQuery(signatureTypeMutation, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          not_signed: false,
          signed_by_artist: true,
          signed_in_plate: false,
          stamped_by_artist_estate: false,
          sticker_label: false,
          signed_other: false,
        },
      }
    )
  })

  it("updates artworks with multiple signature types", async () => {
    const signatureTypeMutation = gql`
      mutation {
        bulkUpdateArtworksMetadata(
          input: {
            id: "partner123"
            metadata: {
              signatureTypes: [HAND_SIGNED_BY_ARTIST, SIGNED_IN_PLATE]
            }
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
        success: 1,
        errors: {
          count: 0,
          ids: [],
        },
      }),
    }

    await runAuthenticatedQuery(signatureTypeMutation, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          not_signed: false,
          signed_by_artist: true,
          signed_in_plate: true,
          stamped_by_artist_estate: false,
          sticker_label: false,
          signed_other: false,
        },
      }
    )
  })

  it("updates artworks with empty signature types array", async () => {
    const signatureTypeMutation = gql`
      mutation {
        bulkUpdateArtworksMetadata(
          input: { id: "partner123", metadata: { signatureTypes: [] } }
        ) {
          bulkUpdateArtworksMetadataOrError {
            __typename
          }
        }
      }
    `

    const context = {
      updatePartnerArtworksMetadataLoader: jest.fn().mockResolvedValue({
        success: 1,
        errors: {
          count: 0,
          ids: [],
        },
      }),
    }

    await runAuthenticatedQuery(signatureTypeMutation, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          not_signed: false,
          signed_by_artist: false,
          signed_in_plate: false,
          stamped_by_artist_estate: false,
          sticker_label: false,
          signed_other: false,
        },
      }
    )
  })

  it("updates artworks with dates field", async () => {
    const datesMutation = gql`
      mutation {
        bulkUpdateArtworksMetadata(
          input: { id: "partner123", metadata: { dates: [1990, 1995, 2000] } }
        ) {
          bulkUpdateArtworksMetadataOrError {
            __typename
          }
        }
      }
    `

    const context = {
      updatePartnerArtworksMetadataLoader: jest.fn().mockResolvedValue({
        success: 2,
        errors: {
          count: 0,
          ids: [],
        },
      }),
    }

    await runAuthenticatedQuery(datesMutation, context)

    expect(context.updatePartnerArtworksMetadataLoader).toHaveBeenCalledWith(
      "partner123",
      {
        metadata: {
          dates: [1990, 1995, 2000],
        },
      }
    )
  })
})
