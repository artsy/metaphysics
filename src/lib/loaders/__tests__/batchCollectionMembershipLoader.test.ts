import { error } from "lib/loggers"
import { createBatchCollectionMembershipLoader } from "../batchCollectionMembershipLoader"

jest.mock("lib/loggers", () => ({
  ...jest.requireActual("lib/loggers"),
  error: jest.fn(),
}))

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

  it("degrades to an empty set and logs when Gravity rejects", async () => {
    const gravityError = new Error("Artwork Not Found")
    const fetchCollections = jest.fn().mockRejectedValue(gravityError)
    const loader = createBatchCollectionMembershipLoader(
      fetchCollections,
      "user-42"
    )

    const set = await loader("missing-artwork")

    expect(set.size).toBe(0)
    expect(error as jest.Mock).toHaveBeenCalledWith(gravityError)
  })
})
