/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Me", () => {
  describe("Tasks", () => {
    it("returns tasks for the user", async () => {
      const query = gql`
        {
          me {
            tasks(limit: 2) {
              title
              taskType
            }
          }
        }
      `

      const expectedData = [
        {
          title: "Come on baby light my wire",
          taskType: "send_wire",
        },
        {
          title: "I wanna know the outbid, I want you to show me",
          taskType: "outbid",
        },
      ]

      const meTasksLoader = jest.fn(async () => [
        {
          title: "Come on baby light my wire",
          task_type: "send_wire",
        },
        {
          title: "I wanna know the outbid, I want you to show me",
          task_type: "outbid",
        },
      ])

      const context = {
        meLoader: () => Promise.resolve({}),
        meTasksLoader,
      }

      const {
        me: { tasks },
      } = await runAuthenticatedQuery(query, context)

      expect(tasks).toEqual(expectedData)

      expect(meTasksLoader).toHaveBeenCalledWith({
        limit: 2,
      })
    })
  })
})
