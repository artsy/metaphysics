import { Readable } from "stream"
import { tineyeSearch } from "lib/apis/tineye"
import { Upload } from "graphql-upload"
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

jest.mock("lib/apis/tineye")

describe("reverseImageSearch", () => {
  const mockTineyeSearch = tineyeSearch as jest.Mock
  let upload: Upload
  let file

  beforeEach(() => {
    mockTineyeSearch.mockClear()

    file = Readable.from(Buffer.from("helloWorld"))
    upload = new Upload()

    upload.file = file
    upload.promise = new Promise((resolve) =>
      resolve({
        filename: "filename.jpg",
        mimetype: "image/jpeg",
        encoding: "7bit",
        createReadStream: () => file,
      })
    )
  })

  it("should throw error if user is not logged in", async () => {
    await expect(runQuery(query, {}, { file: upload })).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("should throw error if the token is invalid", async () => {
    const context = {
      meLoader: jest.fn().mockRejectedValue(new Error("Error Message")),
    }

    await expect(runQuery(query, context, { file: upload })).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("should return results", async () => {
    const context = {
      meLoader: jest.fn().mockResolvedValue({}),
    }

    mockTineyeSearch.mockResolvedValue(TinEyeSuccessResponse)

    const result = await runQuery(query, context, { file: upload })

    expect(result).toMatchInlineSnapshot(`
      Object {
        "reverseImageSearch": Object {
          "results": Array [
            Object {
              "filepath": "artwork/artwork-id/image/image-id",
              "score": 72.83,
            },
          ],
        },
      }
    `)
  })

  it("should return errors when something went wrong", async () => {
    const context = {
      meLoader: jest.fn().mockResolvedValue({}),
    }

    mockTineyeSearch.mockResolvedValue(TinEyeFailResponse)

    await expect(runQuery(query, context, { file: upload })).rejects.toThrow(
      "Error message"
    )
  })
})

const query = gql`
  query($file: Upload!) {
    reverseImageSearch(image: $file) {
      results {
        filepath
        score
      }
    }
  }
`

const TinEyeSuccessResponse = {
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
}

const TinEyeFailResponse = {
  status: "fail",
  error: ["Error message"],
  method: "search",
  result: [],
}
