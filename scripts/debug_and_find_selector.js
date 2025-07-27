// 文件名: debug_and_find_selector.js
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function debugAndFindSelector() {
  console.log("正在加载 Cookies...");
  const cookiesString = await fs.readFile('./cookies.json');
  const cookies = JSON.parse(cookiesString);

  console.log("以【非无头模式】启动浏览器，您会看到一个窗口...");
  const browser = await puppeteer.launch({ headless: false }); // 显示浏览器界面
  const page = await browser.newPage();
  await page.setCookie(...cookies);

  const url = "https://www.google.com/search?q=Sky-Touch+Disposable+Absorbent+Quick+Drying+Leak-Proof+Pee+Pads+For+Potty+Training+For+Pets&hl=en";
  console.log("正在导航到搜索页面...");
  await page.goto(url, { waitUntil: 'networkidle2' });

  console.log("\n======================== 操作指南 ========================");
  console.log("浏览器已打开，并停在搜索结果页面上。");
  console.log("请您现在操作那个打开的浏览器窗口：");
  console.log("  1. 在页面上找到您想要抓取的第一个图片。");
  console.log("  2. 用鼠标右键点击那个图片。");
  console.log("  3. 在弹出的菜单中，选择“检查”（Inspect）。");
  console.log("  4. 此时屏幕右侧会打开开发者工具，并且会高亮显示那张图片的HTML代码。");
  console.log("  5. 在高亮的代码上再次点击右键 -> 选择“复制”(Copy) -> 选择“复制选择器”(Copy selector)。");
  console.log("\n现在，您已经把新的、正确的选择器复制到了剪贴板里！");
  console.log("脚本将保持运行 2 分钟，之后会自动关闭。");
  console.log("========================================================\n");

  // 等待2分钟，给用户充足的时间来手动检查和复制
  await new Promise(resolve => setTimeout(resolve, 120000));

  console.log("调试时间结束，正在关闭浏览器。");
  await browser.close();
}

debugAndFindSelector();