# capture-book

capture book 抓取书籍

## 说明

网上的图书有很多，但是有些书籍不方便下载，或者下载的书籍有广告不方便阅读，所以我就写了这个小程序。有问题欢迎提issue。

**自用自玩即可，请勿明目张胆的商用，不然可能会侵犯某些正版图书网站的版权**

## 拓展

在src/book-creator目录上可以有很多 不同图书网站图书 的 生成器，如果当下的 book 生成器不是很适用需求，可以参考 bao-zi-man-hua 这个目录再写一个。

使用很简单，只需要在src/book-creator目录上创建目录，比如 xx-man-hua，之后把 bao-zi-man-hua拷贝一下，然后在src/book-creator/index.js调用即可。

例如：

**capture-book/src/book-creator/index.js**

```js
import * as xxManHua from "./xx-man-hua/index.js";

const bookCreators = {
  ...

  // xxManHua的生成器
  xxManHua: async () => {
    const { creator, url, fileName } = xxManHua;
    await creator(url, fileName);
  },
};

export default bookCreators;

```

**capture-book/src/main.js**

```js
import bookCreators from "./book-creator/index.js";

const main = async () => {
//   await bookCreators.baoZiManHua();
  // call xxManHua
  await bookCreators.xxManHua();
};

(async () => {
  await main();
})();

```
