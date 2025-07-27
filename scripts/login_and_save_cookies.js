// 文件名: login_and_save_cookies.js
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function loginAndSave() {
  console.log("正在启动浏览器...");
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // 前往谷歌首页，这里更容易进行登录操作
  await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });

  console.log("\n=======================================================");
  console.log("浏览器已打开。请在浏览器窗口中进行以下操作：");
  console.log("  1. 如果有Cookie弹窗，请点击“接受”或“同意”。");
  console.log("  2. 请登录您的Google账户。");
  console.log("  3. 如果遇到任何“人机验证”，请手动完成。");
  console.log("\n操作完成后，请将浏览器放在一旁，不要关闭它。");
  console.log("脚本将在 2 分钟后自动保存您的登录信息并关闭浏览器。");
  console.log("=======================================================\n");

  // 等待2分钟，给用户充足的时间来手动操作
  await new Promise(resolve => setTimeout(resolve, 120000));

  // 保存当前页面的 Cookies 到一个文件中
  const cookies = await page.cookies();
  await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));

  console.log("✅ Cookies 已成功保存到 cookies.json 文件。");
  console.log("现在您可以进行第二步了。");

  await browser.close();
}

loginAndSave();