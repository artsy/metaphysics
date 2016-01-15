import {
  first,
  isNull,
  isUndefined,
} from 'lodash';
import normalize, { grab } from '../../../schema/image/normalize';

describe('grab', () => {
  it('grabs the first value for a set of possible keys', () => {
    grab({ foo: 'bar' }, 'foo').should.equal('bar');
    grab({ bar: 'baz' }, ['foo', 'bar']).should.equal('baz');
    grab({ foo: 'bar', bar: 'baz' }, ['foo', 'bar', 'baz']).should.equal('bar');
  });

  it('returns undefined when unable to find a value', () => {
    isUndefined(grab({ foo: 'bar' }, 'baz')).should.be.true();
    isUndefined(grab({}, 'baz')).should.be.true();
    isUndefined(grab(null, 'baz')).should.be.true();
  });
});

describe('image response normalization', () => {
  describe('API returns garbage response', () => {
    const badResponse = [{
      original_height: null,
      original_width: null,
      image_url: null,
      image_versions: [],
      image_urls: {},
    }];

    const goodResponse = [{
      original_height: 1919,
      original_width: 1352,
      image_url: 'https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/:version.jpg',
      image_versions: [
        'tall',
      ],
      image_urls: {
        tall: 'https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/tall.jpg',
      },
    }];

    const weirdResponse = [{
      original_height: 1919,
      original_width: 1352,
      url: 'https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/:version.jpg',
      versions: [
        'tall',
      ],
      urls: {
        tall: 'https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/tall.jpg',
      },
    }];

    it('rejects a bad response', () => {
      normalize(badResponse).should.have.lengthOf(0);
      isNull(normalize(first(badResponse))).should.be.true();
    });

    it('allows a good response through', () => {
      normalize(goodResponse).should.have.lengthOf(1);
    });

    it('allows a weird response through', () => {
      normalize(weirdResponse).should.have.lengthOf(1);
    });

    it('normalizes the keys', () => {
      const normalized = normalize(first(weirdResponse));
      normalized.image_url.should.equal('https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/:version.jpg');
      normalized.image_versions.should.eql(['tall']);
    });

    it('normalizes bare URLs', () => {
      const normalized = normalize('https://xxx.cloudfront.net/xxx/cat.jpg');
      normalized.image_url.should.equal('https://xxx.cloudfront.net/xxx/cat.jpg');
    });

    it('doesn\'t blow up on images without a ":version" substring', () => {
      const normalized = normalize({ image_url: 'https://xxx.cloudfront.net/xxx/cat.jpg' });
      normalized.image_url.should.equal('https://xxx.cloudfront.net/xxx/cat.jpg');
    });

    it('removes bad responses from mixed response', () => {
      normalize(badResponse.concat(goodResponse)).should.have.lengthOf(1);
    });
  });
});
