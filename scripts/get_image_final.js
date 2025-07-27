// 文件名: scrape_with_cookies.js (智能尺寸筛选最终版)
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// 自动滚动页面的函数
async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function scrapeWithSmartFilter() {
  console.log("正在启动浏览器...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("加载并清洗Cookies...");
    const cookiesString = await fs.readFile('./cookies.json');
    let cookies = JSON.parse(cookiesString);
    const cleanedCookies = cookies.map(cookie => {
      const newCookie = {
        name: cookie.name, value: cookie.value, domain: cookie.domain,
        path: cookie.path, secure: cookie.secure, httpOnly: cookie.httpOnly,
      };
      if (cookie.expirationDate) newCookie.expires = cookie.expirationDate;
      else if (cookie.expires) newCookie.expires = cookie.expires;
      if (['Lax', 'Strict', 'None'].includes(cookie.sameSite)) newCookie.sameSite = cookie.sameSite;
      return newCookie;
    }).filter(cookie => cookie.name);
    await page.setCookie(...cleanedCookies);
    console.log("✅ Cookies 加载成功。");

    const url = "https://www.google.com/search?q=Sky-Touch+Disposable+Absorbent+Quick+Drying+Leak-Proof+Pee+Pads+For+Potty+Training+For+Pets&sca_esv=7434d0bd66bb8ac8&biw=1536&bih=826&udm=28&sxsrf=AE3TifMWgUemJKlC3U24kUBeSHZMLRhegg%3A1753539236361&shopmd=1&ei=pOKEaKLXFbvn5NoPrfym2Qw&ved=0ahUKEwiiuaHa2tqOAxW7M1kFHS2-KcsQ4dUDCCI&uact=5&oq=Sky-Touch+Disposable+Absorbent+Quick+Drying+Leak-Proof+Pee+Pads+For+Potty+Training+For+Pets&gs_lp=Ehlnd3Mtd2l6LW1vZGVsZXNzLXNob3BwaW5nIltTa3ktVG91Y2ggRGlzcG9zYWJsZSBBYnNvcmJlbnQgUXVpY2sgRHJ5aW5nIExlYWstUHJvb2YgUGVlIFBhZHMgRm9yIFBvdHR5IFRyYWluaW5nIEZvciBQZXRzMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHSJEUUN4MWN4McAF4AZABAJgBAKABAKoBALgBA8gBAPgBAvgBAZgCAaACH5gDAIgGAZAGCJIHATGgBwCyBwC4BwDCBwM5LTHIB_0Y&sclient=gws-wiz-modeless-shopping";
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log("页面初步加载完毕。");

    try {
      const continueButtonSelector = 'button ::-p-text("Continue without address")';
      await page.waitForSelector(continueButtonSelector, { timeout: 5000 });
      await page.click(continueButtonSelector);
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("地址弹窗已处理。");
    } catch (e) {
      console.log("未检测到地址弹窗。");
    }

    console.log("正在滚动页面以加载所有懒加载内容...");
    await autoScroll(page);
    console.log("页面滚动完成。");

    console.log("正在检查所有框架并使用【智能尺寸筛选】策略查找图片...");
    let firstImgSrc = null;
    const frames = page.frames();

    for (const frame of frames) {
        try {
            const selector = 'div#search a img';
            await frame.waitForSelector(selector, { timeout: 5000 });
            
            // ================== 核心改动：智能筛选逻辑 ==================
            const imgSrc = await frame.evaluate((selector) => {
                const MIN_IMAGE_SIZE = 50; // 定义最小像素尺寸
                const imgs = Array.from(document.querySelectorAll(selector));
                
                // 1. 过滤掉data URI和尺寸过小的图片
                const largeEnoughImgs = imgs.filter(img => {
                    return img.src && 
                           !img.src.startsWith('data:') &&
                           img.naturalWidth > MIN_IMAGE_SIZE &&
                           img.naturalHeight > MIN_IMAGE_SIZE;
                });
                
                // 2. 在合格的图片中返回第一张的src
                return largeEnoughImgs.length > 0 ? largeEnoughImgs[0].src : null;
            }, selector);
            // ==========================================================

            if (imgSrc) {
                firstImgSrc = imgSrc;
                break; 
            }
        } catch (error) {
            // 在这个框架里没找到，继续检查下一个
        }
    }

    if (firstImgSrc) {
        console.log(`\n✅ 找到目标产品图片链接: ${firstImgSrc}`);
        
        try {
            console.log("正在下载图片...");
            const response = await axios({
                method: 'GET', url: firstImgSrc, responseType: 'arraybuffer'
            });
            const urlObject = new URL(firstImgSrc);
            const imageName = path.basename(urlObject.pathname) || 'product_image.jpg';
            const savePath = path.resolve(__dirname, imageName);
            await fs.writeFile(savePath, response.data);
            console.log(`✅ 图片已成功下载并保存为: ${savePath}`);
        } catch (downloadError) {
            console.error("❌ 下载图片时出错:", downloadError.message);
        }

    } else {
        await page.screenshot({ path: 'final_failure_v6.png' });
        console.log("\n❌ 遗憾，智能筛选后依然未找到合适的产品图片。已保存截图 'final_failure_v6.png'。\n");
    }

  } catch (error) {
    console.error("\n❌ 抓取过程中出现意外错误:", error.message);
    await page.screenshot({ path: 'error_screenshot_v6.png' });
    console.log("已保存错误截图 'error_screenshot_v6.png'");
  } finally {
    await browser.close();
    console.log("浏览器已关闭。");
  }
}

scrapeWithSmartFilter();