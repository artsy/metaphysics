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
              initials
              email
              selfReportedPurchases
              intents
              privacy
              profession
              isEmailConfirmed
              isIdentityVerified
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
        initials: "P",
        email: "percy@cat.com",
        selfReportedPurchases: "treats",
        intents: ["buy art & design"],
        privacy: "public",
        profession: "typer",
        isEmailConfirmed: true,
        isIdentityVerified: true,
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

    describe("isProfileComplete", () => {
      it("returns true if the profile is complete", () => {
        const query = `
          {
            me {
              collectorProfile {
                isProfileComplete
              }
            }
          }
        `

        const collectorProfile = {
          id: "3",
          name: "Johnathan Storm",
          email: "johnathan@storm.com",
          location: {
            display: "Berlin",
          },
          profession: "coder",
          other_relevant_positions: "other typer",
          bio: "J. Storm",
        }

        const context = {
          meCollectorProfileLoader: () => Promise.resolve(collectorProfile),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            expect(collectorProfile.isProfileComplete).toBe(true)
          }
        )
      })

      it("returns false if the profile is incomplete", () => {
        const query = `
        {
          me {
            collectorProfile {
              isProfileComplete
            }
          }
        }
      `

        const collectorProfile = {
          id: "3",
          name: "Anonny",
          email: "anonny@mos.sos",
          location: {
            display: "Berlin",
          },
          profession: "",
          other_relevant_positions: "no one knows",
          bio: "¯\\_(ツ)_//¯",
        }

        const context = {
          meCollectorProfileLoader: () => Promise.resolve(collectorProfile),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            expect(collectorProfile.isProfileComplete).toBe(false)
          }
        )
      })
    })
  })
})
