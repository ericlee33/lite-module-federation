type GetSharedDependencies = () => {
  [key: string]: string;
};

export const getSharedDependencies: GetSharedDependencies = () => {
  const config = require('lite-module-federation.config.js');

  if (!config.shared) {
    throw new Error(
      `cannot found registered \"shared\" deps in 'lite-module-federation.config.js' `
    );
  }

  return config.shared;
};
