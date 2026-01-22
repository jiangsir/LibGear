/**
 * LibGear - 前端應用邏輯
 */

// Google Sign-In 回調函數（必須是全局函數）
function handleCredentialResponse(response) {
  console.log('收到 Google 登入憑證');
  if (window.libGearApp) {
    window.libGearApp.handleGoogleLogin(response.credential);
  }
}

class LibGearApp {
  constructor(apiClient) {
    this.api = apiClient;
    this.currentUser = null;
    this.gears = [];
    this.unreturned = [];
    this.currentDate = new Date().toISOString().split('T')[0];
    
    // 設置全局引用供 Google 回調使用
    window.libGearApp = this;
    
    this.initializeElements();
    this.attachEventListeners();
  }

  /**
   * 初始化 DOM 元素
   */
  initializeElements() {
    // 輸入欄位
    this.borrowerIdInput = document.getElementById('borrower-id');
    this.gearIdInput = document.getElementById('gear-id');
    
    // 按鈕
    this.borrowBtn = document.getElementById('borrow-btn');
    this.returnBtn = document.getElementById('return-btn');
    this.clearBtn = document.getElementById('clear-btn');
    
    // 表格
    this.unreturnedTable = document.getElementById('unreturned-table');
    this.recordsTable = document.getElementById('records-table');
    this.recordsTableBody = this.recordsTable?.querySelector('tbody');
    
    // 標籤頁
    this.tabBorrow = document.getElementById('tab-borrow');
    this.tabStatus = document.getElementById('tab-status');
    this.tabRecords = document.getElementById('tab-records');
    
    // 狀態訊息
    this.messageContainer = document.getElementById('message');
    
    // 日期選擇
    this.dateInput = document.getElementById('date-input');
    if (this.dateInput) {
      this.dateInput.value = this.currentDate;
    }
    
    // 登入相關元素
    this.loginSection = document.getElementById('login-section');
    this.userInfoSection = document.getElementById('user-info-section');
    this.loginPrompt = document.getElementById('login-prompt');
    this.userEmailSpan = document.getElementById('user-email');
    this.permissionBadge = document.getElementById('permission-badge');
    this.logoutBtn = document.getElementById('logout-btn');
  }

  /**
   * 附加事件監聽器
   */
  attachEventListeners() {
    // 借出按鈕
    if (this.borrowBtn) {
      this.borrowBtn.addEventListener('click', () => this.handleBorrow());
    }

    // 登出按鈕
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // 歸還按鈕
    if (this.returnBtn) {
      this.returnBtn.addEventListener('click', () => this.handleReturn());
    }

    // 清除按鈕
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clearInputs());
    }

    // 標籤頁點擊
    if (this.tabStatus) {
      this.tabStatus.addEventListener('click', () => this.loadUnreturnedGears());
    }

    if (this.tabRecords) {
      this.tabRecords.addEventListener('click', () => this.loadRecordsByDate());
    }

    // 日期變更
    if (this.dateInput) {
      this.dateInput.addEventListener('change', (e) => {
        this.currentDate = e.target.value;
        this.loadRecordsByDate();
      });
    }

    // 回車鍵快捷鍵
    if (this.borrowerIdInput) {
      this.borrowerIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.gearIdInput.focus();
      });
    }

    if (this.gearIdInput) {
      this.gearIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleBorrow();
      });
    }
  }

  /**
   * 處理 Google 登入
   */
  async handleGoogleLogin(idToken) {
    try {
      console.log('處理 Google 登入...');
      
      // 保存 ID Token 到 API Client
      this.api.setIdToken(idToken);
      
      // 隱藏登入提示和登入按鈕
      if (this.loginPrompt) this.loginPrompt.style.display = 'none';
      if (this.loginSection) this.loginSection.style.display = 'none';
      
      // 初始化應用
      await this.initialize();
    } catch (error) {
      console.error('登入處理失敗:', error);
      this.showMessage('登入失敗: ' + error.message, 'danger');
    }
  }

  /**
   * 處理登出
   */
  handleLogout() {
    console.log('登出');
    
    // 清除 ID Token
    this.api.setIdToken(null);
    this.currentUser = null;
    
    // 顯示登入按鈕
    if (this.loginSection) this.loginSection.style.display = 'block';
    if (this.userInfoSection) this.userInfoSection.style.display = 'none';
    if (this.loginPrompt) this.loginPrompt.style.display = 'block';
    
    // 清空數據
    this.gears = [];
    this.unreturned = [];
    if (this.unreturnedTable) this.unreturnedTable.innerHTML = '';
    if (this.recordsTableBody) this.recordsTableBody.innerHTML = '';
    
    this.showMessage('已登出', 'info');
  }

  /**
   * 處理 Google 登入
   */
  async handleGoogleLogin(idToken) {
    try {
      console.log('處理 Google 登入...');
      
      // 保存 ID Token
      this.api.setIdToken(idToken);
      
      // 隱藏登入提示
      if (this.loginPrompt) this.loginPrompt.style.display = 'none';
      
      // 重新初始化
      await this.initialize();
    } catch (error) {
      console.error('登入處理失敗:', error);
      this.showMessage('登入失敗: ' + error.message, 'error');
    }
  }

  /**
   * 處理登出
   */
  handleLogout() {
    // 清除 ID Token
    this.api.setIdToken(null);
    this.currentUser = null;
    
    // 顯示登入提示
    if (this.loginPrompt) this.loginPrompt.style.display = 'block';
    if (this.loginStatus) this.loginStatus.style.display = 'none';
    
    // 清空界面
    this.showMessage('已登出', 'info');
    if (this.unreturnedTable) this.unreturnedTable.innerHTML = '';
    if (this.recordsTable) this.recordsTable.innerHTML = '';
  }

  /**
   * 初始化應用
   */
  async initialize() {
    // 檢查是否有 ID Token
    const idToken = this.api.getIdToken();
    if (!idToken) {
      console.log('未登入，顯示登入提示');
      if (this.loginPrompt) this.loginPrompt.style.display = 'block';
      if (this.loginSection) this.loginSection.style.display = 'block';
      if (this.userInfoSection) this.userInfoSection.style.display = 'none';
      this.showMessage('請先使用 Google 帳號登入', 'warning');
      return;
    }
    
    this.showMessage('初始化中...', 'info');
    
    try {
      // 檢查後端版本
      await this.checkVersion();
      
      // 驗證使用者
      await this.verifyUser();
      
      // 加載設備清單
      await this.loadGears();
      
      // 加載未歸還設備
      await this.loadUnreturnedGears();
      
      // 加載今日記錄
      await this.loadRecordsByDate();
      
      // 聚焦到借用人欄位
      if (this.borrowerIdInput) {
        this.borrowerIdInput.focus();
      }
      
      this.showMessage('系統已就緒', 'success');
    } catch (error) {
      this.showMessage('初始化失敗: ' + error.message, 'error');
      console.error('初始化錯誤:', error);
    }
  }

  /**
   * 檢查後端版本
   */
  async checkVersion() {
    try {
      const frontendVersion = SYSTEM_CONFIG.VERSION || 'unknown';
      const result = await this.api.getVersion();
      
      if (result.success && result.version) {
        console.log(
          `%c📚 LibGear 系統版本\n` +
          `前端: ${frontendVersion} | 後端: ${result.version}`,
          'color: #4285f4; font-weight: bold; font-size: 14px; line-height: 1.6;'
        );
      } else {
        console.log(`%c📚 LibGear 前端版本: ${frontendVersion}`, 'color: #4285f4; font-weight: bold; font-size: 14px;');
      }
    } catch (error) {
      console.warn('無法獲取後端版本:', error.message);
    }
  }

  /**
   * 驗證使用者
   */
  async verifyUser() {
    const result = await this.api.checkAuth();
    
    // 只有 API 調用失敗時才拋出錯誤
    if (!result.success) {
      console.error('API 調用失敗:', result);
      throw new Error('無法連接到後端服務: ' + (result.message || '未知錯誤'));
    }

    this.currentUser = {
      email: result.email,
      hasPermission: result.hasPermission,
      permission: result.permission
    };

    console.log('使用者已驗證:', this.currentUser.email);
    console.log('權限狀態:', result.hasPermission ? '✅ 已授權' : '⚠️ 未授權');
    
    // 更新 UI 顯示
    if (this.loginSection) this.loginSection.style.display = 'none';
    if (this.userInfoSection) this.userInfoSection.style.display = 'block';
    if (this.userEmailSpan) this.userEmailSpan.textContent = this.currentUser.email;
    if (this.permissionBadge) {
      this.permissionBadge.innerHTML = result.hasPermission
        ? '<span class="badge bg-success">有權限</span>'
        : '<span class="badge bg-warning">無權限</span>';
    }
    
    // 如果沒有權限，顯示警告但不阻止使用
    if (!result.hasPermission) {
      this.showMessage('警告: ' + result.message, 'warning');
      console.warn('請在 Google Sheets 的 users 工作表中新增您的郵箱:', result.email);
    }
  }

  /**
   * 加載設備清單
   */
  async loadGears() {
    const result = await this.api.getGears();
    
    if (result.success) {
      this.gears = result.data || [];
      console.log(`已加載 ${this.gears.length} 個設備`);
    }
  }

  /**
   * 處理借出
   */
  async handleBorrow() {
    const borrowerId = this.borrowerIdInput?.value?.trim();
    const gearId = this.gearIdInput?.value?.trim();

    // 驗證輸入
    if (!borrowerId || !gearId) {
      this.showMessage('請輸入借用人和設備條碼', 'warning');
      return;
    }

    if (!SYSTEM_CONFIG.BORROWER_ID_FORMAT.test(borrowerId)) {
      this.showMessage(MESSAGES.ERROR.INVALID_FORMAT, 'error');
      return;
    }

    if (!SYSTEM_CONFIG.GEAR_ID_FORMAT.test(gearId)) {
      this.showMessage(MESSAGES.ERROR.INVALID_FORMAT, 'error');
      return;
    }

    this.showMessage('處理中...', 'info');
    this.disableInputs(true);

    try {
      const result = await this.api.recordBorrow(borrowerId, gearId);

      if (result.success) {
        this.showMessage(MESSAGES.SUCCESS.BORROW, 'success');
        this.clearInputs();
        
        // 刷新表格
        await this.loadUnreturnedGears();
        await this.loadRecordsByDate();
        
        // 聚焦到借用人欄位
        if (this.borrowerIdInput) {
          this.borrowerIdInput.focus();
        }
      } else {
        this.showMessage(result.message || MESSAGES.ERROR.API_FAILED, 'error');
      }
    } catch (error) {
      this.showMessage(error.message, 'error');
      console.error('借出錯誤:', error);
    } finally {
      this.disableInputs(false);
    }
  }

  /**
   * 處理歸還
   */
  async handleReturn() {
    const borrowerId = this.borrowerIdInput?.value?.trim();
    const gearId = this.gearIdInput?.value?.trim();

    if (!borrowerId || !gearId) {
      this.showMessage('請輸入借用人和設備條碼', 'warning');
      return;
    }

    this.showMessage('處理中...', 'info');
    this.disableInputs(true);

    try {
      const result = await this.api.recordReturn(borrowerId, gearId);

      if (result.success) {
        this.showMessage(MESSAGES.SUCCESS.RETURN, 'success');
        this.clearInputs();
        
        // 刷新表格
        await this.loadUnreturnedGears();
        await this.loadRecordsByDate();
        
        if (this.borrowerIdInput) {
          this.borrowerIdInput.focus();
        }
      } else {
        this.showMessage(result.message || MESSAGES.ERROR.API_FAILED, 'error');
      }
    } catch (error) {
      this.showMessage(error.message, 'error');
      console.error('歸還錯誤:', error);
    } finally {
      this.disableInputs(false);
    }
  }

  /**
   * 加載未歸還設備列表
   */
  async loadUnreturnedGears() {
    try {
      const result = await this.api.getUnreturnedGears();

      if (result.success) {
        this.unreturned = result.data || [];
        this.renderUnreturnedTable();
      } else {
        this.showMessage('加載失敗: ' + result.message, 'error');
      }
    } catch (error) {
      this.showMessage('加載錯誤: ' + error.message, 'error');
      console.error('加載未歸還設備錯誤:', error);
    }
  }

  /**
   * 加載借用記錄
   */
  async loadRecordsByDate() {
    try {
      const result = await this.api.getRecordsByDate(this.currentDate);

      if (result.success) {
        const records = result.data || [];
        this.renderRecordsTable(records);
      } else {
        this.showMessage('加載失敗: ' + result.message, 'error');
      }
    } catch (error) {
      this.showMessage('加載錯誤: ' + error.message, 'error');
      console.error('加載記錄錯誤:', error);
    }
  }

  /**
   * 繪製未歸還設備表格
   */
  renderUnreturnedTable() {
    if (!this.unreturnedTable) return;

    const tbody = this.unreturnedTable.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.unreturned.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">目前無未歸還設備</td></tr>';
      return;
    }

    this.unreturned.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${this.escapeHtml(record.borrowerId)}</td>
        <td>${this.escapeHtml(record.gear)}</td>
        <td>${this.formatTime(record.borrowTime)}</td>
        <td>${this.calculateDuration(record.borrowTime)}</td>
      `;
      tbody.appendChild(row);
    });
  }

  /**
   * 繪製借用記錄表格
   */
  renderRecordsTable(records) {
    if (!this.recordsTableBody) return;

    this.recordsTableBody.innerHTML = '';

    if (!records || records.length === 0) {
      this.recordsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">此日期無借用記錄</td></tr>';
      return;
    }

    records.forEach(record => {
      const row = document.createElement('tr');
      const status = record.returnTime ? '已歸還' : '借出中';
      const statusClass = record.returnTime ? 'success' : 'warning';
      
      row.innerHTML = `
        <td>${this.escapeHtml(record.borrowerId)}</td>
        <td>${this.escapeHtml(record.gear)}</td>
        <td>${this.formatTime(record.borrowTime)}</td>
        <td>${record.returnTime ? this.formatTime(record.returnTime) : '-'}</td>
        <td><span class="badge bg-${statusClass}">${status}</span></td>
      `;
      this.recordsTableBody.appendChild(row);
    });
  }

  /**
   * 清除輸入欄位
   */
  clearInputs() {
    if (this.borrowerIdInput) this.borrowerIdInput.value = '';
    if (this.gearIdInput) this.gearIdInput.value = '';
  }

  /**
   * 禁用/啟用輸入
   */
  disableInputs(disabled) {
    if (this.borrowerIdInput) this.borrowerIdInput.disabled = disabled;
    if (this.gearIdInput) this.gearIdInput.disabled = disabled;
    if (this.borrowBtn) this.borrowBtn.disabled = disabled;
    if (this.returnBtn) this.returnBtn.disabled = disabled;
  }

  /**
   * 顯示訊息
   */
  showMessage(message, type = 'info') {
    if (!this.messageContainer) return;

    const alertClass = {
      success: 'alert-success',
      error: 'alert-danger',
      warning: 'alert-warning',
      info: 'alert-info'
    }[type] || 'alert-info';

    this.messageContainer.className = `alert ${alertClass} alert-dismissible fade show`;
    this.messageContainer.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // 3 秒後自動隱藏
    setTimeout(() => {
      this.messageContainer.className = 'alert alert-info d-none';
    }, 3000);
  }

  /**
   * 格式化時間
   */
  formatTime(timestamp) {
    if (!timestamp) return '-';
    if (typeof timestamp === 'string') return timestamp;
    
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW');
  }

  /**
   * 計算借用時長
   */
  calculateDuration(borrowTime) {
    if (!borrowTime) return '-';
    
    const borrow = new Date(borrowTime);
    const now = new Date();
    const diff = Math.floor((now - borrow) / 60000); // 分鐘
    
    if (diff < 60) return `${diff} 分鐘`;
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    return `${hours} 小時 ${minutes} 分鐘`;
  }

  /**
   * HTML 轉義
   */
  escapeHtml(text) {
    // 處理 null, undefined, 或非字串類型
    if (text == null) return '';
    if (typeof text !== 'string') text = String(text);
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
  // 確保配置已加載
  if (typeof API_CONFIG === 'undefined') {
    console.error('配置文件未加載');
    return;
  }

  // 初始化 API 客戶端
  const apiClient = new APIClient(API_CONFIG.API_URL, API_CONFIG.TIMEOUT);
  
  // 初始化應用
  window.app = new LibGearApp(apiClient);
  window.app.initialize();
});
