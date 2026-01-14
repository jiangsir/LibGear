# 🔐 Google Sign-In 設置步驟

## ✅ 已完成的代碼修改

前端和後端代碼已經完成以下修改：

### 前端 (已完成)
- ✅ index.html 添加了 Google Sign-In SDK
- ✅ 添加了登入/登出 UI 元素
- ✅ app.js 添加了 `handleGoogleLogin()` 和 `handleLogout()` 方法
- ✅ api-client.js 支援 ID Token 傳遞

### 後端 (已完成)
- ✅ checkAuth() 函數支援接收和解析 ID Token
- ✅ 自動從 JWT Token 中提取用戶郵箱
- ✅ 回退支援直接訪問時的 Session 認證

---

## 🎯 您需要完成的配置

### 步驟 1：建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊頂部的專案選擇器，選「新增專案」
3. 專案名稱：`LibGear` 
4. 點擊「建立」

### 步驟 2：建立 OAuth 2.0 憑證

1. 在 Google Cloud Console 左側選單：
   - **API 和服務** → **憑證**

2. 點擊「+ 建立憑證」→ 選擇「**OAuth 用戶端 ID**」

3. 如果第一次使用，需先「設定同意畫面」：
   - 使用者類型：選「**外部**」→ 建立
   - 應用程式名稱：`LibGear 設備借還系統`
   - 使用者支援電子郵件：您的郵箱
   - 開發人員聯絡資訊：您的郵箱
   - 點擊「儲存並繼續」
   - 範圍：直接點「儲存並繼續」(不需要添加)
   - 測試使用者：暫時不添加，點「儲存並繼續」
   - 點擊「返回資訊主頁」

4. 再次點擊「建立憑證」→「OAuth 用戶端 ID」：
   - 應用程式類型：**網頁應用程式**
   - 名稱：`LibGear Web Client`
   
   - **已授權的 JavaScript 來源**，添加：
     ```
     https://jiangsir.github.io
     ```
   
   - **已授權的重新導向 URI**，添加：
     ```
     https://jiangsir.github.io/LibGear/
     ```
   
   - 點擊「建立」

5. **複製您的 Client ID**
   - 格式類似：`123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
   - ⚠️ **重要：保存好這個 Client ID！**

### 步驟 3：更新前端代碼

#### 修改 `docs/index.html`

找到第 29 行附近的這段代碼：

```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
     data-callback="handleCredentialResponse"
     data-auto_prompt="false">
</div>
```

**將 `YOUR_GOOGLE_CLIENT_ID` 替換為您在步驟 2 複製的 Client ID！**

例如：
```html
<div id="g_id_onload"
     data-client_id="123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
     data-callback="handleCredentialResponse"
     data-auto_prompt="false">
</div>
```

### 步驟 4：部署後端

1. 打開 Google Apps Script 編輯器
2. 確認 Code.gs 已更新（已自動完成）
3. 點擊「**部署**」→「**管理部署**」
4. 點擊現有部署的 **✏️ 編輯**
5. **重要設置**：
   - **執行身份**：選擇「**我**」
   - **存取權限**：選擇「**任何人**」
6. **版本** → 選擇「**新版本**」
7. 點擊「**部署**」
8. **複製新的部署 URL**

### 步驟 5：更新前端 API URL

編輯 `docs/js/config.js`，將第 9 行的 API_URL 更新為新的部署 URL：

```javascript
API_URL: 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec',
```

### 步驟 6：提交到 GitHub

```bash
git add .
git commit -m "feat: 添加 Google Sign-In 登入功能"
git push
```

### 步驟 7：測試

1. 訪問您的 GitHub Pages：`https://jiangsir.github.io/LibGear/`

2. 應該看到：
   - 右上角有「**Sign in with Google**」按鈕
   - 中間有「需要登入」提示框

3. 點擊 Google 登入按鈕：
   - 選擇您的學校 Google 帳號
   - 授權後系統自動載入

4. 打開瀏覽器 Console (F12)，應該看到：
   ```
   收到 Google 登入憑證
   處理 Google 登入...
   從 ID Token 獲取郵箱: xxx@tea.nknush.kh.edu.tw
   📚 LibGear 後端版本: v1.1.0
   使用者已驗證: xxx@tea.nknush.kh.edu.tw
   權限狀態: ✅ 已授權
   ```

---

## 🔍 驗證清單

- [ ] Google Cloud 專案已建立
- [ ] OAuth 用戶端 ID 已建立
- [ ] Client ID 已複製
- [ ] index.html 中的 `data-client_id` 已更新
- [ ] 後端已重新部署
- [ ] config.js 中的 API_URL 已更新
- [ ] 代碼已提交到 GitHub
- [ ] 可以看到 Google 登入按鈕
- [ ] 點擊登入後可以成功登入
- [ ] 右上角顯示用戶郵箱

---

## ⚠️ 常見問題

### Q1: 看不到 Google 登入按鈕

**檢查：**
1. 打開 Console (F12)，看是否有錯誤
2. 確認 `gsi/client` 腳本已載入
3. 確認 Client ID 格式正確（包含 `.apps.googleusercontent.com`）

### Q2: 點擊登入按鈕後沒反應

**檢查：**
1. Console 中是否有「未授權的來源」錯誤
2. 回到 Google Cloud Console 確認已授權的 JavaScript 來源包含：
   - `https://jiangsir.github.io`

### Q3: 登入後顯示「無權限」

**這是正常的！** 
- 登入成功，但 users 表中沒有您的郵箱
- 需要手動添加：
  1. 打開 Google Sheets
  2. 切換到 `users` 工作表
  3. 添加新行：
     - A 欄：序號（例如 4）
     - B 欄：您的郵箱（例如 `555@tea.nknush.kh.edu.tw`）
     - C 欄：`借還`
  4. 重新整理網頁

### Q4: Console 顯示「從 ID Token 獲取郵箱: undefined」

**原因：** 後端解析 Token 失敗

**解決：**
- 確認後端 Code.gs 已更新到最新版本
- 重新部署後端（新版本）

---

## 📚 測試流程

1. **首次訪問**：看到登入提示
2. **點擊登入**：Google 登入彈窗
3. **選擇帳號**：選擇學校 Google 帳號
4. **授權完成**：自動跳轉回網頁
5. **系統初始化**：載入設備、未歸還列表
6. **開始使用**：可以借還設備
7. **登出**：點擊右上角「登出」按鈕

---

## 🎉 完成後的效果

- ✅ 用戶必須 Google 登入才能使用
- ✅ 自動識別用戶郵箱（跨域也可以）
- ✅ 右上角顯示用戶資訊
- ✅ 有權限/無權限的徽章顯示
- ✅ 可以登出再登入

---

需要幫助？檢查 Console (F12) 中的錯誤訊息！
