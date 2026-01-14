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
const VERSION = 'v1.0.0';

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
 * 主 doPost 處理函數
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    // 路由請求
    let result;
    switch (action) {
      case 'recordBorrow':
        result = recordBorrow(params.borrowerId, params.gearId);
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
        result = checkAuth();
        break;
      case 'getVersion':
        result = { success: true, version: VERSION };
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
 */
function checkAuth() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    
    // 開發模式：即使無法獲取郵箱，也返回 success: true
    // 這樣前端可以繼續運行，只是沒有權限
    if (!userEmail) {
      return {
        success: true,  // API 調用成功
        hasPermission: false,
        message: '無法獲取使用者信息。請檢查部署設置：\n1. 執行身份應為「我」\n2. 存取權限應為「任何人」',
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
 */
function recordBorrow(borrowerId, gearId) {
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
    records.appendRow([borrowerId, gearInfo.name, timestamp, '']);

    return {
      success: true,
      message: '借出成功',
      record: {
        borrowerId: borrowerId,
        gear: gearInfo.name,
        borrowTime: timestamp,
        returnTime: null
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
          duration: calculateDuration(data[i][2], new Date())
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
          status: data[i][3] ? '已歸還' : '借出中'
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
 */
function validateBorrower(borrowerId) {
  try {
    const users = getSheet(SHEET_NAMES.USERS);
    const data = users.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === borrowerId) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('驗證借用人錯誤:', error);
    return false;
  }
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
