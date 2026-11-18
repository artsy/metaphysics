import { createBatchLatestResaleSubmissionLoader } from "../batchLatestResaleSubmissionLoader"

describe("batch latest resale submission", () => {
  it("fetches several artworks in one call and matches rows by artwork ID", async () => {
    const submission = { id: "submission-1", state: "listed" }
    const fetchLatest = jest.fn().mockResolvedValue([
      { artwork_id: "artwork-2", resale_submission: null },
      { artwork_id: "artwork-1", resale_submission: submission },
    ])
    const loader = createBatchLatestResaleSubmissionLoader(fetchLatest)

    const results = await Promise.all([
      loader.load("artwork-1"),
      loader.load("artwork-2"),
      loader.load("artwork-1"),
      loader.load("someone-elses-artwork"),
    ])

    expect(fetchLatest).toHaveBeenCalledTimes(1)
    expect(fetchLatest).toHaveBeenCalledWith({
      artwork_id: ["artwork-1", "artwork-2", "someone-elses-artwork"],
    })
    expect(results).toEqual([
      { artwork_id: "artwork-1", resale_submission: submission },
      { artwork_id: "artwork-2", resale_submission: null },
      { artwork_id: "artwork-1", resale_submission: submission },
      null,
    ])
  })

  it("splits batches of more than 50 artworks", async () => {
    const fetchLatest = jest.fn().mockResolvedValue([])
    const loader = createBatchLatestResaleSubmissionLoader(fetchLatest)

    await Promise.all(
      Array.from({ length: 60 }, (_, i) => loader.load(`artwork-${i}`))
    )

    expect(
      fetchLatest.mock.calls.map(([params]) => params.artwork_id.length)
    ).toEqual([50, 10])
  })

  it("rejects failures instead of claiming the work has no submission", async () => {
    const loader = createBatchLatestResaleSubmissionLoader(
      jest.fn().mockRejectedValue(new Error("Unavailable"))
    )
    await expect(loader.load("artwork-1")).rejects.toThrow("Unavailable")
  })
})
