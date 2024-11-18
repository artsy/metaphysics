/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("ShowsConnection", () => {
    describe("when including shows by location", () => {
      describe("when `near` param is provided", () => {
        it("passes near param to loader", async () => {
          const query = gql`
            {
              me {
                showsConnection(
                  first: 2
                  sort: NAME_ASC
                  status: UPCOMING
                  near: { lat: 1, lng: 2, maxDistance: 3 }
                ) {
                  totalCount
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          `

          const meShowsLoader = jest.fn().mockResolvedValue(mockShowsResponse)

          const context = {
            meLoader: jest.fn().mockResolvedValue({}),
            meShowsLoader,
          }

          const {
            me: { showsConnection },
          } = await runAuthenticatedQuery(query, context)

          expect(meShowsLoader).toHaveBeenCalledWith({
            offset: 0,
            size: 2,
            sort: "name",
            status: "upcoming",
            max_distance: 3,
            near: "1,2",
            total_count: true,
          })

          expect(showsConnection).toMatchInlineSnapshot(`
            {
              "edges": [
                {
                  "node": {
                    "name": "Design for a Garden",
                  },
                },
                {
                  "node": {
                    "name": "Spazio Nobile Studiolo – Interlude, Group Exhibition",
                  },
                },
              ],
              "totalCount": 5084,
            }
          `)
        })
      })

      describe.skip("when `ip` param is provided", () => {
        it("loads location and passes near param to loader", async () => {
          const query = gql`
            {
              me {
                showsConnection(
                  first: 2
                  sort: NAME_ASC
                  status: UPCOMING
                  ip: "my-ip"
                ) {
                  totalCount
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          `

          const meShowsLoader = jest.fn().mockResolvedValue(mockShowsResponse)
          const requestLocationLoader = jest
            .fn()
            .mockResolvedValue(mockLocationResponse)

          const context = {
            meLoader: jest.fn().mockResolvedValue({}),
            meShowsLoader,
            requestLocationLoader,
          }

          const {
            me: { showsConnection },
          } = await runAuthenticatedQuery(query, context)

          expect(requestLocationLoader).toHaveBeenCalledWith({ ip: "my-ip" })

          expect(meShowsLoader).toHaveBeenCalledWith({
            offset: 0,
            size: 2,
            sort: "name",
            status: "upcoming",
            max_distance: 75,
            near: "52.53627395629883,13.399658203125",
            total_count: true,
          })

          expect(showsConnection).toMatchInlineSnapshot(`
                      Object {
                        "edges": Array [
                          Object {
                            "node": Object {
                              "name": "Design for a Garden",
                            },
                          },
                          Object {
                            "node": Object {
                              "name": "Spazio Nobile Studiolo – Interlude, Group Exhibition",
                            },
                          },
                        ],
                        "totalCount": 5084,
                      }
                  `)
        })
      })

      describe.skip("when `includeShowsNearIpBasedLocation` is set to true", () => {
        it("loads location and passes near param to loader", async () => {
          const query = gql`
            {
              me {
                showsConnection(
                  first: 2
                  sort: NAME_ASC
                  status: UPCOMING
                  includeShowsNearIpBasedLocation: true
                ) {
                  totalCount
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          `

          const meShowsLoader = jest.fn().mockResolvedValue(mockShowsResponse)
          const requestLocationLoader = jest
            .fn()
            .mockResolvedValue(mockLocationResponse)

          const context = {
            ipAddress: "context-ip",
            meLoader: jest.fn().mockResolvedValue({}),
            meShowsLoader,
            requestLocationLoader,
          }

          const {
            me: { showsConnection },
          } = await runAuthenticatedQuery(query, context)

          expect(requestLocationLoader).toHaveBeenCalledWith({
            ip: "context-ip",
          })

          expect(meShowsLoader).toHaveBeenCalledWith({
            offset: 0,
            size: 2,
            sort: "name",
            status: "upcoming",
            max_distance: 75,
            near: "52.53627395629883,13.399658203125",
            total_count: true,
          })

          expect(showsConnection).toMatchInlineSnapshot(`
                      Object {
                        "edges": Array [
                          Object {
                            "node": Object {
                              "name": "Design for a Garden",
                            },
                          },
                          Object {
                            "node": Object {
                              "name": "Spazio Nobile Studiolo – Interlude, Group Exhibition",
                            },
                          },
                        ],
                        "totalCount": 5084,
                      }
                  `)
        })
      })
    })

    describe("when no location param is passed", () => {
      it("returns shows for you", async () => {
        const query = gql`
          {
            me {
              showsConnection(first: 2, sort: NAME_ASC, status: UPCOMING) {
                totalCount
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        `

        const meShowsLoader = jest.fn().mockResolvedValue(mockShowsResponse)

        const context = {
          meLoader: jest.fn().mockResolvedValue({}),
          meShowsLoader,
        }

        const {
          me: { showsConnection },
        } = await runAuthenticatedQuery(query, context)

        expect(meShowsLoader).toHaveBeenCalledWith({
          offset: 0,
          size: 2,
          sort: "name",
          status: "upcoming",
          total_count: true,
        })

        expect(showsConnection).toMatchInlineSnapshot(`
          {
            "edges": [
              {
                "node": {
                  "name": "Design for a Garden",
                },
              },
              {
                "node": {
                  "name": "Spazio Nobile Studiolo – Interlude, Group Exhibition",
                },
              },
            ],
            "totalCount": 5084,
          }
        `)
      })
    })
  })
})

const mockShowsResponse = {
  headers: {
    date: "Thu, 04 May 2023 12:23:27 GMT",
    "content-type": "application/json",
    "transfer-encoding": "chunked",
    connection: "close",
    "x-frame-options": "SAMEORIGIN",
    "x-robots-tag": "noindex",
    "x-total-count": "5084",
    expires: "1970-01-01 00:00:00 UTC",
    etag: 'W/"2ec38abfd9ada43b9fd81fbfbc4a445b"',
    "cache-control": "max-age=0, private, must-revalidate",
    vary: "Accept-Encoding, Accept-Encoding, Origin",
    "set-cookie": [
      "signed_in=true; path=/; expires=Sat, 04 May 2024 12:23:25 GMT; secure",
      "_gravity_secure_session=rA%2FI9p9Kjzc4IPjyEoKLLn2pAGZHNB597WDZjvWF9c0SmgdDENdTCpo%2BZWXnAkSJcSaIDT6nDZZpyHTkfTokcVQT3005ACHPEj3liIuICgSrq8wnGQTEVDn5IcRl30VQDIET5fYdqtspdh3q%2FGXWsbKsUZ8fsZ7A9hPINDeVSPOjzybZ180dIXjbSH6K7SrBgvmd3jx72iMHONcGF2vKsdo7%2BFZxvF4mbFmV4UDajNE01%2B81IwOBZnV6O8AqQVJrDWNtdioavEGq%2FxjVe%2BFfL2pjFw%3D%3D--nN20OMBEFNnKjqEq--WcVAA5mJggsuzyVhb2bRag%3D%3D; path=/; secure; HttpOnly",
    ],
    "x-request-id": "776ac580-ea76-11ed-bc55-ff5b7407d3f3",
    "x-runtime": "1.554132",
    "strict-transport-security": "max-age=15724800; includeSubDomains",
    "content-security-policy": "frame-ancestors https://*.artsy.net;",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers":
      "Accept,X-Xapp-Token,Content-Type,Accept,Origin,User-Agent,DNT,Cache-Control,X-Mx-ReqToken,Keep-Alive,X-Requested-With,If-Modified-Since,X-Request-Id",
    "access-control-expose-headers": "X-Total-Count",
    "cf-cache-status": "DYNAMIC",
    server: "cloudflare",
    "cf-ray": "7c20b7002b891c79-FRA",
  },
  body: [
    {
      fair: null,
      location: {
        day_schedules: [
          {
            _id: "5bdc0a9761f12b42d17f10bd",
            id: "5bdc0a9761f12b42d17f10bd",
            start_time: 50400,
            end_time: 64800,
            day_of_week: "Tuesday",
          },
          {
            _id: "5bdc0a987ffd4113e107c571",
            id: "5bdc0a987ffd4113e107c571",
            start_time: 50400,
            end_time: 64800,
            day_of_week: "Wednesday",
          },
          {
            _id: "5bdc0a983cc3701f04cf1927",
            id: "5bdc0a983cc3701f04cf1927",
            start_time: 50400,
            end_time: 64800,
            day_of_week: "Thursday",
          },
          {
            _id: "5bdc0a985ce6832314f6806e",
            id: "5bdc0a985ce6832314f6806e",
            start_time: 50400,
            end_time: 64800,
            day_of_week: "Friday",
          },
          {
            _id: "5bdc0a98435594002cf0ce65",
            id: "5bdc0a98435594002cf0ce65",
            start_time: 39600,
            end_time: 57600,
            day_of_week: "Saturday",
          },
        ],
        id: "51d1a1ce8b3b819a1500010c",
        name: "von Bartha Garage",
        address: "Kannenfeldplatz 6",
        address_2: "",
        city: "Basel",
        country: "CH",
        state: "",
        postal_code: "CH-4056",
        timezone: "Europe/Zurich",
        address_type: "Business",
        day_schedule_text: "",
        phone: "+41 61 322 10 00",
        coordinates: {
          lng: 7.573886099999999,
          lat: 47.5657684,
        },
        eu_shipping_location: false,
        position: 1,
        email: "",
        fax: "",
        publicly_viewable: true,
        skip_geocoding: false,
      },
      partner: {
        partner_categories: [
          {
            _id: "55f0d1ec776f721939000009",
            id: "contemporary",
            category_type: "Gallery",
            name: "Contemporary",
            internal: false,
          },
          {
            _id: "55fb1a9a726169694a000001",
            id: "established",
            category_type: "Gallery",
            name: "Established",
            internal: false,
          },
          {
            _id: "55fb1a95726169694a000000",
            id: "mid-career",
            category_type: "Gallery",
            name: "Mid-Career",
            internal: false,
          },
          {
            _id: "5a048102ebad647c7becc049",
            id: "top-established",
            category_type: "Gallery",
            name: "Top Established",
            internal: true,
          },
        ],
        _id: "51905c683db161ba23000021",
        id: "von-bartha",
        default_profile_id: "von-bartha",
        default_profile_public: true,
        sortable_id: "von-bartha",
        type: "Gallery",
        name: "von Bartha",
        short_name: "",
        pre_qualify: false,
        website: "http://www.vonbartha.com",
        has_full_profile: true,
        has_fair_partnership: false,
        profile_layout: "gallery_eight",
        display_works_section: true,
        profile_banner_display: null,
        profile_artists_layout: null,
        display_artists_section: true,
      },
      events: [],
      _id: "644d07a77a0004000c6e1151",
      id: "von-bartha-design-for-a-garden",
      name: "Design for a Garden",
      in_upcoming_fair: false,
      original_width: 2400,
      original_height: 1600,
      image_url:
        "https://d32dm0rphc51dk.cloudfront.net/Wi9MgUFmUGbFDJZAmBvHUg/:version.jpg",
      image_versions: [
        "square",
        "tall",
        "general",
        "featured",
        "larger",
        "large",
        "normalized",
        "medium",
      ],
      image_urls: {
        square:
          "https://d32dm0rphc51dk.cloudfront.net/Wi9MgUFmUGbFDJZAmBvHUg/square.jpg",
        tall:
          "https://d32dm0rphc51dk.cloudfront.net/Wi9MgUFmUGbFDJZAmBvHUg/tall.jpg",
        general:
          "https://d32dm0rphc51dk.cloudfront.net/Wi9MgUFmUGbFDJZAmBvHUg/general.jpg",
        featured:
          "https://d32dm0rphc51dk.cloudfront.net/Wi9MgUFmUGbFDJZAmBvHUg/featured.jpg",
        larger:
          "https://d32dm0rphc51dk.cloudfront.net/Wi9MgUFmUGbFDJZAmBvHUg/larger.jpg",
        large:
          "https://d32dm0rphc51dk.cloudfront.net/Wi9MgUFmUGbFDJZAmBvHUg/large.jpg",
        normalized:
          "https://d32dm0rphc51dk.cloudfront.net/Wi9MgUFmUGbFDJZAmBvHUg/normalized.jpg",
        medium:
          "https://d32dm0rphc51dk.cloudfront.net/Wi9MgUFmUGbFDJZAmBvHUg/medium.jpg",
      },
      gemini_token_updated_at: "2023-04-29T12:04:26+00:00",
      description:
        '"Conceptually and visually, the exhibition is a garden of unexpected viewpoints, juxtapositions, and parings, where relationships between artists’ work and each other remain continually in play." ',
      created_at: "2023-04-29T12:03:51+00:00",
      featured: false,
      start_at: "2023-04-22T12:00:00+00:00",
      batch_publish: true,
      end_at: "2023-07-15T12:00:00+00:00",
      artworks_count: 0,
      eligible_artworks_count: 0,
      displayable: true,
      images_count: 5,
      status: "running",
      display_on_partner_profile: true,
      is_reference: false,
      is_local_discovery: false,
      galaxy_partner_id: null,
      partner_city: null,
      group: false,
      discovery_blocked_reason: null,
      discovery_blocked_at: null,
      duplicate_of_id: null,
    },
    {
      fair: null,
      location: {
        day_schedules: [
          {
            _id: "640f486f78eb11000bf3daa8",
            id: "640f486f78eb11000bf3daa8",
            start_time: 39600,
            end_time: 64800,
            day_of_week: "Tuesday",
          },
          {
            _id: "640f486f1cb9c6000c3e962e",
            id: "640f486f1cb9c6000c3e962e",
            start_time: 39600,
            end_time: 64800,
            day_of_week: "Wednesday",
          },
          {
            _id: "640f486f697af1000e3260d3",
            id: "640f486f697af1000e3260d3",
            start_time: 39600,
            end_time: 64800,
            day_of_week: "Thursday",
          },
          {
            _id: "640f486f61e642000d19c32b",
            id: "640f486f61e642000d19c32b",
            start_time: 39600,
            end_time: 64800,
            day_of_week: "Friday",
          },
          {
            _id: "640f486fc9fed9000e3a6243",
            id: "640f486fc9fed9000e3a6243",
            start_time: 39600,
            end_time: 64800,
            day_of_week: "Saturday",
          },
        ],
        id: "59a276318b3b8172220c9585",
        name: "f98bf4aa02ef2ad97dae89981f5e09a1",
        address: "Rue Franz Merjay 142 & 169",
        address_2: "",
        city: "Brussels",
        country: "BE",
        state: "",
        postal_code: "1050",
        timezone: "Europe/Brussels",
        address_type: "Business",
        day_schedule_text: "",
        phone: "+32475531988",
        coordinates: {
          lng: 4.3520559,
          lat: 50.8167222,
        },
        eu_shipping_location: true,
        position: 1,
        email: "lc@spazionobile.com",
        fax: "",
        publicly_viewable: true,
        skip_geocoding: false,
      },
      partner: {
        partner_categories: [
          {
            _id: "5790e1bb7622dd65da0015e2",
            id: "ceramics",
            category_type: "Gallery",
            name: "Ceramics",
            internal: false,
          },
          {
            _id: "55f0d1ec776f721939000009",
            id: "contemporary",
            category_type: "Gallery",
            name: "Contemporary",
            internal: false,
          },
          {
            _id: "55f0d1ec776f721939000005",
            id: "contemporary-design",
            category_type: "Gallery",
            name: "Contemporary Design",
            internal: false,
          },
          {
            _id: "55f0d1ec776f721939000002",
            id: "drawings",
            category_type: "Gallery",
            name: "Drawings",
            internal: false,
          },
          {
            _id: "55fb1ab3726169694a000003",
            id: "east-asian-art",
            category_type: "Gallery",
            name: "East Asian Art",
            internal: false,
          },
          {
            _id: "55f0d1ec776f721939000008",
            id: "emerging-art",
            category_type: "Gallery",
            name: "Emerging Art",
            internal: false,
          },
          {
            _id: "5790e1aa2a893a65dc001e9b",
            id: "emerging-design",
            category_type: "Gallery",
            name: "Emerging Design",
            internal: false,
          },
          {
            _id: "55f0d1ec776f721939000007",
            id: "photography",
            category_type: "Gallery",
            name: "Photography",
            internal: false,
          },
        ],
        _id: "59a2753a8b3b8172220c957a",
        id: "spazio-nobile",
        default_profile_id: "spazio-nobile",
        default_profile_public: true,
        sortable_id: "spazio-nobile",
        type: "Gallery",
        name: "Spazio Nobile",
        short_name: "",
        pre_qualify: false,
        website: "http://www.spazionobile.com",
        has_full_profile: true,
        has_fair_partnership: false,
        profile_layout: "gallery_four",
        display_works_section: true,
        profile_banner_display: "Shows",
        profile_artists_layout: "Grid",
        display_artists_section: true,
      },
      events: [],
      _id: "644d048a35fa2b000c336d6d",
      id: "spazio-nobile-spazio-nobile-studiolo-interlude-group-exhibition",
      name: "Spazio Nobile Studiolo – Interlude, Group Exhibition",
      in_upcoming_fair: false,
      original_width: 2300,
      original_height: 3543,
      image_url:
        "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/:version.jpg",
      image_versions: [
        "square",
        "large_rectangle",
        "medium_rectangle",
        "larger",
        "tall",
        "large",
        "small",
        "medium",
        "normalized",
      ],
      image_urls: {
        square:
          "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/square.jpg",
        large_rectangle:
          "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/large_rectangle.jpg",
        medium_rectangle:
          "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/medium_rectangle.jpg",
        larger:
          "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/larger.jpg",
        tall:
          "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/tall.jpg",
        large:
          "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/large.jpg",
        small:
          "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/small.jpg",
        medium:
          "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/medium.jpg",
        normalized:
          "https://d32dm0rphc51dk.cloudfront.net/b_bJ93qc5Fc5Cw4qlZ6hcQ/normalized.jpg",
      },
      gemini_token_updated_at: "2022-10-29T13:15:38+00:00",
      description: "",
      created_at: "2023-04-29T11:50:34+00:00",
      featured: false,
      start_at: "2023-04-28T12:00:00+00:00",
      batch_publish: true,
      end_at: "2023-09-03T12:00:00+00:00",
      artworks_count: 129,
      eligible_artworks_count: 128,
      displayable: true,
      images_count: 0,
      status: "running",
      display_on_partner_profile: true,
      is_reference: false,
      is_local_discovery: false,
      galaxy_partner_id: null,
      partner_city: null,
      group: true,
      discovery_blocked_reason: null,
      discovery_blocked_at: null,
      duplicate_of_id: null,
    },
  ],
}

const mockLocationResponse = {
  headers: {},
  body: {
    data: {
      location: {
        geonames_id: 12324215,
        latitude: 52.53627395629883,
        longitude: 13.399658203125,
        zip: "10115",
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
          geonames_id: null,
          hasc_id: null,
          wikidata_id: "Q64",
          name: "Berlin",
          name_translated: "Berlin",
        },
        region: {
          fips: "GM16",
          alpha2: "DE-BE",
          geonames_id: 2950157,
          hasc_id: "DE.BE",
          wikidata_id: "Q64",
          name: "Berlin",
          name_translated: "Berlin",
        },
      },
    },
  },
}
