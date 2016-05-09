import { countDisplay } from '../../../schema/artist/meta';

describe('ArtistMeta', () => {
  describe('countDisplay', () => {
    it('rounds count properly', () => {
      let count = countDisplay({ published_artworks_count: 78 });
      count.should.equal('70+ ');
      count = countDisplay({ published_artworks_count: 775 });
      count.should.equal('700+ ');
      count = countDisplay({ published_artworks_count: 1275 });
      count.should.equal('1200+ ');
    });
  });
});
