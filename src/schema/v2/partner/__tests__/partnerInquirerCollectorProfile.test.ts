import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("partnerInquirerCollectorProfile", () => {
  const partnerData = {
    id: "catty-partner",
    slug: "catty-partner",
    name: "Catty Partner",
  }

  const collectorProfile = {
    name: "Some Collector",
    location: {
      city: "Around",
      country: "The Globe",
    },
    profession: "Superhuman",
    bio: "I got snacks to the roof",
  }

  const context = {
    partnerInquiryRequestLoader: () =>
      Promise.resolve({ id: "123", partnerId: "catty-partner" }),
    partnerInquirerCollectorProfileLoader: () =>
      Promise.resolve(collectorProfile),
    partnerLoader: () => Promise.resolve(partnerData),
  }

  it("returns an inquirer's collector profile", async () => {
    const query = gql`
      query {
        partner(id: "catty-partner") {
          inquiryRequest(inquiryId: "inquiry-id") {
            collectorProfile {
              name
              location {
                city
                country
              }
              profession
              bio
              isActiveInquirer
              isActiveBidder
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      partner: {
        inquiryRequest: {
          collectorProfile: {
            name: "Some Collector",
            location: { city: "Around", country: "The Globe" },
            profession: "Superhuman",
            bio: "I got snacks to the roof",
            isActiveInquirer: false,
            isActiveBidder: false,
          },
        },
      },
    })
  })
})
