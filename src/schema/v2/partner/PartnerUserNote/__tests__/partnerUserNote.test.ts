import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("PartnerUserNote", () => {
  const query = gql`
    {
      partnerUserNote(id: "note-123") {
        internalID
        partnerId
        userId
        body
        updatedByUserId
      }
    }
  `

  it("retrieves a partner's note about a collector", async () => {
    const context = {
      partnerUserNoteLoader: () =>
        Promise.resolve({
          id: "note-123",
          partner_id: "partner-123",
          user_id: "collector-123",
          body: "Repeat buyer.",
          updated_by_user_id: "partner-user-123",
        }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      partnerUserNote: {
        internalID: "note-123",
        partnerId: "partner-123",
        userId: "collector-123",
        body: "Repeat buyer.",
        updatedByUserId: "partner-user-123",
      },
    })
  })

  it("calls the loader with the given id", async () => {
    const mockLoader = jest.fn().mockResolvedValue({
      id: "note-123",
      body: "Repeat buyer.",
    })

    await runAuthenticatedQuery(query, {
      partnerUserNoteLoader: mockLoader,
    })

    expect(mockLoader).toHaveBeenCalledWith("note-123")
  })
})
