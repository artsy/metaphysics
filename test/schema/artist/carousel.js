import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../../schema';

describe('ArtistCarousel type', () => {
  const Artist = schema.__get__('Artist');
  const ArtistCarousel = Artist.__get__('ArtistCarousel');

  beforeEach(() => {
    Artist.__Rewire__('gravity', sinon.stub().returns(
      Promise.resolve({
        id: 'foo-bar',
        name: 'Foo Bar',
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

      return graphql(schema, query)
        .then(({ data }) => {
          gravity.args[0][0].should.equal('related/shows');
          gravity.args[0][1].should.eql({
            artist_id: 'foo-bar',
            sort: '-end_at',
            displayable: true,
            solo_show: true,
            top_tier: true,
          });

          gravity.args[1][0].should.equal('artist/foo-bar/artworks');
          gravity.args[1][1].should.eql({ size: 7, sort: '-iconicity', published: true });

          data.artist.carousel.should.eql({
            images: [
              {
                href: '/artwork/foo-bar-artwork-1',
                resized: {
                  height: 199,
                  width: 300,
                  url: 'https://i.embed.ly.test/1/display/resize?grow=false&url=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=300&height=199&key=xxx_embedly_key_xxx&quality=95',
                },
              },
            ],
          });
        });
    });
  });
});
