import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("ViewingRoomConnection", () => {
  const viewingRooms = [
    {
      id: "viewing-room-1",
      title: "Viewing Room 1",
    },
    {
      id: "viewing-room-2",
      title: "Viewing Room 2",
    },
    {
      id: "viewing-room-2",
      title: "Viewing Room 2",
    },
  ]

  const viewingRoomsLoader = jest.fn().mockResolvedValue({
    body: viewingRooms,
    headers: {
      "x-total-count": viewingRooms.length,
    },
  })

  const context = {
    viewingRoomsLoader: viewingRoomsLoader,
  }

  it("returns viewing rooms", async () => {
    const query = gql`
      {
        viewingRoomsConnection(first: 2) {
          totalCount

          edges {
            node {
              internalID
              title
            }
          }
        }
      }
    `

    const result = await runQuery(query, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "viewingRoomsConnection": {
          "edges": [
            {
              "node": {
                "internalID": "viewing-room-1",
                "title": "Viewing Room 1",
              },
            },
            {
              "node": {
                "internalID": "viewing-room-2",
                "title": "Viewing Room 2",
              },
            },
          ],
          "totalCount": 3,
        },
      }
    `)
  })

  it("requests 20 viewing rooms when first option is not provided", async () => {
    const query = gql`
      {
        viewingRoomsConnection {
          totalCount

          edges {
            node {
              internalID
              title
            }
          }
        }
      }
    `

    await runQuery(query, context)

    expect(viewingRoomsLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        size: 20,
        total_count: true,
      })
    )
  })

  it("passes correct options to gravity", async () => {
    const query = gql`
      {
        viewingRoomsConnection(
          first: 2
          ids: ["viewing-room-1"]
          partnerID: "partner-id"
          featured: true
          statuses: [draft, live]
        ) {
          totalCount

          edges {
            node {
              internalID
              title
            }
          }
        }
      }
    `

    await runQuery(query, context)

    expect(viewingRoomsLoader).toHaveBeenCalledWith({
      featured: true,
      ids: ["viewing-room-1"],
      page: 1,
      partner_id: "partner-id",
      size: 2,
      statuses: ["draft", "live"],
      total_count: true,
    })
  })
})
