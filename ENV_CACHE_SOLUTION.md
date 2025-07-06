# Next.js 环境变量缓存问题解决方案

## 问题描述
修改 `.env` 文件后，环境变量没有立即生效，存在缓存问题。

## 解决方案

### 1. 清除 Next.js 缓存
```bash
# 删除 .next 目录
rm -rf .next

# 删除 node_modules/.cache 目录
rm -rf node_modules/.cache

# 重新安装依赖
npm install
```

### 2. 重启开发服务器
```bash
# 停止当前开发服务器 (Ctrl+C)
# 重新启动
npm run dev
```

### 3. 清除浏览器缓存
- 按 `Ctrl+F5` 强制刷新页面
- 或者打开开发者工具，右键刷新按钮选择"清空缓存并硬性重新加载"

### 4. 重启 IDE/编辑器
- 完全关闭你的代码编辑器
- 重新打开项目

### 5. 验证环境变量

#### 方法一：使用测试脚本
```bash
node test-env-nextjs.js
```

#### 方法二：访问 API 路由
启动开发服务器后，访问：
```
http://localhost:3000/api/test-env
```

### 6. 检查 .env 文件语法
确保 `.env` 文件没有语法错误：
- 每行一个变量
- 没有多余的空格或引号
- 没有特殊字符

### 7. 环境变量加载顺序
Next.js 按以下顺序加载环境变量：
1. `.env.local` (最高优先级)
2. `.env.development` 或 `.env.production`
3. `.env`

## 常见问题

### Q: 为什么修改 .env 文件后没有立即生效？
A: Next.js 会缓存环境变量，需要重启开发服务器。

### Q: 如何确保环境变量在 API 路由中可用？
A: 环境变量在服务器端（包括 API 路由）中自动可用，无需额外配置。

### Q: 客户端代码中如何使用环境变量？
A: 只有以 `NEXT_PUBLIC_` 开头的环境变量才能在客户端代码中使用。

## 自动化脚本
项目根目录提供了以下脚本：
- `clear-cache.js` - 清除缓存
- `test-env-nextjs.js` - 测试环境变量
- `restart-dev.js` - 重启开发服务器

## 验证步骤
1. 运行 `node test-env-nextjs.js` 检查环境变量
2. 启动开发服务器 `npm run dev`
3. 访问 `http://localhost:3000/api/test-env` 验证
4. 如果仍有问题，按上述步骤逐一排查 