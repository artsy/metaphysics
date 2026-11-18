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

  describe("linked artworks and artists", () => {
    const query = (fields: string) => `{
      crmActivitiesConnection(crmContactID: "contact-1", first: 5) {
        edges { node { internalID ${fields} } }
      }
    }`

    const activity = (id: string, links: any[]) => ({
      id,
      crm_contact_id: "contact-1",
      partner_id: "partner-1",
      kind: "interest",
      links,
    })

    const artworkLink = (id: string) => ({
      target_type: "artwork",
      target_id: id,
    })
    const artistLink = (id: string) => ({
      target_type: "artist",
      target_id: id,
    })

    const timeline = (body: any[]) =>
      jest.fn().mockResolvedValue({
        body,
        headers: { "x-total-count": String(body.length) },
      })

    const artworks = (body: any[]) =>
      jest.fn().mockResolvedValue({ body, headers: {} })

    const partnerArtists = (artists: any[]) =>
      jest.fn().mockResolvedValue({
        body: artists.map((artist) => ({ artist })),
        headers: {},
      })

    const nodes = (result: any) =>
      result.crmActivitiesConnection.edges.map(({ node }) => node)

    it("loads the artworks of the whole page with one partner call", async () => {
      const partnerArtworksAllLoader = artworks([
        { _id: "artwork-1", id: "one", title: "One" },
        { _id: "artwork-2", id: "two", title: "Two" },
      ])

      const result = await runAuthenticatedQuery(
        query("artworks { internalID title }"),
        {
          crmActivitiesLoader: timeline([
            activity("activity-1", [
              artworkLink("artwork-1"),
              { target_type: "show", target_id: "show-1" },
            ]),
            activity("activity-2", [
              artworkLink("artwork-2"),
              artworkLink("artwork-1"),
            ]),
            activity("activity-3", []),
          ]),
          partnerArtworksAllLoader,
        }
      )

      expect(partnerArtworksAllLoader).toHaveBeenCalledTimes(1)
      expect(partnerArtworksAllLoader).toHaveBeenCalledWith("partner-1", {
        artwork_id: ["artwork-1", "artwork-2"],
        include_non_artsy_listed: true,
        size: 2,
      })
      expect(nodes(result).map((node) => node.artworks)).toEqual([
        [{ internalID: "artwork-1", title: "One" }],
        [
          { internalID: "artwork-2", title: "Two" },
          { internalID: "artwork-1", title: "One" },
        ],
        [],
      ])
    })

    it("loads the artists of the whole page with one partner call", async () => {
      const partnerArtistsForPartnerLoader = partnerArtists([
        { _id: "artist-1", id: "one", name: "One" },
        { _id: "artist-2", id: "two", name: "Two" },
      ])

      const result = await runAuthenticatedQuery(
        query("artists { internalID name }"),
        {
          crmActivitiesLoader: timeline([
            activity("activity-1", [artistLink("artist-1")]),
            activity("activity-2", [
              artistLink("artist-2"),
              artistLink("artist-1"),
            ]),
          ]),
          partnerArtistsForPartnerLoader,
        }
      )

      expect(partnerArtistsForPartnerLoader).toHaveBeenCalledTimes(1)
      expect(partnerArtistsForPartnerLoader).toHaveBeenCalledWith("partner-1", {
        artist_ids: ["artist-1", "artist-2"],
        size: 2,
      })
      expect(nodes(result).map((node) => node.artists)).toEqual([
        [{ internalID: "artist-1", name: "One" }],
        [
          { internalID: "artist-2", name: "Two" },
          { internalID: "artist-1", name: "One" },
        ],
      ])
    })

    it("loads artworks and artists at the same time", async () => {
      // The artworks call only resolves once the artists call has started, so
      // loading them one after the other would never finish
      let artistsStarted: () => void
      const artistsCalled = new Promise<void>((resolve) => {
        artistsStarted = resolve
      })
      const partnerArtworksAllLoader = jest.fn().mockImplementation(() => {
        return artistsCalled.then(() => ({ body: [], headers: {} }))
      })
      const partnerArtistsForPartnerLoader = jest
        .fn()
        .mockImplementation(() => {
          artistsStarted()
          return Promise.resolve({ body: [], headers: {} })
        })

      await runAuthenticatedQuery(
        query("artworks { internalID } artists { internalID }"),
        {
          crmActivitiesLoader: timeline([
            activity("activity-1", [artworkLink("a"), artistLink("r")]),
          ]),
          partnerArtworksAllLoader,
          partnerArtistsForPartnerLoader,
        }
      )

      expect(partnerArtworksAllLoader).toHaveBeenCalledTimes(1)
      expect(partnerArtistsForPartnerLoader).toHaveBeenCalledTimes(1)
    })

    it("only loads what the query selects", async () => {
      const partnerArtworksAllLoader = artworks([])
      const partnerArtistsForPartnerLoader = partnerArtists([])
      const crmActivitiesLoader = timeline([
        activity("activity-1", [artworkLink("a"), artistLink("r")]),
      ])

      await runAuthenticatedQuery(query("artworks { internalID }"), {
        crmActivitiesLoader,
        partnerArtworksAllLoader,
        partnerArtistsForPartnerLoader,
      })

      expect(partnerArtworksAllLoader).toHaveBeenCalledTimes(1)
      expect(partnerArtistsForPartnerLoader).not.toHaveBeenCalled()

      jest.clearAllMocks()
      crmActivitiesLoader.mockResolvedValue({
        body: [activity("activity-1", [artworkLink("a"), artistLink("r")])],
        headers: { "x-total-count": "1" },
      })

      await runAuthenticatedQuery(query("artists { internalID }"), {
        crmActivitiesLoader,
        partnerArtworksAllLoader,
        partnerArtistsForPartnerLoader,
      })

      expect(partnerArtistsForPartnerLoader).toHaveBeenCalledTimes(1)
      expect(partnerArtworksAllLoader).not.toHaveBeenCalled()

      jest.clearAllMocks()

      await runAuthenticatedQuery(query("kind"), {
        crmActivitiesLoader,
        partnerArtworksAllLoader,
        partnerArtistsForPartnerLoader,
      })

      expect(partnerArtworksAllLoader).not.toHaveBeenCalled()
      expect(partnerArtistsForPartnerLoader).not.toHaveBeenCalled()
    })

    it("does not call Gravity for a page without links", async () => {
      const partnerArtworksAllLoader = artworks([])
      const partnerArtistsForPartnerLoader = partnerArtists([])

      const result = await runAuthenticatedQuery(
        query("artworks { internalID } artists { internalID }"),
        {
          crmActivitiesLoader: timeline([
            activity("activity-1", []),
            activity("activity-2", [{ target_type: "show", target_id: "s" }]),
          ]),
          partnerArtworksAllLoader,
          partnerArtistsForPartnerLoader,
        }
      )

      expect(partnerArtworksAllLoader).not.toHaveBeenCalled()
      expect(partnerArtistsForPartnerLoader).not.toHaveBeenCalled()
      expect(nodes(result)).toEqual([
        { internalID: "activity-1", artworks: [], artists: [] },
        { internalID: "activity-2", artworks: [], artists: [] },
      ])
    })

    it("leaves out deleted artworks and artists", async () => {
      const result = await runAuthenticatedQuery(
        query("artworks { internalID } artists { internalID }"),
        {
          crmActivitiesLoader: timeline([
            activity("activity-1", [artworkLink("gone"), artistLink("gone")]),
          ]),
          partnerArtworksAllLoader: artworks([]),
          partnerArtistsForPartnerLoader: partnerArtists([]),
        }
      )

      expect(nodes(result)).toEqual([
        { internalID: "activity-1", artworks: [], artists: [] },
      ])
    })

    it("returns no artworks when they cannot be loaded", async () => {
      const result = await runAuthenticatedQuery(
        query("artworks { internalID }"),
        {
          crmActivitiesLoader: timeline([
            activity("activity-1", [artworkLink("artwork-1")]),
          ]),
          partnerArtworksAllLoader: jest
            .fn()
            .mockRejectedValue(new Error("Gravity down")),
        }
      )

      expect(nodes(result)[0].artworks).toEqual([])
    })

    it("returns no artists when they cannot be loaded", async () => {
      const result = await runAuthenticatedQuery(
        query("artists { internalID }"),
        {
          crmActivitiesLoader: timeline([
            activity("activity-1", [artistLink("artist-1")]),
          ]),
          partnerArtistsForPartnerLoader: jest
            .fn()
            .mockRejectedValue(new Error("Gravity down")),
        }
      )

      expect(nodes(result)[0].artists).toEqual([])
    })
  })
})
