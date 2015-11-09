import Image from '../../../schema/image';
import { ResizedImageUrl } from '../../../schema/image/resized';

describe('Image', () => {
  describe('ResizedImageUrl', () => {
    let image = {
      original_height: 2333,
      original_width: 3500,
      image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg'
    };

    it('takes an image response with options and resizes it to fit', () => {
      let resized = ResizedImageUrl(image, { width: 500, height: 500 });
      resized.should.eql({
        factor: 0.14285714285714285,
        height: 333,
        width: 500,
        url: 'https://i.embed.ly.test/1/display/resize?grow=false&url=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=500&height=333&key=xxx_embedly_key_xxx&quality=95'
      });
    });

    it('returns a resized image URL when existing image dimensions are lacking', () => {
      let resized = ResizedImageUrl({ image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg' }, { width: 500, height: 500 });
      resized.should.eql({
        factor: Infinity,
        width: undefined,
        height: undefined,
        url: 'https://i.embed.ly.test/1/display/resize?grow=false&url=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=500&height=500&key=xxx_embedly_key_xxx&quality=95'
      });
    });
  });
});
