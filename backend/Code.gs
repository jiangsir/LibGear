/**
 * LibGear - 圖書館設備借還系統
 * Google Apps Script 後端
 * 
 * 部署方式：
 * 1. 開啟 Google Apps Script 編輯器
 * 2. 複製此代碼到 Code.gs
 * 3. 設定以下變數：
 *    - SHEET_ID: Google Spreadsheet ID
 *    - ALLOWED_EMAILS: 允許的郵箱列表
 * 4. 部署為網頁應用程式 (Execute as: Me, Access: Anyone)
 */

// ===== 設定值 =====
const SHEET_ID = '1jcvw1Hfv_9oO2OhFT6huOPhMtnBr_hlR6TJv_8pr6U4'; // 替換為實際的 Google Sheet ID
const ALLOWED_DOMAIN = '@tea.nknush.kh.edu.tw'; // 允許的郵箱域
const BACKEND_VERSION = 'v1.3.0'; // 更新：新增照片上傳功能

// ===== 工作表名稱 =====
const SHEET_NAMES = {
  RECORDS: 'records',
  GEARS: 'gears',
  USERS: 'users'
};

// ===== 全域變數 =====
let spreadsheet = null;
let sheetsCache = {};

/**
 * 初始化 Spreadsheet
 */
function getSpreadsheet() {
  if (!spreadsheet) {
    try {
      spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    } catch (e) {
      throw new Error('無法打開 Spreadsheet: ' + e.message);
    }
  }
  return spreadsheet;
}

/**
 * 取得工作表
 */
function getSheet(sheetName) {
  if (!sheetsCache[sheetName]) {
    const sheet = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('工作表不存在: ' + sheetName);
    }
    sheetsCache[sheetName] = sheet;
  }
  return sheetsCache[sheetName];
}

/**
 * 測試函數 - 在瀏覽器中打開部署 URL 可看到此頁面
 * 這也會觸發權限授權
 */
function doGet(e) {
  const userEmail = Session.getActiveUser().getEmail();
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>LibGear 後端狀態</title>
        <style>
          body { font-family: 'Microsoft JhengHei', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; border-bottom: 3px solid #4285f4; padding-bottom: 10px; }
          .status { padding: 15px; margin: 10px 0; border-radius: 5px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
          .error { background: #f8d7da; border-left: 4px solid #dc3545; }
          .info { background: #d1ecf1; border-left: 4px solid #17a2b8; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📚 LibGear 後端系統</h1>
          
          <div class="status info">
            <strong>後端版本：</strong> ${BACKEND_VERSION}
          </div>
          
          <div class="status ${userEmail ? 'success' : 'error'}">
            <strong>使用者郵箱：</strong><br>
            ${userEmail || '<span style="color: red;">❌ 無法獲取（返回空值）</span>'}
          </div>
          
          ${!userEmail ? `
          <div class="status error">
            <h3>⚠️ 部署設置錯誤</h3>
            <p>無法獲取使用者郵箱，請檢查部署設置：</p>
            <ol>
              <li>點擊「<strong>部署</strong>」→「<strong>管理部署</strong>」</li>
              <li>點擊現有部署旁的 <strong>✏️ 編輯</strong> 圖標</li>
              <li><strong>執行身份</strong>：必須選擇「<code>我</code>」（不是「存取網頁應用程式的使用者」）</li>
              <li><strong>具有應用程式存取權的使用者</strong>：選擇「<code>任何人</code>」</li>
              <li>點擊「<strong>版本</strong>」→ 選擇「<strong>新版本</strong>」</li>
              <li>點擊「<strong>部署</strong>」</li>
            </ol>
            <p><strong style="color: red;">關鍵：</strong>「執行身份」選項若選錯，將無法獲取使用者資訊！</p>
          </div>
          ` : ''}
          
          <div class="status success">
            <strong>✅ API 已就緒</strong><br>
            POST 請求至此 URL 即可使用 API
          </div>
        </div>
      </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * 主 doPost 處理函數
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    // 提取 ID Token（如果有）
    const idToken = params.idToken || null;
    
    // 路由請求
    let result;
    switch (action) {
      case 'recordBorrow':
        result = recordBorrow(params.borrowerId, params.gearId, params.photoUrl);
        break;
      case 'recordReturn':
        result = recordReturn(params.borrowerId, params.gearId);
        break;
      case 'getUnreturnedGears':
        result = getUnreturnedGears();
        break;
      case 'getRecordsByDate':
        result = getRecordsByDate(params.date);
        break;
      case 'getGears':
        result = getGears();
        break;
      case 'checkAuth':
        result = checkAuth(idToken);
        break;
      case 'uploadPhoto':
        result = uploadPhoto(params.photoBase64, params.fileName);
        break;
      case 'getVersion':
        result = { success: true, version: BACKEND_VERSION };
        break;
      default:
        result = { success: false, error: 'UNKNOWN_ACTION', message: '未知的動作' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 驗證使用者權限
 * @param {string} idToken - Google ID Token（從前端傳來）
 */
function checkAuth(idToken) {
  try {
    let userEmail = null;
    
    // 優先使用 ID Token 驗證（前端 Google Sign-In）
    if (idToken) {
      try {
        // 解碼 ID Token 獲取郵箱
        // Google ID Token 是 JWT，格式：header.payload.signature
        const payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(
          idToken.split('.')[1]
        )).getDataAsString();
        const tokenData = JSON.parse(payload);
        userEmail = tokenData.email;
        console.log('從 ID Token 獲取郵箱:', userEmail);
      } catch (tokenError) {
        console.error('ID Token 解析失敗:', tokenError);
      }
    }
    
    // 如果沒有 ID Token，嘗試從 Session 獲取（直接訪問時）
    if (!userEmail) {
      userEmail = Session.getActiveUser().getEmail();
      if (userEmail) {
        console.log('從 Session 獲取郵箱:', userEmail);
      }
    }
    
    // 如果還是無法獲取郵箱
    if (!userEmail) {
      return {
        success: true,
        hasPermission: false,
        message: '❌ 無法獲取使用者資訊\n請使用 Google 帳號登入',
        email: '未知'
      };
    }

    // 暫時註釋郵箱域檢查，方便開發測試
    // 生產環境請取消註釋
    // if (!userEmail.endsWith(ALLOWED_DOMAIN)) {
    //   return {
    //     success: true,
    //     hasPermission: false,
    //     message: '不允許的郵箱域: ' + userEmail,
    //     email: userEmail
    //   };
    // }

    // 檢查 Users 表
    try {
      const users = getSheet(SHEET_NAMES.USERS);
      const data = users.getDataRange().getValues();
      
      let hasPermission = false;
      let permission = '';
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === userEmail) { // B 欄是 email
          hasPermission = true;
          permission = data[i][2]; // C 欄是權限
          break;
        }
      }

      return {
        success: true,  // API 調用成功，總是返回 true
        email: userEmail,
        hasPermission: hasPermission,
        permission: permission || '無',
        message: hasPermission ? '已授權' : '此郵箱未在 users 表中，請新增: ' + userEmail
      };
    } catch (sheetError) {
      // users 表不存在或讀取失敗
      return {
        success: true,
        email: userEmail,
        hasPermission: false,
        permission: '無',
        message: 'users 工作表錯誤: ' + sheetError.message
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'AUTH_ERROR',
      message: '驗證錯誤: ' + error.message,
      email: '錯誤'
    };
  }
}

/**
 * 記錄設備借出
 * @param {string} photoUrl - 照片 Google Drive URL（可選）
 */
function recordBorrow(borrowerId, gearId, photoUrl) {
  try {
    // 驗證輸入
    if (!borrowerId || !gearId) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: '借用人或設備不能為空'
      };
    }

    // 驗證格式
    if (!/^[\dA-Za-z]{7,10}$/.test(borrowerId)) {
      return {
        success: false,
        error: 'INVALID_BORROWER',
        message: '借用人學號格式不正確'
      };
    }

    if (!/^\d{5}$/.test(gearId)) {
      return {
        success: false,
        error: 'INVALID_GEAR',
        message: '設備條碼格式不正確'
      };
    }

    // 驗證設備存在
    const gearInfo = findGearById(gearId);
    if (!gearInfo) {
      return {
        success: false,
        error: 'GEAR_NOT_FOUND',
        message: '設備不存在'
      };
    }

    // 驗證設備是否提供借用
    if (!gearInfo.available) {
      return {
        success: false,
        error: 'GEAR_DISABLED',
        message: '該設備不提供借用'
      };
    }

    // 驗證借用人
    if (!validateBorrower(borrowerId)) {
      return {
        success: false,
        error: 'USER_NOT_FOUND',
        message: '借用人不存在或無權限'
      };
    }

    // 檢查是否已有未歸還的同設備記錄（進入歸還流程）
    const existingRecord = findUnreturnedRecord(borrowerId, gearInfo.name);
    if (existingRecord) {
      // 自動進入歸還流程
      return recordReturn(borrowerId, gearId);
    }

    // 新增記錄
    const timestamp = getCurrentTimestamp();
    const records = getSheet(SHEET_NAMES.RECORDS);
    records.appendRow([borrowerId, gearInfo.name, timestamp, '', photoUrl || '']);

    return {
      success: true,
      message: '借出成功',
      record: {
        borrowerId: borrowerId,
        gear: gearInfo.name,
        borrowTime: timestamp,
        returnTime: null,
        photoUrl: photoUrl || null
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'BORROW_ERROR',
      message: error.message
    };
  }
}

/**
 * 記錄設備歸還
 */
function recordReturn(borrowerId, gearId) {
  try {
    // 驗證輸入
    if (!borrowerId || !gearId) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: '借用人或設備不能為空'
      };
    }

    // 取得設備信息
    const gearInfo = findGearById(gearId);
    if (!gearInfo) {
      return {
        success: false,
        error: 'GEAR_NOT_FOUND',
        message: '設備不存在'
      };
    }

    // 找到未歸還的記錄
    const records = getSheet(SHEET_NAMES.RECORDS);
    const data = records.getDataRange().getValues();
    let foundRow = -1;
    let earliestTime = null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === borrowerId && data[i][1] === gearInfo.name && !data[i][3]) {
        // A 欄借用人, B 欄設備, D 欄為空表示未歸還
        if (!earliestTime || data[i][2] < earliestTime) {
          foundRow = i + 1; // Google Sheets 是 1-indexed
          earliestTime = data[i][2];
        }
      }
    }

    if (foundRow === -1) {
      return {
        success: false,
        error: 'NO_RECORD',
        message: '無未歸還的記錄'
      };
    }

    // 更新 D 欄（歸還時間）
    const timestamp = getCurrentTimestamp();
    records.getRange(foundRow, 4).setValue(timestamp);

    // 計算借用時長
    const borrowTime = data[foundRow - 1][2];
    const duration = calculateDuration(borrowTime, timestamp);

    return {
      success: true,
      message: '歸還成功',
      record: {
        borrowerId: borrowerId,
        gear: gearInfo.name,
        borrowTime: borrowTime,
        returnTime: timestamp,
        duration: duration
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'RETURN_ERROR',
      message: error.message
    };
  }
}

/**
 * 取得未歸還的設備列表
 */
function getUnreturnedGears() {
  try {
    const records = getSheet(SHEET_NAMES.RECORDS);
    const data = records.getDataRange().getValues();
    const unreturned = [];

    for (let i = 1; i < data.length; i++) {
      if (!data[i][3]) { // D 欄為空表示未歸還
        unreturned.push({
          borrowerId: data[i][0],
          gear: data[i][1],
          borrowTime: data[i][2],
          duration: calculateDuration(data[i][2], new Date()),
          photoUrl: data[i][4] || null // E 欄為照片 URL
        });
      }
    }

    return {
      success: true,
      data: unreturned
    };
  } catch (error) {
    return {
      success: false,
      error: 'QUERY_ERROR',
      message: error.message
    };
  }
}

/**
 * 按日期取得借用記錄
 */
function getRecordsByDate(dateStr) {
  try {
    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    }

    const records = getSheet(SHEET_NAMES.RECORDS);
    const data = records.getDataRange().getValues();
    const result = [];

    for (let i = 1; i < data.length; i++) {
      const borrowTime = data[i][2];
      if (borrowTime && formatDate(borrowTime) === dateStr) {
        result.push({
          borrowerId: data[i][0],
          gear: data[i][1],
          borrowTime: borrowTime,
          returnTime: data[i][3] || null,
          status: data[i][3] ? '已歸還' : '借出中',
          photoUrl: data[i][4] || null // E 欄為照片 URL
        });
      }
    }

    return {
      success: true,
      date: dateStr,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: 'QUERY_ERROR',
      message: error.message
    };
  }
}

/**
 * 取得設備清單
 */
function getGears() {
  try {
    const gears = getSheet(SHEET_NAMES.GEARS);
    const data = gears.getDataRange().getValues();
    const result = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][3]) { // D 欄：是否提供借用
        result.push({
          id: data[i][0],
          name: data[i][1],
          description: data[i][2],
          available: data[i][3]
        });
      }
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: 'QUERY_ERROR',
      message: error.message
    };
  }
}

// ===== 輔助函數 =====

/**
 * 根據 ID 查找設備
 */
function findGearById(gearId) {
  try {
    const gears = getSheet(SHEET_NAMES.GEARS);
    const data = gears.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(gearId)) {
        return {
          id: data[i][0],
          name: data[i][1],
          description: data[i][2],
          available: data[i][3]
        };
      }
    }
    return null;
  } catch (error) {
    console.error('查找設備錯誤:', error);
    return null;
  }
}

/**
 * 驗證借用人
 * 學生不需要在 users 表中，只要學號格式正確即可
 */
function validateBorrower(borrowerId) {
  // 學生可以是任何人，不檢查 users 表
  // 只要學號格式正確（已在 recordBorrow 中檢查）就允許借用
  return true;
}

/**
 * 查找未歸還的記錄
 */
function findUnreturnedRecord(borrowerId, gearName) {
  try {
    const records = getSheet(SHEET_NAMES.RECORDS);
    const data = records.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === borrowerId && data[i][1] === gearName && !data[i][3]) {
        return {
          row: i + 1,
          borrowTime: data[i][2]
        };
      }
    }
    return null;
  } catch (error) {
    console.error('查找記錄錯誤:', error);
    return null;
  }
}

/**
 * 取得當前時間戳記
 */
function getCurrentTimestamp() {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 格式化日期
 */
function formatDate(date) {
  if (typeof date === 'string') {
    return date.split(' ')[0];
  }
  if (date instanceof Date) {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return '';
}

/**
 * 上傳照片到 Google Drive
 * @param {string} photoBase64 - Base64 編碼的照片資料
 * @param {string} fileName - 檔案名稱
 * @returns {object} 包含 fileId 和 url 的物件
 */
function uploadPhoto(photoBase64, fileName) {
  try {
    // 移除 Base64 前綴 (data:image/jpeg;base64,)
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // 將 Base64 轉換為 Blob
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', fileName);
    
    // 取得或建立 LibGear_Photos 資料夾
    const folderName = 'LibGear_Photos';
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    // 上傳檔案到資料夾
    const file = folder.createFile(blob);
    
    // 設定權限為任何人都可以查看
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    const url = `https://drive.google.com/uc?id=${fileId}`;
    
    return {
      success: true,
      fileId: fileId,
      url: url
    };
  } catch (error) {
    Logger.log('Upload photo error: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 計算借用時長
 */
function calculateDuration(startTime, endTime) {
  try {
    const start = new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);
    
    const diffMs = end - start;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 60) {
      return diffMinutes + ' 分鐘';
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return hours + ' 小時 ' + minutes + ' 分鐘';
  } catch (error) {
    return '-';
  }
}
