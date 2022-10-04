/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    deleteUserAdminNote(input: { id: "xyz321", adminNoteId: "abc123" }) {
      adminNoteOrError {
        __typename
        ... on deleteUserAdminNoteSuccess {
          adminNote {
            internalID
            body
            createdAt
          }
        }
        ... on deleteUserAdminNoteFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("Delete an admin note for a user", () => {
  describe("when succesfull", () => {
    const adminNote = {
      id: "xyz321",
      body: "Still a great collector",
      created_at: "2022-09-30T12:00:00+00:00",
    }

    const context = {
      deleteUserAdminNoteLoader: () => Promise.resolve(adminNote),
    }

    it("deletes an account request", async () => {
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        deleteUserAdminNote: {
          adminNoteOrError: {
            __typename: "deleteUserAdminNoteSuccess",
            adminNote: {
              internalID: "xyz321",
              body: "Still a great collector",
              createdAt: "2022-09-30T12:00:00+00:00",
            },
          },
        },
      })
    })
  })

  describe("when failure", () => {
    it("return an error", async () => {
      const context = {
        deleteUserAdminNoteLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/user/xyz321/admin_note/abc123 - {"type":"error","message":"User not found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        deleteUserAdminNote: {
          adminNoteOrError: {
            __typename: "deleteUserAdminNoteFailure",
            mutationError: {
              message: "User not found",
            },
          },
        },
      })
    })
  })
})
