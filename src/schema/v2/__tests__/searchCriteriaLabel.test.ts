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
})
