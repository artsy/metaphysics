import { representativeArtworks } from "../representativeArtworks"

describe("representativeArtworks field", () => {
  const field = representativeArtworks()
  const resolve = (parent: any, context: any) =>
    (field.resolve as any)(parent, {}, context)

  it("resolves representative_artwork_ids through artworkByIDLoader", async () => {
    const load = jest.fn((id: string) => Promise.resolve({ _id: id }))
    const result = await resolve(
      { representative_artwork_ids: ["art-1", "art-2", "art-3"] },
      { artworkByIDLoader: { load } }
    )

    expect(result).toEqual([
      { _id: "art-1" },
      { _id: "art-2" },
      { _id: "art-3" },
    ])
    // One .load() per id — the loader itself coalesces them into one call.
    expect(load).toHaveBeenCalledTimes(3)
  })

  it("drops ids the loader can't resolve", async () => {
    const load = jest.fn((id: string) =>
      Promise.resolve(id === "missing" ? null : { _id: id })
    )
    const result = await resolve(
      { representative_artwork_ids: ["art-1", "missing", "art-2"] },
      { artworkByIDLoader: { load } }
    )

    expect(result).toEqual([{ _id: "art-1" }, { _id: "art-2" }])
  })

  it("returns [] without touching the loader when there are no ids", async () => {
    const load = jest.fn()
    const result = await resolve(
      { representative_artwork_ids: [] },
      { artworkByIDLoader: { load } }
    )

    expect(result).toEqual([])
    expect(load).not.toHaveBeenCalled()
  })

  it("returns [] when the ids field is absent", async () => {
    const load = jest.fn()
    const result = await resolve({}, { artworkByIDLoader: { load } })

    expect(result).toEqual([])
    expect(load).not.toHaveBeenCalled()
  })

  it("honors a custom ids accessor", async () => {
    const customField = representativeArtworks((parent) => parent.rep_ids)
    const load = jest.fn((id: string) => Promise.resolve({ _id: id }))
    const result = await (customField.resolve as any)(
      { rep_ids: ["art-9"] },
      {},
      { artworkByIDLoader: { load } }
    )

    expect(result).toEqual([{ _id: "art-9" }])
  })
})
