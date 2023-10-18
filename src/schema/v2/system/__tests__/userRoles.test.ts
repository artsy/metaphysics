import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const ROLES_FIXTURE = [
  {
    name: "content_manager",
  },
  {
    name: "sales_observer",
  },
]

describe("userRoles", () => {
  it("returns a list of roles", async () => {
    const userRolesLoader = jest
      .fn()
      .mockReturnValue(Promise.resolve(ROLES_FIXTURE))

    const query = gql`
      {
        system {
          userRoles {
            name
          }
        }
      }
    `
    const {
      system: { userRoles },
    } = await runAuthenticatedQuery(query, {
      userRolesLoader,
    })

    expect(userRoles[0].name).toEqual("content_manager")
  })
})
