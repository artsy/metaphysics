import { map, find } from 'lodash';

describe('HomePageArtworkModules', () => {
  describe('when signed in', () => {
    const HomePage = schema.__get__('HomePage');
    const HomePageArtworkModules = HomePage.__get__('HomePageArtworkModules');

    let gravity;
    let modules;
    let relatedArtistsResponse;
    let relatedArtists;

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

      relatedArtistsResponse = [
        {
          sim_artist: { id: 'pablo-picasso' },
          artist: { id: 'charles-broskoski' },
        },
        {
          sim_artist: { id: 'ann-craven' },
          artist: { id: 'margaret-lee' },
        },
      ];

      gravity = sinon.stub();
      gravity.with = sinon.stub().returns(gravity);
      relatedArtists = sinon.stub();

      HomePageArtworkModules.__Rewire__('gravity', gravity);
      HomePageArtworkModules.__Rewire__('relatedArtists', relatedArtists);

      gravity
        // Modules fetch
        .onCall(0)
        .returns(Promise.resolve(modules));
      relatedArtists
        .onCall(0)
        .returns(Promise.resolve(relatedArtistsResponse));
    });

    afterEach(() => {
      HomePageArtworkModules.__ResetDependency__('gravity');
    });

    it('shows all modules that should be returned', () => {
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

      return runAuthenticatedQuery(query).then(({ home_page }) => {
        const keys = map(home_page.artwork_modules, 'key');

        // the default module response is 8 keys
        expect(keys).toEqual([
          'followed_galleries',
          'saved_works',
          'recommended_works',
          'current_fairs',
          'followed_artist',
          'related_artists',
          'generic_gene',
          'generic_gene',
          'generic_gene',
        ]);

        const relatedArtistsModule = find(home_page.artwork_modules, { key: 'related_artists' });
        expect(relatedArtistsModule.params).toEqual({
          related_artist_id: 'charles-broskoski',
          followed_artist_id: 'pablo-picasso',
        });
      });
    });

    it('shows skips the followed_artist module if no 2nd pair is returned', () => {
      relatedArtistsResponse = [
        {
          sim_artist: { id: 'pablo-picasso' },
          artist: { id: 'charles-broskoski' },
        },
      ];

      relatedArtists
        .onCall(0)
        .returns(Promise.resolve(relatedArtistsResponse));

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

      return runAuthenticatedQuery(query).then(({ home_page }) => {
        const keys = map(home_page.artwork_modules, 'key');

        // the default module response is 8 keys
        expect(keys).toEqual([
          'followed_galleries',
          'saved_works',
          'recommended_works',
          'current_fairs',
          'related_artists',
          'generic_gene',
          'generic_gene',
          'generic_gene',
        ]);

        const relatedArtistsModule = find(home_page.artwork_modules, { key: 'related_artists' });
        expect(relatedArtistsModule.params).toEqual({
          related_artist_id: 'charles-broskoski',
          followed_artist_id: 'pablo-picasso',
        });
      });
    });

    it('takes a preferred order of modules', () => {
      const query = `
        {
          home_page {
            artwork_modules(order: [RECOMMENDED_WORKS, FOLLOWED_ARTISTS, GENERIC_GENES]) {
              key
            }
          }
        }
      `;

      return runAuthenticatedQuery(query).then(({ home_page: { artwork_modules } }) => {
        // The order of rails not included in the preferred order list is left as-is from Gravity’s
        // modules endpoint response. Rails in the preferred order list that aren’t even included in
        // Gravity’s response do not lead to an error (the FOLLOWED_ARTISTS rail).
        expect(map(artwork_modules, 'key')).toEqual([
          'recommended_works',
          'generic_gene',
          'generic_gene',
          'generic_gene',
          'followed_galleries',
          'saved_works',
          'current_fairs',
          'followed_artist',
          'related_artists',
        ]);
      });
    });
  });

  describe('when signed-out', () => {
    // nothing for now
  });
});
