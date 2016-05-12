import { times, concat } from 'lodash';

export default (modules) => {
  // see https://github.com/artsy/force/issues/4705
  const params = [
    {
      gene_id: 'geometric',
    },
    {
      gene_id: 'landscape',
    },
    {
      gene_id: 'emerging-art',
      medium: 'painting',
      price_range: '50.00-10000.00',
    },
    {
      gene_id: 'emerging-art',
      medium: 'painting',
      price_range: '50.00-10000.00',
    },
    {
      gene_id: 'emerging-art',
      medium: 'photography',
      price_range: '50.00-10000.00',
    },
    {
      gene_id: 'graffiti-slash-street-art',
      price_range: '50.00-5000.00',
    },
    {
      gene_id: 'pop-and-contemporary-pop',
      medium: 'prints',
      price_range: '50.00-5000.00',
    },
    {
      gene_id: 'black-and-white',
      medium: 'photography',
      price_range: '50.00-10000.00',
    },
    {
      gene_id: 'abstract-art',
      medium: 'painting',
      price_range: '50.00-10000.00',
    },
    {
      gene_id: 'figurative-painting',
      medium: 'painting',
      price_range: '50.00-10000.00',
    },
    {
      gene_id: 'collage',
      medium: 'work-on-paper',
      price_range: '50.00-5000.00',
    },
  ];

  return concat(modules, times(10, () => {
    const index = Math.floor(Math.random() * params.length);
    const moduleParams = params[index];
    params.splice(index, 1);
    return {
      key: 'generic_gene',
      display: true,
      params: moduleParams,
    };
  }));
};
