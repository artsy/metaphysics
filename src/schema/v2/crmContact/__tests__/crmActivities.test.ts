import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("crmActivitiesConnection", () => {
  const query = `{
    crmActivitiesConnection(crmContactID: "contact-1", kind: EMAIL, sort: OCCURRED_AT_ASC, first: 5) {
      totalCount
      edges {
        node {
          internalID
          kind
          emailMessage {
            direction
            contentVisible
            subject
            snippet
            participants { role address crmContactID }
          }
        }
      }
    }
  }`

  it("passes params to the loader and returns the connection", async () => {
    const crmActivitiesLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "activity-1",
          crm_contact_id: "contact-1",
          partner_id: "partner-1",
          kind: "email",
          email_message: {
            id: "message-1",
            direction: "inbound",
            content_visible: true,
            subject: "The show",
            snippet: "Hello there",
            participants: [
              {
                id: "p1",
                role: "from",
                address: "ada@example.com",
                crm_contact_id: "contact-1",
              },
            ],
          },
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(query, { crmActivitiesLoader })

    expect(crmActivitiesLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      kind: "email",
      sort: "occurred_at",
      total_count: true,
      size: 5,
      offset: 0,
    })
    expect(result.crmActivitiesConnection.totalCount).toBe(1)
    expect(result.crmActivitiesConnection.edges[0].node).toEqual({
      internalID: "activity-1",
      kind: "EMAIL",
      emailMessage: {
        direction: "INBOUND",
        contentVisible: true,
        subject: "The show",
        snippet: "Hello there",
        participants: [
          {
            role: "FROM",
            address: "ada@example.com",
            crmContactID: "contact-1",
          },
        ],
      },
    })
  })

  it("omits kind and sort from the loader params when not given or null", async () => {
    const crmActivitiesLoader = jest.fn().mockResolvedValue({
      body: [],
      headers: { "x-total-count": "0" },
    })

    await runAuthenticatedQuery(
      `{ crmActivitiesConnection(crmContactID: "contact-1", first: 5) { totalCount } }`,
      { crmActivitiesLoader }
    )

    // toHaveBeenCalledWith ignores undefined keys, so check the keys directly
    expect(Object.keys(crmActivitiesLoader.mock.calls[0][0]).sort()).toEqual([
      "crm_contact_id",
      "offset",
      "size",
      "total_count",
    ])

    // Relay clients send unset variables as an explicit null
    await runAuthenticatedQuery(
      `{ crmActivitiesConnection(crmContactID: "contact-1", first: 5, kind: null) { totalCount } }`,
      { crmActivitiesLoader }
    )

    expect(Object.keys(crmActivitiesLoader.mock.calls[1][0]).sort()).toEqual([
      "crm_contact_id",
      "offset",
      "size",
      "total_count",
    ])
  })

  it("returns null content when the viewer may not read the message", async () => {
    const crmActivitiesLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "activity-1",
          crm_contact_id: "contact-1",
          partner_id: "partner-1",
          kind: "email",
          email_message: {
            id: "message-1",
            direction: "inbound",
            content_visible: false,
            subject: null,
            snippet: null,
            participants: [],
          },
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(query, { crmActivitiesLoader })

    expect(
      result.crmActivitiesConnection.edges[0].node.emailMessage
    ).toMatchObject({ contentVisible: false, subject: null, snippet: null })
  })

  it("returns a null emailMessage for notes", async () => {
    const crmActivitiesLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "activity-2",
          crm_contact_id: "contact-1",
          partner_id: "partner-1",
          kind: "note",
          email_message: null,
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(query, { crmActivitiesLoader })

    expect(result.crmActivitiesConnection.edges[0].node).toMatchObject({
      kind: "NOTE",
      emailMessage: null,
    })
  })

  describe("linked artworks", () => {
    const artworksQuery = `{
      crmActivitiesConnection(crmContactID: "contact-1", first: 5) {
        edges {
          node {
            internalID
            artworks { internalID title }
          }
        }
      }
    }`

    const activity = (id: string, links: any[]) => ({
      id,
      crm_contact_id: "contact-1",
      partner_id: "partner-1",
      kind: "interest",
      links,
    })

    it("loads the artworks of the whole page with one partner call", async () => {
      const crmActivitiesLoader = jest.fn().mockResolvedValue({
        body: [
          activity("activity-1", [
            { target_type: "artwork", target_id: "artwork-1" },
            { target_type: "show", target_id: "show-1" },
          ]),
          activity("activity-2", [
            { target_type: "artwork", target_id: "artwork-2" },
            { target_type: "artwork", target_id: "artwork-1" },
          ]),
          activity("activity-3", []),
        ],
        headers: { "x-total-count": "3" },
      })
      const partnerArtworksAllLoader = jest.fn().mockResolvedValue({
        body: [
          { _id: "artwork-1", id: "one", title: "One" },
          { _id: "artwork-2", id: "two", title: "Two" },
        ],
        headers: {},
      })

      const result = await runAuthenticatedQuery(artworksQuery, {
        crmActivitiesLoader,
        partnerArtworksAllLoader,
      })

      expect(partnerArtworksAllLoader).toHaveBeenCalledTimes(1)
      expect(partnerArtworksAllLoader).toHaveBeenCalledWith("partner-1", {
        artwork_id: ["artwork-1", "artwork-2"],
        include_non_artsy_listed: true,
        size: 2,
      })
      expect(
        result.crmActivitiesConnection.edges.map(({ node }) => node.artworks)
      ).toEqual([
        [{ internalID: "artwork-1", title: "One" }],
        [
          { internalID: "artwork-2", title: "Two" },
          { internalID: "artwork-1", title: "One" },
        ],
        [],
      ])
    })

    it("loads the artists of the whole page with one call", async () => {
      const crmActivitiesLoader = jest.fn().mockResolvedValue({
        body: [
          activity("activity-1", [
            { target_type: "artist", target_id: "artist-1" },
          ]),
          activity("activity-2", [
            { target_type: "artist", target_id: "artist-2" },
            { target_type: "artist", target_id: "artist-1" },
          ]),
        ],
        headers: { "x-total-count": "2" },
      })
      const artistsLoader = jest.fn().mockResolvedValue({
        body: [
          { _id: "artist-1", id: "one", name: "One" },
          { _id: "artist-2", id: "two", name: "Two" },
        ],
        headers: {},
      })

      const result = await runAuthenticatedQuery(
        `{
          crmActivitiesConnection(crmContactID: "contact-1", first: 5) {
            edges { node { artists { internalID name } } }
          }
        }`,
        { crmActivitiesLoader, artistsLoader }
      )

      expect(artistsLoader).toHaveBeenCalledTimes(1)
      expect(artistsLoader).toHaveBeenCalledWith({
        ids: ["artist-1", "artist-2"],
        size: 2,
      })
      expect(
        result.crmActivitiesConnection.edges.map(({ node }) => node.artists)
      ).toEqual([
        [{ internalID: "artist-1", name: "One" }],
        [
          { internalID: "artist-2", name: "Two" },
          { internalID: "artist-1", name: "One" },
        ],
      ])
    })

    it("leaves out deleted artworks and does not call Gravity without artwork links", async () => {
      const crmActivitiesLoader = jest.fn().mockResolvedValue({
        body: [
          activity("activity-1", [
            { target_type: "artwork", target_id: "gone" },
          ]),
          activity("activity-2", [
            { target_type: "show", target_id: "show-1" },
          ]),
        ],
        headers: { "x-total-count": "2" },
      })
      const partnerArtworksAllLoader = jest
        .fn()
        .mockResolvedValue({ body: [], headers: {} })

      const result = await runAuthenticatedQuery(artworksQuery, {
        crmActivitiesLoader,
        partnerArtworksAllLoader,
      })

      expect(partnerArtworksAllLoader).toHaveBeenCalledTimes(1)
      expect(partnerArtworksAllLoader).toHaveBeenCalledWith(
        "partner-1",
        expect.objectContaining({ artwork_id: ["gone"] })
      )
      expect(
        result.crmActivitiesConnection.edges.map(({ node }) => node.artworks)
      ).toEqual([[], []])
    })

    it("returns no artworks when they cannot be loaded", async () => {
      const crmActivitiesLoader = jest.fn().mockResolvedValue({
        body: [
          activity("activity-1", [
            { target_type: "artwork", target_id: "artwork-1" },
          ]),
        ],
        headers: { "x-total-count": "1" },
      })
      const partnerArtworksAllLoader = jest
        .fn()
        .mockRejectedValue(new Error("Gravity down"))

      const result = await runAuthenticatedQuery(artworksQuery, {
        crmActivitiesLoader,
        partnerArtworksAllLoader,
      })

      expect(result.crmActivitiesConnection.edges[0].node.artworks).toEqual([])
    })
  })
})
