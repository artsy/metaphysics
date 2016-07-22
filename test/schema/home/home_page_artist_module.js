import { isNull } from 'lodash';
import sinon from 'sinon';
import schema from '../../../schema';
import { runAuthenticatedQuery, runQuery } from '../../helper';

describe('HomePageArtistModule', () => {
  const HomePage = schema.__get__('HomePage');
  const HomePageArtistModule = HomePage.__get__('HomePageArtistModule');

  const query = key => {
    return `
      {
        home_page {
          artist_module(key: "${key}") {
            results {
              id
            }
          }
        }
      }
    `;
  };

  beforeEach(() => {
    const gravity = sinon.stub();
    gravity.with = sinon.stub().returns(gravity);

    gravity.withArgs('artists/trending').returns(Promise.resolve([{
      id: 'trending',
      birthday: null,
      artworks_count: null,
    }]));

    gravity.withArgs('user/user-42/suggested/similar/artists').returns(Promise.resolve([{
      artist: {
        id: 'suggested',
        birthday: null,
        artworks_count: null,
      },
    }]));

    HomePageArtistModule.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    HomePageArtistModule.__ResetDependency__('gravity');
  });

  const shared = () => {
    it('returns trending artists', () => {
      return runQuery(query('trending')).then(({ home_page }) => {
        home_page.artist_module.results.should.eql([{ id: 'trending' }]);
      });
    });
  };

  describe('when signed-in', () => {
    shared();

    it('returns suggestions', () => {
      return runAuthenticatedQuery(query('suggested')).then(({ home_page }) => {
        home_page.artist_module.results.should.eql([{ id: 'suggested' }]);
      });
    });
  });

  describe('when signed-out', () => {
    shared();

    it('does not return any suggestions', () => {
      return runQuery(query('suggested')).then(({ home_page }) => {
        isNull(home_page.artist_module.results).should.be.true();
      });
    });
  });
});