import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    manageArtworksCollections(input: { artworkIDs: ["artwork-id"], addToCollectionIDs: ["collection-1", "collection-2"], removeFromCollectionIDs: ["collection-3"] }) {
      responseOrError {
        ... on ManageArtworksCollectionsSuccess {
          counts {
            artworks
            addedToCollections
            removedFromCollections
          }

          addedToCollections {
            internalID
          }

          removedFromCollections {
            internalID
          }
        }

        ... on ManageArtworksCollectionsFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("manageArtworksCollections", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      counts: {
        artworks: 1,
        added_to: 2,
        removed_from: 1,
      },
      added_to: [{ id: "collection-1" }, { id: "collection-2" }],
      removed_from: [{ id: "collection-3" }],
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        manageArtworksCollectionsLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.manageArtworksCollectionsLoader as jest.Mock
      ).toHaveBeenCalledWith({
        artwork_ids: ["artwork-id"],
        add_to: ["collection-1", "collection-2"],
        remove_from: ["collection-3"],
      })
    })

    it("returns success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        Object {
          "manageArtworksCollections": Object {
            "responseOrError": Object {
              "addedToCollections": Array [
                Object {
                  "internalID": "collection-1",
                },
                Object {
                  "internalID": "collection-2",
                },
              ],
              "counts": Object {
                "addedToCollections": 2,
                "artworks": 1,
                "removedFromCollections": 1,
              },
              "removedFromCollections": Array [
                Object {
                  "internalID": "collection-3",
                },
              ],
            },
          },
        }
      `)
    })
  })

  it("returns failure when something went wrong", async () => {
    const message = `https://stagingapi.artsy.net/api/v1/artworks/collections/batch - {"error":"One or more specified artworks was not found"}`
    const error = new Error(message)
    const context = {
      manageArtworksCollectionsLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "manageArtworksCollections": Object {
          "responseOrError": Object {
            "mutationError": Object {
              "message": "One or more specified artworks was not found",
            },
          },
        },
      }
    `)
  })
})
