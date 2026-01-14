/**
 * LibGear - API 客戶端
 * 封裝所有 API 調用
 */

class APIClient {
  constructor(baseURL, timeout = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.retries = 3;
    this.retryDelay = 1000;
  }

  /**
   * 發送 API 請求
   * @param {Object} params - 請求參數
   * @param {number} retryCount - 重試次數
   * @returns {Promise<Object>} API 回應
   */
  async request(params, retryCount = 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        body: JSON.stringify(params),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success && retryCount < this.retries) {
        await this.sleep(this.retryDelay);
        return this.request(params, retryCount + 1);
      }

      return data;
    } catch (error) {
      if (retryCount < this.retries) {
        console.warn(`重試 ${retryCount + 1}/${this.retries}...`, error.message);
        await this.sleep(this.retryDelay);
        return this.request(params, retryCount + 1);
      }

      console.error('API 請求失敗:', error);
      return {
        success: false,
        error: error.name === 'AbortError' ? 'TIMEOUT' : 'API_FAILED',
        message: error.message
      };
    }
  }

  /**
   * 延遲函數
   * @param {number} ms - 毫秒
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 記錄設備借出
   * @param {string} borrowerId - 借用人學號
   * @param {string} gearId - 設備條碼
   * @returns {Promise<Object>}
   */
  async recordBorrow(borrowerId, gearId) {
    return this.request({
      action: 'recordBorrow',
      borrowerId,
      gearId
    });
  }

  /**
   * 記錄設備歸還
   * @param {string} borrowerId - 借用人學號
   * @param {string} gearId - 設備條碼
   * @returns {Promise<Object>}
   */
  async recordReturn(borrowerId, gearId) {
    return this.request({
      action: 'recordReturn',
      borrowerId,
      gearId
    });
  }

  /**
   * 獲取已借出未歸還的設備列表
   * @returns {Promise<Object>}
   */
  async getUnreturnedGears() {
    return this.request({
      action: 'getUnreturnedGears'
    });
  }

  /**
   * 獲取特定日期的借用記錄
   * @param {string} date - 日期 (YYYY-MM-DD)
   * @returns {Promise<Object>}
   */
  async getRecordsByDate(date) {
    return this.request({
      action: 'getRecordsByDate',
      date
    });
  }

  /**
   * 獲取設備清單
   * @returns {Promise<Object>}
   */
  async getGears() {
    return this.request({
      action: 'getGears'
    });
  }

  /**
   * 驗證使用者權限
   * @returns {Promise<Object>}
   */
  async checkAuth() {
    return this.request({
      action: 'checkAuth'
    });
  }

  /**
   * 獲取系統版本
   * @returns {Promise<Object>}
   */
  async getVersion() {
    return this.request({
      action: 'getVersion'
    });
  }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}
