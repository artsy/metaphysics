/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("submissionsConnection", () => {
  it("returns empty list since Convection is disabled", async () => {
    const query = gql`
      {
        me {
          submissionsConnection(first: 10) {
            totalCount
            edges {
              node {
                state
              }
            }
          }
        }
      }
    `

    const submissionsLoader = jest.fn(async () => {
      return {
        headers: { "x-total-count": "0" },
        body: [],
      }
    })

    const context: any = {
      meLoader: () => Promise.resolve({}),
      submissionsLoader: submissionsLoader,
    }

    const {
      me: { submissionsConnection },
    } = await runAuthenticatedQuery(query, context)

    expect(submissionsLoader).toHaveBeenCalledWith()
    expect(submissionsConnection).toEqual({
      edges: [],
      totalCount: 0,
    })
  })

  it("returns empty list when filtering by state since Convection is disabled", async () => {
    const query = gql`
      {
        me {
          submissionsConnection(first: 10, states: [DRAFT]) {
            totalCount
            edges {
              node {
                state
              }
            }
          }
        }
      }
    `

    const submissionsLoader = jest.fn(async () => {
      return {
        headers: { "x-total-count": "0" },
        body: [],
      }
    })

    const context: any = {
      meLoader: () => Promise.resolve({}),
      submissionsLoader: submissionsLoader,
    }

    const {
      me: { submissionsConnection },
    } = await runAuthenticatedQuery(query, context)

    expect(submissionsLoader).toHaveBeenCalledWith()
    expect(submissionsConnection).toEqual({
      edges: [],
      totalCount: 0,
    })
  })
})
