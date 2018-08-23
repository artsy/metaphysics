/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"

describe("submissions", () => {
  it("asks for a user's submissions", () => {
    const mutation = gql`
      {
        me {
          consignment_submissions(first: 5, completed: true) {
            edges {
              node {
                id
                authenticity_certificate
                title
                artist_id
                artist {
                  name
                }
              }
            }
          }
        }
      }
    `

    const rootValue = {
      submissionsLoader: () =>
        Promise.resolve([
          {
            id: "106",
            authenticity_certificate: true,
            artist_id: "123",
            title: "The best photo yet",
          },
        ]),
      artistLoader: () =>
        Promise.resolve({
          name: "Larissa Croft",
          birthday: "April 2011",
          artworks_count: 1,
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
