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

  describe('when signed out', () => {
    it('returns the proper title for popular_artists', () => {
      return runQuery(query('popular_artists')).then(({ home_page }) => {
        expect(home_page.artwork_module.title).toEqual('Works by Popular Artists');
      });
    });
  });
});
