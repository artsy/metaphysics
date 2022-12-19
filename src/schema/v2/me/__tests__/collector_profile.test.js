/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("CollectorProfile", () => {
    it("returns the collector profile", () => {
      const query = `
        {
          me {
            collectorProfile {
              internalID
              name
              email
              selfReportedPurchases
              intents
              privacy
              profession
              emailConfirmed
              identityVerified 
              isActiveInquirer
              isActiveBidder
              collectorProfileArtists {
                name
              }
            }
          }
        }
      `

      const collectorProfile = {
        id: "3",
        name: "Percy",
        email: "percy@cat.com",
        self_reported_purchases: "treats",
        intents: ["buy art & design"],
        privacy: "public",
        owner: {
          location: {
            display: "Germany",
          },
          confirmed_at: "2022-12-19",
          identity_verified: true,
        },
        profession: "typer",
        artwork_inquiry_requests_count: 25,
        previously_registered_for_auction: false,
        collected_artist_names: [{ name: "Gumball" }, { name: "Edgar" }],
      }

      const expectedProfileData = {
        internalID: "3",
        name: "Percy",
        email: "percy@cat.com",
        selfReportedPurchases: "treats",
        intents: ["buy art & design"],
        privacy: "public",
        profession: "typer",
        emailConfirmed: true,
        identityVerified: true,
        isActiveInquirer: true,
        isActiveBidder: false,
        collectorProfileArtists: [{ name: "Gumball" }, { name: "Edgar" }],
      }

      const context = {
        meCollectorProfileLoader: () => Promise.resolve(collectorProfile),
      }

      return runAuthenticatedQuery(query, context).then(
        ({ me: { collectorProfile } }) => {
          expect(collectorProfile).toEqual(expectedProfileData)
        }
      )
    })
  })
})
