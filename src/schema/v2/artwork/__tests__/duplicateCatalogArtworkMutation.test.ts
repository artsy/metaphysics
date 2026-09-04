import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DuplicateCatalogArtworkMutation", () => {
  const mutation = gql`
    mutation {
      duplicateCatalogArtwork(input: { artworkID: "artwork-123" }) {
        artworkOrError {
          __typename
          ... on DuplicateCatalogArtworkSuccess {
            artwork {
              internalID
              title
            }
          }
          ... on DuplicateCatalogArtworkFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  describe("on success", () => {
    it("returns the newly created duplicate artwork", async () => {
      const context = {
        duplicateCatalogArtworkLoader: jest.fn(() =>
          Promise.resolve({ id: "artwork-456", _id: "artwork-456" })
        ),
        artworkLoader: jest.fn(() =>
          Promise.resolve({
            _id: "artwork-456",
            id: "artwork-456-slug",
            title: "Original Title",
          })
        ),
      }

      const result = await runAuthenticatedQuery(mutation, context)

      expect(context.duplicateCatalogArtworkLoader).toHaveBeenCalledWith(
        "artwork-123"
      )
      expect(context.artworkLoader).toHaveBeenCalledWith("artwork-456")
      expect(result).toEqual({
        duplicateCatalogArtwork: {
          artworkOrError: {
            __typename: "DuplicateCatalogArtworkSuccess",
            artwork: {
              internalID: "artwork-456",
              title: "Original Title",
            },
          },
        },
      })
    })
  })

  describe("on API failure", () => {
    it("returns a mutation error", async () => {
      const context = {
        duplicateCatalogArtworkLoader: jest.fn(() =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/catalog_artwork/artwork-123/duplicate - {"type":"error","message":"Catalog artwork not found"}`
            )
          )
        ),
      }

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toEqual({
        duplicateCatalogArtwork: {
          artworkOrError: {
            __typename: "DuplicateCatalogArtworkFailure",
            mutationError: {
              message: "Catalog artwork not found",
            },
          },
        },
      })
    })
  })

  describe("when unauthenticated", () => {
    it("returns an error", async () => {
      const context = {
        duplicateCatalogArtworkLoader: undefined,
      }

      await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
        "You need to be signed in to perform this action"
      )
    })
  })
})
