import { createBatchCollectionMembershipLoader } from "../batchCollectionMembershipLoader"

describe("createBatchCollectionMembershipLoader", () => {
  it("makes a single Gravity call for many membership checks of the same artwork", async () => {
    const fetchCollections = jest
      .fn()
      .mockResolvedValue([{ id: "list-1" }, { id: "list-3" }])
    const loader = createBatchCollectionMembershipLoader(
      fetchCollections,
      "user-42"
    )

    const results = await Promise.all([
      loader("artwork-id"),
      loader("artwork-id"),
      loader("artwork-id"),
    ])

    expect(fetchCollections).toHaveBeenCalledTimes(1)
    expect(fetchCollections).toHaveBeenCalledWith({
      artwork_id: "artwork-id",
      user_id: "user-42",
      private: true,
      size: 100,
    })
    results.forEach((set) => {
      expect(set.has("list-1")).toBe(true)
      expect(set.has("list-3")).toBe(true)
      expect(set.has("list-2")).toBe(false)
    })
  })

  it("degrades to an empty set when Gravity rejects", async () => {
    const fetchCollections = jest
      .fn()
      .mockRejectedValue(new Error("Artwork Not Found"))
    const loader = createBatchCollectionMembershipLoader(
      fetchCollections,
      "user-42"
    )

    const set = await loader("missing-artwork")

    expect(set.size).toBe(0)
  })
})
