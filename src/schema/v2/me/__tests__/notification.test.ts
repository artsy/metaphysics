import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.notification", () => {
  it("returns a notification", async () => {
    const query = gql`
      {
        me {
          notification(id: "user-notification-id") {
            internalID
            message
          }
        }
      }
    `
    const meNotificationLoader = jest.fn(async () => ({
      id: "user-notification-id",
      message: "6 works added",
    }))
    const meLoader = jest.fn(async () => ({ id: "some-user-id" }))

    const context: Partial<ResolverContext> = {
      meNotificationLoader,
      meLoader,
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(meLoader).toHaveBeenCalled()
    expect(meNotificationLoader).toHaveBeenCalledWith("user-notification-id")

    console.log("[Debug] data")
    console.log(data)

    expect(data).toMatchInlineSnapshot(`
      Object {
        "me": Object {
          "notification": Object {
            "internalID": "user-notification-id",
            "message": "6 works added",
          },
        },
      }
    `)
  })
})
