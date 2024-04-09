import bookCreators from "./book-creator/index.js";

const main = async () => {
  await bookCreators.baoZiManHua();
};

(async () => {
  await main();
})();
