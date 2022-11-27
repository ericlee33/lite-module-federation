export const memoize = (func) => {
  const cache = {};
  return (key: string) => {
    if (!(key in cache)) {
      cache[key] = func(key);
    }
    return cache[key];
  };
};
