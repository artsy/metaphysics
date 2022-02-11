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
        value: "Large", // TODO: fix this placeholder formatting
        field: "sizes",
      },
      {
        name: "Size",
        value: "Medium", // TODO: fix this placeholder formatting
        field: "sizes",
      },
      {
        name: "Size",
        value: "Small", // TODO: fix this placeholder formatting
        field: "sizes",
      },
    ])
  })

  it("formats custom size criteria", async () => {
    const parent = {
      height: "1-10",
      width: "2-20",
    }

    const labels = await resolveSearchCriteriaLabels(parent, _, _, _)

    expect(labels).toIncludeAllMembers([
      {
        name: "Size",
        value: "w: 5–51 cm", // TODO: fix this placeholder formatting
        field: "width",
      },
      {
        name: "Size",
        value: "h: 3–25 cm", // TODO: fix this placeholder formatting
        field: "height",
      },
    ])
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
})
