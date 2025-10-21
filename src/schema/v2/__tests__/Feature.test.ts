import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { Gravity } from "types/runtime"

const FEATURE: Gravity.Feature = {
  _id: "5ef50c1f896158000d635b34",
  id: "milan-gallery-community",
  name: "Milan Gallery Community",
  description: "Milan is an art center like no other...",
  subheadline: "July 1–August 1, 2020\n",
  callout:
    "Sponsored by APALAZZOGALLERY, [CARDI GALLERY](https://www.artsy.net/cardi-gallery)...",
  layout: "default",
  active: true,
  original_width: 1006,
  original_height: 1114,
  image_versions: ["square", "source", "wide", "large_rectangle"],
  image_urls: {
    square:
      "https://d32dm0rphc51dk.cloudfront.net/6XnLlK82VdXcs0Ii9pTzzg/square.jpg",
    source:
      "https://d32dm0rphc51dk.cloudfront.net/6XnLlK82VdXcs0Ii9pTzzg/source.jpg",
    wide:
      "https://d32dm0rphc51dk.cloudfront.net/6XnLlK82VdXcs0Ii9pTzzg/wide.jpg",
    large_rectangle:
      "https://d32dm0rphc51dk.cloudfront.net/6XnLlK82VdXcs0Ii9pTzzg/large_rectangle.jpg",
  },
  created_at: "2020-06-25T20:42:07+00:00",
  meta_title: "Milan Gallery Community | Artsy",
  video_url: "https://somevideo.url",
}

const featureLoader = (_id: string) => Promise.resolve(FEATURE)

describe("Feature", () => {
  const query = gql`
    {
      feature(id: "milan-gallery-community") {
        id
        name
        description
        subheadline
        callout
        layout
        isActive
        metaTitle
        videoURL
        meta {
          name
          description
        }
      }
    }
  `

  it("returns the correct data", async () => {
    const data = await runQuery(query, { featureLoader })

    expect(data).toEqual({
      feature: {
        id: "RmVhdHVyZTo1ZWY1MGMxZjg5NjE1ODAwMGQ2MzViMzQ=",
        layout: "DEFAULT",
        callout:
          "Sponsored by APALAZZOGALLERY, [CARDI GALLERY](https://www.artsy.net/cardi-gallery)...",
        description: "Milan is an art center like no other...",
        isActive: true,
        name: "Milan Gallery Community",
        subheadline: "July 1–August 1, 2020\n",
        metaTitle: "Milan Gallery Community | Artsy",
        videoURL: "https://somevideo.url",
        meta: {
          description: "Milan is an art center like no other...",
          name: "Milan Gallery Community | Artsy",
        },
      },
    })
  })
})
