import { ReadStream } from "fs"
import tineye from "lib/apis/tineye"

type SearchArtworkByImageLoaderOptions = {
  image: ReadStream
  filename: string
  contentType: string
}

export default (_opts) => {
  const searchArtworkByImageLoader = async ({
    image,
    filename,
    contentType,
  }: SearchArtworkByImageLoaderOptions) => {
    const response = await tineye("/search", {
      method: "POST",
      formData: {
        image: {
          value: image,
          options: {
            filename,
            contentType,
          },
        },
      },
    })

    return response.body
  }

  return {
    searchArtworkByImageLoader,
  }
}
