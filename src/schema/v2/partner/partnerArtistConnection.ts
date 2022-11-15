import { connectionDefinitions } from "graphql-relay"

import { PartnerType } from "schema/v2/partner/partner"

import { fields } from "./partner_artist"

// The below can be used as the connection from an artist to its partners.
// The edge is the PartnerArtist relationship, with the node being the partner.
export const PartnerArtistConnection = connectionDefinitions({
  name: "PartnerArtist",
  nodeType: PartnerType,
  edgeFields: fields,
}).connectionType
