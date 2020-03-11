/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v1/test/utils"
import gql from "lib/gql"

// FIXME: We're now stitching. Remove these files once this work settles
xdescribe("submissions", () => {
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
                edition_size
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
      submissionsLoader: () =>
        Promise.resolve([
          {
            id: "106",
            authenticity_certificate: true,
            artist_id: "123",
            title: "The best photo yet",
            edition_size: 100, // Edition sizes are stored as Int in Convection
          },
        ]),
      artistLoader: () =>
        Promise.resolve({
          name: "Larissa Croft",
          birthday: "April 2011",
          artworks_count: 1,
          edition_size: "100",
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, context).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
