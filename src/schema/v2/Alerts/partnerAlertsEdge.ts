import { GraphQLFieldConfig } from "graphql"
import { PartnerAlertsEdgeFields, AlertType } from "."
import { connectionWithCursorInfo } from "../fields/pagination"
import { NodeInterface } from "../object_identification"

const PartnerAlertsConnection = connectionWithCursorInfo({
  name: "PartnerAlerts",
  edgeFields: PartnerAlertsEdgeFields,
  nodeType: AlertType,
  edgeInterfaces: [NodeInterface],
})

export const PartnerAlertsConnectionType =
  PartnerAlertsConnection.connectionType
const PartnerAlertsEdgeType = PartnerAlertsConnection.edgeType

const PartnerAlertsEdge: GraphQLFieldConfig<any, any> = {
  type: PartnerAlertsEdgeType,
  description: "Only used for `node` resolution",
  resolve: async (
    _root,
    { partnerID, id },
    { partnerSearchCriteriaLoader }
  ) => {
    const {
      body: { hits },
    } = await partnerSearchCriteriaLoader(partnerID, { ids: [id] }) // Requires upstream changes to support this
    return hits[0]
  },
}

export default PartnerAlertsEdge
