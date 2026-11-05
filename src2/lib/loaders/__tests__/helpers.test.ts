import { withTimeout } from "../helpers"

jest.useFakeTimers()

describe("withTimeout", () => {
  it("rejects after the timeout", async () => {
    const loader = new Promise((resolve) => {
      setTimeout(() => {
        resolve("done")
      }, 1000)
    })

    const timeoutMs = 500
    const result = withTimeout(loader, timeoutMs)

    jest.advanceTimersByTime(1000)

    await expect(result).rejects.toThrow("Timeout of 500ms")
  })

  it("resolves before the timeout", async () => {
    const loader = new Promise((resolve) => {
      setTimeout(() => {
        resolve("done")
      }, 500)
    })

    const timeoutMs = 1000
    const result = withTimeout(loader, timeoutMs)

    jest.advanceTimersByTime(500)

    await expect(result).resolves.toBe("done")
  })

  it("works with a loader that errors", async () => {
    // eslint-disable-next-line promise/param-names
    const loader = new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error("failed"))
      }, 500)
    })

    const timeoutMs = 1000
    const result = withTimeout(loader, timeoutMs)

    jest.advanceTimersByTime(500)

    await expect(result).rejects.toThrow("failed")
  })
})
