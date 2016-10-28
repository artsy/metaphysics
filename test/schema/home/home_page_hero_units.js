describe('HomePageHeroUnits', () => {
  const HomePage = schema.__get__('HomePage');
  const HomePageHeroUnits = HomePage.__get__('HomePageHeroUnits');
  let gravity = null;
  const payload = [{
    _id: '57e2ec9b8b3b817dc10015f7',
    id: 'artrio-2016-number-3',
    link: '/artrio-2016',
    heading: 'Featured Fair',
    mobile_title: 'ArtRio 2016',
    background_image_url: 'wide.jpg',
    background_image_mobile_url: 'narrow.jpg',
  }];

  beforeEach(() => {
    gravity = sinon.stub();
    HomePageHeroUnits.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    HomePageHeroUnits.__ResetDependency__('gravity');
  });

  ['mobile', 'desktop', 'martsy'].forEach(platform => {
    it(`returns enabled hero units for ${platform} only`, () => {
      const params = { enabled: true };
      params[platform] = true;
      gravity.withArgs('site_hero_units', params).returns(Promise.resolve(payload));

      const query = `
        {
          home_page {
            hero_units(platform: ${platform.toUpperCase()}) {
              _id
              id
              href
              heading
              title
              background_image_url
            }
          }
        }
      `;

      return runQuery(query).then(({ home_page: { hero_units } }) => {
        expect(hero_units).to.eql([{
          _id: '57e2ec9b8b3b817dc10015f7',
          id: 'artrio-2016-number-3',
          href: '/artrio-2016',
          heading: 'Featured Fair',
          title: 'ArtRio 2016',
          background_image_url: (platform === 'desktop' ? 'wide.jpg' : 'narrow.jpg'),
        }]);
      });
    });
  });

  it('returns a specific background image version', () => {
    gravity.returns(Promise.resolve(payload));

    const query = `
      {
        home_page {
          hero_units(platform: MOBILE) {
            background_image_url(version: WIDE)
          }
        }
      }
    `;

    return runQuery(query).then(({ home_page: { hero_units } }) => {
      expect(hero_units).to.eql([{
        background_image_url: 'wide.jpg',
      }]);
    });
  });
});
