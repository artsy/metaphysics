import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("modelChangesConnection", () => {
  const mockModelChange = {
    id: "change-1",
    trackable_type: "Artwork",
    trackable_id: "artwork-abc",
    user_id: "user-123",
    event: "update",
    fields_changed: ["title", "price"],
    field_changes: {
      title: ["Old Title", "New Title"],
      price: [1000, 2000],
    },
    created_at: "2024-01-01T00:00:00Z",
  }

  it("fetches model changes with pagination", async () => {
    const modelChangesLoader = jest.fn().mockResolvedValue({
      body: [mockModelChange],
      headers: { "x-total-count": "1" },
    })

    const query = gql`
      {
        modelChangesConnection(
          trackableType: ARTWORK
          trackableId: "artwork-abc"
          first: 10
        ) {
          totalCount
          edges {
            node {
              internalID
              event
              userID
              user {
                name
              }
              fieldsChanged
              fieldChanges
              trackableType
              trackableId
              createdAt
            }
          }
        }
      }
    `

    const userByIDLoader = jest.fn().mockResolvedValue({ name: "Percy Z" })

    const { modelChangesConnection } = await runAuthenticatedQuery(query, {
      modelChangesLoader,
      userByIDLoader,
    })

    expect(modelChangesLoader).toHaveBeenCalledWith({
      trackable_type: "Artwork",
      trackable_id: "artwork-abc",
      page: 1,
      size: 10,
      total_count: true,
    })

    expect(modelChangesConnection).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "node": {
              "createdAt": "2024-01-01T00:00:00Z",
              "event": "update",
              "fieldChanges": {
                "price": [
                  1000,
                  2000,
                ],
                "title": [
                  "Old Title",
                  "New Title",
                ],
              },
              "fieldsChanged": [
                "title",
                "price",
              ],
              "internalID": "change-1",
              "trackableId": "artwork-abc",
              "trackableType": "Artwork",
              "user": {
                "name": "Percy Z",
              },
              "userID": "user-123",
            },
          },
        ],
        "totalCount": 1,
      }
    `)
  })

  it("passes page cursor args correctly", async () => {
    const modelChangesLoader = jest.fn().mockResolvedValue({
      body: [],
      headers: { "x-total-count": "0" },
    })

    const query = gql`
      {
        modelChangesConnection(
          trackableType: ARTWORK
          trackableId: "artwork-abc"
          first: 5
        ) {
          totalCount
          edges {
            node {
              internalID
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(query, { modelChangesLoader })

    expect(modelChangesLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        size: 5,
        total_count: true,
      })
    )
  })

  it("returns null for user and userID when user_id is null", async () => {
    const modelChangesLoader = jest.fn().mockResolvedValue({
      body: [{ ...mockModelChange, user_id: null }],
      headers: { "x-total-count": "1" },
    })

    const query = gql`
      {
        modelChangesConnection(
          trackableType: ARTWORK
          trackableId: "artwork-abc"
          first: 10
        ) {
          edges {
            node {
              userID
              user {
                name
              }
            }
          }
        }
      }
    `

    const userByIDLoader = jest.fn()

    const { modelChangesConnection } = await runAuthenticatedQuery(query, {
      modelChangesLoader,
      userByIDLoader,
    })

    expect(userByIDLoader).not.toHaveBeenCalled()
    expect(modelChangesConnection.edges[0].node).toEqual({
      userID: null,
      user: null,
    })
  })

  it("throws an error when not authenticated", async () => {
    const query = gql`
      {
        modelChangesConnection(
          trackableType: ARTWORK
          trackableId: "artwork-abc"
          first: 10
        ) {
          edges {
            node {
              internalID
            }
          }
        }
      }
    `

    await expect(
      runAuthenticatedQuery(query, { modelChangesLoader: undefined })
    ).rejects.toThrow("You need to be signed in to view model changes.")
  })
})
