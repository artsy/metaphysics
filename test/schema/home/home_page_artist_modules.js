import { map } from 'lodash';

describe('HomePageArtistModules', () => {
  describe('concerning display', () => {
    const query = `
      {
        home_page {
          artist_modules {
            key
          }
        }
      }
    `;

    describe('when signed-in', () => {
      const HomePage = schema.__get__('HomePage');
      const HomePageArtistModule = HomePage.__get__('HomePageArtistModule');

      let suggestions = null;

      beforeEach(() => {
        suggestions = [];

        HomePageArtistModule.__Rewire__('gravity', () => {
          return { with: () => Promise.resolve(suggestions) };
        });

        HomePageArtistModule.__Rewire__('total', () => {
          return Promise.resolve({ body: { total: suggestions.length } });
        });
      });

      afterEach(() => {
        HomePageArtistModule.__ResetDependency__('gravity');
        HomePageArtistModule.__ResetDependency__('total');
      });

      it('shows all modules if there are any suggestions', () => {
        suggestions.push({
          id: 'foo-bar',
          name: 'Foo Bar',
          bio: null,
          blurb: null,
          birthday: null,
          artworks_count: 42,
        });

        return runAuthenticatedQuery(query).then(({ home_page }) => {
          const keys = map(home_page.artist_modules, 'key');
          expect(keys).toEqual(['SUGGESTED', 'TRENDING', 'POPULAR']);
        });
      });

      it('only shows the trending and popular artists modules if there are no suggestions', () => {
        return runAuthenticatedQuery(query).then(({ home_page }) => {
          const keys = map(home_page.artist_modules, 'key');
          expect(keys).toEqual(['TRENDING', 'POPULAR']);
        });
      });
    });

    describe('when signed-out', () => {
      it('only shows the trending and popular artists modules', () => {
        return runQuery(query).then(({ home_page }) => {
          const keys = map(home_page.artist_modules, 'key');
          expect(keys).toEqual(['TRENDING', 'POPULAR']);
        });
      });
    });
  });
});
