# LibGear - 圖書館設備借還系統 安裝手冊

## 📋 目錄

1. [系統需求](#系統需求)
2. [快速開始（5分鐘）](#快速開始)
3. [完整安裝步驟](#完整安裝步驟)
4. [配置說明](#配置說明)
5. [測試與驗證](#測試與驗證)
6. [常見問題](#常見問題)
7. [故障排除](#故障排除)

---

## 系統需求

### 必須條件
- ✅ **Google 帳號**（@nknush.kh.edu.tw 郵箱）
- ✅ **Google Spreadsheet**（用作資料庫）
- ✅ **GitHub 帳號**（部署前端）
- ✅ **網際網路連接**
- ✅ **現代瀏覽器**（Chrome、Firefox、Safari、Edge）

### 不需要
- ❌ 伺服器（使用 Google Apps Script）
- ❌ 資料庫軟體（使用 Google Sheets）
- ❌ 本地開發環境

---

## 快速開始

### 第 1 步：準備 Google Spreadsheet（5 分鐘）

#### 1.1 建立新的 Google Spreadsheet

1. 訪問 [Google Sheets](https://sheets.google.com)
2. 點擊「+」新建 Spreadsheet
3. 命名為 **LibGear** 或自訂名稱
4. **複製並保存 Spreadsheet ID**（URL 中的長字串）
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

#### 1.2 建立三個工作表

刪除預設的「Sheet1」，新建以下三個工作表：

**工作表 1：records**

| A | B | C | D |
|---|---|---|---|
| 借用人學號 | 設備 | 借用時間 | 歸還時間 |

設定欄位寬度：
- A 欄：100px
- B 欄：150px
- C、D 欄：180px

**工作表 2：gears**

| A | B | C | D |
|---|---|---|---|
| ID | 設備名稱 | 說明 | 是否提供借用 |
00001,iPad 30台,附充電車,TRUE
00002,Chromebook 20台, TRUE
00003,投影機 10台, 已禁用,FALSE   

**工作表 3：users**

| A | B | C |
|---|---|---|
| ID | email | 權限 |
| 1 | admin@tea.nknush.kh.edu.tw | 借還 |
| 2 | teacher1@tea.nknush.kh.edu.tw | 借還 |
| 3 | teacher2@tea.nknush.kh.edu.tw | 借還 |

> ⚠️ 務必確保 **users 表中包含您的郵箱地址**，否則無法使用系統

### 第 2 步：部署後端（Google Apps Script）

#### 2.1 建立 Apps Script

1. 在 Google Sheets 中點擊「擴充功能」→「Apps Script」
2. 刪除預設代碼
3. 複製 `backend/Code.gs` 的全部內容到編輯器

#### 2.2 設定 SHEET_ID

在 Code.gs 第 11 行修改：

```javascript
// 修改前
const SHEET_ID = 'YOUR_SPREADSHEET_ID';

// 修改後（貼上您的 ID）
const SHEET_ID = '1a2b3c4d5e6f7g8h9i10j11k12l13m14n15o16p17q18r';
```

#### 2.3 部署為網頁應用程式

1. 點擊「部署」→「新增部署」
2. 選擇類型：**網頁應用程式**
3. 執行身份：**我**
4. 具有應用程式存取權的使用者：**任何人**
5. 點擊「部署」
6. **複製並保存部署 URL**
   ```
   https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
   ```

### 第 3 步：配置前端（GitHub Pages）

#### 3.1 修改配置文件

編輯 `docs/js/config.js` 第 6 行：

```javascript
// 修改前
API_URL: 'https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec',

// 修改後
API_URL: 'https://script.google.com/macros/s/AKfycbxyz123abc.../exec',
```

#### 3.2 提交到 GitHub

```bash
cd LibGear
git add .
git commit -m "配置 API URL"
git push origin main
```

#### 3.3 啟用 GitHub Pages

1. 訪問 GitHub Repository Settings
2. 左側選擇「Pages」
3. Source 選擇：**Deploy from a branch**
4. Branch 選擇：**main**
5. Folder 選擇：**/docs**
6. 點擊「Save」
7. 等待 1-2 分鐘
8. 訪問 `https://[username].github.io/LibGear/`

---

## 完整安裝步驟

### 前置準備

#### 檢查清單
- [ ] 有 Google 帳號（@nknush.kh.edu.tw）
- [ ] 有 GitHub 帳號
- [ ] 已 Fork 或 Clone LibGear Repository
- [ ] 有文本編輯器（VS Code、記事本等）

### 安裝流程

#### 步驟 1：準備 Google Spreadsheet（10 分鐘）

**1.1 建立 Spreadsheet**
```
訪問 → https://sheets.google.com
點擊 → 「+ 新建 Spreadsheet」
命名 → LibGear
```

**1.2 設定工作表結構**

刪除 Sheet1，新建：
- 點擊右下角「+」
- 輸入工作表名稱

**1.3 填入初始資料**

records 表（表頭）：
```
A1: 借用人學號
B1: 設備
C1: 借用時間
D1: 歸還時間
```

gears 表（表頭 + 範例資料）：
```
A1: ID           B1: 設備名稱      C1: 說明        D1: 是否提供借用
A2: 00001        B2: iPad 30台     C2: 附充電車    D2: TRUE
A3: 00002        B3: Chromebook    C3: -           D3: TRUE
```

users 表（表頭 + 範例資料）：
```
A1: ID   B1: email                        C1: 權限
A2: 1    B2: admin@tea.nknush.kh.edu.tw   C2: 借還
```

**1.4 複製 Spreadsheet ID**

URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

保存 SPREADSHEET_ID（供後續使用）

---

#### 步驟 2：配置 Google Apps Script（15 分鐘）

**2.1 開啟 Apps Script 編輯器**

在 Google Sheets 中：
```
工具 → Apps Script
```

**2.2 貼上後端代碼**

1. 刪除現有代碼
2. 複製 `backend/Code.gs` 全部內容
3. 貼到編輯器

**2.3 設定 SHEET_ID**

找到第 11 行，修改：
```javascript
const SHEET_ID = 'YOUR_SPREADSHEET_ID';
```

改為（替換為您的 ID）：
```javascript
const SHEET_ID = '1a2b3c4d5e6f7g8h9i10j11k12l13m14n15o16p17q18r';
```

**2.4 測試代碼**

點擊「執行」→「doPost」（會提示授權）

授權過程：
1. 選擇帳號
2. 點擊「進階」
3. 點擊「前往 LibGear（不安全）」
4. 確認授權範圍

**2.5 部署為網頁應用程式**

點擊「部署」按鈕 → 「新增部署」

設定值：
| 項目 | 值 |
|-----|-----|
| 類型 | 網頁應用程式 |
| 執行身份 | 我 |
| 存取權限 | 任何人 |

部署成功後，複製 URL：
```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

保存此 URL（供步驟 3 使用）

---

#### 步驟 3：配置前端（10 分鐘）

**3.1 修改 API 配置**

編輯文件：`docs/js/config.js`

第 6-8 行，修改 API_URL：
```javascript
// 修改前
API_URL: 'https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec',

// 修改後（貼上步驟 2.5 的 URL）
API_URL: 'https://script.google.com/macros/s/AKfycbxXxXxX123...../exec',
```

**3.2 提交到 GitHub**

命令列操作：
```bash
# 進入 LibGear 目錄
cd LibGear

# 檢查修改
git status

# 添加修改
git add docs/js/config.js

# 提交
git commit -m "設定 API URL: $(date)"

# 推送到 GitHub
git push origin main
```

**3.3 確認部署**

訪問 GitHub Repository 檢查：
1. 點擊「Code」標籤
2. 確認 `docs/js/config.js` 已更新 API_URL

---

#### 步驟 4：啟用 GitHub Pages（5 分鐘）

**4.1 開啟 Settings**

Repository → Settings → Pages

**4.2 配置部署來源**

| 設定項 | 選擇值 |
|--------|---------|
| Source | Deploy from a branch |
| Branch | main |
| Folder | /docs |

點擊「Save」

**4.3 等待部署完成**

等待 1-2 分鐘，頁面會出現：
```
Your site is live at https://[username].github.io/LibGear/
```

**4.4 訪問網站**

訪問上述 URL，應該看到系統界面

---

## 配置說明

### API 配置（docs/js/config.js）

```javascript
const API_CONFIG = {
  // Google Apps Script 部署 URL（必填）
  API_URL: 'https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec',
  
  // API 超時時間（毫秒，預設 10000）
  TIMEOUT: 10000,
  
  // 重試次數（預設 3）
  MAX_RETRIES: 3,
  
  // 重試延遲（毫秒，預設 1000）
  RETRY_DELAY: 1000
};
```

### 後端配置（backend/Code.gs）

```javascript
// Spreadsheet ID（必填）
const SHEET_ID = 'YOUR_SPREADSHEET_ID';

// 允許的郵箱域（可修改）
const ALLOWED_DOMAIN = '@nknush.kh.edu.tw';

// 系統版本
const VERSION = 'v1.0.0';
```

### 工作表配置

#### records 表
```
A: 借用人學號 (String, 7-10 位)
B: 設備 (String)
C: 借用時間 (Timestamp, 自動填入)
D: 歸還時間 (Timestamp, 可為空)
```

#### gears 表
```
A: ID (Number, 5 位, 唯一)
B: 設備名稱 (String, 2-50 位)
C: 說明 (String, 可為空)
D: 是否提供借用 (Boolean, TRUE/FALSE)
```

#### users 表
```
A: ID (Number, 唯一)
B: email (String, 必須 @nknush.kh.edu.tw)
C: 權限 (String, 預設為 "借還")
```

---

## 測試與驗證

### 系統測試清單

#### 1. 權限驗證測試
```
步驟：
1. 開啟系統
2. 系統應自動驗證您的 Google 帳號
3. 確認您的郵箱顯示在頁首

預期結果：✅ 顯示您的郵箱地址
```

#### 2. 借出功能測試
```
步驟：
1. 在「借用人學號」輸入：1234567
2. 在「設備條碼」輸入：00001
3. 點擊「借出」

預期結果：
✅ 顯示「借出成功」訊息
✅ 輸入欄被清除
✅ 設備出現在「已借出未歸還」列表
```

#### 3. 歸還功能測試
```
步驟：
1. 在「借用人學號」輸入：1234567
2. 在「設備條碼」輸入：00001
3. 點擊「歸還」

預期結果：
✅ 顯示「歸還成功」訊息
✅ 設備從「未歸還」列表移除
✅ 出現在「借用記錄」表中，顯示完整的借用/歸還時間
```

#### 4. 查詢功能測試
```
步驟：
1. 點擊「借用記錄」標籤
2. 選擇日期（應為今天）
3. 應顯示今天的所有借用記錄

預期結果：
✅ 表格顯示正確的日期記錄
✅ 已歸還設備狀態為「已歸還」（綠色）
✅ 未歸還設備狀態為「借出中」（黃色）
```

### 驗證檢查清單

部署完成後，檢查以下項目：

- [ ] 系統加載無錯誤
- [ ] 能夠讀取設備清單
- [ ] 能夠成功借出設備
- [ ] 能夠成功歸還設備
- [ ] 設備狀態實時更新
- [ ] 借用記錄正確保存
- [ ] 按日期查詢功能正常
- [ ] 時長計算正確
- [ ] 無效輸入被正確拒絕
- [ ] 無權限的使用者被拒絕

---

## 常見問題

### Q1: 如何修改允許的郵箱域？

**A:** 編輯 `backend/Code.gs` 第 13 行：

```javascript
const ALLOWED_DOMAIN = '@nknush.kh.edu.tw';
```

修改為您的郵箱域，例如：
```javascript
const ALLOWED_DOMAIN = '@school.edu.tw';
```

然後重新部署（部署 → 管理部署 → 編輯 → 更新）

### Q2: 如何新增設備？

**A:** 在 Google Sheets 的 **gears** 表新增一行：

```
A: 00004
B: 新設備名稱
C: 說明（可選）
D: TRUE （如果提供借用）
```

### Q3: 如何新增用戶？

**A:** 在 Google Sheets 的 **users** 表新增一行：

```
A: 唯一 ID（任意數字）
B: email@tea.nknush.kh.edu.tw
C: 借還
```

### Q4: 如何修改版本號？

**A:** 編輯 `backend/Code.gs` 第 14 行：

```javascript
const VERSION = 'v1.0.1';
```

### Q5: 系統支援多少筆記錄？

**A:** Google Sheets 支援最多 500 萬筆記錄。系統優化為只讀取最近 500 筆，性能良好。

### Q6: 可以刪除舊記錄嗎？

**A:** 可以。在 Google Sheets 中選擇要刪除的行，右鍵「刪除」。系統不會自動刪除。

### Q7: 如何備份資料？

**A:** Google Sheets 自動備份。您也可以：
1. 在 Google Sheets 中點擊「檔案」→「版本記錄」
2. 或下載為 CSV/Excel 格式

---

## 故障排除

### 問題 1：「無法打開 Spreadsheet」

**原因：** SHEET_ID 錯誤或拼寫錯誤

**解決方式：**
1. 檢查 `backend/Code.gs` 的 SHEET_ID
2. 確保複製的是完整的 ID
3. 重新部署代碼

### 問題 2：「無借還權限」

**原因：** 您的郵箱不在 users 表中

**解決方式：**
1. 在 Google Sheets 的 **users** 表新增您的郵箱
2. 格式：`your.email@tea.nknush.kh.edu.tw`
3. 重新刷新網頁

### 問題 3：API 返回 404 錯誤

**原因：** Deployment URL 錯誤

**解決方式：**
1. 檢查 `docs/js/config.js` 的 API_URL
2. 確保 URL 完整無誤
3. 確保 Apps Script 已部署

### 問題 4：「設備不存在」

**原因：** 條碼輸入有誤或設備不在 gears 表中

**解決方式：**
1. 確認條碼格式正確（5 位數字）
2. 在 Google Sheets 檢查 gears 表是否有此設備

### 問題 5：GitHub Pages 無法訪問

**原因：** Pages 未啟用或部署未完成

**解決方式：**
1. 確認 Settings → Pages 已配置
2. 等待 2-3 分鐘完成部署
3. 檢查 URL 是否正確：`https://[username].github.io/LibGear/`

### 問題 6：網頁一片空白

**原因：** JavaScript 文件未加載或有語法錯誤

**解決方式：**
1. 打開瀏覽器 Console（F12）
2. 查看錯誤訊息
3. 檢查 `docs/js/config.js` 的 API_URL 是否正確
4. 重新刷新頁面（Ctrl+F5）

### 問題 7：「請求超時」

**原因：** Apps Script 響應慢或網路不穩定

**解決方式：**
1. 檢查網路連接
2. 等待幾秒後重試
3. 檢查 Google Sheets 是否正常（訪問 sheets.google.com）
4. 檢查 Apps Script 是否有錯誤（打開 Apps Script 編輯器查看執行日誌）

---

## 進階配置

### 自訂訊息

編輯 `docs/js/config.js` 的 MESSAGES 物件：

```javascript
const MESSAGES = {
  SUCCESS: {
    BORROW: '借出成功',      // 修改為自訂訊息
    RETURN: '歸還成功'
  },
  ERROR: {
    USER_NOT_FOUND: '使用者不存在'
    // ...
  }
};
```

### 自訂樣式

編輯 `docs/css/style.css`，修改顏色變數：

```css
:root {
  --primary-color: #0d6efd;    /* 主色 */
  --success-color: #198754;    /* 成功色 */
  --warning-color: #ffc107;    /* 警告色 */
  /* ... */
}
```

### 增加超時時間

編輯 `docs/js/config.js`：

```javascript
const API_CONFIG = {
  TIMEOUT: 15000,  // 改為 15 秒
  MAX_RETRIES: 5,  // 增加重試次數
};
```

---

## 支援與回報

如有問題或建議，請：

1. 檢查此手冊的「故障排除」部分
2. 查看 GitHub Issues
3. 提交詳細的錯誤報告

---

**最後更新：** 2026-01-14  
**版本：** v1.0.0  
**維護者：** LibGear 開發團隊
