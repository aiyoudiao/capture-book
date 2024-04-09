export const url = "https://cn.czmanga.com/comic/chapter/cangyuantu-shenman"; // 书的url
export const fileName = `cangyuantu-${Date.now()}.pdf`; // 生成的文件名
export const startPageNumber = 0; // 起始章节数
export const totalSize = 1; // 一本书的总章节数
export const getPageUrl = (siteUrl, pageNumber) =>
  `${siteUrl}/0_${pageNumber}.html`; // 每一个页面的url
export const anchorSelector = ".comic-contain div >amp-img"; // 指定图片的选择器
export const ratio = 1.5; // 越大越清晰，但生成的文件越大
