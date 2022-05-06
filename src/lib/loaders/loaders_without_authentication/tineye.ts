import { ReadStream } from "fs"
import tineye from "lib/apis/tineye"

type TineyeSearchLoaderOptions = {
  image: ReadStream
  filename: string
  contentType: string
}

export default (_opts) => {
  const tineyeSearchLoader = async ({
    image,
    filename,
    contentType,
  }: TineyeSearchLoaderOptions) => {
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
    tineyeSearchLoader,
  }
}
