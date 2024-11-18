import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    artworksCollectionsBatchUpdate(input: { artworkIDs: ["artwork-id"], addToCollectionIDs: ["collection-1", "collection-2"], removeFromCollectionIDs: ["collection-3"] }) {
      responseOrError {
        ... on ArtworksCollectionsBatchUpdateSuccess {
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

        ... on ArtworksCollectionsBatchUpdateFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("artworksCollectionsBatchUpdate", () => {
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
        artworksCollectionsBatchUpdateLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.artworksCollectionsBatchUpdateLoader as jest.Mock
      ).toHaveBeenCalledWith({
        artwork_ids: ["artwork-id"],
        add_to: ["collection-1", "collection-2"],
        remove_from: ["collection-3"],
      })
    })

    it("returns success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "artworksCollectionsBatchUpdate": {
            "responseOrError": {
              "addedToCollections": [
                {
                  "internalID": "collection-1",
                },
                {
                  "internalID": "collection-2",
                },
              ],
              "counts": {
                "addedToCollections": 2,
                "artworks": 1,
                "removedFromCollections": 1,
              },
              "removedFromCollections": [
                {
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
      artworksCollectionsBatchUpdateLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "artworksCollectionsBatchUpdate": {
          "responseOrError": {
            "mutationError": {
              "message": "One or more specified artworks was not found",
            },
          },
        },
      }
    `)
  })
})
