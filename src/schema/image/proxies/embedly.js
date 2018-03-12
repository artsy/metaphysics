import urljoin from "url-join"
import qs from "qs"
import config from "config"

const { EMBEDLY_KEY, EMBEDLY_ENDPOINT } = config

export default (src, mode, width, height) => {
  const options = {
    crop: {
      url: src,
      width,
      height,
      key: EMBEDLY_KEY,
      quality: 80,
    },
    resize: {
      grow: false,
      url: src,
      width,
      height,
      key: EMBEDLY_KEY,
      quality: 80,
    },
  }
  return urljoin(EMBEDLY_ENDPOINT, `${mode}?${qs.stringify(options[mode])}`)
}
