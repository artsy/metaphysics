import { times, concat, clone } from 'lodash';

// see https://github.com/artsy/force/issues/4705
export const params = [
  {
    id: 'geometric',
    gene_id: 'geometric',
  },
  {
    id: 'landscape',
    gene_id: 'landscape',
  },
  {
    id: 'emerging-art-painting',
    gene_id: 'emerging-art',
    medium: 'painting',
    price_range: '50.00-10000.00',
  },
  {
    id: 'emerging-art-photography',
    gene_id: 'emerging-art',
    medium: 'photography',
    price_range: '50.00-10000.00',
  },
  {
    id: 'graffiti-slash-street-art',
    gene_id: 'graffiti-slash-street-art',
    price_range: '50.00-5000.00',
  },
  {
    id: 'pop-and-contemporary-pop',
    gene_id: 'pop-and-contemporary-pop',
    medium: 'prints',
    price_range: '50.00-5000.00',
  },
  {
    id: 'black-and-white',
    gene_id: 'black-and-white',
    medium: 'photography',
    price_range: '50.00-10000.00',
  },
  {
    id: 'abstract-art',
    gene_id: 'abstract-art',
    medium: 'painting',
    price_range: '50.00-10000.00',
  },
  {
    id: 'figurative-painting',
    gene_id: 'figurative-painting',
    medium: 'painting',
    price_range: '50.00-10000.00',
  },
  {
    id: 'collage',
    gene_id: 'collage',
    medium: 'work-on-paper',
    price_range: '50.00-5000.00',
  },
];

export default (modules) => {
  const clonedParams = clone(params);
  return concat(modules, times(10, () => {
    const index = Math.floor(Math.random() * clonedParams.length);
    const moduleParams = clonedParams[index];
    clonedParams.splice(index, 1);
    return {
      key: 'generic_gene',
      display: true,
      params: moduleParams,
    };
  }));
};
