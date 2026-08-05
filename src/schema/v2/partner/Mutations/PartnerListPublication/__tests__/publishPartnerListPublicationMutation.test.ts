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
              passwordProtected
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
        password_protected: false,
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
            passwordProtected: false,
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

  it("sets a password", async () => {
    const withPassword = gql`
      mutation {
        publishPartnerListPublication(
          input: { partnerListID: "list-abc", password: "letmein" }
        ) {
          partnerListPublicationOrError {
            __typename
            ... on PublishPartnerListPublicationSuccess {
              partnerListPublication {
                passwordProtected
              }
            }
          }
        }
      }
    `
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        password_protected: true,
      }),
    }

    const result = await runAuthenticatedQuery(withPassword, context)

    expect(
      context.publishPartnerListPublicationLoader
    ).toHaveBeenCalledWith("list-abc", { password: "letmein" })
    expect(
      result.publishPartnerListPublication.partnerListPublicationOrError
        .partnerListPublication.passwordProtected
    ).toBe(true)
  })

  it("passes an empty string through when clearing a password", async () => {
    // Regression guard: `password: ""` must reach the loader as "" (not be
    // dropped), since that's what signals "clear the password" — the query
    // string round trip further down in lib/apis/fetch.ts is what turns it
    // into a `null` on the wire, which is out of scope for this mutation to
    // guard against; this test only proves the mutation itself forwards it.
    const clearPassword = gql`
      mutation {
        publishPartnerListPublication(
          input: { partnerListID: "list-abc", password: "" }
        ) {
          partnerListPublicationOrError {
            __typename
            ... on PublishPartnerListPublicationSuccess {
              partnerListPublication {
                passwordProtected
              }
            }
          }
        }
      }
    `
    const context = {
      publishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        password_protected: false,
      }),
    }

    await runAuthenticatedQuery(clearPassword, context)

    expect(
      context.publishPartnerListPublicationLoader
    ).toHaveBeenCalledWith("list-abc", { password: "" })
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
