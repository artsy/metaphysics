import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.myCollection", () => {
  it("includes info about my collection", async () => {
    const query = gql`
      {
        me {
          myCollectionInfo {
            name
            includesPurchasedArtworks
          }
        }
      }
    `
    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      collectionLoader: () =>
        Promise.resolve({
          name: "My Collection",
          includes_purchased_artworks: true,
        }),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data.me.myCollectionInfo.name).toBe("My Collection")
    expect(data.me.myCollectionInfo.includesPurchasedArtworks).toBe(true)
  })

  it("returns artworks for a collection", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10) {
            edges {
              node {
                internalID
                title
              }
            }
          }
        }
      }
    `
    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      collectionArtworksLoader: () =>
        Promise.resolve({
          body: [
            {
              _id: "58e3e54aa09a6708282022f6",
              title: "some title",
            },
          ],
          headers: {
            "x-total-count": "10",
          },
        }),
      submissionsLoader: () => Promise.resolve([]),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data.me.myCollectionConnection.edges[0].node.title).toBe(
      "some title"
    )
  })

  it("enriches artwork with consignment submissions data", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10) {
            edges {
              node {
                internalID
                title
                consignmentSubmission {
                  displayText
                }
              }
            }
          }
        }
      }
    `

    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      collectionArtworksLoader: () =>
        Promise.resolve({
          body: [
            {
              _id: "artwork_id_with_submission",
              id: "artwork_id_with_submission",
              title: "some title",
            },
            {
              _id: "artwork_id_without_submission",
              id: "artwork_id_without_submission",
              title: "some title 2",
            },
            {
              _id: "artwork_id_with_draft_submission",
              id: "artwork_id_with_draft_submission",
              title: "some title 3",
            },
          ],
          headers: {
            "x-total-count": "10",
          },
        }),
      submissionsLoader: () =>
        Promise.resolve([
          {
            my_collection_artwork_id: "artwork_id_with_submission",
            state: "submitted",
          },
          {
            my_collection_artwork_id: "artwork_id_with_draft_submission",
            state: "draft",
          },
        ]),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data.me.myCollectionConnection.edges[0].node.title).toBe(
      "some title"
    )
    expect(
      data.me.myCollectionConnection.edges[0].node.consignmentSubmission
        .displayText
    ).toBe("Submission in progress")

    expect(data.me.myCollectionConnection.edges[1].node.title).toBe(
      "some title 2"
    )
    expect(
      data.me.myCollectionConnection.edges[1].node.consignmentSubmission
    ).toBeFalsy()

    expect(data.me.myCollectionConnection.edges[2].node.title).toBe(
      "some title 3"
    )
    expect(
      data.me.myCollectionConnection.edges[2].node.consignmentSubmission
    ).toBeFalsy()
  })

  it("ignores collection not found errors and returns an empty array", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10) {
            edges {
              node {
                internalID
                title
              }
            }
          }
        }
      }
    `
    console.error = jest.fn() // Suppress error output
    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      collectionArtworksLoader: () =>
        Promise.reject(new Error("Collection Not Found")),
      submissionsLoader: () => Promise.resolve([]),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data.me.myCollectionConnection.edges).toEqual([])
  })

  it("fails with all other errors", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10) {
            edges {
              node {
                internalID
                title
              }
            }
          }
        }
      }
    `
    console.error = jest.fn() // Suppress error output
    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      collectionArtworksLoader: () =>
        Promise.reject(new Error("Some other error")),
      submissionsLoader: () => Promise.resolve([]),
    }

    expect.assertions(1)

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
      "Some other error"
    )
  })
})
