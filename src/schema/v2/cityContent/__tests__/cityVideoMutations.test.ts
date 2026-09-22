import { runQuery } from "schema/v2/test/utils"

const gravityJoin = {
  id: "video-join-1",
  city_slug: "london-united-kingdom",
  video_id: "video-1",
  video: { _id: "video-1", title: "London Art Week Recap" },
  position: 0,
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
}

describe("createCityVideo", () => {
  it("attaches a video to a city", async () => {
    const createCityVideoLoader = jest.fn().mockResolvedValue(gravityJoin)

    const mutation = `
      mutation {
        createCityVideo(
          input: { citySlug: "london-united-kingdom", videoID: "video-1" }
        ) {
          responseOrError {
            ... on CityVideoMutationSuccess {
              cityVideo {
                position
                video { title }
              }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, { createCityVideoLoader })

    expect(createCityVideoLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
      video_id: "video-1",
    })
    expect(data.createCityVideo.responseOrError.cityVideo).toEqual({
      position: 0,
      video: { title: "London Art Week Recap" },
    })
  })
})

describe("updateCityVideo", () => {
  it("moves a video within its city's list", async () => {
    const updateCityVideoLoader = jest.fn().mockResolvedValue(gravityJoin)

    const mutation = `
      mutation {
        updateCityVideo(input: { id: "video-join-1", position: 0 }) {
          responseOrError {
            ... on CityVideoMutationSuccess {
              cityVideo { position }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, { updateCityVideoLoader })

    expect(updateCityVideoLoader).toHaveBeenCalledWith("video-join-1", {
      position: 0,
    })
    expect(data.updateCityVideo.responseOrError.cityVideo.position).toEqual(0)
  })
})

describe("deleteCityVideo", () => {
  it("detaches a video from a city", async () => {
    const deleteCityVideoLoader = jest.fn().mockResolvedValue(gravityJoin)

    const mutation = `
      mutation {
        deleteCityVideo(input: { id: "video-join-1" }) {
          responseOrError {
            ... on CityVideoMutationSuccess {
              cityVideo { internalID }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, { deleteCityVideoLoader })

    expect(deleteCityVideoLoader).toHaveBeenCalledWith("video-join-1", {})
    expect(data.deleteCityVideo.responseOrError.cityVideo.internalID).toEqual(
      "video-join-1"
    )
  })
})
