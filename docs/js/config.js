/**
 * LibGear - 圖書館設備借還系統
 * 配置文件
 */

const API_CONFIG = {
  // Google Apps Script 部署 URL
  // 需要替換為實際的 DEPLOYMENT_ID
  API_URL: 'https://script.google.com/macros/s/AKfycbwpAlRkuTsH0zcdo104ZaH4msk-n9v-E5C8O2WUA4aJbDeMDskZ-w0t69mVq6tefjsu/exec',
  
  // API 超時時間 (毫秒)
  TIMEOUT: 10000,
  
  // 重試次數
  MAX_RETRIES: 3,
  
  // 重試延遲 (毫秒)
  RETRY_DELAY: 1000
};

// 系統設定
const SYSTEM_CONFIG = {
  // 版本號
  VERSION: 'v1.0.0',
  
  // 設備條碼格式：5 位數字
  GEAR_ID_FORMAT: /^\d{5}$/,
  
  // 借用人學號格式：7-10 位字元
  BORROWER_ID_FORMAT: /^[\dA-Za-z]{7,10}$/,
  
  // 時間戳記格式
  TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:MM:SS',
  
  // UI 刷新時間間隔 (毫秒)
  REFRESH_INTERVAL: 3000
};

// 訊息文本
const MESSAGES = {
  // 成功訊息
  SUCCESS: {
    BORROW: '借出成功',
    RETURN: '歸還成功',
    LOADED: '數據加載成功'
  },
  
  // 錯誤訊息
  ERROR: {
    API_FAILED: 'API 調用失敗，請重試',
    USER_NOT_FOUND: '使用者不存在',
    GEAR_NOT_FOUND: '設備不存在',
    NO_PERMISSION: '無借還權限',
    GEAR_DISABLED: '該設備不提供借用',
    INVALID_FORMAT: '格式不正確',
    NO_NETWORK: '網路連接失敗',
    TIMEOUT: '請求超時，請重試'
  },
  
  // 確認訊息
  CONFIRM: {
    DELETE_RECORD: '確定要刪除此記錄嗎？'
  }
};

// 表格配置
const TABLE_CONFIG = {
  // 未歸還設備列表
  UNRETURNED_GEARS: {
    COLUMNS: ['borrowerId', 'gear', 'borrowTime', 'duration'],
    HEADERS: ['借用人', '設備', '借用時間', '借用時長']
  },
  
  // 借用記錄
  RECORDS: {
    COLUMNS: ['borrowerId', 'gear', 'borrowTime', 'returnTime', 'status'],
    HEADERS: ['借用人', '設備', '借用時間', '歸還時間', '狀態']
  }
};

// 導出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, SYSTEM_CONFIG, MESSAGES, TABLE_CONFIG };
}
