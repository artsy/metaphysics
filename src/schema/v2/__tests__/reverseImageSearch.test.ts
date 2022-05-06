import { reverseImageSearchResolver } from "../reverseImageSearch"
import { Readable } from "stream"

const _ = {}

describe("reverseImageSearchResolver", () => {
  it("should throw error if user is not logged in", async () => {
    await expect(reverseImageSearchResolver(_, _, _)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("should throw error if the token is invalid", async () => {
    const context = {
      meLoader: jest.fn().mockRejectedValue(new Error("Error Message")),
    }

    await expect(reverseImageSearchResolver(_, _, context)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("should return results", async () => {
    const stream = Readable.from(Buffer.from("helloWorld"))
    const args = {
      image: Promise.resolve({
        filename: "filename.jpg",
        mimetype: "image/jpeg",
        encoding: "7bit",
        createReadStream: () => stream,
      }),
    }
    const context = {
      meLoader: jest.fn().mockResolvedValue({}),
      tineyeSearchLoader: jest.fn().mockResolvedValue({
        status: "ok",
        count: "1",
        count_total: "1",
        result: [
          {
            target_overlap_percent: 99.76,
            query_overlap_percent: 99.95,
            filepath: "artwork/artwork-id/image/image-id",
            target_match_rect: {
              top: 29.29,
              bottom: 71.64,
              right: 84.53,
              left: 21.25,
            },
            score: 72.83,
            match_percent: 97.26,
            query_match_rect: {
              top: 29.17,
              bottom: 71.43,
              right: 84.5,
              left: 21,
            },
          },
        ],
        error: [],
        query_image: { filepath: "filename.jpg" },
        method: "search",
      }),
    }

    const result = await reverseImageSearchResolver(_, args, context)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "__typename": "ReverseImageSearchResults",
        "results": Array [
          Object {
            "filepath": "artwork/artwork-id/image/image-id",
            "match_percent": 97.26,
            "query_match_rect": Object {
              "bottom": 71.43,
              "left": 21,
              "right": 84.5,
              "top": 29.17,
            },
            "query_overlap_percent": 99.95,
            "score": 72.83,
            "target_match_rect": Object {
              "bottom": 71.64,
              "left": 21.25,
              "right": 84.53,
              "top": 29.29,
            },
            "target_overlap_percent": 99.76,
          },
        ],
      }
    `)
  })

  it("should return errors when something went wrong", async () => {
    const stream = Readable.from(Buffer.from("helloWorld"))
    const args = {
      image: Promise.resolve({
        filename: "filename.jpg",
        mimetype: "image/jpeg",
        encoding: "7bit",
        createReadStream: () => stream,
      }),
    }
    const context = {
      meLoader: jest.fn().mockResolvedValue({}),
      tineyeSearchLoader: jest.fn().mockResolvedValue({
        status: "fail",
        error: ["Error message"],
        method: "search",
        result: [],
      }),
    }

    await expect(reverseImageSearchResolver(_, args, context)).rejects.toThrow(
      "Error message"
    )
  })
})
