import marked from 'marked';

export default (value, format) => {
  if (format === 'html' || format === 'markdown') {
    const renderer = new marked.Renderer;
    marked.setOptions({
      renderer,
      gfm: true,
      tables: true,
      breaks: true,
      pedantic: false,
      sanitize: false,
      smartypants: false,
    });
    return marked(value);
  }

  return value;
};
