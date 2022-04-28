import { resolveImageSearch } from "../imageSearch"
import { Readable } from "stream"

const _ = {}

describe("resolveImageSearch", () => {
  it("should throw error if user is not logged in", async () => {
    await expect(resolveImageSearch(_, _, _)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("should throw error if the token is invalid", async () => {
    const context = {
      meLoader: jest.fn().mockRejectedValue(new Error("Error Message")),
    }

    await expect(resolveImageSearch(_, _, context)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("should return basic info about file", async () => {
    const stream = Readable.from(Buffer.from("helloWorld"))
    const args = {
      image: Promise.resolve({
        filename: "some-filename",
        mimetype: "image/jpeg",
        encoding: "7bit",
        createReadStream: () => stream,
      }),
    }
    const context = {
      meLoader: jest.fn().mockResolvedValue({}),
    }

    const result = await resolveImageSearch(_, args, context)

    expect(result).toEqual({
      filename: "some-filename",
      mimetype: "image/jpeg",
      encoding: "7bit",
    })
  })
})
