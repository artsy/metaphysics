/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Me", () => {
  describe("AlertsConnection", () => {
    it("returns alerts", () => {
      const query = gql`
        {
          me {
            alertsConnection(first: 2) {
              pageInfo {
                hasNextPage
              }
              edges {
                node {
                  summary
                }
              }
            }
          }
        }
      `

      const summary1 = { artist_ids: ["shara-hughes", "andy-warhol"] }
      const summary2 = { artist_ids: ["pablo-picasso", "marina-abramović"] }

      const expectedConnectionData = {
        pageInfo: {
          hasNextPage: false,
        },
        edges: [
          {
            node: {
              summary: summary1,
            },
          },
          {
            node: {
              summary: summary2,
            },
          },
        ],
      }

      const context: any = {
        meLoader: () => Promise.resolve({}),
        meSearchCriteriaAllLoader: () =>
          Promise.resolve({
            headers: { "x-total-count": 2 },
            body: [
              {
                summary: summary1,
              },
              {
                summary: summary2,
              },
            ],
          }),
      }

      return runAuthenticatedQuery(query, context).then(
        ({ me: { alertsConnection } }) => {
          expect(alertsConnection).toEqual(expectedConnectionData)
        }
      )
    })
  })
})
