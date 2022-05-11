import { ReadStream } from "fs"
import tineye from "lib/apis/tineye"

type SearchByImageLoaderOptions = {
  image: ReadStream
  filename: string
  contentType: string
}

export default (_opts) => {
  const searchByImageLoader = async ({
    image,
    filename,
    contentType,
  }: SearchByImageLoaderOptions) => {
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
    searchByImageLoader,
  }
}
