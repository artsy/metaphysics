import _ from 'lodash';
import Artwork from '../../schema/artwork';
import { ArtworkPredicates } from '../../schema/artwork';

let artwork = {
  id: "richard-prince-untitled-portrait",
  title: "Untitled (Portrait)",
  forsale: true,
  acquireable: false,
  partner: [{id: 'galerie cabbie'}],
  sales: [
    {title: 'sale #1', is_auction: true},
    {title: 'sale #2', is_auction: false}
  ]
}

describe('Artwork', () => {
  describe('ArtworkPredicates.is_contactable', () => {
    it('sets an artwork as contactable if it meets requirements', () => {
      ArtworkPredicates.is_contactable(artwork, []).should.be.true();
    });

    it('sets an artwork as not contactable if it has related sales', () => {
      ArtworkPredicates.is_contactable(artwork, [{id: 'another auction by cab'}])
        .should.be.false();
    });
  });
  describe('ArtworkPredicates.is_in_auction', () => {
    it('if any artwork sale is an auction, then is_in_auction is true', () => {
      ArtworkPredicates.is_in_auction(artwork, artwork.sales).should.be.true();
    });
    it('if no artwork sales are in an auction, then is_in_auction is false', () => {
      ArtworkPredicates.is_in_auction(artwork, []).should.be.false();
    });
  });
});
