import { map, find } from 'lodash';

describe('HomePageArtworkModules', () => {
  const query = `
    {
      home_page {
        artwork_modules {
          key
          params {
            related_artist_id
            followed_artist_id
          }
        }
      }
    }
  `;
  describe('when signed in', () => {
    const HomePage = schema.__get__('HomePage');
    const HomePageArtworkModules = HomePage.__get__('HomePageArtworkModules');

    let gravity;
    let modules;
    let relatedArtistsResponse;
    let relatedArtist;

    beforeEach(() => {
      modules = {
        active_bids: false,
        followed_artists: false,
        followed_galleries: true,
        saved_works: true,
        recommended_works: true,
        live_auctions: false,
        current_fairs: true,
        related_artists: true,
        genes: false,
      };

      relatedArtistsResponse = {
        sim_artist: { id: 'pablo-picasso' },
        artist: { id: 'charles-broskoski' },
      };

      gravity = sinon.stub();
      gravity.with = sinon.stub().returns(gravity);
      relatedArtist = sinon.stub();

      HomePageArtworkModules.__Rewire__('gravity', gravity);
      HomePageArtworkModules.__Rewire__('relatedArtist', relatedArtist);

      gravity
        // Modules fetch
        .onCall(0)
        .returns(Promise.resolve(modules));
      relatedArtist
        .onCall(0)
        .returns(Promise.resolve(relatedArtistsResponse));
    });

    afterEach(() => {
      HomePageArtworkModules.__ResetDependency__('gravity');
    });

    it('shows all modules that should be returned', () => {
      return runAuthenticatedQuery(query).then(({ home_page }) => {
        const keys = map(home_page.artwork_modules, 'key');

        // followed artists should always return true
        // the default module response is 8 keys
        expect(keys).to.eql([
          'followed_artists',
          'followed_galleries',
          'saved_works',
          'recommended_works',
          'current_fairs',
          'related_artists',
          'generic_gene',
          'generic_gene',
        ]);

        const relatedArtistsModule = find(home_page.artwork_modules, { key: 'related_artists' });
        expect(relatedArtistsModule.params).to.eql({
          related_artist_id: 'charles-broskoski',
          followed_artist_id: 'pablo-picasso',
        });
      });
    });
  });
  describe('when signed-out', () => {
    // nothing for now
  });
});
