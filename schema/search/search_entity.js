import _ from 'lodash';
import Artist from '../artist';
import Artwork from '../artwork';
import Profile from '../profile';
import PartnerShow from '../partner_show';
import {
  GraphQLObjectType,
  GraphQLUnionType
} from 'graphql';

export let ArtistSearchEntityType = _.create(Artist.type, {
  name: 'ArtistSearchEntity',
  isTypeOf: ({ type }) => type === 'Artist',
});

export let ArtworkSearchEntityType = _.create(Artwork.type, {
  name: 'ArtworkSearchEntity',
  isTypeOf: ({ type }) => type === 'Artwork',
});


export let ProfileSearchEntityType = _.create(Profile.type, {
  name: 'ProfileSearchEntity',
  isTypeOf: ({ type }) => type === 'Profile'
});

export let PartnerShowSearchEntityType = _.create(PartnerShow.type, {
  name: 'PartnerShowSearchEntity',
  isTypeOf: ({ type }) => type === 'PartnerShow'
});

export let SearchEntityType = new GraphQLUnionType({
  name: 'SearchEntity',
  types: [
    ArtistSearchEntityType,
    ArtworkSearchEntityType,
    ProfileSearchEntityType,
    PartnerShowSearchEntityType
  ]
});

export default SearchEntityType;
