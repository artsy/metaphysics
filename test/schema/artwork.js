import _ from 'lodash';
import Artwork from '../../schema/artwork';
import { ArtworkPredicates } from '../../schema/artwork';

let artwork = {
  id: "richard-prince-untitled-portrait",
  title: "Untitled (Portrait)",
  forsale: true,
  acquireable: false,
  partner: [{id: 'galerie cabbie'}]
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
});
