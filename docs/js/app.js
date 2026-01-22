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
    
    // 照片相關元素
    this.photoInput = document.getElementById('photo-input');
    this.takePhotoBtn = document.getElementById('take-photo-btn');
    this.photoPreview = document.getElementById('photo-preview');
    this.previewImg = document.getElementById('preview-img');
    this.removePhotoBtn = document.getElementById('remove-photo-btn');
    this.currentPhotoBase64 = null; // 儲存壓縮後的照片
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

    // 拍照相關
    if (this.takePhotoBtn && this.photoInput) {
      console.log('✅ 拍照按鈕事件已綁定');
      this.takePhotoBtn.addEventListener('click', () => {
        console.log('📸 拍照按鈕被點擊');
        this.photoInput.click();
      });
      this.photoInput.addEventListener('change', (e) => this.handlePhotoSelect(e));
    } else {
      console.error('❌ 拍照元素未找到:', {
        takePhotoBtn: this.takePhotoBtn,
        photoInput: this.photoInput
      });
    }

    if (this.removePhotoBtn) {
      this.removePhotoBtn.addEventListener('click', () => this.removePhoto());
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
    
    // 顯示登入區域，隱藏使用者資訊
    if (this.loginPrompt) this.loginPrompt.style.display = 'block';
    if (this.loginSection) this.loginSection.style.display = 'block';
    if (this.userInfoSection) this.userInfoSection.style.display = 'none';
    
    // 清空界面
    this.showMessage('已登出', 'info');
    if (this.unreturnedTable) this.unreturnedTable.innerHTML = '';
    if (this.recordsTable) this.recordsTable.innerHTML = '';
  }

  /**
   * 初始化應用
   */
  async initialize() {
    console.log('🚀 開始初始化應用...');
    
    // 檢查是否有 ID Token
    const idToken = this.api.getIdToken();
    console.log('📋 ID Token 檢查:', idToken ? '已存在' : '不存在');
    
    if (!idToken) {
      console.log('未登入，顯示登入提示');
      console.log('登入區域元素:', {
        loginPrompt: this.loginPrompt,
        loginSection: this.loginSection,
        userInfoSection: this.userInfoSection
      });
      
      if (this.loginPrompt) {
        this.loginPrompt.style.display = 'block';
        console.log('✅ 登入提示已顯示');
      }
      if (this.loginSection) {
        this.loginSection.style.display = 'block';
        console.log('✅ 登入按鈕區域已顯示');
      }
      if (this.userInfoSection) {
        this.userInfoSection.style.display = 'none';
        console.log('✅ 使用者資訊區域已隱藏');
      }
      
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
   * 處理照片選擇
   */
  async handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      this.showMessage('請選擇圖片文件', 'warning');
      return;
    }

    // 檢查文件大小 (限制 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showMessage('圖片文件過大，請選擇小於 10MB 的圖片', 'warning');
      return;
    }

    this.showMessage('正在處理照片...', 'info');

    try {
      // 壓縮圖片
      const compressedBase64 = await this.compressImage(file);
      this.currentPhotoBase64 = compressedBase64;

      // 顯示預覽
      this.previewImg.src = compressedBase64;
      this.photoPreview.style.display = 'block';

      this.showMessage('照片已準備好', 'success');
    } catch (error) {
      console.error('處理照片失敗:', error);
      this.showMessage('處理照片失敗: ' + error.message, 'error');
      this.removePhoto();
    }
  }

  /**
   * 壓縮圖片
   */
  compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // 創建 canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // 計算縮放比例 (最大寬高 800px)
          const maxSize = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          // 設定 canvas 尺寸
          canvas.width = width;
          canvas.height = height;

          // 繪製圖片
          ctx.drawImage(img, 0, 0, width, height);

          // 轉換為 Base64 (JPEG, 70% 質量)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };

        img.onerror = () => reject(new Error('無法載入圖片'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('無法讀取文件'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 移除照片
   */
  removePhoto() {
    this.currentPhotoBase64 = null;
    this.photoPreview.style.display = 'none';
    this.previewImg.src = '';
    this.photoInput.value = '';
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
      let photoUrl = null;

      // 如果有照片，先上傳到 Drive
      if (this.currentPhotoBase64) {
        this.showMessage('正在上傳照片...', 'info');
        const fileName = `${borrowerId}_${gearId}_${Date.now()}.jpg`;
        
        const uploadResult = await this.api.uploadPhoto(this.currentPhotoBase64, fileName);
        
        if (uploadResult.success) {
          photoUrl = uploadResult.url;
          console.log('照片上傳成功:', photoUrl);
        } else {
          console.warn('照片上傳失敗:', uploadResult.error);
          // 照片上傳失敗不影響借用流程
        }
      }

      // 記錄借用
      const result = await this.api.recordBorrow(borrowerId, gearId, photoUrl);

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
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">目前無未歸還設備</td></tr>';
      return;
    }

    this.unreturned.forEach(record => {
      const row = document.createElement('tr');
      
      // 照片欄位
      let photoCell = '-';
      if (record.photoUrl) {
        photoCell = `<a href="${this.escapeHtml(record.photoUrl)}" target="_blank" class="btn btn-sm btn-outline-primary">
          <i class="bi bi-image"></i> 查看照片
        </a>`;
      }
      
      row.innerHTML = `
        <td>${this.escapeHtml(record.borrowerId)}</td>
        <td>${this.escapeHtml(record.gear)}</td>
        <td>${this.formatTime(record.borrowTime)}</td>
        <td>${this.calculateDuration(record.borrowTime)}</td>
        <td>${photoCell}</td>
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
      this.recordsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">此日期無借用記錄</td></tr>';
      return;
    }

    records.forEach(record => {
      const row = document.createElement('tr');
      const status = record.returnTime ? '已歸還' : '借出中';
      const statusClass = record.returnTime ? 'success' : 'warning';
      
      // 照片欄位
      let photoCell = '-';
      if (record.photoUrl) {
        photoCell = `<a href="${this.escapeHtml(record.photoUrl)}" target="_blank" class="btn btn-sm btn-outline-primary">
          <i class="bi bi-image"></i> 查看照片
        </a>`;
      }
      
      row.innerHTML = `
        <td>${this.escapeHtml(record.borrowerId)}</td>
        <td>${this.escapeHtml(record.gear)}</td>
        <td>${this.formatTime(record.borrowTime)}</td>
        <td>${record.returnTime ? this.formatTime(record.returnTime) : '-'}</td>
        <td><span class="badge bg-${statusClass}">${status}</span></td>
        <td>${photoCell}</td>
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
    this.removePhoto(); // 清除照片
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
