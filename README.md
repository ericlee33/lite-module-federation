<h1 align="center">lite-module-federation</h1>

<div align="center">

Lighter weight than webpack 5 module federation

[![NPM version][npm-image]][npm-url] [![NPM downloads][download-image]][download-url]

[npm-image]: http://img.shields.io/npm/v/lite-module-federation.svg?style=flat-square
[npm-url]: http://npmjs.org/package/lite-module-federation
[download-image]: https://img.shields.io/npm/dm/lite-module-federation.svg?style=flat-square
[download-url]: https://npmjs.org/package/lite-module-federation

</div>

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9706d135f6034b35ad0093a38170c2c8~tplv-k3u1fbpfcp-watermark.image?)

English | [简体中文](./README-zh_CN.md)

## What is lite-module-federation?

`lite-module-federation` is an external module dynamic loading scheme, which is more lightweight than Webpack 5 [Module Federation](https://webpack.docschina.org/concepts/module-federation/#motivation). Provides the ability to dynamically load `React` modules when `runtime` is provided.

```js
import { memorizedFetchBundle } from 'lite-module-federation';

const { config } = await memorizedFetchBundle(
  'http://localhost:7001/cdn/remoteEntry.js'
);
const PluginOne = config.componentOne;

ReactDom.render(<PluginOne />, document.getElementById('app'));
```

**Disadvantages of Module Federation**

1. There are prerequisites for use, and both sub-projects and parent projects need to be upgraded to Webpack 5
2. The configuration is cumbersome, it is not easy for users to understand, the documentation is not clear enough, and the mental burden is heavy.
3. If the `remoteEntry` module is loaded dynamically, additional `shared` activation logic needs to be added to the host application. In addition, in order to use `Module Federation`, the host application entry file needs to be transformed into asynchronous loading, which is intrusive.

We want to be as intrusive as possible to the host application, and lightweight and easy to use.

## Install

```js
npm install lite-module-federation
```

## Shared dependencies

Dependencies can be shared between the host project and subprojects.

### Host project configuration

In the root directory of the host project, we create a new `lite-module-federation.config.js` file, in which we configure the dependencies that need to be shared with sub-applications.

```js
// lite-module-federation.config.js
module.exports = {
  shared: {
    react: require('react'),
  },
};
```

After that, we need to add the `alias` of `lite-module-federation.config.js` to the webpack configuration of the host application

```js
module.exports = {
  resolve: {
    alias: {
      'lite-module-federation.config.js': path.resolve(
        __dirname,
        'lite-module-federation.config.js'
      ),
    },
  },
};
```

### Subproject configuration

For the `webpack.config.js` of the sub-project, you need to change the following 2 configurations

- Change output format to `commonjs`
- Set external dependencies `externals`, so that the following dependencies will not be included in the bundle when packaging

```js
module.exports = {
  output: {
    libraryTarget: 'commonjs',
  },
  externals: {
    react: 'react',
  },
};
```

### Practical application

This is a parent-child application scenario, there are 2 projects, one is the child application and the other is the parent application.

In the figure below, we start the parent application locally, and the `plugin-1` and `plugin-2` components are dynamically loaded remote sub-applications `remoteEntry.js`

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fd54d82634364e0d990d21dcf7ffcb4b~tplv-k3u1fbpfcp-watermark.image?)

#### Sub app code

In the sub-application, we `export` out a `config`, which is similar to the `exposes` property of Module Federation, which can export multiple components. The difference here when bundling is that we will configure `react` in `externals` in `webpack`. That is, do not package `React`.

```js
// ./src/plugin
import React from 'react';
import './test.css';

const PluginOne: React.FC<{}> = () => {
  return <div className="sub-app-box">plugin-1</div>;
};
const PluginTwo: React.FC<{}> = () => {
  return <div className="sub-app-box">plugin-2</div>;
};

export const config = {
  componentOne: PluginOne,
  componentTwo: PluginTwo,
};
```

The `Webpack` configuration on the sub-application side is as follows:

```js
const webpack = require('webpack');
module.exports = {
  mode: 'development',
  entry: {
    remoteEntry: './src/plugin.tsx',
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs',
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  externals: {
    react: 'react',
  },
  devServer: {
    hot: true,
    port: 9001,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
};
```

Next, we package the sub-app

```js
npm run build
```

After packaging, we get `remoteEntry.js`, and we upload it to `CDN`.

#### Using plugins on the host side

On the host side, we use the `lite-module-federation` package to parse the packaged `remoteEntry.js` just published to the CDN.
After executing the `memorizedFetchBundle` method, we can load the injected dependency `remoteEntry.js`, get the `config` property, and render the component to the page.

```js
import ReactDom from 'react-dom';
import React, { useEffect, useState } from 'react';
import { memorizedFetchBundle } from 'lite-module-federation';
import './app.css';

const App: React.FC<{}> = () => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(async() => {
      const { config } = await memorizedFetchBundle(
        'http://localhost:7001/cdn/remoteEntry.js'
      );
      setConfig(config);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div>Loading sub-app.....</div>;
  }

  const PluginOne = config.componentOne;
  const PluginTwo = config.componentTwo;

  return (
    <div className="main-box">
      <div className="main-app">Main App</div>
      <div className="sub-app-wrapper">
        <PluginOne />
        <PluginTwo />
      </div>
    </div>
  );
};

ReactDom.render(<App />, document.getElementById('app'));
```

### Scenes to be used

Module Federation usage scenarios:

- It needs to run in the sandbox environment of the host application, and the child application wants to share the same context as the parent application

- Parent-child applications do not require style environment isolation

The usage scenario of `lite-module-federation` is also the same as Module Federation. When you encounter the above scenario and need a lighter solution, you can use `lite-module-federation`.

### Best Practices

https://github.com/ericlee33/remote-plugin-dev

https://juejin.cn/post/7170613119755452446
