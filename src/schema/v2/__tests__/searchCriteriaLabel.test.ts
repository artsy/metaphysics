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
        value: "Foo Bar",
        field: "artistIDs",
      },
      {
        name: "Artist",
        value: "Baz Qux",
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
        value: "Unique",
        field: "attributionClass",
      },
      {
        name: "Rarity",
        value: "Limited edition",
        field: "attributionClass",
      },
      {
        name: "Rarity",
        value: "Open edition",
        field: "attributionClass",
      },
      {
        name: "Rarity",
        value: "Unknown edition",
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
        value: "Painting",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Photography",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Sculpture",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Prints",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Work on Paper",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "NFT",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Design",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Drawing",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Installation",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Film/Video",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Jewelry",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Performance Art",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Reproduction",
        field: "additionalGeneIDs",
      },
      {
        name: "Medium",
        value: "Ephemera or Merchandise",
        field: "additionalGeneIDs",
      },
    ])
  })

  it("formats price criteria", async () => {
    const parent = {
      priceRange: "42-420",
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Price",
        value: expect.anything(), // TODO: fix this placeholder formatting
        field: "priceRange",
      },
    ])
  })

  it("formats size bucket criteria", async () => {
    const parent = {
      sizes: ["LARGE", "MEDIUM", "SMALL"],
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Size",
        value: "Large (over 100cm)",
        field: "sizes",
      },
      {
        name: "Size",
        value: "Medium (40 – 100cm)",
        field: "sizes",
      },
      {
        name: "Size",
        value: "Small (under 40cm)",
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
          value: "h: from 1 cm",
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
          value: "h: to 10 cm",
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
          value: "h: 1–10 cm",
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
          value: "w: from 1 cm",
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
          value: "w: to 10 cm",
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
          value: "w: 1–10 cm",
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
          value: "w: to 51 cm",
          field: "width",
        },
        {
          name: "Size",
          value: "h: 1–10 cm",
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
        value: "Buy Now",
        field: "acquireable",
      },
      {
        name: "Ways to Buy",
        value: "Bid",
        field: "atAuction",
      },
      {
        name: "Ways to Buy",
        value: "Inquire",
        field: "inquireableOnly",
      },
      {
        name: "Ways to Buy",
        value: "Make Offer",
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
        value: "Acrylic",
        field: "materialsTerms",
      },
      {
        name: "Material",
        value: "C-Print",
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
        value: "Durham, PA, USA",
        field: "locationCities",
      },
      {
        name: "Artwork Location",
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
        value: "1990–1999",
        field: "majorPeriods",
      },
      {
        name: "Time Period",
        value: "Early 19th Century",
        field: "majorPeriods",
      },
    ])
  })

  it("formats color criteria", async () => {
    const parent = {
      colors: ["lightblue", "yellow"],
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Color",
        value: "Light Blue",
        field: "colors",
      },
      {
        name: "Color",
        value: "Yellow",
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
        value: "Foo Bar Gallery",
        field: "partnerIDs",
      },
      {
        name: "Galleries and Institutions",
        value: "Baz Qux Gallery",
        field: "partnerIDs",
      },
    ])
  })
})
