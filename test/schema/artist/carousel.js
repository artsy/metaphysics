describe('ArtistCarousel type', () => {
  const Artist = schema.__get__('Artist');
  const ArtistCarousel = Artist.__get__('ArtistCarousel');

  beforeEach(() => {
    Artist.__Rewire__('gravity', sinon.stub().returns(
      Promise.resolve({
        id: 'foo-bar',
        name: 'Foo Bar',
        birthday: null,
        artworks_count: null,
      })
    ));
  });

  afterEach(() => {
    Artist.__ResetDependency__('gravity');
  });

  describe('with artworks, no shows', () => {
    beforeEach(() => {
      const gravity = sinon.stub();

      gravity
        // Shows
        .onCall(0)
        .returns(Promise.resolve([]))
        // Artworks
        .onCall(1)
        .returns(
          Promise.resolve(
            [{ id: 'foo-bar-artwork-1', images: [
              {
                original_height: 2333,
                original_width: 3500,
                image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg',
                image_versions: ['large'],
              },
            ] }]
          )
        );

      ArtistCarousel.__Rewire__('gravity', gravity);
    });

    afterEach(() => {
      ArtistCarousel.__ResetDependency__('gravity');
    });


    it('fetches an artist by ID', () => {
      const gravity = ArtistCarousel.__get__('gravity');
      const query = `
        {
          artist(id: "foo-bar") {
            id
            carousel {
              images {
                href
                resized(width: 300) {
                  url
                  width
                  height
                }
              }
            }
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(gravity.args[0][0]).toBe('related/shows');
          expect(gravity.args[0][1]).toEqual({
            artist_id: 'foo-bar',
            sort: '-end_at',
            displayable: true,
            solo_show: true,
            top_tier: true,
          });

          expect(gravity.args[1][0]).toBe('artist/foo-bar/artworks');
          expect(gravity.args[1][1]).toEqual({ size: 7, sort: '-iconicity', published: true });

          expect(data.artist.carousel).toEqual({
            images: [
              {
                href: '/artwork/foo-bar-artwork-1',
                resized: {
                  height: 199,
                  width: 300,
                  url: 'https://gemini.cloudfront.test/?resize_to=fit&width=300&height=199&quality=95&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg',
                },
              },
            ],
          });
        });
    });
  });
});
