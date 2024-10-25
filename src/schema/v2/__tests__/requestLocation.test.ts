import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("requestLocation", () => {
  describe("when ip param is not provided", () => {
    it("returns location based on the IP address from the request", async () => {
      const query = gql`
        {
          requestLocation {
            id
            city
            country
            countryCode
            coordinates {
              lat
              lng
            }
          }
        }
      `

      const requestLocationLoader = jest.fn(async () => locationResponse)

      const context = {
        requestLocationLoader,
        ipAddress: "request-ip",
      }

      const { requestLocation } = await runAuthenticatedQuery(query, context)

      expect(requestLocationLoader).toHaveBeenCalledWith({ ip: "request-ip" })

      expect(requestLocation).toMatchInlineSnapshot(`
        {
          "city": "Frankfurt",
          "coordinates": {
            "lat": 50.11207962036133,
            "lng": 8.683409690856934,
          },
          "country": "Germany",
          "countryCode": "DE",
          "id": "cmVxdWVzdC1pcA==",
        }
      `)
    })
  })

  describe("when `ip` param is provided", () => {
    it("returns location based on the `ip` param", async () => {
      const query = gql`
        {
          requestLocation(ip: "param-ip") {
            id
            city
            country
            countryCode
            coordinates {
              lat
              lng
            }
          }
        }
      `

      const requestLocationLoader = jest.fn(async () => locationResponse)

      const context = {
        requestLocationLoader,
        ipAddress: "request-ip",
      }

      const { requestLocation } = await runAuthenticatedQuery(query, context)

      expect(requestLocationLoader).toHaveBeenCalledWith({ ip: "param-ip" })

      expect(requestLocation).toMatchInlineSnapshot(`
        {
          "city": "Frankfurt",
          "coordinates": {
            "lat": 50.11207962036133,
            "lng": 8.683409690856934,
          },
          "country": "Germany",
          "countryCode": "DE",
          "id": "cGFyYW0taXA=",
        }
      `)
    })
  })
})

const locationResponse = {
  body: {
    header: {
      date: "Tue, 20 Jun 2023 09:11:05 GMT",
      "content-type": "application/json; charset=UTF-8",
      "transfer-encoding": "chunked",
      connection: "close",
      "www-authenticate": 'Key realm="kong"',
      "ratelimit-remaining": "9",
      "ratelimit-limit": "10",
      "x-ratelimit-limit-hour": "10",
      "x-ratelimit-remaining-hour": "9",
      "ratelimit-reset": "2935",
      charset: "utf-8",
      "x-limit": "1",
      "x-execution-time": "7.32",
      "cache-control": "no-cache, private",
      "x-forwarded-proto": "https",
      "x-forwarded-port": "443",
      "access-control-allow-origin": "*",
      "cf-cache-status": "DYNAMIC",
      "report-to":
        '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=B8ar4N5KR9Nh%2FmuNXDnRZkVnZjjtrfIyUnZHudQ%2BDHZB%2FRMPaUBkU9N9hYQkaAdguPILrC3ntvrlfMnArfSpXrihOtXckUTHZnFzncemzKS3VSN0XxPLJX8V33cmxAc5dA%3D%3D"}],"group":"cf-nel","max_age":604800}',
      nel: '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
      server: "cloudflare",
      "cf-ray": "7da2e1e26ac6161f-DUS",
      "alt-svc": 'h3=":443"; ma=86400',
    },
    data: {
      ip: "85.239.36.119",
      hostname: null,
      type: "v4",
      range_type: {
        type: "PUBLIC",
        description: "Public address",
      },
      connection: {
        asn: 52000,
        organization: "MIRholding B.V.",
        isp: "TrafficTransitSolution LLC",
        range: "85.239.36.0/24",
      },
      location: {
        geonames_id: 6463469,
        latitude: 50.11207962036133,
        longitude: 8.683409690856934,
        zip: "60311",
        continent: {
          code: "EU",
          name: "Europe",
          name_translated: "Europe",
        },
        country: {
          alpha2: "DE",
          alpha3: "DEU",
          calling_codes: ["+49"],
          currencies: [
            {
              symbol: "€",
              name: "Euro",
              symbol_native: "€",
              decimal_digits: 2,
              rounding: 0,
              code: "EUR",
              name_plural: "Euros",
            },
          ],
          emoji: "🇩🇪",
          ioc: "GER",
          languages: [
            {
              name: "German",
              name_native: "Deutsch",
            },
          ],
          name: "Germany",
          name_translated: "Germany",
          timezones: ["Europe/Berlin", "Europe/Busingen"],
          is_in_european_union: true,
          fips: "GM",
          geonames_id: 2921044,
          hasc_id: "DE",
          wikidata_id: "Q183",
        },
        city: {
          fips: null,
          alpha2: null,
          geonames_id: 2925533,
          hasc_id: null,
          wikidata_id: "Q1794",
          name: "Frankfurt",
          name_translated: "Frankfurt",
        },
        region: {
          fips: "GM05",
          alpha2: "DE-HE",
          geonames_id: 2905330,
          hasc_id: "DE.HE",
          wikidata_id: "Q1199",
          name: "Hesse",
          name_translated: "Hesse",
        },
      },
      tlds: [".de"],
      timezone: {
        id: "Europe/Berlin",
        current_time: "2023-06-20T11:11:05+02:00",
        code: "CEST",
        is_daylight_saving: true,
        gmt_offset: 7200,
      },
      security: {
        is_anonymous: null,
        is_datacenter: null,
        is_vpn: null,
        is_bot: null,
        is_abuser: null,
        is_known_attacker: null,
        is_proxy: null,
        is_spam: null,
        is_tor: null,
        proxy_type: null,
        is_icloud_relay: null,
        threat_score: null,
      },
      domains: {
        count: null,
        domains: [],
      },
    },
  },
}
