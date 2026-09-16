import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("conversation collectorResume notesConnection", () => {
  let partnerUserNotesLoader
  let context

  const query = gql`
    {
      conversation(id: "conversation-1") {
        collectorResume {
          notesConnection(first: 5) {
            totalCount
            edges {
              node {
                internalID
                body
                updatedByUserId
                updatedByUserName
              }
            }
          }
        }
      }
    }
  `

  beforeEach(() => {
    partnerUserNotesLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          {
            id: "note-1",
            partner_id: "partner-id",
            user_id: "buyer-1",
            body:
              "Serious collector, wants to see similar Latin American works.",
            updated_by_user_id: "partner-user-1",
            updated_by_user_name: "Eric Johnson",
          },
        ],
        headers: { "x-total-count": "1" },
      })
    )

    context = {
      conversationLoader: () =>
        Promise.resolve({
          id: "conversation-1",
          from_id: "buyer-1",
          from_type: "User",
          to_id: "partner-id",
          to_type: "Partner",
          items: [
            {
              item_type: "Artwork",
              item_id: "artwork-1",
              properties: { id: "artwork-1", _id: "artwork-1" },
            },
          ],
        }),
      partnerCollectorProfileLoader: () =>
        Promise.resolve({
          collector_profile: { id: "collector-profile-1" },
          follows_profile: false,
          purchases: {},
        }),
      partnerUserNotesLoader,
    }
  })

  it("returns the partner's notes about the collector", async () => {
    const data = await runQuery(query, context)

    expect(data.conversation.collectorResume.notesConnection).toEqual({
      totalCount: 1,
      edges: [
        {
          node: {
            internalID: "note-1",
            body:
              "Serious collector, wants to see similar Latin American works.",
            updatedByUserId: "partner-user-1",
            updatedByUserName: "Eric Johnson",
          },
        },
      ],
    })
  })

  it("scopes the request to the conversation's partner and collector", async () => {
    await runQuery(query, context)

    expect(partnerUserNotesLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        partner_id: "partner-id",
        user_id: "buyer-1",
        total_count: true,
      })
    )
  })

  it("leaves updatedByUserName null when gravity has no name for the author", async () => {
    partnerUserNotesLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          {
            id: "note-1",
            partner_id: "partner-id",
            user_id: "buyer-1",
            body: "Note from a since-deleted teammate.",
            updated_by_user_id: "partner-user-1",
            updated_by_user_name: null,
          },
        ],
        headers: { "x-total-count": "1" },
      })
    )

    const data = await runQuery(query, { ...context, partnerUserNotesLoader })
    const node = data.conversation.collectorResume.notesConnection.edges[0].node

    expect(node.updatedByUserName).toBeNull()
    expect(node.body).toEqual("Note from a since-deleted teammate.")
  })
})
