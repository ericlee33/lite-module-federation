import { Require } from './loadRequireFuncOfBundle';

type InjectExternalDepsForModule = (
  require: Require,
  bundle: string
) => Record<string, any>;

const evalBundleWithNewFunction = (bundle) =>
  new Function('require', 'module', 'exports', bundle);

export const injectExternalDepsForModule: InjectExternalDepsForModule = (
  require,
  bundle
) => {
  const exports = {};
  const module = { exports };
  // if we configure the webpack external option with `react`
  // the bundle will have `require('react')` methods, so we need to inject this method

  // note: bundle must be formatted as commonjs
  evalBundleWithNewFunction(bundle)(require, module, exports);
  return module.exports;
};
