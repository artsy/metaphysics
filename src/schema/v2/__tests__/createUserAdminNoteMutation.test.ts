/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createUserAdminNote(
      input: { id: "xyz321", body: "Still a great collector" }
    ) {
      adminNoteOrError {
        __typename
        ... on createUserAdminNoteSuccess {
          adminNote {
            body
            createdAt
          }
        }
        ... on createUserAdminNoteFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("Create a admin note for a user", () => {
  describe("when succesfull", () => {
    const adminNote = {
      id: "xyz321",
      body: "Still a great collector",
      created_at: "2022-09-30T12:00:00+00:00",
    }

    const context = {
      createUserAdminNoteLoader: () => Promise.resolve(adminNote),
    }

    it("creates an account request", async () => {
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        createUserAdminNote: {
          adminNoteOrError: {
            __typename: "createUserAdminNoteSuccess",
            adminNote: {
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
        createUserAdminNoteLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/user/abc123/admin_notes - {"type":"error","message":"User not found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        createUserAdminNote: {
          adminNoteOrError: {
            __typename: "createUserAdminNoteFailure",
            mutationError: {
              message: "User not found",
            },
          },
        },
      })
    })
  })
})
