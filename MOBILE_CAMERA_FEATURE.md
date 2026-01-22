# 📱 手機支援與拍照功能技術說明

## ✅ 手機使用可行性

### 當前狀況
**完全支援手機使用！**

1. **響應式設計已就緒**
   - ✅ Bootstrap 5.3.0 響應式框架
   - ✅ 自訂 @media queries (768px 斷點)
   - ✅ viewport meta 已設置
   - ✅ 觸控友善的按鈕和表單

2. **手機瀏覽器兼容**
   - ✅ Chrome Mobile
   - ✅ Safari iOS
   - ✅ Firefox Mobile
   - ✅ Edge Mobile

---

## 📸 拍照功能實作方案

### 技術架構

```
┌─────────────────┐
│   手機瀏覽器     │
│  HTML5 Camera   │
└────────┬────────┘
         │ 拍照/選圖
         ▼
┌─────────────────┐
│ 前端 JavaScript  │
│ - 壓縮圖片       │
│ - 轉 Base64      │
│ - 預覽顯示       │
└────────┬────────┘
         │ POST API
         ▼
┌─────────────────┐
│ Google Apps     │
│ Script Backend  │
│ - 接收 Base64    │
│ - 存入 Sheets   │
└─────────────────┘
```

### 數據存儲方案

**方案選擇：Base64 存入 Google Sheets**

**優點：**
- ✅ 簡單直接，不需額外 Drive API
- ✅ 照片和記錄在同一個表中
- ✅ 查詢方便

**限制：**
- ⚠️ 單格最大 50,000 字符
- ⚠️ 建議壓縮照片至 200-300KB
- ⚠️ 總容量受 Sheets 限制 (10MB/工作表)

**替代方案（如需更大容量）：**
- Google Drive + Sheets 存 URL
- 需要額外的 Drive API 權限

---

## 🔧 實作細節

### 1. Google Sheets 結構調整

**records 表新增欄位：**
| A | B | C | D | E |
|---|---|---|---|---|
| borrowerId | gear | borrowTime | returnTime | **photo** |
| ew123456 | 設備A | 2026-01-22 10:00 | 2026-01-22 15:00 | data:image/jpeg;base64,/9j/4AAQ... |

### 2. 前端 UI 調整

**借出表單增加：**
```html
<div class="camera-section">
  <button type="button" class="btn btn-outline-primary" id="take-photo">
    <i class="bi bi-camera"></i> 拍照記錄
  </button>
  <input type="file" accept="image/*" capture="camera" style="display:none" id="camera-input">
  <div id="photo-preview" style="display:none">
    <img id="preview-image" class="img-thumbnail mt-2" style="max-width: 200px">
    <button type="button" class="btn btn-sm btn-danger" id="remove-photo">移除</button>
  </div>
</div>
```

### 3. 照片處理流程

```javascript
// 1. 選擇/拍照
document.getElementById('camera-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  
  // 2. 壓縮圖片
  const compressed = await compressImage(file, 800, 800, 0.7);
  
  // 3. 轉 Base64
  const base64 = await fileToBase64(compressed);
  
  // 4. 預覽
  showPreview(base64);
  
  // 5. 暫存
  currentPhoto = base64;
});

// 借出時附加照片
async handleBorrow() {
  const result = await this.api.recordBorrow(
    borrowerId,
    gearId,
    currentPhoto // 新增參數
  );
}
```

### 4. 後端 API 調整

```javascript
// recordBorrow 接受照片參數
function recordBorrow(borrowerId, gearId, photoBase64) {
  // ... 原有驗證邏輯
  
  // 新增記錄時包含照片
  records.appendRow([
    borrowerId,
    gearInfo.name,
    timestamp,
    '',
    photoBase64 || '' // E 欄：照片
  ]);
}
```

---

## 📐 圖片壓縮規格

**推薦設定：**
- 最大寬度：800px
- 最大高度：800px
- JPEG 質量：0.7 (70%)
- 預估大小：50-150KB

**壓縮函數：**
```javascript
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 計算縮放比例
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 轉 Base64
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

---

## 🎨 手機 UI 優化建議

### 1. 大按鈕設計
```css
@media (max-width: 768px) {
  .btn-lg {
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
    min-height: 48px; /* Apple 建議的觸控目標 */
  }
  
  #take-photo {
    width: 100%;
    margin: 1rem 0;
  }
}
```

### 2. 輸入框優化
```css
.form-control {
  font-size: 16px; /* 防止 iOS 自動縮放 */
}
```

### 3. 相機按鈕置頂
- 手機上先拍照，再輸入資料
- 符合使用直覺

---

## 📊 容量限制與建議

### Google Sheets 限制
- 單個儲存格：50,000 字符
- 單個工作表：10MB
- 整個試算表：100MB

### 照片數量估算
- 每張照片：~100KB = ~133,000 字符（Base64 膨脹 1.33倍）
- ❌ **超過單格限制！**

### ✅ 解決方案
**分片存儲或改用 Drive URL**

```javascript
// 方案 A：縮小至符合限制
壓縮至 30KB = ~40,000 字符 ✅

// 方案 B：使用 Google Drive
1. 上傳到 Drive
2. 獲取共享連結
3. 存 URL 到 Sheets
```

---

## 🔒 隱私與安全

1. **照片權限**
   - 需要用戶明確允許相機訪問
   - HTTPS 必要（GitHub Pages 已滿足）

2. **數據保護**
   - 照片存在您的 Google Sheets
   - 只有有權限的人能存取

3. **建議設置**
   - Google Sheets 設為「知道連結的人可以檢視」
   - Apps Script 維持「執行身份：我」

---

## 🚀 部署步驟

1. **更新 Sheets 結構**
   - records 表新增 E 欄（photo）

2. **部署新版前端**
   - 添加拍照UI
   - 添加圖片處理邏輯
   - Git push 到 GitHub

3. **部署新版後端**
   - 修改 recordBorrow 接受 photo 參數
   - Apps Script 重新部署

4. **測試**
   - 手機瀏覽器測試拍照
   - 電腦測試上傳照片
   - 確認 Sheets 有存入 Base64

---

## ✅ 測試檢查清單

- [ ] 手機 Chrome 可以正常拍照
- [ ] 手機 Safari 可以正常拍照
- [ ] 電腦可以選擇本地照片
- [ ] 照片預覽顯示正確
- [ ] 照片有壓縮（檢查 Base64 長度）
- [ ] 借出成功後 Sheets E 欄有資料
- [ ] Base64 可以解碼還原圖片

---

需要我現在開始實作嗎？
