import { rateLimitByUser } from "../rateLimitByUser"

// Minimal in-memory stand-in for the bits of the `memcached` client the
// limiter uses, with the same "incr misses return false" semantics.
function fakeClient() {
  const store = new Map<string, number>()
  const calls = { incr: 0, add: 0 }
  return {
    store,
    calls,
    incr: (key: string, amount: number, cb: any) => {
      calls.incr += 1
      if (!store.has(key)) return cb(null, false)
      const next = (store.get(key) as number) + amount
      store.set(key, next)
      cb(null, next)
    },
    add: (key: string, value: number, _lifetime: number, cb: any) => {
      calls.add += 1
      if (store.has(key)) return cb(null, false)
      store.set(key, value)
      cb(null, true)
    },
  }
}

const consume = (client: any, max = 3) =>
  rateLimitByUser({
    scope: "test",
    userID: "user-1",
    max,
    windowSeconds: 60,
    client,
  })

describe("rateLimitByUser", () => {
  it("allows calls up to max, then rejects", async () => {
    const client = fakeClient()
    const results: boolean[] = []
    for (let i = 0; i < 5; i++) {
      results.push((await consume(client)).allowed)
    }
    expect(results).toEqual([true, true, true, false, false])
  })

  it("reports the running count", async () => {
    const client = fakeClient()
    expect((await consume(client)).count).toBe(1)
    expect((await consume(client)).count).toBe(2)
  })

  it("scopes counters separately per user", async () => {
    const client = fakeClient()
    const args = { scope: "test", max: 1, windowSeconds: 60, client }
    expect((await rateLimitByUser({ ...args, userID: "a" })).allowed).toBe(true)
    expect((await rateLimitByUser({ ...args, userID: "b" })).allowed).toBe(true)
    expect((await rateLimitByUser({ ...args, userID: "a" })).allowed).toBe(
      false
    )
  })

  it("scopes counters separately per scope", async () => {
    const client = fakeClient()
    const args = { userID: "u", max: 1, windowSeconds: 60, client }
    expect((await rateLimitByUser({ ...args, scope: "x" })).allowed).toBe(true)
    expect((await rateLimitByUser({ ...args, scope: "y" })).allowed).toBe(true)
    expect((await rateLimitByUser({ ...args, scope: "x" })).allowed).toBe(false)
  })

  it("passes the window through as the key's TTL", async () => {
    const client = fakeClient()
    const add = jest.spyOn(client, "add")
    await rateLimitByUser({
      scope: "test",
      userID: "u",
      max: 5,
      windowSeconds: 900,
      client,
    })
    expect(add).toHaveBeenCalledWith(
      expect.any(String),
      1,
      900,
      expect.any(Function)
    )
  })

  // Regression: config's IntWithDefault helper yields NaN (not its default)
  // for an unset env var, which silently disabled the limiter entirely.
  it("allows and logs when max is not a finite number", async () => {
    const client = fakeClient()
    for (const badMax of [NaN, Infinity]) {
      const result = await consume(client, badMax)
      expect(result).toEqual({ allowed: true, count: null })
    }
    expect(client.calls.incr).toBe(0)
  })

  it("treats max of 0 as disabled", async () => {
    const client = fakeClient()
    const result = await consume(client, 0)
    expect(result).toEqual({ allowed: true, count: null })
    expect(client.calls.incr).toBe(0)
  })

  describe("degrades open", () => {
    it("when the store errors", async () => {
      const client = {
        incr: (_k: string, _a: number, cb: any) => cb(new Error("down")),
        add: (_k: string, _v: number, _l: number, cb: any) =>
          cb(new Error("down")),
      }
      expect(await consume(client)).toEqual({ allowed: true, count: null })
    })

    it("when the store hangs past the timeout", async () => {
      const client = { incr: () => undefined, add: () => undefined }
      const result = await rateLimitByUser({
        scope: "test",
        userID: "u",
        max: 1,
        windowSeconds: 60,
        client: client as any,
        timeoutMs: 10,
      })
      expect(result).toEqual({ allowed: true, count: null })
    })

    it("when the client lacks the atomic ops", async () => {
      expect(await consume({})).toEqual({ allowed: true, count: null })
    })

    it("when the client throws synchronously", async () => {
      const client = {
        incr: () => {
          throw new Error("boom")
        },
        add: () => undefined,
      }
      expect(await consume(client as any)).toEqual({
        allowed: true,
        count: null,
      })
    })
  })

  it("counts the call that loses the seed race", async () => {
    const client = fakeClient()
    // Simulate a concurrent request seeding the key between our incr and add.
    const realAdd = client.add
    client.add = (key: string, value: number, lifetime: number, cb: any) => {
      client.store.set(key, 1) // another request got there first
      realAdd(key, value, lifetime, cb)
    }
    const result = await consume(client)
    expect(result.count).toBe(2)
    expect(result.allowed).toBe(true)
  })
})
