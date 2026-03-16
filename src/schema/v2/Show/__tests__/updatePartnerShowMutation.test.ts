import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerShow(
        input: { partnerId: "foo", showId: "bar", featured: true }
      ) {
        showOrError {
          __typename
          ... on UpdatePartnerShowSuccess {
            show {
              internalID
            }
          }
          ... on UpdatePartnerShowFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates the partner show featured field", async () => {
    const context = {
      updatePartnerShowLoader: () =>
        Promise.resolve({
          _id: "foo",
        }),
    }

    const updatedPartner = await runAuthenticatedQuery(mutation, context)

    expect(updatedPartner).toEqual({
      updatePartnerShow: {
        showOrError: {
          __typename: "UpdatePartnerShowSuccess",
          show: {
            internalID: "foo",
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        updatePartnerShowLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partners/foo/show/bar - {"type":"error","message":"Error from API"}`
            )
          ),
      }

      const updatedPartner = await runAuthenticatedQuery(mutation, context)

      expect(updatedPartner).toEqual({
        updatePartnerShow: {
          showOrError: {
            __typename: "UpdatePartnerShowFailure",
            mutationError: {
              message: "Error from API",
            },
          },
        },
      })
    })
  })

  describe("with artistIds", () => {
    const artistIdsMutation = gql`
      mutation {
        updatePartnerShow(
          input: { showId: "ref-show-123", artistIds: ["artist-1", "artist-2"] }
        ) {
          showOrError {
            __typename
            ... on UpdatePartnerShowSuccess {
              show {
                internalID
              }
            }
            ... on UpdatePartnerShowFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("passes artist_ids to the Gravity API", async () => {
      const updateShowLoader = jest.fn().mockResolvedValue({
        _id: "ref-show-123",
      })

      const context = {
        updatePartnerShowLoader: jest.fn(),
        updateShowLoader,
      }

      const result = await runAuthenticatedQuery(artistIdsMutation, context)

      expect(updateShowLoader).toHaveBeenCalledWith(
        "ref-show-123",
        expect.objectContaining({
          artist_ids: ["artist-1", "artist-2"],
        })
      )
      expect(result).toEqual({
        updatePartnerShow: {
          showOrError: {
            __typename: "UpdatePartnerShowSuccess",
            show: {
              internalID: "ref-show-123",
            },
          },
        },
      })
    })
  })

  describe("with addArtistIds", () => {
    const addArtistIdsMutation = gql`
      mutation {
        updatePartnerShow(
          input: { showId: "ref-show-123", addArtistIds: ["new-artist-slug"] }
        ) {
          showOrError {
            __typename
            ... on UpdatePartnerShowSuccess {
              show {
                internalID
              }
            }
            ... on UpdatePartnerShowFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("fetches existing artists and merges with new slugs", async () => {
      const updateShowLoader = jest.fn().mockResolvedValue({
        _id: "ref-show-123",
      })

      const context = {
        updatePartnerShowLoader: jest.fn(),
        updateShowLoader,
        showLoader: jest.fn().mockResolvedValue({
          _id: "ref-show-123",
          artists_without_artworks: [
            { id: "existing-artist-slug", _id: "existing-artist-id" },
          ],
        }),
      }

      await runAuthenticatedQuery(addArtistIdsMutation, context)

      expect(context.showLoader).toHaveBeenCalledWith("ref-show-123")
      expect(updateShowLoader).toHaveBeenCalledWith(
        "ref-show-123",
        expect.objectContaining({
          artist_ids: ["existing-artist-slug", "new-artist-slug"],
        })
      )
    })

    it("deduplicates when artist already exists in show", async () => {
      const updateShowLoader = jest.fn().mockResolvedValue({
        _id: "ref-show-123",
      })

      const context = {
        updatePartnerShowLoader: jest.fn(),
        updateShowLoader,
        showLoader: jest.fn().mockResolvedValue({
          _id: "ref-show-123",
          artists_without_artworks: [{ id: "artist-slug", _id: "artist-id" }],
        }),
      }

      const addDupeMutation = gql`
        mutation {
          updatePartnerShow(
            input: { showId: "ref-show-123", addArtistIds: ["artist-slug"] }
          ) {
            showOrError {
              __typename
              ... on UpdatePartnerShowSuccess {
                show {
                  internalID
                }
              }
            }
          }
        }
      `

      await runAuthenticatedQuery(addDupeMutation, context)

      expect(updateShowLoader).toHaveBeenCalledWith(
        "ref-show-123",
        expect.objectContaining({
          artist_ids: ["artist-slug"],
        })
      )
    })
  })

  describe("with removeArtistIds", () => {
    const removeArtistIdsMutation = gql`
      mutation {
        updatePartnerShow(
          input: {
            showId: "ref-show-123"
            removeArtistIds: ["artist-to-remove"]
          }
        ) {
          showOrError {
            __typename
            ... on UpdatePartnerShowSuccess {
              show {
                internalID
              }
            }
          }
        }
      }
    `

    it("fetches existing artists and removes the specified slug", async () => {
      const updateShowLoader = jest.fn().mockResolvedValue({
        _id: "ref-show-123",
      })

      const context = {
        updatePartnerShowLoader: jest.fn(),
        updateShowLoader,
        showLoader: jest.fn().mockResolvedValue({
          _id: "ref-show-123",
          artists_without_artworks: [
            { id: "artist-to-keep", _id: "id-1" },
            { id: "artist-to-remove", _id: "id-2" },
          ],
        }),
      }

      await runAuthenticatedQuery(removeArtistIdsMutation, context)

      expect(context.showLoader).toHaveBeenCalledWith("ref-show-123")
      expect(updateShowLoader).toHaveBeenCalledWith(
        "ref-show-123",
        expect.objectContaining({
          artist_ids: ["artist-to-keep"],
        })
      )
    })

    it("preserves all artists when removing a non-existent slug", async () => {
      const updateShowLoader = jest.fn().mockResolvedValue({
        _id: "ref-show-123",
      })

      const context = {
        updatePartnerShowLoader: jest.fn(),
        updateShowLoader,
        showLoader: jest.fn().mockResolvedValue({
          _id: "ref-show-123",
          artists_without_artworks: [
            { id: "artist-a", _id: "id-1" },
            { id: "artist-b", _id: "id-2" },
          ],
        }),
      }

      const removeNonExistentMutation = gql`
        mutation {
          updatePartnerShow(
            input: {
              showId: "ref-show-123"
              removeArtistIds: ["does-not-exist"]
            }
          ) {
            showOrError {
              __typename
              ... on UpdatePartnerShowSuccess {
                show {
                  internalID
                }
              }
            }
          }
        }
      `

      await runAuthenticatedQuery(removeNonExistentMutation, context)

      expect(updateShowLoader).toHaveBeenCalledWith(
        "ref-show-123",
        expect.objectContaining({
          artist_ids: ["artist-a", "artist-b"],
        })
      )
    })
  })

  describe("with conflicting artistIds and addArtistIds", () => {
    const conflictingMutation = gql`
      mutation {
        updatePartnerShow(
          input: {
            showId: "ref-show-123"
            artistIds: ["artist-1"]
            addArtistIds: ["artist-2"]
          }
        ) {
          showOrError {
            __typename
            ... on UpdatePartnerShowFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("throws an error when both modes are used", async () => {
      const context = {
        updatePartnerShowLoader: jest.fn(),
        updateShowLoader: jest.fn(),
      }

      await expect(
        runAuthenticatedQuery(conflictingMutation, context)
      ).rejects.toThrow(
        /Cannot use artistIds with addArtistIds or removeArtistIds/
      )

      expect(context.updateShowLoader).not.toHaveBeenCalled()
    })
  })

  describe("without partnerId (partner-less reference show)", () => {
    const partnerlessMutation = gql`
      mutation {
        updatePartnerShow(
          input: { showId: "ref-show-123", name: "Updated Name" }
        ) {
          showOrError {
            __typename
            ... on UpdatePartnerShowSuccess {
              show {
                internalID
              }
            }
            ... on UpdatePartnerShowFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("uses the top-level show loader", async () => {
      const context = {
        updatePartnerShowLoader: jest.fn(),
        updateShowLoader: () =>
          Promise.resolve({
            _id: "ref-show-123",
          }),
      }

      const result = await runAuthenticatedQuery(partnerlessMutation, context)

      expect(context.updatePartnerShowLoader).not.toHaveBeenCalled()
      expect(result).toEqual({
        updatePartnerShow: {
          showOrError: {
            __typename: "UpdatePartnerShowSuccess",
            show: {
              internalID: "ref-show-123",
            },
          },
        },
      })
    })
  })

  describe("with endAt set to null", () => {
    it("allows null endAt for fair booth shows", async () => {
      const nullEndAtFairMutation = gql`
        mutation {
          updatePartnerShow(
            input: {
              partnerId: "partner123"
              showId: "show123"
              endAt: null
              fairId: "fair123"
            }
          ) {
            showOrError {
              __typename
              ... on UpdatePartnerShowSuccess {
                show {
                  internalID
                }
              }
            }
          }
        }
      `

      const context = {
        updatePartnerShowLoader: jest.fn().mockResolvedValue({
          _id: "show123",
        }),
        showLoader: jest.fn(),
      }

      const result = await runAuthenticatedQuery(nullEndAtFairMutation, context)

      expect(context.updatePartnerShowLoader).toHaveBeenCalledWith(
        { partnerId: "partner123", showId: "show123" },
        expect.objectContaining({
          end_at: null,
        })
      )
      expect(result).toEqual({
        updatePartnerShow: {
          showOrError: {
            __typename: "UpdatePartnerShowSuccess",
            show: {
              internalID: "show123",
            },
          },
        },
      })
    })

    it("allows null endAt for existing fair booth shows", async () => {
      const nullEndAtExistingFairMutation = gql`
        mutation {
          updatePartnerShow(
            input: { partnerId: "partner123", showId: "show456", endAt: null }
          ) {
            showOrError {
              __typename
              ... on UpdatePartnerShowSuccess {
                show {
                  internalID
                }
              }
            }
          }
        }
      `

      const context = {
        updatePartnerShowLoader: jest.fn().mockResolvedValue({
          _id: "show456",
        }),
        showLoader: jest.fn().mockResolvedValue({
          _id: "show456",
          fair: { id: "fair123" },
        }),
      }

      const result = await runAuthenticatedQuery(
        nullEndAtExistingFairMutation,
        context
      )

      expect(context.showLoader).toHaveBeenCalledWith("show456")
      expect(context.updatePartnerShowLoader).toHaveBeenCalledWith(
        { partnerId: "partner123", showId: "show456" },
        expect.objectContaining({
          end_at: null,
        })
      )
      expect(result).toEqual({
        updatePartnerShow: {
          showOrError: {
            __typename: "UpdatePartnerShowSuccess",
            show: {
              internalID: "show456",
            },
          },
        },
      })
    })

    it("returns error when setting endAt to null for non-fair shows", async () => {
      const invalidNullEndAtMutation = gql`
        mutation {
          updatePartnerShow(
            input: { partnerId: "partner123", showId: "show789", endAt: null }
          ) {
            showOrError {
              __typename
              ... on UpdatePartnerShowFailure {
                mutationError {
                  message
                }
              }
            }
          }
        }
      `

      const context = {
        updatePartnerShowLoader: jest.fn(),
        showLoader: jest.fn().mockResolvedValue({
          _id: "show789",
          fair: null,
        }),
      }

      const result = await runAuthenticatedQuery(
        invalidNullEndAtMutation,
        context
      )

      expect(context.showLoader).toHaveBeenCalledWith("show789")
      expect(context.updatePartnerShowLoader).not.toHaveBeenCalled()
      expect(result).toEqual({
        updatePartnerShow: {
          showOrError: {
            __typename: "UpdatePartnerShowFailure",
            mutationError: {
              message: "endAt can only be null for fair booth shows",
            },
          },
        },
      })
    })
  })
})
