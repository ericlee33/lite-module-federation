import { memoize } from './utils';
import { injectExternalDepsForModule } from './core/injectExternalDepsForModule';
import { loadRequireFuncOfBundle } from './core/loadRequireFuncOfBundle';

type MemorizedModuleFetcher = (url: string) => Promise<any>;

const showInfoWhenBundleNotFound = () => {
  console.warn(
    `[lite-module-federation] Bundle is empty, please check to see if the 'url' is correct`
  );
};

const fetchModule = (url, require) => {
  return fetch(url)
    .then((data) => data.text())
    .then((text) => {
      if (!text) {
        showInfoWhenBundleNotFound();
      }

      return injectExternalDepsForModule(require, text);
    });
};

const requireFunc = loadRequireFuncOfBundle();

/**
 * Fetch the bundle with cache
 *
 * e.g. memorizedFetchBundle(bundle_CDN_url: string)
 *
 * cache by `url`
 */
export const memorizedFetchBundle: MemorizedModuleFetcher = memoize((url) =>
  fetchModule(url, requireFunc)
);

export default memorizedFetchBundle;
