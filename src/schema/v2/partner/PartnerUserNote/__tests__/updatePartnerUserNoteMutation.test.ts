import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerUserNoteMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerUserNote(
        input: { id: "note-123", body: "Now looking at works on paper." }
      ) {
        partnerUserNoteOrError {
          __typename
          ... on UpdatePartnerUserNoteSuccess {
            partnerUserNote {
              internalID
              body
            }
          }
          ... on UpdatePartnerUserNoteFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates a partner user note", async () => {
    const context = {
      updatePartnerUserNoteLoader: () =>
        Promise.resolve({
          id: "note-123",
          partner_id: "partner-123",
          user_id: "collector-123",
          body: "Now looking at works on paper.",
        }),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual({
      updatePartnerUserNote: {
        partnerUserNoteOrError: {
          __typename: "UpdatePartnerUserNoteSuccess",
          partnerUserNote: {
            internalID: "note-123",
            body: "Now looking at works on paper.",
          },
        },
      },
    })
  })

  it("calls the loader with the correct parameters", async () => {
    const mockLoader = jest.fn().mockResolvedValue({
      id: "note-123",
      body: "Now looking at works on paper.",
    })

    await runAuthenticatedQuery(mutation, {
      updatePartnerUserNoteLoader: mockLoader,
    })

    expect(mockLoader).toHaveBeenCalledWith("note-123", {
      body: "Now looking at works on paper.",
    })
  })

  it("returns a mutation error when Gravity rejects the request", async () => {
    const context = {
      updatePartnerUserNoteLoader: () =>
        Promise.reject(
          new HTTPError("http://artsy.net - {}", 403, { error: "Forbidden" })
        ),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual({
      updatePartnerUserNote: {
        partnerUserNoteOrError: {
          __typename: "UpdatePartnerUserNoteFailure",
          mutationError: {
            message: "Forbidden",
          },
        },
      },
    })
  })
})
