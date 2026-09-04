import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("PublishPartnerListPublicationMutation", () => {
  const mutation = gql`
    mutation {
      publishPartnerListPublication(
        input: {
          partnerListID: "list-abc"
          description: "For Anna"
          applyBrand: true
          artworkFieldVisibility: { artistName: true, artworkTitle: false }
        }
      ) {
        partnerListPublicationOrError {
          __typename
          ... on PublishPartnerListPublicationSuccess {
            partnerListPublication {
              internalID
              published
              description
              applyBrand
              passcodeProtected
            }
          }
          ... on PublishPartnerListPublicationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("publishes a partner list publication", async () => {
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        partner_list_id: "list-abc",
        published: true,
        description: "For Anna",
        apply_brand: true,
        passcode_protected: false,
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.publishPartnerListPublicationLoader).toHaveBeenCalledWith(
      "list-abc",
      {
        description: "For Anna",
        apply_brand: true,
        artwork_field_visibility: {
          artist_name: true,
          artwork_title: false,
        },
      }
    )

    expect(result).toEqual({
      publishPartnerListPublication: {
        partnerListPublicationOrError: {
          __typename: "PublishPartnerListPublicationSuccess",
          partnerListPublication: {
            internalID: "pub-1",
            published: true,
            description: "For Anna",
            applyBrand: true,
            passcodeProtected: false,
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockRejectedValue({
        body: { error: "Only private_viewing_room lists can be published" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      publishPartnerListPublication: {
        partnerListPublicationOrError: {
          __typename: "PublishPartnerListPublicationFailure",
          mutationError: {
            message: "Only private_viewing_room lists can be published",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        publishPartnerListPublicationLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })

  it("sets a passcode", async () => {
    const withPasscode = gql`
      mutation {
        publishPartnerListPublication(
          input: { partnerListID: "list-abc", passcode: "letmein" }
        ) {
          partnerListPublicationOrError {
            __typename
            ... on PublishPartnerListPublicationSuccess {
              partnerListPublication {
                passcodeProtected
                passcode
              }
            }
          }
        }
      }
    `
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        passcode_protected: true,
        passcode: "letmein",
      }),
    }

    const result = await runAuthenticatedQuery(withPasscode, context)

    expect(
      context.publishPartnerListPublicationLoader
    ).toHaveBeenCalledWith("list-abc", { passcode: "letmein" })
    expect(
      result.publishPartnerListPublication.partnerListPublicationOrError
        .partnerListPublication.passcodeProtected
    ).toBe(true)
    expect(
      result.publishPartnerListPublication.partnerListPublicationOrError
        .partnerListPublication.passcode
    ).toBe("letmein")
  })

  it("passes an empty string through when clearing a passcode", async () => {
    // Regression guard: `passcode: ""` must reach the loader as "" (not be
    // dropped), since that's what signals "clear the passcode" — the query
    // string round trip further down in lib/apis/fetch.ts is what turns it
    // into a `null` on the wire, which is out of scope for this mutation to
    // guard against; this test only proves the mutation itself forwards it.
    const clearPasscode = gql`
      mutation {
        publishPartnerListPublication(
          input: { partnerListID: "list-abc", passcode: "" }
        ) {
          partnerListPublicationOrError {
            __typename
            ... on PublishPartnerListPublicationSuccess {
              partnerListPublication {
                passcodeProtected
              }
            }
          }
        }
      }
    `
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        passcode_protected: false,
      }),
    }

    await runAuthenticatedQuery(clearPasscode, context)

    expect(
      context.publishPartnerListPublicationLoader
    ).toHaveBeenCalledWith("list-abc", { passcode: "" })
  })

  it("sets heading and showGalleryName", async () => {
    const withHeadingAndGalleryName = gql`
      mutation {
        publishPartnerListPublication(
          input: {
            partnerListID: "list-abc"
            heading: "For Anna"
            showGalleryName: false
          }
        ) {
          partnerListPublicationOrError {
            ... on PublishPartnerListPublicationSuccess {
              partnerListPublication {
                heading
                showGalleryName
              }
            }
          }
        }
      }
    `
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        heading: "For Anna",
        show_gallery_name: false,
      }),
    }

    const result = await runAuthenticatedQuery(
      withHeadingAndGalleryName,
      context
    )

    expect(context.publishPartnerListPublicationLoader).toHaveBeenCalledWith(
      "list-abc",
      {
        heading: "For Anna",
        show_gallery_name: false,
      }
    )
    expect(
      result.publishPartnerListPublication.partnerListPublicationOrError
        .partnerListPublication
    ).toEqual({ heading: "For Anna", showGalleryName: false })
  })

  it("accepts location and certificateOfAuthenticity visibility keys", async () => {
    const withNewVisibilityKeys = gql`
      mutation {
        publishPartnerListPublication(
          input: {
            partnerListID: "list-abc"
            artworkFieldVisibility: {
              location: true
              certificateOfAuthenticity: true
            }
          }
        ) {
          partnerListPublicationOrError {
            ... on PublishPartnerListPublicationSuccess {
              partnerListPublication {
                artworkFieldVisibility {
                  location
                  certificateOfAuthenticity
                }
              }
            }
          }
        }
      }
    `
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        artwork_field_visibility: {
          location: true,
          certificate_of_authenticity: true,
        },
      }),
    }

    const result = await runAuthenticatedQuery(withNewVisibilityKeys, context)

    expect(context.publishPartnerListPublicationLoader).toHaveBeenCalledWith(
      "list-abc",
      {
        artwork_field_visibility: {
          location: true,
          certificate_of_authenticity: true,
        },
      }
    )
    expect(
      result.publishPartnerListPublication.partnerListPublicationOrError
        .partnerListPublication.artworkFieldVisibility
    ).toEqual({ location: true, certificateOfAuthenticity: true })
  })

  it("accepts the 4 per-edition-set visibility keys (Gravity PR #20428)", async () => {
    const withEditionVisibilityKeys = gql`
      mutation {
        publishPartnerListPublication(
          input: {
            partnerListID: "list-abc"
            artworkFieldVisibility: {
              editionPrice: true
              editionAvailability: true
              editionSize: false
              editionInventoryCount: false
            }
          }
        ) {
          partnerListPublicationOrError {
            ... on PublishPartnerListPublicationSuccess {
              partnerListPublication {
                artworkFieldVisibility {
                  editionPrice
                  editionAvailability
                  editionSize
                  editionInventoryCount
                }
              }
            }
          }
        }
      }
    `
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        artwork_field_visibility: {
          edition_price: true,
          edition_availability: true,
          edition_size: false,
          edition_inventory_count: false,
        },
      }),
    }

    const result = await runAuthenticatedQuery(
      withEditionVisibilityKeys,
      context
    )

    expect(context.publishPartnerListPublicationLoader).toHaveBeenCalledWith(
      "list-abc",
      {
        artwork_field_visibility: {
          edition_price: true,
          edition_availability: true,
          edition_size: false,
          edition_inventory_count: false,
        },
      }
    )
    expect(
      result.publishPartnerListPublication.partnerListPublicationOrError
        .partnerListPublication.artworkFieldVisibility
    ).toEqual({
      editionPrice: true,
      editionAvailability: true,
      editionSize: false,
      editionInventoryCount: false,
    })
  })

  it("omits artwork_field_visibility entirely when not provided", async () => {
    const withoutVisibility = gql`
      mutation {
        publishPartnerListPublication(input: { partnerListID: "list-abc" }) {
          partnerListPublicationOrError {
            __typename
          }
        }
      }
    `
    const context = {
      publishPartnerListPublicationLoader: jest
        .fn()
        .mockResolvedValue({ id: "pub-1" }),
    }

    await runAuthenticatedQuery(withoutVisibility, context)

    expect(context.publishPartnerListPublicationLoader).toHaveBeenCalledWith(
      "list-abc",
      {}
    )
  })

  it("reads artworkFieldVisibility back as typed booleans, casting stored string values", async () => {
    const readVisibility = gql`
      mutation {
        publishPartnerListPublication(
          input: {
            partnerListID: "list-abc"
            artworkFieldVisibility: { artistName: true, artworkTitle: false }
          }
        ) {
          partnerListPublicationOrError {
            ... on PublishPartnerListPublicationSuccess {
              partnerListPublication {
                artworkFieldVisibility {
                  artistName
                  artworkTitle
                  price
                }
              }
            }
          }
        }
      }
    `
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        // Gravity may store either real booleans or the literal strings
        // "true"/"false" (untyped Grape Hash param) — both must cast right.
        artwork_field_visibility: {
          artist_name: true,
          artwork_title: "false",
        },
      }),
    }

    const result = await runAuthenticatedQuery(readVisibility, context)

    expect(
      result.publishPartnerListPublication.partnerListPublicationOrError
        .partnerListPublication.artworkFieldVisibility
    ).toEqual({
      artistName: true,
      artworkTitle: false,
      price: null,
    })
  })
})
