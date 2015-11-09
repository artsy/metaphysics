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
      ResizedImageUrl(image, { width: 500, height: 500 })
        .should.eql({
          factor: 0.14285714285714285,
          width: 500,
          height: 333,
          url: 'https://gemini.cloudfront.test/?resize_to=fit&height=333&width=500&quality=95&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg'
        });
    });

    it('returns a resized image URL when existing image dimensions are lacking', () => {
      ResizedImageUrl({
        image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg'
      }, { width: 500, height: 500 })
        .should.eql({
          factor: Infinity,
          width: undefined,
          height: undefined,
          url: 'https://gemini.cloudfront.test/?resize_to=fit&height=500&width=500&quality=95&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg'
        });
    });
  });
});
