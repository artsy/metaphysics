import _ from "lodash"

export default (type, id) => {
  const namespace = _.snakeCase(type)

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
      return {
        api: `${namespace}/${id}`,
        href: `/${namespace}/${id}`,
      }
  }
}
