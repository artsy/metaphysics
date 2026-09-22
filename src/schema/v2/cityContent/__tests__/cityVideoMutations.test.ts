import { runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const gravityJoin = {
  id: "video-join-1",
  city_slug: "london-united-kingdom",
  video_id: "video-1",
  video: { _id: "video-1", title: "London Art Week Recap" },
  position: 0,
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
}

const mutationQuery = (mutation: string, input: string) => `
  mutation {
    ${mutation}(input: ${input}) {
      responseOrError {
        ... on CityVideoMutationSuccess {
          citySlug
          videos {
            position
            video { title }
          }
        }
        ... on CityVideoMutationFailure {
          mutationError { message }
        }
      }
    }
  }
`

describe("createCityVideo", () => {
  it("attaches a video and returns the city's refreshed video list", async () => {
    const createCityVideoLoader = jest.fn().mockResolvedValue(gravityJoin)
    const cityVideosLoader = jest.fn().mockResolvedValue([gravityJoin])

    const data = await runQuery(
      mutationQuery(
        "createCityVideo",
        '{ citySlug: "london-united-kingdom", videoID: "video-1" }'
      ),
      { createCityVideoLoader, cityVideosLoader }
    )

    expect(createCityVideoLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
      video_id: "video-1",
    })
    expect(cityVideosLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
    })
    expect(data.createCityVideo.responseOrError).toEqual({
      citySlug: "london-united-kingdom",
      videos: [{ position: 0, video: { title: "London Art Week Recap" } }],
    })
  })

  it("returns a mutation error when the loader is unavailable", async () => {
    await expect(
      runQuery(
        mutationQuery(
          "createCityVideo",
          '{ citySlug: "london-united-kingdom", videoID: "video-1" }'
        ),
        {}
      )
    ).rejects.toThrow("You need to be signed in to perform this action")
  })

  it("returns a GravityMutationError when gravity rejects the attach", async () => {
    const createCityVideoLoader = jest
      .fn()
      .mockRejectedValue(
        new HTTPError(
          "Video has already been taken",
          400,
          JSON.stringify({ error: "Video has already been taken" })
        )
      )

    const data = await runQuery(
      mutationQuery(
        "createCityVideo",
        '{ citySlug: "london-united-kingdom", videoID: "video-1" }'
      ),
      { createCityVideoLoader }
    )

    expect(data.createCityVideo.responseOrError.mutationError.message).toEqual(
      "Video has already been taken"
    )
  })
})

describe("updateCityVideo", () => {
  it("moves a video and returns the city's refreshed video list", async () => {
    const updateCityVideoLoader = jest.fn().mockResolvedValue(gravityJoin)
    const cityVideosLoader = jest.fn().mockResolvedValue([gravityJoin])

    const data = await runQuery(
      mutationQuery("updateCityVideo", '{ id: "video-join-1", position: 0 }'),
      { updateCityVideoLoader, cityVideosLoader }
    )

    expect(updateCityVideoLoader).toHaveBeenCalledWith("video-join-1", {
      position: 0,
    })
    expect(data.updateCityVideo.responseOrError.citySlug).toEqual(
      "london-united-kingdom"
    )
  })
})

describe("deleteCityVideo", () => {
  it("detaches a video and returns the city's remaining video list", async () => {
    const deleteCityVideoLoader = jest.fn().mockResolvedValue(gravityJoin)
    const cityVideosLoader = jest.fn().mockResolvedValue([])

    const data = await runQuery(
      mutationQuery("deleteCityVideo", '{ id: "video-join-1" }'),
      { deleteCityVideoLoader, cityVideosLoader }
    )

    expect(deleteCityVideoLoader).toHaveBeenCalledWith("video-join-1", {})
    expect(data.deleteCityVideo.responseOrError).toEqual({
      citySlug: "london-united-kingdom",
      videos: [],
    })
  })
})
