import Image from '../../../schema/image';
import { CroppedImageUrl } from '../../../schema/image/cropped';

describe('Image', () => {
  describe('CroppedImageUrl', () => {
    let image = {
      image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg'
    };

    it('takes an image response with options and resizes it to crop', () => {
      CroppedImageUrl(image, { width: 500, height: 500 })
        .should.eql({
          width: 500,
          height: 500,
          url: 'https://gemini.cloudfront.test/?resize_to=crop&height=500&width=500&quality=95&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg'
        });
    });
  });
});
