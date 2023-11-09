import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("previewSavedSearch", () => {
  const query = gql`
    {
      previewSavedSearch(attributes: { acquireable: true }) {
        labels {
          field
          name
          displayValue
          value
        }
      }
    }
  `

  const meLoader = async () => ({ length_unit_preference: "in" })

  it("returns a previewed saved search", async () => {
    const { previewSavedSearch } = await runQuery(query, { meLoader })

    expect(previewSavedSearch.labels).toEqual([
      {
        field: "acquireable",
        name: "Ways to Buy",
        displayValue: "Buy Now",
        value: "true",
      },
    ])
  })

  describe("size labels", () => {
    it("returns a previewed saved search for sizes in inches", async () => {
      const query = gql`
        {
          previewSavedSearch(attributes: { sizes: [SMALL, MEDIUM, LARGE] }) {
            labels {
              field
              name
              displayValue
              value
            }
          }
        }
      `
      const { previewSavedSearch } = await runQuery(query, { meLoader })

      expect(previewSavedSearch.labels).toEqual([
        {
          field: "sizes",
          name: "Size",
          displayValue: "Small (under 16in)",
          value: "SMALL",
        },
        {
          field: "sizes",
          name: "Size",
          displayValue: "Medium (16in – 40in)",
          value: "MEDIUM",
        },
        {
          field: "sizes",
          name: "Size",
          displayValue: "Large (over 40in)",
          value: "LARGE",
        },
      ])
    })

    it("returns a previewed saved search for sizes in cm", async () => {
      const query = gql`
        {
          previewSavedSearch(attributes: { sizes: [SMALL, MEDIUM, LARGE] }) {
            labels {
              field
              name
              displayValue
              value
            }
          }
        }
      `

      const { previewSavedSearch } = await runQuery(query, {
        meLoader: async () => ({ length_unit_preference: "cm" }),
      })

      expect(previewSavedSearch.labels).toEqual([
        {
          field: "sizes",
          name: "Size",
          displayValue: "Small (under 40cm)",
          value: "SMALL",
        },
        {
          field: "sizes",
          name: "Size",
          displayValue: "Medium (40 – 100cm)",
          value: "MEDIUM",
        },
        {
          field: "sizes",
          name: "Size",
          displayValue: "Large (over 100cm)",
          value: "LARGE",
        },
      ])
    })
  })

  describe("displayName", () => {
    it("prefers artist, price, medium type, rarity in that order", async () => {
      const query = gql`
        {
          previewSavedSearch(
            attributes: {
              additionalGeneIDs: "prints"
              artistIDs: ["kaws-4242"]
              attributionClass: "limited edition"
              priceRange: "100-1000"
            }
          ) {
            displayName
          }
        }
      `

      const artistLoader = () => Promise.resolve({ name: "KAWS" })

      const { previewSavedSearch } = await runQuery(query, {
        artistLoader,
        meLoader,
      })

      expect(previewSavedSearch.displayName).toEqual(
        "KAWS — $100–$1,000, Print, Limited edition"
      )
    })

    it("handles array-valued input attributes", async () => {
      const query = gql`
        {
          previewSavedSearch(
            attributes: {
              additionalGeneIDs: ["painting", "prints"]
              artistIDs: ["kaws", "banksy"]
              attributionClass: ["limited edition", "unique"]
            }
          ) {
            displayName
          }
        }
      `

      const artistLoader = jest
        .fn()
        .mockReturnValueOnce(Promise.resolve({ name: "KAWS" }))
        .mockReturnValueOnce(Promise.resolve({ name: "Banksy" }))

      const { previewSavedSearch } = await runQuery(query, {
        artistLoader,
        meLoader,
      })

      expect(previewSavedSearch.displayName).toEqual(
        "KAWS or Banksy — Painting or Print, Limited edition or Unique"
      )
    })

    describe("when other criteria are available", () => {
      it("still prefers artist, price, medium, rarity over all others", async () => {
        const query = gql`
          {
            previewSavedSearch(
              attributes: {
                acquireable: true
                additionalGeneIDs: "prints"
                artistIDs: ["kaws"]
                atAuction: true
                attributionClass: ["limited edition"]
                colors: ["yellow"]
                inquireableOnly: true
                locationCities: ["New York, NY, USA"]
                majorPeriods: ["1990"]
                materialsTerms: ["acrylic"]
                offerable: true
                partnerIDs: ["foo-bar-gallery"]
                priceRange: "100-1000"
                sizes: [SMALL, MEDIUM]
              }
            ) {
              displayName
            }
          }
        `

        const artistLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve({ name: "KAWS" }))

        const partnerLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve({ name: "Foo Bar Gallery" }))

        const { previewSavedSearch } = await runQuery(query, {
          artistLoader,
          partnerLoader,
          meLoader,
        })

        expect(previewSavedSearch.displayName).toEqual(
          "KAWS — $100–$1,000, Print, Limited edition + 7 more"
        )
      })

      it("can use size; ways to buy; material in inches", async () => {
        const query = gql`
          {
            previewSavedSearch(
              attributes: {
                acquireable: true
                artistIDs: ["kaws"]
                atAuction: true
                inquireableOnly: true
                materialsTerms: ["acrylic"]
                offerable: true
                sizes: [SMALL]
              }
            ) {
              displayName
            }
          }
        `

        const artistLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve({ name: "KAWS" }))

        const { previewSavedSearch } = await runQuery(query, {
          artistLoader,
          meLoader,
        })

        expect(previewSavedSearch.displayName).toEqual(
          "KAWS — Small (under 16in), Buy Now or Bid or Inquire or Make Offer, Acrylic"
        )
      })

      it("can use size; ways to buy; material in centimeters", async () => {
        const query = gql`
          {
            previewSavedSearch(
              attributes: {
                acquireable: true
                artistIDs: ["kaws"]
                atAuction: true
                inquireableOnly: true
                materialsTerms: ["acrylic"]
                offerable: true
                sizes: [SMALL]
              }
            ) {
              displayName
            }
          }
        `

        const artistLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve({ name: "KAWS" }))

        const { previewSavedSearch } = await runQuery(query, {
          artistLoader,
          meLoader: async () => ({ length_unit_preference: "cm" }),
        })

        expect(previewSavedSearch.displayName).toEqual(
          "KAWS — Small (under 40cm), Buy Now or Bid or Inquire or Make Offer, Acrylic"
        )
      })

      it("can use period; color", async () => {
        const query = gql`
          {
            previewSavedSearch(
              attributes: {
                artistIDs: ["kaws"]
                colors: ["yellow"]
                majorPeriods: ["1990"]
              }
            ) {
              displayName
            }
          }
        `

        const artistLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve({ name: "KAWS" }))

        const { previewSavedSearch } = await runQuery(query, {
          artistLoader,
          meLoader,
        })

        expect(previewSavedSearch.displayName).toEqual(
          "KAWS — 1990–1999, Yellow"
        )
      })

      it("can use location; partner", async () => {
        const query = gql`
          {
            previewSavedSearch(
              attributes: {
                artistIDs: ["kaws"]
                locationCities: ["New York, NY, USA"]
                partnerIDs: ["foo-bar-gallery"]
              }
            ) {
              displayName
            }
          }
        `

        const artistLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve({ name: "KAWS" }))

        const partnerLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve({ name: "Foo Bar Gallery" }))

        const { previewSavedSearch } = await runQuery(query, {
          artistLoader,
          partnerLoader,
          meLoader,
        })

        expect(previewSavedSearch.displayName).toEqual(
          "KAWS — New York, NY, USA, Foo Bar Gallery"
        )
      })

      it("generates a name with only artist specified in the alert criteria", async () => {
        const query = gql`
          {
            previewSavedSearch(attributes: { artistIDs: ["kaws"] }) {
              displayName
            }
          }
        `

        const artistLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve({ name: "KAWS" }))

        const { previewSavedSearch } = await runQuery(query, {
          artistLoader,
          meLoader,
        })

        expect(previewSavedSearch.displayName).toEqual("KAWS")
      })
    })
  })

  describe("href", () => {
    describe("when no artistIDs are present", () => {
      it("returns null", async () => {
        const query = gql`
          {
            previewSavedSearch(
              attributes: {
                additionalGeneIDs: "prints"
                attributionClass: "limited edition"
                priceRange: "100-1000"
              }
            ) {
              href
            }
          }
        `

        const { previewSavedSearch } = await runQuery(query)

        expect(previewSavedSearch.href).toEqual(null)
      })
    })

    describe("when artistIDs are present", () => {
      it("builds correct href based on passed attributes", async () => {
        const query = gql`
          {
            previewSavedSearch(
              attributes: {
                acquireable: true
                additionalGeneIDs: "prints"
                artistIDs: ["kaws"]
                atAuction: true
                attributionClass: ["limited edition", "unique"]
                colors: ["yellow", "red"]
                inquireableOnly: true
                locationCities: ["New York, NY, USA"]
                majorPeriods: ["1990", "2000"]
                materialsTerms: ["acrylic", "aluminium"]
                offerable: true
                partnerIDs: ["foo-bar-gallery"]
                priceRange: "100-1000"
                sizes: [SMALL, MEDIUM]
              }
            ) {
              href
            }
          }
        `

        const { previewSavedSearch } = await runQuery(query)

        expect(previewSavedSearch.href).toEqual(
          "/artist/kaws?acquireable=true&additional_gene_ids%5B0%5D=prints&at_auction=true&attribution_class%5B0%5D=limited%20edition&attribution_class%5B1%5D=unique&colors%5B0%5D=yellow&colors%5B1%5D=red&inquireable_only=true&location_cities%5B0%5D=New%20York%2C%20NY%2C%20USA&major_periods%5B0%5D=1990&major_periods%5B1%5D=2000&materials_terms%5B0%5D=acrylic&materials_terms%5B1%5D=aluminium&offerable=true&partner_ids%5B0%5D=foo-bar-gallery&price_range=100-1000&sizes%5B0%5D=small&sizes%5B1%5D=medium&for_sale=true"
        )
      })
    })
  })
})
