import config from "config"
import { requestCloudflareGeo } from "lib/cloudflareGeo"

const req = (headers: Record<string, any>) => ({ headers })

describe("requestCloudflareGeo", () => {
  beforeEach(() => {
    config.ENABLE_CLOUDFLARE_GEO = true
  })

  it("returns null when disabled", () => {
    config.ENABLE_CLOUDFLARE_GEO = false
    expect(requestCloudflareGeo(req({ "cf-ipcountry": "US" }))).toBeNull()
  })

  it("returns null when there is no cf-ipcountry header", () => {
    expect(requestCloudflareGeo(req({}))).toBeNull()
  })

  it("returns null for Cloudflare's unknown-country sentinels", () => {
    expect(requestCloudflareGeo(req({ "cf-ipcountry": "XX" }))).toBeNull()
    expect(requestCloudflareGeo(req({ "cf-ipcountry": "T1" }))).toBeNull()
  })

  it("returns country only when lat/lng headers are absent", () => {
    expect(requestCloudflareGeo(req({ "cf-ipcountry": "US" }))).toEqual({
      countryCode: "US",
      city: undefined,
      lat: undefined,
      lng: undefined,
    })
  })

  it("returns full geo when visitor location headers are present", () => {
    const geo = requestCloudflareGeo(
      req({
        "cf-ipcountry": "US",
        "cf-ipcity": "New York",
        "cf-iplatitude": "40.7128",
        "cf-iplongitude": "-74.0060",
      })
    )

    expect(geo).toEqual({
      countryCode: "US",
      city: "New York",
      lat: 40.7128,
      lng: -74.006,
    })
  })

  it("ignores non-numeric lat/lng", () => {
    const geo = requestCloudflareGeo(
      req({
        "cf-ipcountry": "US",
        "cf-iplatitude": "",
        "cf-iplongitude": "not-a-number",
      })
    )

    expect(geo).toEqual({
      countryCode: "US",
      city: undefined,
      lat: undefined,
      lng: undefined,
    })
  })
})
