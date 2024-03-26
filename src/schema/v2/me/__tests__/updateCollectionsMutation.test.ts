import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("updateMeCollectionsMutation", () => {
  const mutation = gql`
    mutation {
      updateMeCollectionsMutation(
        input: {
          attributes: [
            { id: "collection-id-1", shareableWithPartners: true }
            { id: "collection-id-2", shareableWithPartners: false }
          ]
        }
      ) {
        meCollectionsOrErrors {
          ... on UpdateMeCollectionsSuccess {
            collection {
              shareableWithPartners
            }
          }
          ... on UpdateMeCollectionsFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  const mockCollections = [
    { id: "collection-id-1", shareable_with_partners: true },
    { id: "collection-id-2", shareable_with_partners: false },
  ]

  it("calls the expected loader with correctly formatted params", async () => {
    const mockUpdateMeCollectionsLoader = jest.fn(() =>
      Promise.resolve(mockCollections)
    )

    const context = { meUpdateCollectionsLoader: mockUpdateMeCollectionsLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockUpdateMeCollectionsLoader).toBeCalledWith({
      attributes: JSON.stringify(mockCollections),
    })

    expect(result).toEqual(
      expect.objectContaining({
        updateMeCollectionsMutation: {
          meCollectionsOrErrors: [
            {
              collection: {
                shareableWithPartners: true,
              },
            },
            {
              collection: {
                shareableWithPartners: false,
              },
            },
          ],
        },
      })
    )
  })

  it("throws error when data loader is missing", async () => {
    const errorResponse = "You need to be signed in to perform this action"

    try {
      await runQuery(mutation)
      throw new Error("An error was not thrown but was expected.")
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect, jest/no-try-expect
      expect(error.message).toEqual(errorResponse)
    }
  })

  it("returns gravity errors", async () => {
    const context = {
      meUpdateCollectionsLoader: () =>
        Promise.reject(new HTTPError(`Oops`, 500, "Error from API")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updateMeCollectionsMutation: {
        meCollectionsOrErrors: [
          {
            mutationError: {
              message: "Error from API",
              type: "error",
            },
          },
        ],
      },
    })
  })
})
