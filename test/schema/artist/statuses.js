describe('Artist Statuses', () => {
  const Artist = schema.__get__('Artist');
  let artist = null;

  beforeEach(() => {
    artist = {
      id: 'foo-bar',
      name: 'Foo Bar',
      birthday: null,
      artworks_count: 42,
      partner_shows_count: 42,
      published_artworks_count: 42,
      displayable_partner_shows_count: 0,
    };

    Artist.__Rewire__('gravity', sinon.stub().returns(Promise.resolve(artist)));
  });

  afterEach(() => {
    Artist.__ResetDependency__('gravity');
  });

  it('returns statuses for artworks, shows and cv', () => {
    const query = `
      {
        artist(id: "foo-bar") {
          statuses {
            artworks
            shows
            cv
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).toEqual({
          artist: {
            statuses: {
              artworks: true,
              shows: false,
              cv: true,
            },
          },
        });
      });
  });
});
