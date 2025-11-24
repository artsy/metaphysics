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

    it("returns linkedIn and instagram fields", () => {
      const query = `
        {
          me {
            collectorProfile {
              internalID
              name
              linkedIn
              instagram
            }
          }
        }
      `

      const collectorProfile = {
        id: "3",
        name: "Percy",
        linked_in: "percy-cat",
        instagram: "@percy_the_cat",
      }

      const expectedProfileData = {
        internalID: "3",
        name: "Percy",
        linkedIn: "percy-cat",
        instagram: "@percy_the_cat",
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

    it("returns linkedIn and instagram fields from collectorProfile", () => {
      const query = `
        {
          me {
            name
            profession
            collectorProfile {
              linkedIn
              instagram
            }
          }
        }
      `

      const meData = {
        id: "user-123",
        name: "Percy Cat",
        profession: "Professional Cat",
      }

      const collectorProfileData = {
        id: "collector-123",
        linked_in: "percy-the-cat",
        instagram: "@percy_cat",
      }

      const expectedData = {
        name: "Percy Cat",
        profession: "Professional Cat",
        collectorProfile: {
          linkedIn: "percy-the-cat",
          instagram: "@percy_cat",
        },
      }

      const context = {
        meLoader: () => Promise.resolve(meData),
        meCollectorProfileLoader: () => Promise.resolve(collectorProfileData),
      }

      return runAuthenticatedQuery(query, context).then(({ me }) => {
        expect(me).toEqual(expectedData)
      })
    })

    describe("summaryAttributes", () => {
      it("returns up to 3 attributes when many attributes are true", () => {
        const query = `
          {
            me {
              collectorProfile {
                summaryAttributes(artworkID: "blah")
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
            Promise.resolve({
              raw_attributes: {
                has_demonstrated_budget: true,
                has_bought_works_from_partner: true,
                has_followed_partner: true,
                has_inquired_about_works_from_partner: true,
                has_inquired_about_works_from_artist: true,
                has_enabled_alerts_on_artist: true,
                has_enabled_alerts_on_a_represented_artist: true,
                has_followed_a_represented_artist: true,
                has_saved_works_from_partner: true,
                is_recent_sign_up: false,
              },
            }),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            expect(collectorProfile.summaryAttributes).toEqual([
              "Demonstrated a budget in line with this artwork's price",
              "Purchased from your gallery before",
              "Follows your gallery",
            ])
          }
        )
      })

      it("returns empty array when no attributes are true", () => {
        const query = `
          {
            me {
              collectorProfile {
                summaryAttributes(artworkID: "blah")
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
            Promise.resolve({
              raw_attributes: {
                has_demonstrated_budget: false,
                has_bought_works_from_partner: false,
                has_followed_partner: false,
                has_inquired_about_works_from_partner: false,
                has_inquired_about_works_from_artist: false,
                has_enabled_alerts_on_artist: false,
                has_enabled_alerts_on_a_represented_artist: false,
                has_followed_a_represented_artist: false,
                has_saved_works_from_partner: false,
                is_recent_sign_up: null,
              },
            }),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            expect(collectorProfile.summaryAttributes).toEqual([])
          }
        )
      })

      it("returns attributes with user info prepended when few attributes are true", () => {
        const query = `
          {
            me {
              collectorProfile {
                summaryAttributes(artworkID: "blah")
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
            Promise.resolve({
              raw_attributes: {
                has_demonstrated_budget: true,
                has_bought_works_from_partner: false,
                has_followed_partner: false,
                has_inquired_about_works_from_partner: false,
                has_inquired_about_works_from_artist: false,
                has_enabled_alerts_on_artist: false,
                has_enabled_alerts_on_a_represented_artist: false,
                has_followed_a_represented_artist: false,
                has_saved_works_from_partner: false,
                is_recent_sign_up: true,
              },
            }),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            expect(collectorProfile.summaryAttributes).toEqual([
              "New user",
              "Demonstrated a budget in line with this artwork's price",
            ])
          }
        )
      })

      it("returns active user when is_recent_sign_up is false and few other attributes are true", () => {
        const query = `
          {
            me {
              collectorProfile {
                summaryAttributes(artworkID: "blah")
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
            Promise.resolve({
              raw_attributes: {
                has_demonstrated_budget: false,
                has_bought_works_from_partner: true,
                has_followed_partner: false,
                has_inquired_about_works_from_partner: false,
                has_inquired_about_works_from_artist: false,
                has_enabled_alerts_on_artist: false,
                has_enabled_alerts_on_a_represented_artist: false,
                has_followed_a_represented_artist: false,
                has_saved_works_from_partner: false,
                is_recent_sign_up: false,
              },
            }),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            expect(collectorProfile.summaryAttributes).toEqual([
              "Active user",
              "Purchased from your gallery before",
            ])
          }
        )
      })
    })

    describe("collectorAttributes", () => {
      it("returns all attributes with structured data", () => {
        const query = `
          {
            me {
              collectorProfile {
                collectorAttributes {
                  key
                  label
                  value
                }
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
            Promise.resolve({
              raw_attributes: {
                has_demonstrated_budget: true,
                has_bought_works_from_partner: false,
                has_followed_partner: true,
                has_inquired_about_works_from_partner: false,
                has_inquired_about_works_from_artist: false,
                has_enabled_alerts_on_artist: false,
                has_enabled_alerts_on_a_represented_artist: false,
                has_followed_a_represented_artist: false,
                has_saved_works_from_partner: false,
                is_recent_sign_up: false,
              },
            }),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            // Only true attributes should be returned
            const allTrue = collectorProfile.collectorAttributes.every(
              (attr) => attr.value === true
            )
            expect(allTrue).toBe(true)

            // Check specific attributes that should be present
            const keys = collectorProfile.collectorAttributes.map(
              (attr) => attr.key
            )
            expect(keys).toContain("IS_ACTIVE_USER")
            expect(keys).toContain("HAS_DEMONSTRATED_BUDGET")
            expect(keys).toContain("HAS_FOLLOWED_PARTNER")
            expect(keys).not.toContain("HAS_BOUGHT_WORKS_FROM_PARTNER") // false, shouldn't be there
          }
        )
      })

      it("returns all attributes when none are true", () => {
        const query = `
          {
            me {
              collectorProfile {
                collectorAttributes {
                  key
                  label
                  value
                }
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
            Promise.resolve({
              raw_attributes: {
                has_demonstrated_budget: false,
                has_bought_works_from_partner: false,
                has_followed_partner: false,
                has_inquired_about_works_from_partner: false,
                has_inquired_about_works_from_artist: false,
                has_enabled_alerts_on_artist: false,
                has_enabled_alerts_on_a_represented_artist: false,
                has_followed_a_represented_artist: false,
                has_saved_works_from_partner: false,
                is_recent_sign_up: null,
              },
            }),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            // When all attributes are false, none should be returned
            expect(collectorProfile.collectorAttributes.length).toBe(0)
          }
        )
      })

      it("includes new user status when is_recent_sign_up is true", () => {
        const query = `
          {
            me {
              collectorProfile {
                collectorAttributes {
                  key
                  label
                  value
                }
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
            Promise.resolve({
              raw_attributes: {
                has_demonstrated_budget: true,
                has_bought_works_from_partner: false,
                has_followed_partner: false,
                has_inquired_about_works_from_partner: false,
                has_inquired_about_works_from_artist: false,
                has_enabled_alerts_on_artist: false,
                has_enabled_alerts_on_a_represented_artist: false,
                has_followed_a_represented_artist: false,
                has_saved_works_from_partner: false,
                is_recent_sign_up: true,
              },
            }),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            const newUserAttr = collectorProfile.collectorAttributes.find(
              (attr) => attr.key === "IS_RECENT_SIGN_UP"
            )
            expect(newUserAttr).toEqual({
              key: "IS_RECENT_SIGN_UP",
              label: "New Artsy user",
              value: true,
            })
          }
        )
      })

      it("includes similar galleries attributes from Vortex", () => {
        const query = `
          {
            me {
              collectorProfile {
                collectorAttributes {
                  key
                  label
                  value
                }
              }
            }
          }
        `

        const collectorProfile = {
          id: "3",
          partnerId: "partner-123",
          owner: { id: "user-456" },
        }

        const context = {
          meCollectorProfileLoader: () => Promise.resolve(collectorProfile),
          collectorProfileSummaryLoader: () =>
            Promise.resolve({
              raw_attributes: {
                has_demonstrated_budget: false,
                has_bought_works_from_partner: false,
                has_followed_partner: false,
                has_inquired_about_works_from_partner: false,
                has_inquired_about_works_from_artist: false,
                has_enabled_alerts_on_artist: false,
                has_enabled_alerts_on_a_represented_artist: false,
                has_followed_a_represented_artist: false,
                has_saved_works_from_partner: false,
                is_recent_sign_up: null,
              },
            }),
          similarGalleriesInteractionsLoader: () =>
            Promise.resolve({
              data: {
                has_purchased_from_similar_galleries: true,
                has_inquired_with_similar_galleries: true,
              },
            }),
        }

        return runAuthenticatedQuery(query, context).then(
          ({ me: { collectorProfile } }) => {
            // Should return max 5 attributes
            expect(
              collectorProfile.collectorAttributes.length
            ).toBeLessThanOrEqual(5)

            const purchasedAttr = collectorProfile.collectorAttributes.find(
              (attr) => attr.key === "HAS_BOUGHT_WORKS_FROM_SIMILAR_PARTNERS"
            )

            // At least the purchased attribute should be present
            expect(purchasedAttr).toEqual({
              key: "HAS_BOUGHT_WORKS_FROM_SIMILAR_PARTNERS",
              label: "Purchased from galleries like you",
              value: true,
            })
          }
        )
      })
    })
  })
})
