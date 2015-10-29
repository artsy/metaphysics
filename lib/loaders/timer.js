export default {
  start: (key) => {
    let start = process.hrtime();
    console.info(`Loading: ${key}`);
    return start;
  },

  end: (start) => {
    let end = process.hrtime(start);
    console.info(`Elapsed: ${end[1] / 1000000}ms`);
    return end;
  }
};
