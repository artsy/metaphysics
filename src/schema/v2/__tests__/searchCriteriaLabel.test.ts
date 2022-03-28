import { resolveSearchCriteriaLabels } from "../searchCriteriaLabel"

const _ = {}

describe("resolveSearchCriteriaLabels", () => {
  it("formats artist criteria", async () => {
    const parent = {
      artistIDs: ["foo-bar", "baz-qux"],
    }

    const context = {
      artistLoader: jest
        .fn()
        .mockReturnValueOnce(Promise.resolve({ name: "Foo Bar" }))
        .mockReturnValueOnce(Promise.resolve({ name: "Baz Qux" })),
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, context, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Artist",
        displayValue: "Foo Bar",
        value: "foo-bar",
        field: "artistIDs",
      },
      {
        name: "Artist",
        displayValue: "Baz Qux",
        value: "baz-qux",
        field: "artistIDs",
      },
    ])
  })

  it("formats rarity criteria", async () => {
    const parent = {
      attributionClass: [
        "unique",
        "limited edition",
        "open edition",
        "unknown edition",
      ],
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Rarity",
        displayValue: "Unique",
        value: "unique",
        field: "attributionClass",
      },
      {
        name: "Rarity",
        displayValue: "Limited edition",
        value: "limited edition",
        field: "attributionClass",
      },
      {
        name: "Rarity",
        displayValue: "Open edition",
        value: "open edition",
        field: "attributionClass",
      },
      {
        name: "Rarity",
        displayValue: "Unknown edition",
        value: "unknown edition",
        field: "attributionClass",
      },
    ])
  })

  it("formats medium criteria", async () => {
    const parent = {
      additionalGeneIDs: [
        "painting",
        "photography",
        "sculpture",
        "prints",
        "work-on-paper",
        "nft",
        "design",
        "drawing",
        "installation",
        "film-slash-video",
        "jewelry",
        "performance-art",
        "reproduction",
        "ephemera-or-merchandise",
      ],
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Medium",
        displayValue: "Painting",
        value: "painting",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Photography",
        value: "photography",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Sculpture",
        value: "sculpture",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Prints",
        value: "prints",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Work on Paper",
        value: "work-on-paper",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "NFT",
        value: "nft",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Design",
        value: "design",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Drawing",
        value: "drawing",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Installation",
        value: "installation",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Film/Video",
        value: "film-slash-video",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Jewelry",
        value: "jewelry",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Performance Art",
        value: "performance-art",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Reproduction",
        value: "reproduction",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        displayValue: "Ephemera or Merchandise",
        value: "ephemera-or-merchandise",
        field: "additionalGeneIDs",
      },
    ])
  })

  describe("price criteria", () => {
    describe("min and max are set", () => {
      it("formats price criteria", async () => {
        const parent = {
          priceRange: "42-420",
        }
        const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

        expect(labels).toIncludeAllMembers([
          {
            name: "Price",
            displayValue: "$42–$420",
            value: "42-420",
            field: "priceRange",
          },
        ])
      })
    })

    describe("only min is set", () => {
      it("formats price criteria", async () => {
        const parent = {
          priceRange: "42-*",
        }
        const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

        expect(labels).toIncludeAllMembers([
          {
            name: "Price",
            displayValue: "$42+",
            value: "42-*",
            field: "priceRange",
          },
        ])
      })
    })

    describe("only max is set", () => {
      it("formats price criteria", async () => {
        const parent = {
          priceRange: "*-420",
        }
        const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

        expect(labels).toIncludeAllMembers([
          {
            name: "Price",
            displayValue: "$0–$420",
            value: "*-420",
            field: "priceRange",
          },
        ])
      })
    })
  })

  it("formats size bucket criteria", async () => {
    const parent = {
      sizes: ["LARGE", "MEDIUM", "SMALL"],
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Size",
        displayValue: "Large (over 100cm)",
        value: "LARGE",
        field: "sizes",
      },
      {
        name: "Size",
        displayValue: "Medium (40 – 100cm)",
        value: "MEDIUM",
        field: "sizes",
      },
      {
        name: "Size",
        displayValue: "Small (under 40cm)",
        value: "SMALL",
        field: "sizes",
      },
    ])
  })

  describe("formatting size criteria", () => {
    it("handles range with min for height", async () => {
      const parent = {
        height: "0.39370078740157477-*",
      }

      const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

      expect(labels).toIncludeAllMembers([
        {
          name: "Size",
          displayValue: "h: from 1 cm",
          value: "0.39370078740157477-*",
          field: "height",
        },
      ])
    })
    it("handles range with max for height", async () => {
      const parent = {
        height: "*-3.937007874015748",
      }

      const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

      expect(labels).toIncludeAllMembers([
        {
          name: "Size",
          displayValue: "h: to 10 cm",
          value: "*-3.937007874015748",
          field: "height",
        },
      ])
    })
    it("handles range with min and max for height", async () => {
      const parent = {
        height: "0.39370078740157477-3.937007874015748",
      }

      const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

      expect(labels).toIncludeAllMembers([
        {
          name: "Size",
          displayValue: "h: 1–10 cm",
          value: "0.39370078740157477-3.937007874015748",
          field: "height",
        },
      ])
    })
    it("handles range with min for width", async () => {
      const parent = {
        width: "0.39370078740157477-*",
      }

      const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

      expect(labels).toIncludeAllMembers([
        {
          name: "Size",
          displayValue: "w: from 1 cm",
          value: "0.39370078740157477-*",
          field: "width",
        },
      ])
    })
    it("handles range with max for width", async () => {
      const parent = {
        width: "*-3.937007874015748",
      }

      const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

      expect(labels).toIncludeAllMembers([
        {
          name: "Size",
          displayValue: "w: to 10 cm",
          value: "*-3.937007874015748",
          field: "width",
        },
      ])
    })
    it("handles range with min and max for width", async () => {
      const parent = {
        width: "0.39370078740157477-3.937007874015748",
      }

      const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

      expect(labels).toIncludeAllMembers([
        {
          name: "Size",
          displayValue: "w: 1–10 cm",
          value: "0.39370078740157477-3.937007874015748",
          field: "width",
        },
      ])
    })
    it("handles range with min and max for height and width", async () => {
      const parent = {
        height: "0.39370078740157477-3.937007874015748",
        width: "*-20",
      }

      const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

      expect(labels).toIncludeAllMembers([
        {
          name: "Size",
          displayValue: "w: to 51 cm",
          value: "*-20",
          field: "width",
        },
        {
          name: "Size",
          displayValue: "h: 1–10 cm",
          value: "0.39370078740157477-3.937007874015748",
          field: "height",
        },
      ])
    })
  })

  it("formats ways-to-buy criteria", async () => {
    const parent = {
      acquireable: true,
      atAuction: true,
      inquireableOnly: true,
      offerable: true,
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Ways to Buy",
        displayValue: "Buy Now",
        value: "true",
        field: "acquireable",
      },
      {
        name: "Ways to Buy",
        displayValue: "Bid",
        value: "true",
        field: "atAuction",
      },
      {
        name: "Ways to Buy",
        displayValue: "Inquire",
        value: "true",
        field: "inquireableOnly",
      },
      {
        name: "Ways to Buy",
        displayValue: "Make Offer",
        value: "true",
        field: "offerable",
      },
    ])
  })

  it("formats material criteria", async () => {
    const parent = {
      materialsTerms: ["acrylic", "c-print"],
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Material",
        displayValue: "Acrylic",
        value: "acrylic",
        field: "materialsTerms",
      },
      {
        name: "Material",
        displayValue: "C-Print",
        value: "c-print",
        field: "materialsTerms",
      },
    ])
  })

  it("formats artwork location criteria", async () => {
    const parent = {
      locationCities: ["Durham, PA, USA", "New York, NY, USA"],
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Artwork Location",
        displayValue: "Durham, PA, USA",
        value: "Durham, PA, USA",
        field: "locationCities",
      },
      {
        name: "Artwork Location",
        displayValue: "New York, NY, USA",
        value: "New York, NY, USA",
        field: "locationCities",
      },
    ])
  })

  it("formats time period criteria", async () => {
    const parent = {
      majorPeriods: ["1990", "Early 19th Century"],
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Time Period",
        displayValue: "1990–1999",
        value: "1990",
        field: "majorPeriods",
      },
      {
        name: "Time Period",
        displayValue: "Early 19th Century",
        value: "Early 19th Century",
        field: "majorPeriods",
      },
    ])
  })

  it("formats color criteria", async () => {
    const parent = {
      colors: ["blue", "yellow"],
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Color",
        displayValue: "Blue",
        value: "blue",
        field: "colors",
      },
      {
        name: "Color",
        displayValue: "Yellow",
        value: "yellow",
        field: "colors",
      },
    ])
  })

  it("formats partner criteria", async () => {
    const parent = {
      partnerIDs: ["foo-bar-gallery", "baz-qux-gallery"],
    }

    const context = {
      partnerLoader: jest
        .fn()
        .mockReturnValueOnce(Promise.resolve({ name: "Foo Bar Gallery" }))
        .mockReturnValueOnce(Promise.resolve({ name: "Baz Qux Gallery" })),
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, context, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Galleries and Institutions",
        displayValue: "Foo Bar Gallery",
        value: "foo-bar-gallery",
        field: "partnerIDs",
      },
      {
        name: "Galleries and Institutions",
        displayValue: "Baz Qux Gallery",
        value: "baz-qux-gallery",
        field: "partnerIDs",
      },
    ])
  })
})
