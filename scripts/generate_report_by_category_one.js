const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// 递归查找 catalog_name
function findCategoryName(nodes, code) {
  for (const n of nodes) {
    if (n.code === code) return n.catalog_name;
    if (n.children) {
      const found = findCategoryName(n.children, code);
      if (found) return found;
    }
  }
  return '';
}

const categoriesPath = path.join(__dirname, '../public/categories.json');
const categoriesRaw = fs.readFileSync(categoriesPath, 'utf8');
const categories = JSON.parse(categoriesRaw);

const outputRoot = path.join(__dirname, '../gmc_data/output');
const countryDirs = fs.readdirSync(outputRoot).filter(f => fs.statSync(path.join(outputRoot, f)).isDirectory());

const startTime = Date.now();

for (const country of countryDirs) {
  const countryDir = path.join(outputRoot, country);
  const catDirs = fs.readdirSync(countryDir).filter(f => fs.statSync(path.join(countryDir, f)).isDirectory());
  for (const catId of catDirs) {
    const catDir = path.join(countryDir, catId);
    const csvFiles = fs.readdirSync(catDir).filter(f => f.endsWith('.csv'));
    for (const csvFile of csvFiles) {
      const csvPath = path.join(catDir, csvFile);
      const csvContent = fs.readFileSync(csvPath, 'utf-8');

      
      
      const parsed = Papa.parse(csvContent, { 
        header: true,
        newline: '\n', // <-- 关键修复：手动指定换行符
        skipEmptyLines: true // 推荐加入此选项，可以跳过空行
      });

      const rows = parsed.data.filter(r => r.product_title);

      // Top 10 产品（按rank排序，取前十，product_title唯一）
      const parseNum = v => Number(String(v).replace(/[^\d.\-]/g, ''));
      const rankNum = v => parseNum(v);
      // 按rank升序排序
      const sortedRows = rows.slice().sort((a, b) => rankNum(a.rank) - rankNum(b.rank));
      const seenTitles = new Set();
      let topProducts = [];
      for (const r of sortedRows) {
        if (r.product_title && !seenTitles.has(r.product_title)) {
          topProducts.push(r);
          seenTitles.add(r.product_title);
        }
        if (topProducts.length >= 10) break;
      }

      // Top Performing Products - no brand
      const topNoBrandProducts = rows.filter(r => !r.brand || String(r.brand).trim() === '' || r.brand === 'no brand').sort((a, b) => rankNum(a.rank) - rankNum(b.rank)).slice(0, 10);

      // 品牌分布
      const brandCount = {};
      rows.forEach(r => {
        const brand = r.brand && String(r.brand).trim() ? r.brand : 'no brand';
        brandCount[brand] = (brandCount[brand] || 0) + 1;
      });
      const totalBrands = Object.values(brandCount).reduce((a, b) => a + b, 0);
      const sortedBrands = Object.entries(brandCount).sort((a, b) => b[1] - a[1]);
      const topN = 10;
      const topBrands = sortedBrands.slice(0, topN);
      const otherCount = sortedBrands.slice(topN).reduce((sum, [, count]) => sum + count, 0);
      const brandTableRows = topBrands.map(([brand, count]) => ({ brand, share: ((count / totalBrands) * 100).toFixed(1) + '%' }));
      if (otherCount > 0) {
        brandTableRows.push({ brand: 'other brands', share: ((otherCount / totalBrands) * 100).toFixed(1) + '%' });
      }
      let brandTableHtml = `<table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
        <thead>
          <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
            <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
            <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Share</th>
          </tr>
        </thead>
        <tbody>
          ${brandTableRows.map(row => `
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${row.brand}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${row.share}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;

      // Fastest Growing Products
      const growthRows = rows.filter(r => r.rank && r.previous_rank && !isNaN(Number(r.rank)) && !isNaN(Number(r.previous_rank)))
        .map(r => ({
          ...r,
          rankChange: Number(r.previous_rank) - Number(r.rank),
          demandChange: (r.previous_relative_demand_bucket && r.relative_demand_bucket && r.previous_relative_demand_bucket !== r.relative_demand_bucket)
            ? `${r.previous_relative_demand_bucket} → ${r.relative_demand_bucket}`
            : (r.relative_demand_bucket ? `Stable (${r.relative_demand_bucket})` : ''),
        }))
        .sort((a, b) => b.rankChange - a.rankChange)
        .slice(0, 10);
      // 新品
      const newEntries = rows.filter(r => (!r.previous_rank || isNaN(Number(r.previous_rank))) && r.rank)
        .slice(0, Math.max(0, 10 - growthRows.length))
        .map(r => ({
          ...r,
          rankChange: 'New entry',
          demandChange: 'New entry',
        }));
      const fastestGrowing = growthRows.concat(newEntries).slice(0, 10);

      // 价格区间
      function priceRange(row) {
        if (row.price_min && row.price_max && row.price_min !== row.price_max) {
          return `${row.price_min} - ${row.price_max} ${row.price_currency || ''}`;
        } else if (row.price_min) {
          return `${row.price_min} ${row.price_currency || ''}`;
        } else {
          return '';
        }
      }

      // 增加一个查找category name的函数
      function getCategoryName(code) {
        return findCategoryName(categories, code) || code;
      }

      // 类目ID和名称
      const categoryId = catId;
      let categoryName = '';
      try {
        categoryName = categoryId ? findCategoryName(categories, categoryId) : '';
      } catch (e) {
        categoryName = '';
      }
      // 最新rank_timestamp
      const latestRankTimestamp = rows.map(r => r.rank_timestamp).filter(Boolean).sort().reverse()[0] || '';
      // 只保留日期部分
      const latestDate = latestRankTimestamp.split(' ')[0];
      const subHeader = `Week of ${latestDate} | ${categoryName} | ${country}`;

      // 生成 HTML
      let html = `
      <div style="background:#f7f9fa;padding:40px 0 0 0;min-height:100vh;">
        <div style="max-width:900px;margin:0 auto;background:#fff;padding:32px 32px 48px 32px;border-radius:8px;box-shadow:0 2px 8px #0001;">
          <div style="text-align:center;margin-bottom:1.5rem;"><img src="https://www.ecompulsedata.com/logo-footer.png" alt="logo" style="height:48px;"></div>
          <h1 style="font-size:2.5rem;font-weight:700;text-align:center;color:#2a3b4d;margin-bottom:0.5rem;">E-Commerce Trend Report</h1>
          <div style="text-align:center;color:#444;font-size:1.1rem;margin-bottom:2.5rem;">${subHeader}</div>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Top Performing Products</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead>
              <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Product</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Category</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Price</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Demand</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.map(p => `
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.rank || ''}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.product_title || ''}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.brand || '-'}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${getCategoryName(p.ranking_category)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${priceRange(p)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.relative_demand_bucket || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Top Performing Products - no brand</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead>
              <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Product</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Category</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Price</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Demand</th>
              </tr>
            </thead>
            <tbody>
              ${topNoBrandProducts.map(p => `
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.rank || ''}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.product_title || ''}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.brand || '-'}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${getCategoryName(p.ranking_category)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${priceRange(p)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.relative_demand_bucket || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Fastest Growing Products</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead>
              <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Previous Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Product</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Category</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank Change</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Demand Change</th>
              </tr>
            </thead>
            <tbody>
              ${fastestGrowing.map(p => `
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.rank || ''}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.previous_rank || ''}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.product_title || ''}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${p.brand || '-'}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">${getCategoryName(p.ranking_category)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;color:${typeof p.rankChange === 'number' && p.rankChange > 0 ? '#1dbf73' : '#888'};font-weight:600;">${typeof p.rankChange === 'number' ? (p.rankChange > 0 ? `+${p.rankChange} positions` : (p.rankChange < 0 ? `${p.rankChange} positions` : 'Stable')) : p.rankChange}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;color:${p.demandChange && p.demandChange.includes('→') ? '#1dbf73' : '#888'};font-weight:600;">${p.demandChange}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Brand Distribution</h2>
          ${brandTableHtml}
          <div style="text-align:center;color:#888;font-size:0.95rem;margin-top:2.5rem;">Data source: <a href="https://www.ecompulsedata.com" style="color:#888;text-decoration:underline;">ecompulsedata.com</a> &copy; ecompulsedata.com All rights reserved.</div>
        </div>
      </div>
      `;
      // 保存 HTML
      const htmlFilePath = csvPath.replace(/\.csv$/, '.analyzed.html');
      fs.writeFileSync(htmlFilePath, html, 'utf-8');
      console.log(`已生成: ${htmlFilePath}`);
    }
  }
}
const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`全部国家和类目报表生成完成，总用时: ${duration} 秒`); 