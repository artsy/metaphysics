// import { isNull } from 'lodash';
import sinon from 'sinon';
// import { graphql } from 'graphql';
import schema from '../../../schema';
import { runQuery } from '../../helper';

describe('HomePageArtworkModule', () => {
  const HomePage = schema.__get__('HomePage');
  const HomePageArtworkModule = HomePage.__get__('HomePageArtworkModule');

  const query = key => {
    return `
      {
        home_page {
          artwork_module(key: "${key}") {
            key
            title
          }
        }
      }
    `;
  };

  beforeEach(() => {
    const gravity = sinon.stub();
    gravity.with = sinon.stub().returns(gravity);

    HomePageArtworkModule.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    HomePageArtworkModule.__ResetDependency__('gravity');
  });

  describe('when signed-out', () => {
    it('returns the proper title for iconic_artists', () => {
      return runQuery(query('iconic_artists')).then(({ home_page }) => {
        home_page.artwork_module.title.should.eql('Works by Iconic Artists');
      });
    });
    it('returns the proper title for current_fairs', () => {
      return runQuery(query('current_fairs')).then(({ home_page }) => {
        home_page.artwork_module.title.should.eql("Current Fair: Cabbie's Fair, Y'all");
      });
    });
  });
});
