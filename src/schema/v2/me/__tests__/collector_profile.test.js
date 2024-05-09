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

    describe("summarySentence", () => {
      const query = `
          {
            me {
              collectorProfile {
                summarySentence
              }
            }
          }
        `

      const collectorProfile = {
        first_name_last_initial: "John S.",
        artsy_user_since: "2013-01-28T17:32:09+00:00",
      }

      describe("user activity", () => {
        describe("when the user is a confirmed buyer", () => {
          it("returns a summary sentence", () => {
            collectorProfile.confirmed_buyer_at = "2013-01-28T17:32:09+00:00"

            const context = {
              meCollectorProfileLoader: () => Promise.resolve(collectorProfile),
            }

            return runAuthenticatedQuery(query, context).then(
              ({ me: { collectorProfile } }) => {
                expect(collectorProfile.summarySentence).toBe(
                  "John S. is a Confirmed Artsy Buyer."
                )
              }
            )
          })
        })

        describe("when the user has signed up in the last 30 days", () => {
          const realNow = Date.now
          beforeEach(() => {
            Date.now = () => new Date("2013-01-30T03:24:00")
          })
          afterEach(() => {
            Date.now = realNow
          })

          it("returns a summary sentence", () => {
            collectorProfile.confirmed_buyer_at = null

            const context = {
              meCollectorProfileLoader: () => Promise.resolve(collectorProfile),
            }

            return runAuthenticatedQuery(query, context).then(
              ({ me: { collectorProfile } }) => {
                expect(collectorProfile.summarySentence).toBe(
                  "John S. is a New Artsy user."
                )
              }
            )
          })
        })

        describe("when the user has signed up more than 30 days ago", () => {
          it("returns a summary sentence", () => {
            collectorProfile.confirmed_buyer_at = null

            const context = {
              meCollectorProfileLoader: () => Promise.resolve(collectorProfile),
            }

            return runAuthenticatedQuery(query, context).then(
              ({ me: { collectorProfile } }) => {
                expect(collectorProfile.summarySentence).toBe(
                  "John S. is an Active Artsy user."
                )
              }
            )
          })
        })
      })
    })
  })
})
