import * as baoZiManHua from "./bao-zi-man-hua/index.js";

const bookCreators = {
  // baoZiManHua的生成器
  baoZiManHua: async () => {
    const { creator, url, fileName } = baoZiManHua;
    await creator(url, fileName);
  },
};

export default bookCreators;
