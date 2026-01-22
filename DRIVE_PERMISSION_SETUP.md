# 🔐 Google Apps Script 權限設定指南

## 問題說明

上傳照片到 Google Drive 時出現權限錯誤：
```
Exception: 你沒有呼叫「DriveApp.getFoldersByName」的權限
```

這是因為 Google Apps Script 需要明確授權才能訪問 Google Drive。

---

## 📋 解決步驟

### 方法 1: 重新部署並授權（推薦）

#### 1. 開啟 Google Apps Script 編輯器

前往：https://script.google.com/

找到您的 LibGear 專案

#### 2. 新增 appsscript.json 文件

在左側檔案列表中：
1. 點擊「設定」圖示（⚙️）
2. 勾選「在編輯器中顯示 "appsscript.json" 資訊清單檔案」
3. 返回「編輯器」標籤
4. 現在應該會看到 `appsscript.json` 文件

#### 3. 更新 appsscript.json 內容

將內容替換為：

```json
{
  "timeZone": "Asia/Taipei",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file"
  ]
}
```

**重要權限說明**：
- `spreadsheets` - 讀寫 Google Sheets（記錄借還資料）
- `drive.file` - 建立和管理 Drive 中由此應用建立的檔案（上傳照片）

#### 4. 儲存所有檔案

按 **Ctrl + S** 或點擊「儲存」圖示

#### 5. 重新部署

1. 點擊右上角「部署」→「管理部署作業」
2. 點擊現有部署旁的「編輯」圖示（鉛筆）
3. 在「版本」下拉選單中選擇「新增版本」
4. 版本說明輸入：`新增 Drive 權限以支援照片上傳`
5. 點擊「部署」

#### 6. 授權應用程式

部署時會彈出授權視窗：

1. 點擊「檢閱權限」
2. 選擇您的 Google 帳號
3. 看到「Google 尚未驗證這個應用程式」警告：
   - 點擊「進階」
   - 點擊「前往 LibGear（不安全）」（這是正常的，因為這是您自己的專案）
4. 勾選所有權限：
   - ✅ 查看、編輯、建立及刪除您所有的 Google 試算表
   - ✅ 查看及管理由這個應用程式建立或開啟的 Google 雲端硬碟檔案
5. 點擊「允許」

#### 7. 複製新的部署 URL

部署完成後，會顯示新的網頁應用程式 URL，應該與之前相同。

---

### 方法 2: 手動觸發授權（臨時測試）

如果只是想快速測試，可以手動運行一個需要 Drive 權限的函數：

#### 1. 在 Apps Script 編輯器中

建立一個測試函數（加在 Code.gs 最下方）：

```javascript
/**
 * 測試函數 - 用於觸發 Drive 權限授權
 * 執行後可以刪除此函數
 */
function testDrivePermission() {
  const folders = DriveApp.getFoldersByName('LibGear_Photos');
  Logger.log('測試成功');
}
```

#### 2. 執行測試函數

1. 在函數選擇器中選擇 `testDrivePermission`
2. 點擊「執行」按鈕
3. 第一次執行會要求授權
4. 完成授權後，刪除這個測試函數

⚠️ **注意**：這個方法只是臨時授權，建議還是使用方法 1 正式部署。

---

## ✅ 驗證權限設定成功

### 1. 檢查授權狀態

在 Apps Script 編輯器：
1. 點擊左側「服務」（齒輪圖示下方）
2. 確認已啟用：
   - Google Sheets API
   - Drive API

### 2. 測試照片上傳

1. 前往您的網頁：https://jiangsir.github.io/LibGear/
2. 登入 Google 帳號
3. 輸入借用人學號和設備條碼
4. 點擊「拍照或選擇照片」上傳一張測試圖片
5. 點擊「借出」

### 3. 檢查是否成功

**在前端 Console**：
- 應該看到：`✅ 照片上傳成功，URL: https://drive.google.com/uc?id=...`

**在 Google Drive**：
1. 前往您的 Google Drive
2. 應該會看到一個新資料夾「LibGear_Photos」
3. 裡面有剛才上傳的照片

**在 Google Sheets**：
1. 開啟 records 工作表
2. E 欄（photoUrl）應該有 Drive URL
3. F 欄（照片預覽）應該顯示照片縮圖

---

## 🔍 常見問題

### Q: 為什麼需要 drive.file 而不是 drive？

**A**: `drive.file` 是受限權限，只能訪問由此應用建立的檔案，更安全。`drive` 會允許訪問整個 Drive，權限過大。

### Q: 授權後多久生效？

**A**: 立即生效。授權後就可以使用 Drive API。

### Q: 如果忘記授權會怎樣？

**A**: 每次使用 `uploadPhoto` 時會出現權限錯誤，照片無法上傳。但借還功能不受影響。

### Q: 可以撤銷權限嗎？

**A**: 可以。前往 https://myaccount.google.com/permissions 管理應用程式權限。

---

## 📝 更新記錄

- **2026-01-22**: 新增 Drive 權限支援照片上傳功能
- **初始版本**: 僅 Sheets 權限用於借還記錄

---

**完成以上步驟後，照片上傳功能就能正常使用了！** 📸✨
