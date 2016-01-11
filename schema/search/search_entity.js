import _ from 'lodash';
import Artist from '../artist';
import Artwork from '../artwork';
import Profile from '../profile';
import PartnerShow from '../partner_show';
import {
  GraphQLUnionType,
} from 'graphql';

export const ArtistSearchEntityType = _.create(Artist.type, {
  name: 'ArtistSearchEntity',
  isTypeOf: ({ type }) => type === 'Artist',
});

export const ArtworkSearchEntityType = _.create(Artwork.type, {
  name: 'ArtworkSearchEntity',
  isTypeOf: ({ type }) => type === 'Artwork',
});


export const ProfileSearchEntityType = _.create(Profile.type, {
  name: 'ProfileSearchEntity',
  isTypeOf: ({ type }) => type === 'Profile',
});

export const PartnerShowSearchEntityType = _.create(PartnerShow.type, {
  name: 'PartnerShowSearchEntity',
  isTypeOf: ({ type }) => type === 'PartnerShow',
});

export const SearchEntityType = new GraphQLUnionType({
  name: 'SearchEntity',
  types: [
    ArtistSearchEntityType,
    ArtworkSearchEntityType,
    ProfileSearchEntityType,
    PartnerShowSearchEntityType,
  ],
});

export default SearchEntityType;
