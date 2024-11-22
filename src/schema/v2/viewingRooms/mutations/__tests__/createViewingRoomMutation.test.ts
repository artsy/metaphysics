import config from "config"
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createViewingRoomMutation", () => {
  const mockCreateViewingRoomLoader = jest.fn()

  beforeAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = true
  })

  afterAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = false
  })

  describe("success", () => {
    const context = {
      createViewingRoomLoader: mockCreateViewingRoomLoader,
    }

    const viewingRoomData = {
      id: "viewing-room-id",
    }

    beforeEach(() => {
      mockCreateViewingRoomLoader.mockResolvedValue(
        Promise.resolve(viewingRoomData)
      )
    })

    afterEach(() => {
      mockCreateViewingRoomLoader.mockReset()
    })

    describe("when passing top-level attributes", () => {
      const mutation = gql`
        mutation {
          createViewingRoom(
            input: {
              body: "test body"
              endAt: "2092-05-23T00:00:00.000Z"
              image: { internalID: "image-id" }
              introStatement: "intro statement"
              partnerID: "partner-id"
              pullQuote: "pull quote"
              startAt: "1992-05-23T00:00:00.000Z"
              timeZone: "Etc/UTC"
              title: "test title"
            }
          ) {
            viewingRoomOrErrors {
              __typename

              ... on ViewingRoom {
                __typename

                internalID
              }

              ... on Errors {
                errors {
                  message
                }
              }
            }
          }
        }
      `

      it("correctly calls the createViewingRoomLoader", async () => {
        const result = await runAuthenticatedQuery(mutation, context)

        expect(mockCreateViewingRoomLoader).toHaveBeenCalledWith({
          body: "test body",
          end_at: "2092-05-23T00:00:00.000Z",
          image: { internalID: "image-id" },
          intro_statement: "intro statement",
          partner_id: "partner-id",
          pull_quote: "pull quote",
          start_at: "1992-05-23T00:00:00.000Z",
          time_zone: "Etc/UTC",
          title: "test title",
        })

        expect(result).toMatchInlineSnapshot(`
          {
            "createViewingRoom": {
              "viewingRoomOrErrors": {
                "__typename": "ViewingRoom",
                "internalID": "viewing-room-id",
              },
            },
          }
        `)
      })
    })

    describe("when passing nested attributes", () => {
      const mutation = gql`
        mutation {
          createViewingRoom(
            input: {
              image: { internalID: "image-id" }
              partnerID: "partner-id"
              attributes: {
                body: "test body"
                endAt: "2092-05-23T00:00:00.000Z"
                introStatement: "intro statement"
                pullQuote: "pull quote"
                startAt: "1992-05-23T00:00:00.000Z"
                timeZone: "Etc/UTC"
                title: "test title"
              }
            }
          ) {
            viewingRoomOrErrors {
              __typename

              ... on ViewingRoom {
                __typename

                internalID
              }

              ... on Errors {
                errors {
                  message
                }
              }
            }
          }
        }
      `

      it("correctly calls the createViewingRoomLoader", async () => {
        const result = await runAuthenticatedQuery(mutation, context)

        expect(mockCreateViewingRoomLoader).toHaveBeenCalledWith({
          body: "test body",
          end_at: "2092-05-23T00:00:00.000Z",
          image: { internalID: "image-id" },
          intro_statement: "intro statement",
          partner_id: "partner-id",
          pull_quote: "pull quote",
          start_at: "1992-05-23T00:00:00.000Z",
          time_zone: "Etc/UTC",
          title: "test title",
        })

        expect(result).toMatchInlineSnapshot(`
          {
            "createViewingRoom": {
              "viewingRoomOrErrors": {
                "__typename": "ViewingRoom",
                "internalID": "viewing-room-id",
              },
            },
          }
        `)
      })
    })

    describe("when some attributes are ommited", () => {
      const mutation = gql`
        mutation {
          createViewingRoom(
            input: {
              image: { internalID: "image-id" }
              partnerID: "partner-id"
              attributes: {
                body: "test body"
                endAt: "2092-05-23T00:00:00.000Z"
                startAt: "1992-05-23T00:00:00.000Z"
                timeZone: "Etc/UTC"
                title: "test title"
              }
            }
          ) {
            viewingRoomOrErrors {
              __typename

              ... on ViewingRoom {
                __typename

                internalID
              }

              ... on Errors {
                errors {
                  message
                }
              }
            }
          }
        }
      `

      it("correctly calls the createViewingRoomLoader (doesn't send undefined attributes)", async () => {
        const result = await runAuthenticatedQuery(mutation, context)

        expect(mockCreateViewingRoomLoader).toHaveBeenCalledWith({
          body: "test body",
          end_at: "2092-05-23T00:00:00.000Z",
          image: { internalID: "image-id" },
          partner_id: "partner-id",
          start_at: "1992-05-23T00:00:00.000Z",
          time_zone: "Etc/UTC",
          title: "test title",
        })

        expect(result).toMatchInlineSnapshot(`
          {
            "createViewingRoom": {
              "viewingRoomOrErrors": {
                "__typename": "ViewingRoom",
                "internalID": "viewing-room-id",
              },
            },
          }
        `)
      })
    })
  })

  describe("when gravity returns an error", () => {
    const context = {
      createViewingRoomLoader: mockCreateViewingRoomLoader,
    }

    beforeEach(() => {
      mockCreateViewingRoomLoader.mockRejectedValue({
        body: {
          message: "An error occurred",
        },
      })
    })

    afterEach(() => {
      mockCreateViewingRoomLoader.mockReset()
    })

    const mutation = gql`
      mutation {
        createViewingRoom(
          input: {
            image: { internalID: "image-id" }
            partnerID: "partner-id"
            attributes: {
              body: "test body"
              endAt: "2092-05-23T00:00:00.000Z"
              introStatement: "intro statement"
              pullQuote: "pull quote"
              startAt: "1992-05-23T00:00:00.000Z"
              timeZone: "Etc/UTC"
              title: "test title"
            }
          }
        ) {
          viewingRoomOrErrors {
            __typename

            ... on ViewingRoom {
              __typename

              internalID
            }

            ... on Errors {
              errors {
                message
              }
            }
          }
        }
      }
    `

    it("returns an error", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "createViewingRoom": {
            "viewingRoomOrErrors": {
              "__typename": "Errors",
              "errors": [
                {
                  "message": "An error occurred",
                },
              ],
            },
          },
        }
      `)
    })
  })
})
