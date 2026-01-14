# 圖書館設備借還系統 - 軟體規格書

## 專案概述

**專案名稱：** 圖書館設備借還系統 (LibGear)  
**專案類型：** Web 應用程式 + Google Apps Script 後端  
**主要用途：** 圖書館設備借還系統
**使用者：** 教師、管理員

---

## 系統架構

### 整體架構
```
[前端 Web App (GitHub Pages)]
    ↓ HTTP/HTTPS
[Google Apps Script API]
    ↓
[Google Spreadsheet (資料庫)]
```

### 三層架構
1. **前端層 (Presentation Layer)**
   - 靜態網頁 (HTML/CSS/JavaScript)
   - 部署於 GitHub Pages
   - 響應式設計 (Bootstrap 5)

2. **應用層 (Application Layer)**
   - Google Apps Script
   - RESTful API 設計
   - 處理業務邏輯和資料驗證

3. **資料層 (Data Layer)**
   - Google Spreadsheet 作為資料庫

---

## 技術棧

### 前端技術
- **HTML5**: 結構化網頁內容
- **CSS3**: 樣式設計
- **Bootstrap 5.3.0**: UI 框架
- **Bootstrap Icons 1.10.0**: 圖示庫
- **JavaScript (ES6+)**: 客戶端邏輯
- **Fetch API**: HTTP 請求

### 後端技術
- **Google Apps Script**: 伺服器端運行環境
- **JavaScript**: 後端程式語言
- **Google Spreadsheet API**: 資料存取

### 部署平台
- **GitHub Pages**: 前端靜態網站託管
- **Google Apps Script Web App**: 後端 API 服務

---

## 功能需求

### 1. 借還界面

- **借還流程**:
  - 使用紅外線設備讀取條碼，再去 Gears 資料表讀取設備名稱紀錄在 records 裡面
  - 首次掃描：應產生新記錄且 D 欄為空
  - 當首次掃描設備條碼時：
    - 查詢 Gears 表獲取設備名稱
    - 在 records 表新增一行
    - A欄: 借用人學號, C欄: 當前時間, D欄: 空值
    - 返回成功訊息
  - 二次掃描：應更新同筆記錄的 D 欄時間戳記
  - 歸還後查詢：應看到完整的借還時間
  - 連續讀取代表連續借用。
  - 簡易的借用者身份紀錄，如：用條碼讀取學生證號碼
  - 如沒有學生證可用手動輸入
  - 每借一個設備增加一筆 records
  - 只有登入 users 資料表內的帳號才可以進行借還

### 2. 借用狀況視覺化
- **設備借用狀況表格**:
  - 隨時顯示已借出尚未歸還得列表

- **借用紀錄表格**:
  - 按日期查看特定日期的所有借用記錄
  - 顯示完整資訊：日期、時間、設備

### 3. UI/UX 設計說明
  - 由 AI 生成專業的使用者界面

---

## 資料結構

### Spreadsheet 工作表結構

#### Records 工作表 (主要資料表)
| 欄位 | 資料類型 | 說明 | 範例 |
|-----|---------|------|------|
| A: 借用人學號 | String | 學號或老師姓名 | 1234567 |
| B: 設備 | String | 設備名稱 | iPad 30台 |
| C: 借用時間 | Timestamp | 系統自動記錄 | 2026-01-13 08:30:45 |
| D: 歸還時間 | Timestamp (可為空) | 系統自動記錄，未歸還時留空 | 2026-01-13 10:30:45 或 (空白) |

**索引設計**: 按提交時間降序 (最新在最下方)

#### Gears 工作表 (設備清單)
| 欄位 | 資料類型 | 說明 | 範例 |
|-----|---------|------|------|
| A: ID | Number | 設備條碼 | 00001 |
| B: 設備名稱 | String | 顯示名稱 | iPad 30台 |
| C: 說明 | String | 補充資訊 | 附充電車 |
| D: 是否提供借用 | Boolean | TRUE/FALSE | TRUE |


#### Users 工作表 (設備清單)
| 欄位 | 資料類型 | 說明 | 範例 |
|-----|---------|------|------|
| A: ID | Number | id | 00001 |
| B: email | String | @tea or @stu | lib@tea.nknush.kh.edu.tw |
| C: 權限 | String | 補充資訊 | 借還 |


---

## API 規格

### 基礎資訊
- **Base URL**: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`
- **協議**: HTTPS
- **格式**: JSON
- **CORS**: 已啟用 (任何來源)

### 前端優化

#### 1. 並行載入

---

## 安全性設計

### 1. 權限控制

#### Apps Script 部署設定
```
執行身分: 我 (腳本擁有者)
具有應用程式存取權的使用者: 任何人
```

**安全機制**:
- 腳本以擁有者身分執行
- Google 會要求用戶授權
- 擁有者可以控制 Spreadsheet 和 Calendar 的權限


---

## 部署流程

### 前端部署 (GitHub Pages)

1. **準備工作**
   ```bash
   # 確保 docs 資料夾包含所有前端檔案
   docs/
   ├── index.html
   ├── css/style.css
   └── js/
       ├── config.js
       ├── api-client.js
       └── app.js
   ```

2. **GitHub 設定**
   - Repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /docs
   - Save

3. **訪問網址**
   ```
   https://[username].github.io/[repository-name]/
   ```

### 後端部署 (Google Apps Script)

1. **準備 backend/Code.gs**
   - 設定 SHEET_ID
   - 設定 CALENDAR_ID
   - 設定管理員郵箱

2. **部署步驟**
   - 開啟 Apps Script 編輯器
   - 點擊「部署」→「新增部署」
   - 類型：網頁應用程式
   - 說明：v2.4.0 (或當前版本)
   - 執行身分：我
   - 具有應用程式存取權的使用者：任何人
   - 點擊「部署」

3. **取得 API URL**
   ```
   https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
   ```

---

## 檔案結構

```
PadBookings/
├── backend/
│   └── Code.gs                 # Apps Script 後端程式碼
├── docs/                       # GitHub Pages 前端目錄
│   ├── index.html             # 主頁面
│   ├── css/
│   │   └── style.css          # 自訂樣式
│   └── js/
│       ├── config.js          # API 配置
│       ├── api-client.js      # API 客戶端
│       └── app.js             # 主要邏輯
```
