import { map } from 'lodash';
import sinon from 'sinon';
import schema from '../../../schema';
import { runAuthenticatedQuery, runQuery } from '../../helper';

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

        const gravity = sinon.stub();
        gravity.with = sinon.stub().returns(gravity);
        gravity.returns(Promise.resolve(suggestions));
        HomePageArtistModule.__Rewire__('gravity', gravity);
      });

      afterEach(() => {
        HomePageArtistModule.__ResetDependency__('gravity');
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
          keys.should.eql(['suggested', 'trending', 'popular']);
        });
      });

      it('only shows the trending and popular artists modules if there are no suggestions', () => {
        return runAuthenticatedQuery(query).then(({ home_page }) => {
          const keys = map(home_page.artist_modules, 'key');
          keys.should.eql(['trending', 'popular']);
        });
      });
    });

    describe('when signed-out', () => {
      it('only shows the trending and popular artists modules', () => {
        return runQuery(query).then(({ home_page }) => {
          const keys = map(home_page.artist_modules, 'key');
          keys.should.eql(['trending', 'popular']);
        });
      });
    });
  });
});
