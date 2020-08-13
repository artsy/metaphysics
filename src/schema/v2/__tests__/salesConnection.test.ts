/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import sinon from "sinon"

describe("salesConnection", () => {
  describe(`Provides filter results`, () => {
    it("returns a connection, and makes one gravity call when args passed inline", async () => {
      const context = {
        authenticatedLoaders: {
          salesLoaderWithHeaders: sinon
            .stub()
            .withArgs("sales", {
              first: 5,
              isAuction: true,
              live: true,
              published: true,
              registered: true,
            })
            .returns(
              Promise.resolve({
                headers: {
                  "x-total-count": 1,
                },
                body: [
                  {
                    name: "Heritage: Photographs",
                    slug: "heritage-photographs-14",
                  },
                ],
              })
            ),
        },
        unauthenticatedLoaders: {},
      }

      const query = gql`
        {
          salesConnection(
            first: 5
            isAuction: true
            live: true
            published: true
            registered: true
          ) {
            edges {
              node {
                name
              }
            }
          }
        }
      `

      const { salesConnection } = await runQuery(query, context as any)

      expect(salesConnection.edges).toEqual([
        { node: { name: "Heritage: Photographs" } },
      ])
    })

    it("uses the unauthenticated loader if registered is not specified", async () => {
      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          salesLoaderWithHeaders: sinon
            .stub()
            .withArgs("sales", {
              first: 5,
              isAuction: true,
              live: true,
              published: true,
            })
            .returns(
              Promise.resolve({
                headers: {
                  "x-total-count": 1,
                },
                body: [
                  {
                    name: "Heritage: Photographs",
                    slug: "heritage-photographs-14",
                  },
                ],
              })
            ),
        },
      }

      const query = gql`
        {
          salesConnection(
            first: 5
            isAuction: true
            live: true
            published: true
          ) {
            edges {
              node {
                name
              }
            }
          }
        }
      `

      const { salesConnection } = await runQuery(query, context as any)

      expect(salesConnection.edges).toEqual([
        { node: { name: "Heritage: Photographs" } },
      ])
    })
  })
})
