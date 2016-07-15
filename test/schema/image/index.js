import { assign } from 'lodash';
import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../../schema';
import { getDefault } from '../../../schema/image';

describe('getDefault', () => {
  it('returns the default image', () => {
    getDefault([
      { id: 'foo', is_default: false },
      { id: 'bar', is_default: true },
      { id: 'baz', is_default: false },
    ])
      .id.should.equal('bar');
  });

  it('returns the first object if there is no default', () => {
    getDefault([
      { id: 'foo' },
      { id: 'bar' },
      { id: 'baz' },
    ])
      .id.should.equal('foo');
  });
});

describe('Image type', () => {
  const Artwork = schema.__get__('Artwork');
  const image = {
    image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg',
    image_versions: [
      'icon',
      'large',
    ],
    image_urls: {
      icon: 'https://xxx.cloudfront.net/xxx/icon.png',
      large: 'https://xxx.cloudfront.net/xxx/large.jpg',
    },
  };

  beforeEach(() => {
    const gravity = sinon.stub();

    gravity
      // Artwork
      .onCall(0)
      .returns(Promise.resolve({
        id: 'richard-prince-untitled-portrait',
        title: 'untitled-portrait',
        artists: [],
        images: [image],
      }));

    Artwork.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    Artwork.__ResetDependency__('gravity');
  });

  describe('#orientation', () => {
    const query = `{
      artwork(id: "richard-prince-untitled-portrait") {
        image {
          orientation
        }
      }
    }`;

    it('is square by default (when there is no image geometry)', () => {
      assign(image, { original_width: null, original_height: null });

      return graphql(schema, query)
        .then(({ data }) => data.artwork.image.orientation.should.equal('square'));
    });

    it('detects portrait', () => {
      assign(image, { original_width: 1000, original_height: 1500 });

      return graphql(schema, query)
        .then(({ data }) => data.artwork.image.orientation.should.equal('portrait'));
    });

    it('detects landscape', () => {
      assign(image, { original_width: 2000, original_height: 1500 });

      return graphql(schema, query)
        .then(({ data }) => data.artwork.image.orientation.should.equal('landscape'));
    });

    it('detects square', () => {
      assign(image, { original_width: 2000, original_height: 2000 });

      return graphql(schema, query)
        .then(({ data }) => data.artwork.image.orientation.should.equal('square'));
    });
  });
});
