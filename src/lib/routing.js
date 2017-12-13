import _ from "lodash"

export default (type, id) => {
  switch (type) {
    case "PartnerShow":
      return {
        api: `show/${id}`,
        href: `/show/${id}`,
      }

    case "Profile":
      return {
        api: `profile/${id}`,
        href: `/${id}`,
      }

    default:
      const namespace = _.snakeCase(type)
      return {
        api: `${namespace}/${id}`,
        href: `/${namespace}/${id}`,
      }
  }
}
