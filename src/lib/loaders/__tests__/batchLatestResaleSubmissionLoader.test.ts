import { createBatchLatestResaleSubmissionLoader } from "../batchLatestResaleSubmissionLoader"

const page = (body: any[], totalCount = body.length) => ({
  body,
  headers: { "x-total-count": String(totalCount) },
})

describe("batch latest resale submission", () => {
  it("fetches several artworks in one call and keeps each one’s newest submission", async () => {
    const newest = {
      id: "s-2",
      submitted_artwork_id: "artwork-1",
      state: "listed",
    }
    const older = {
      id: "s-1",
      submitted_artwork_id: "artwork-1",
      state: "canceled",
    }
    const fetchSubmissions = jest.fn().mockResolvedValue(page([newest, older]))
    const loader = createBatchLatestResaleSubmissionLoader(fetchSubmissions)

    const results = await Promise.all([
      loader.load("artwork-1"),
      loader.load("artwork-2"),
      loader.load("artwork-1"),
    ])

    expect(fetchSubmissions).toHaveBeenCalledTimes(1)
    expect(fetchSubmissions).toHaveBeenCalledWith({
      artwork_ids: ["artwork-1", "artwork-2"],
      sort: "-created_at",
      size: 100,
      page: 1,
      total_count: true,
    })
    expect(results).toEqual([newest, null, newest])
  })

  it("reads the next page until every work is seen", async () => {
    const first = Array.from({ length: 100 }, (_, i) => ({
      id: `old-${i}`,
      submitted_artwork_id: "artwork-1",
      state: "canceled",
    }))
    const second = {
      id: "s-2",
      submitted_artwork_id: "artwork-2",
      state: "rejected",
    }
    const fetchSubmissions = jest
      .fn()
      .mockResolvedValueOnce(page(first, 101))
      .mockResolvedValueOnce(page([second], 101))
    const loader = createBatchLatestResaleSubmissionLoader(fetchSubmissions)

    const results = await Promise.all([
      loader.load("artwork-1"),
      loader.load("artwork-2"),
    ])

    expect(fetchSubmissions.mock.calls.map(([params]) => params.page)).toEqual([
      1,
      2,
    ])
    expect(results).toEqual([first[0], second])
  })

  it("stops after the last page even when a work has no submission", async () => {
    const fetchSubmissions = jest.fn().mockResolvedValue(page([], 0))
    const loader = createBatchLatestResaleSubmissionLoader(fetchSubmissions)

    expect(await loader.load("artwork-1")).toBeNull()
    expect(fetchSubmissions).toHaveBeenCalledTimes(1)
  })

  it("splits batches of more than 50 artworks", async () => {
    const fetchSubmissions = jest.fn().mockResolvedValue(page([]))
    const loader = createBatchLatestResaleSubmissionLoader(fetchSubmissions)

    await Promise.all(
      Array.from({ length: 60 }, (_, i) => loader.load(`artwork-${i}`))
    )

    expect(
      fetchSubmissions.mock.calls.map(([params]) => params.artwork_ids.length)
    ).toEqual([50, 10])
  })

  it("rejects failures instead of claiming the work has no submission", async () => {
    const loader = createBatchLatestResaleSubmissionLoader(
      jest.fn().mockRejectedValue(new Error("Unavailable"))
    )
    await expect(loader.load("artwork-1")).rejects.toThrow("Unavailable")
  })
})
