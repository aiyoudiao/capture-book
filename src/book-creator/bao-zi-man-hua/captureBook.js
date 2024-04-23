import puppeteer from "puppeteer";
import fs from "fs";
import PDFDocument from "pdfkit";
import chalk from "chalk";
import ora from "ora";
import signale from "signale";
import {
  startPageNumber,
  totalSize,
  getPageUrl,
  anchorSelector,
  pageSize,
  getPageWidth,
  getPageHeight,
} from "./config.js";

let spinner, pageUrl, currentPage, numPages, currentNumber, totalNumber;

export async function captureImagesAndGeneratePDF(bookUrl, outputFile) {
  const browser = await puppeteer.launch({
    headless: true, // 设置为true则为无头模式，设置为false则显示浏览器窗口
    args: [
      // `--window-size=${612 * ratio},${792 * ratio}`, // 设置浏览器窗口大小
      "--no-sandbox", // 禁用沙盒模式
      "--disable-setuid-sandbox", // 禁用设置用户标识沙盒
      // 可以根据需要传递其他参数
    ],
  });

  const doc = new PDFDocument({ autoFirstPage: false, size: pageSize });
  const page = await browser.newPage();
  await page.setViewport({
    width: getPageWidth(),
    height: getPageHeight(),
  });
  await page.setCacheEnabled(true);
  await page.setDefaultNavigationTimeout(30000 * 5);
  const pdfStream = fs.createWriteStream(outputFile);

  doc.pipe(pdfStream);

  try {
    await page.goto(bookUrl, { waitUntil: "networkidle2" });

    numPages = await getNumberOfPages(page);
    signale.success(chalk.green(`Number of pages: ${numPages}`));

    spinner = ora("Processing pages \n").start();
    currentPage = startPageNumber || 1;
    while (currentPage <= numPages) {
      spinner.text = `Processing page ${currentPage}/${numPages}\n`;
      await goToBookPage(page, bookUrl, currentPage);
      const imageUrls = await scrapeImageUrls(page);
      signale.info(
        chalk.blue(`Page ${currentPage}: ${imageUrls.length} images found\n`)
      );
      try {
        await captureImagesOnPage(page, imageUrls, doc);
      } catch (error) {
        signale.error(chalk.red("Error:"), error);
        signale.info(
          chalk.blue("Retry -> "),
          `[captureImagesAndGeneratePDF] Page: ${currentPage}/${numPages}, bookUrl: ${bookUrl}\n`
        );
        await captureImagesOnPage(page, imageUrls, doc);
      }
      signale.success(chalk.green(`Completed to page: ${pageUrl}`));
      currentPage++;
    }
    spinner.succeed(chalk.green("PDF generated successfully"));
  } catch (error) {
    signale.error(chalk.red("Error:"), error);
    spinner.fail(chalk.green("PDF generated error"));
  } finally {
    doc.end();
    pdfStream.on("finish", () => {
      signale.success(chalk.green("PDF stream finished"));
      browser.close();
    });
  }
}

// 获取漫画的总页数
async function getNumberOfPages(page) {
  return parseInt(
    totalSize ||
      (await page.evaluate(() => {
        const lastPageElement = document.querySelector(".last-page");
        return lastPageElement.textContent;
      }))
  );
}

// 跳转到指定的页面
async function goToBookPage(page, bookUrl, pageNumber) {
  pageUrl =
    getPageUrl?.(bookUrl, pageNumber) || `${bookUrl}?page=${pageNumber}`;
  signale.pending(`${chalk.yellow(`Navigating to page: ${pageUrl}`)} \n`);
  try {
    await page.goto(pageUrl, { waitUntil: "networkidle2" });
  } catch (error) {
    signale.error(chalk.red("Error:"), error);
    signale.info(
      chalk.blue("Retry -> "),
      `[goToBookPage], pageUrl: ${pageUrl}\n`
    );
    await page.reload();
  }
}

// 收集页面中的img
async function scrapeImageUrls(page) {
  try {
    return await page.evaluate((selector) => {
      const imageElements = document.querySelectorAll(selector || "img");
      const imageUrls = [];
      imageElements.forEach((img) => {
        const src = img.getAttribute("src");
        imageUrls.push(src);
      });
      return imageUrls;
    }, anchorSelector);
  } catch (error) {
    signale.error(chalk.red("Error in scrapeImageUrls:"), error);
    return [];
  }
}

// 抓取页面中所有的图片
async function captureImagesOnPage(page, imageUrls, doc) {
  currentNumber = 1;
  totalNumber = imageUrls.length;
  for (const imageUrl of imageUrls) {
    try {
      spinner.text = `Processing page ${currentPage}/${numPages}, Processing image ${currentNumber}/${totalNumber}, Capturing ${imageUrl} \n`;
      const screenshotPath = `temp_screenshot_${currentPage}-${currentNumber}.jpg`;
      try {
        await page.goto(imageUrl, { waitUntil: "networkidle2" });
        await page.screenshot({ path: screenshotPath });
      } catch (error) {
        signale.error(chalk.red(`Error capturing ${imageUrl}:`), error);
        signale.info(
          chalk.blue("Retry =>> "),
          `[captureImagesOnPage] Page: ${currentPage}/${numPages}, Image: ${currentNumber}/${totalNumber}, imageUrl: ${imageUrl}\n`
        );
        await page.reload();
        await page.screenshot({ path: screenshotPath });
      }
      doc.addPage();
      doc.image(screenshotPath, 0, 0, {
        fit: [doc.page.width, doc.page.height],
        align: "center",
        valign: "center",
      });
      fs.unlinkSync(screenshotPath);
      spinner.text = `Processing page ${currentPage}/${numPages}, Processing image ${currentNumber++}/${totalNumber}, Captured ${imageUrl} successfully\n`;
    } catch (error) {
      signale.error(chalk.red(`Error capturing ${imageUrl}:`), error);
    }
  }
}
