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
          name: "Percy",
        },
        email_confirmed_at: "2022-12-19",
        identity_verified: true,
        profession: "typer",
        artwork_inquiry_requests_count: 25,
        previously_registered_for_auction: false,
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
          icon: { url: "http://image.com" },
          location: {
            display: "Berlin",
          },
          profession: "coder",
          other_relevant_positions: "other typer",
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

    describe("summaryParagraph", () => {
      it("returns a summary paragraph", () => {
        const query = `
          {
            me {
              collectorProfile {
                summaryParagraph(artworkID: "blah")
              }
            }
          }
        `

        const collectorProfile = {
          id: "3",
        }

        const context = {
          meCollectorProfileLoader: () => Promise.resolve(collectorProfile),
          collectorProfileSummaryLoader: () =>
            Promise.resolve({ paragraph: "This collector exists." }),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            expect(collectorProfile.summaryParagraph).toBe(
              "This collector exists."
            )
          }
        )
      })
    })
  })
})
