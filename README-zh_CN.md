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

[English](./README.md) | 简体中文

## lite-module-federation 是什么？

`lite-module-federation` 是一个外部模块动态加载方案，比 Webpack 5 [Module Federation](https://webpack.docschina.org/concepts/module-federation/#motivation) 更加轻量。提供 `runtime` 时，动态加载 `React` 模块的能力。

```js
import { memorizedFetchBundle } from 'lite-module-federation';

const { config } = await memorizedFetchBundle(
  'http://localhost:7001/cdn/remoteEntry.js'
);
const PluginOne = config.componentOne;

ReactDom.render(<PluginOne />, document.getElementById('app'));
```

**Module Federation 的缺点**

1. 存在使用前提，需要子项目和父项目均升级至 Webpack 5
2. 配置繁琐，对于使用者来说不易理解，文档不够清晰，心智负担重。
3. 如果是动态加载 `remoteEntry` 模块，还需要在宿主应用增加额外的 `shared` 激活逻辑。另外为了使用 `Module Federation`，需要将宿主应用入口文件改造为异步加载，存在侵入性。

我们希望对宿主应用的侵入性尽可能小，并且轻量且好用。

## 安装

```js
npm install lite-module-federation
```

## 共享依赖

宿主项目和子项目之间，可以进行依赖共享。

### 宿主项目配置

在宿主项目根目录，我们新建 `lite-module-federation.config.js` 文件，我们在该文件中，配置需要与子应用共享的依赖。

```js
// lite-module-federation.config.js
module.exports = {
  shared: {
    react: require('react'),
  },
};
```

之后，我们需要在宿主应用的 Webpack 配置中添加 `lite-module-federation.config.js` 的 `alias`

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

### 子项目配置

对于子项目的 `webpack.config.js` 来说，需要改变如下 2 项配置

- 改变输出格式为 `commonjs`
- 设置外置依赖 `externals`，这样在打包时，不会将如下依赖打入 bundle 中

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

### 实际应用

这是一个父子应用的场景，存在 2 个项目，一个是子应用，另一个是父应用。

下图中，我们本地启动了父应用，其中的 `plugin-1` 和 `plugin-2` 组件，是动态加载的远程子应用 `remoteEntry.js`

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fd54d82634364e0d990d21dcf7ffcb4b~tplv-k3u1fbpfcp-watermark.image?)

#### 子应用代码

在子应用中，我们 `export` 出一个 `config` 出去，这里类似于 Module Federation 的 `exposes` 属性，可以导出多个组件。这里在打包时的区别是，我们会在 `webpack` 中`externals` 配置 `react`。也就是不将 `React` 进行打包。

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

子应用侧 `Webpack` 配置如下：

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

接下来，我们将子应用打包

```js
npm run build
```

打包后得到 `remoteEntry.js`，我们将其上传至 `CDN` 上。

#### 宿主侧使用插件

宿主侧，我们使用 `lite-module-federation` 包，解析刚刚发布到 CDN 中打包好的 `remoteEntry.js`。
在执行完 `memorizedFetchBundle` 方法后，我们可以加载出注入依赖后的 `remoteEntry.js`，拿到其中的 `config` 属性，将组件渲染到页面中。

```js
import ReactDom from 'react-dom';
import React, { useEffect, useState } from 'react';
import { memorizedFetchBundle } from 'lite-module-federation';
import './app.css';

const App: React.FC<{}> = () => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(async () => {
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

### 使用场景

Module Federation 的使用场景：

- 需要运行在宿主应用的沙箱环境中，子应用希望与父应用共享同一个上下文

- 父子应用不需要样式环境隔离

`lite-module-federation` 的使用场景也与 Module Federation 相同，当你有遇到如上场景时，又需要一个更轻量的方案时，可以使用`lite-module-federation`。

### 最佳实践

https://juejin.cn/post/7170613119755452446
