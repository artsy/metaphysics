import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerUserNoteMutation", () => {
  const mutation = gql`
    mutation {
      createPartnerUserNote(
        input: {
          partnerId: "partner-123"
          userId: "collector-123"
          body: "Collects ceramics."
        }
      ) {
        partnerUserNoteOrError {
          __typename
          ... on CreatePartnerUserNoteSuccess {
            partnerUserNote {
              internalID
              partnerId
              userId
              body
            }
          }
          ... on CreatePartnerUserNoteFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("creates a partner user note", async () => {
    const context = {
      createPartnerUserNoteLoader: () =>
        Promise.resolve({
          id: "note-123",
          partner_id: "partner-123",
          user_id: "collector-123",
          body: "Collects ceramics.",
          updated_by_user_id: "partner-user-123",
        }),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual({
      createPartnerUserNote: {
        partnerUserNoteOrError: {
          __typename: "CreatePartnerUserNoteSuccess",
          partnerUserNote: {
            internalID: "note-123",
            partnerId: "partner-123",
            userId: "collector-123",
            body: "Collects ceramics.",
          },
        },
      },
    })
  })

  it("calls the loader with the correct parameters", async () => {
    const mockLoader = jest.fn().mockResolvedValue({
      id: "note-123",
      partner_id: "partner-123",
      user_id: "collector-123",
      body: "Collects ceramics.",
    })

    await runAuthenticatedQuery(mutation, {
      createPartnerUserNoteLoader: mockLoader,
    })

    expect(mockLoader).toHaveBeenCalledWith({
      partner_id: "partner-123",
      user_id: "collector-123",
      body: "Collects ceramics.",
    })
  })

  it("returns a mutation error when Gravity rejects the request", async () => {
    const context = {
      createPartnerUserNoteLoader: () =>
        Promise.reject(
          new HTTPError("http://artsy.net - {}", 403, { error: "Forbidden" })
        ),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual({
      createPartnerUserNote: {
        partnerUserNoteOrError: {
          __typename: "CreatePartnerUserNoteFailure",
          mutationError: {
            message: "Forbidden",
          },
        },
      },
    })
  })
})
