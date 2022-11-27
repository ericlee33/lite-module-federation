import { getSharedDependencies } from './getSharedDependencies';

export type Require = (name: string) => string;

type LoadRequireFuncOfBundle = () => Require;

export const loadRequireFuncOfBundle: LoadRequireFuncOfBundle = () => {
  const sharedDeps = getSharedDependencies() || {};

  return (packageName) => {
    if (!(packageName in sharedDeps)) {
      throw new Error(
        `cannot require '${packageName}'. because '${packageName}' does not exist in shared dependencies.`
      );
    }

    return sharedDeps[packageName];
  };
};
