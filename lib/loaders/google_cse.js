import { assign } from 'lodash';
import { toQueryString } from '../helpers';
import googleCSE from '../apis/google_cse';
import httpLoader from './http';
const {
  GOOGLE_CSE_KEY,
  GOOGLE_CSE_CX,
} = process.env;

export const googleCSELoader = httpLoader(googleCSE);

export default (options = {}) => {
  const queryString = toQueryString(assign(options, {
    key: GOOGLE_CSE_KEY,
    cx: GOOGLE_CSE_CX,
  }));

  return googleCSELoader.load(`?${queryString}`);
};
