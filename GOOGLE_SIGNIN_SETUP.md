# Google Sign-In 設置指南

## 🎯 目標
讓用戶使用 Google 帳號登入，從而在跨域情況下正確獲取用戶郵箱。

## 📋 設置步驟

### 步驟 1：建立 Google Cloud 專案並獲取 Client ID

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google+ API**：
   - 左側選單 → API 和服務 → 啟用 API 和服務
   - 搜尋 "Google+ API" → 點擊 → 啟用

4. 建立 OAuth 2.0 憑證：
   - 左側選單 → API 和服務 → 憑證
   - 點擊「建立憑證」→「OAuth 2.0 用戶端 ID」
   - 應用程式類型：選擇「網頁應用程式」
   - 名稱：`LibGear Web Client`
   - 已授權的 JavaScript 來源：
     ```
     https://jiangsir.github.io
     http://localhost:8000
     ```
   - 已授權的重新導向 URI：
     ```
     https://jiangsir.github.io/LibGear/
     ```
   - 點擊「建立」
   - **複製 Client ID**（格式類似：`123456789-abc123.apps.googleusercontent.com`）

### 步驟 2：更新前端代碼

#### 2.1 修改 `docs/index.html`

在 `</head>` 之前添加：

```html
<!-- Google Sign-In SDK -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

在 `<body>` 開頭（緊接著 `<div class="container mt-4">` 之後）添加：

```html
<!-- 登入區塊 -->
<div id="auth-section" class="mb-3">
  <!-- 未登入狀態 -->
  <div id="login-prompt" class="alert alert-warning" style="display: none;">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <strong>🔐 請先登入</strong>
        <p class="mb-0 small">使用學校 Google 帳號登入以使用設備借還功能</p>
      </div>
      <div>
        <div id="g_id_onload"
             data-client_id="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
             data-callback="handleCredentialResponse"
             data-auto_prompt="false">
        </div>
        <div class="g_id_signin"
             data-type="standard"
             data-size="large"
             data-theme="outline"
             data-text="sign_in_with"
             data-shape="rectangular"
             data-logo_alignment="left">
        </div>
      </div>
    </div>
  </div>
  
  <!-- 已登入狀態 -->
  <div id="login-status" class="alert alert-success" style="display: none;">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <strong>✅ 已登入</strong>
        <span id="user-email" class="ms-2 text-muted"></span>
        <span id="permission-badge" class="ms-2"></span>
      </div>
      <button id="logout-btn" class="btn btn-sm btn-outline-secondary">登出</button>
    </div>
  </div>
</div>
```

**重要：** 將 `YOUR_CLIENT_ID_HERE` 替換為步驟 1 獲取的 Client ID！

#### 2.2 修改 `docs/js/config.js`

更新 API URL：

```javascript
const API_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  // ... 其他配置
};
```

### 步驟 3：更新後端代碼

後端代碼已更新完成，支援：
- ✅ 接收前端傳來的 ID Token
- ✅ 解析 JWT 獲取用戶郵箱
- ✅ 回退到 Session.getActiveUser()（直接訪問時）

### 步驟 4：部署

1. **部署後端**：
   - Apps Script 編輯器 → 部署 → 管理部署
   - 編輯 → 新版本 → 部署
   - 複製部署 URL

2. **更新前端 config.js** 中的 API_URL

3. **提交到 GitHub**：
   ```bash
   git add .
   git commit -m "feat: 添加 Google Sign-In 支援"
   git push
   ```

4. **測試**：
   - 訪問 GitHub Pages URL
   - 應該看到「請先登入」提示
   - 點擊 Google 登入按鈕
   - 登入後系統自動初始化

## 🔍 驗證登入是否成功

打開瀏覽器 Console，應該看到：

```
收到 Google 登入憑證
處理 Google 登入...
從 ID Token 獲取郵箱: xxx@tea.nknush.kh.edu.tw
📚 LibGear 後端版本: v1.1.0
使用者已驗證: xxx@tea.nknush.kh.edu.tw
權限狀態: ✅ 已授權
```

## ⚠️ 常見問題

### Q1: 看不到 Google 登入按鈕
**A:** 檢查 Console 是否有錯誤，確認：
- Client ID 是否正確
- `gsi/client` 腳本是否載入成功
- JavaScript 中是否有語法錯誤

### Q2: 登入後顯示「無權限」
**A:** 需要在 Google Sheets 的 `users` 表中添加您的郵箱：
1. 打開 Google Sheets
2. 切換到 `users` 工作表
3. 在新行添加：
   - A 欄：序號（例如 4）
   - B 欄：您的郵箱
   - C 欄：`借還`

### Q3: 提示「未授權的 JavaScript 來源」
**A:** 回到 Google Cloud Console：
- 憑證 → 編輯 OAuth 用戶端
- 確認已授權的 JavaScript 來源包含您的 GitHub Pages URL

## 📚 參考資料

- [Google Identity Services 文件](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 設置](https://support.google.com/cloud/answer/6158849)
