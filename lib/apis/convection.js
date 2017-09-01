import fetch from "./fetch"
const { CONVECTION_API_BASE } = process.env

export default path => fetch(`${CONVECTION_API_BASE}/${path}`)
