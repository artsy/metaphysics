import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerUserNoteMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerUserNote(input: { id: "note-123" }) {
        partnerUserNoteOrError {
          __typename
          ... on DeletePartnerUserNoteSuccess {
            partnerUserNote {
              internalID
              body
            }
          }
          ... on DeletePartnerUserNoteFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("deletes a partner user note", async () => {
    const context = {
      deletePartnerUserNoteLoader: () =>
        Promise.resolve({
          id: "note-123",
          partner_id: "partner-123",
          user_id: "collector-123",
          body: "Collects ceramics.",
        }),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual({
      deletePartnerUserNote: {
        partnerUserNoteOrError: {
          __typename: "DeletePartnerUserNoteSuccess",
          partnerUserNote: {
            internalID: "note-123",
            body: "Collects ceramics.",
          },
        },
      },
    })
  })

  it("calls the loader with the correct parameters", async () => {
    const mockLoader = jest.fn().mockResolvedValue({
      id: "note-123",
      body: "Collects ceramics.",
    })

    await runAuthenticatedQuery(mutation, {
      deletePartnerUserNoteLoader: mockLoader,
    })

    expect(mockLoader).toHaveBeenCalledWith("note-123")
  })

  it("returns a mutation error when Gravity rejects the request", async () => {
    const context = {
      deletePartnerUserNoteLoader: () =>
        Promise.reject(
          new HTTPError("http://artsy.net - {}", 403, { error: "Forbidden" })
        ),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual({
      deletePartnerUserNote: {
        partnerUserNoteOrError: {
          __typename: "DeletePartnerUserNoteFailure",
          mutationError: {
            message: "Forbidden",
          },
        },
      },
    })
  })
})
