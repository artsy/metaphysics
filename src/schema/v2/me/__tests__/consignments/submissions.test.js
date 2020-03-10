/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

// FIXME: We're now stitching. Remove these files once this work settles
xdescribe("submissions", () => {
  it("asks for a user's submissions", async () => {
    const mutation = gql`
      {
        me {
          consignmentSubmissionsConnection(first: 5, completed: true) {
            edges {
              node {
                internalID
                authenticityCertificate
                title
                artistID
                artist {
                  name
                }
              }
            }
          }
        }
      }
    `

    const context = {
      meLoader: () => Promise.resolve({}),
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

    await runAuthenticatedQuery(mutation, context).then(data => {
      expect(data).toMatchSnapshot()
    })
    expect.assertions(1)
  })
})
