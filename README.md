# Rhine.bio 主站

面向读者的内容导航与渐进式网页应用。当前以中文呈现，世界语为长期目标，完整翻译与校对尚未落实。

## 运行

需要 Node.js 20 或更新版本。

```sh
npm ci
npm run build
npm run serve
```

默认地址为 `http://127.0.0.1:4327/Rhine.BIO/`。构建输出在 `dist/`；将其内容部署到网站对应的目录。默认子路径是 `/Rhine.BIO/`，修改时构建和本地服务均需设置同一个 `BASE_PATH`（必须以 `/` 开始和结束），例如：

```sh
BASE_PATH=/example/ npm run build
BASE_PATH=/example/ npm run serve
```

## 验证

```sh
npx playwright install chromium
npm test
```

测试使用本机 4328 端口并在结束时关闭服务。浏览器首次在线访问后，Service Worker 缓存首页及其必要资源；离线时可刷新首页，但其他站点及未缓存页面不可离线使用。Service Worker 仅控制配置的子路径；构建内容变更时缓存版本随之更新。安装功能取决于浏览器支持及 HTTPS（本地回环地址除外）。
