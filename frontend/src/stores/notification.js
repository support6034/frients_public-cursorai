import { defineStore } from 'pinia'
import api from '../api'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    settings: null,
    templates: [],
    selectedTemplates: [1, 2, 3, 4, 5], // 기본 템플릿 ID (주문접수, 결제완료, 상품준비중, 배송시작, 배송완료)
    selectedIndustry: 'shopping',
    activeTab: 'dashboard',
    loading: false,
    error: null,
    debugLogs: [],
    paymentBalance: 0,
    paymentHistory: [],
    integration: {
      smartstore: {
        enabled: false,
        apiKey: '',
        apiSecret: '',
        storeId: ''
      }
    }
  }),

  getters: {
    shoppingTemplates: () => [
      { id: 1, name: '주문접수', description: '주문이 접수되었습니다', default: true },
      { id: 2, name: '결제완료', description: '결제가 완료되었습니다', default: true },
      { id: 3, name: '상품준비중', description: '상품을 준비하고 있습니다', default: true },
      { id: 4, name: '배송시작', description: '배송이 시작되었습니다', default: true },
      { id: 5, name: '배송완료', description: '배송이 완료되었습니다', default: true },
      { id: 6, name: '구매확정', description: '구매가 확정되었습니다', default: false },
      { id: 7, name: '리뷰요청', description: '리뷰를 작성해주세요', default: false },
      { id: 8, name: '재고부족', description: '재고가 부족합니다', default: false },
      { id: 9, name: '주문취소', description: '주문이 취소되었습니다', default: false },
      { id: 10, name: '환불완료', description: '환불이 완료되었습니다', default: false }
    ]
  },

  actions: {
    // 설정 조회
    async fetchSettings(industry = 'shopping') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/api/ai-bot/settings?industry=${industry}`)
        if (response.data.success) {
          this.settings = response.data.data
          // 연동 설정이 있으면 state에 반영
          if (response.data.data.integrationConfig) {
            try {
              this.integration = JSON.parse(response.data.data.integrationConfig)
            } catch (e) {
              console.error('연동 설정 파싱 오류:', e)
            }
          }
        }
      } catch (error) {
        this.error = error.message
        console.error('AI 봇 설정 로드 오류:', error)
      } finally {
        this.loading = false
      }
    },

    // 설정 저장
    async saveSettings(settings) {
      try {
        const response = await api.post('/api/ai-bot/settings', settings)
        if (response.data.success) {
          this.settings = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 템플릿 목록 조회
    async fetchTemplates(industry = 'shopping') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/api/ai-bot/templates?industry=${industry}`)
        if (response.data.success) {
          this.templates = response.data.data
          // 선택된 템플릿 ID 추출
          if (response.data.data && response.data.data.length > 0) {
            this.selectedTemplates = response.data.data
              .filter(t => t.isSelected)
              .map(t => t.templateId || t.id)
          } else {
            // 저장된 템플릿이 없으면 기본 템플릿 선택
            const defaults = this.shoppingTemplates.filter(t => t.default).map(t => t.id)
            this.selectedTemplates = defaults
            // 서버에 기본 템플릿 저장
            await this.saveTemplatesByIds(defaults)
          }
        }
      } catch (error) {
        this.error = error.message
        console.error('템플릿 로드 오류:', error)
        // 오류 발생 시 기본 템플릿 선택
        const defaults = this.shoppingTemplates.filter(t => t.default).map(t => t.id)
        this.selectedTemplates = defaults
      } finally {
        this.loading = false
      }
    },

    // 템플릿 저장 (전체 객체)
    async saveTemplates(templates) {
      try {
        const response = await api.post('/api/ai-bot/templates', templates)
        if (response.data.success) {
          this.templates = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 템플릿 ID 배열로 저장
    async saveTemplatesByIds(templateIds) {
      try {
        const response = await api.post('/api/ai-bot/templates/ids', {
          templateIds: templateIds
        }, {
          params: {
            industry: this.selectedIndustry
          }
        })
        if (response.data.success) {
          this.selectedTemplates = templateIds
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 연동 설정 저장
    async saveIntegration(integration) {
      try {
        const response = await api.post('/api/ai-bot/integration', integration, {
          params: {
            industry: this.selectedIndustry
          }
        })
        if (response.data.success) {
          this.integration = integration
          return response.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 워크플로우 동기화
    async syncWorkflows(industry = 'shopping') {
      try {
        const response = await api.post('/api/ai-bot/sync-workflows', null, {
          params: {
            industry: industry
          }
        })
        if (response.data.success) {
          return response.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 설정 및 템플릿 저장 후 워크플로우 동기화
    async saveSettingsAndSync(settings, templateIds) {
      try {
        // 설정 저장
        await this.saveSettings(settings)
        // 템플릿 저장
        await this.saveTemplatesByIds(templateIds)
        // 워크플로우 동기화
        const syncResult = await this.syncWorkflows(this.selectedIndustry)
        return syncResult
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 디버그 로그 조회
    async fetchDebugLogs(filters = {}) {
      this.loading = true
      this.error = null
      try {
        const params = new URLSearchParams()
        if (filters.component) params.append('component', filters.component)
        if (filters.direction) params.append('direction', filters.direction)
        if (filters.limit) params.append('limit', filters.limit)
        else params.append('limit', 50)

        const response = await api.get(`/api/debug-logs?${params.toString()}`)
        if (response.data.success) {
          this.debugLogs = response.data.data
        }
      } catch (error) {
        this.error = error.message
        console.error('디버그 로그 조회 오류:', error)
      } finally {
        this.loading = false
      }
    },

    // 결제 잔액 조회
    async fetchPaymentBalance() {
      try {
        const response = await api.get('/api/payment/balance')
        if (response.data.success) {
          this.paymentBalance = response.data.data.balance || 0
          return this.paymentBalance
        }
      } catch (error) {
        this.error = error.message
        console.error('결제 잔액 조회 오류:', error)
        throw error
      }
    },

    // 결제 내역 조회
    async fetchPaymentHistory() {
      try {
        const response = await api.get('/api/payment/history')
        if (response.data.success) {
          this.paymentHistory = response.data.data || []
          return this.paymentHistory
        }
      } catch (error) {
        this.error = error.message
        console.error('결제 내역 조회 오류:', error)
        throw error
      }
    },

    // 결제 충전
    async chargePayment(amount, paymentMethod = 'card') {
      try {
        const response = await api.post('/api/payment/charge', {
          amount: amount,
          paymentMethod: paymentMethod
        })
        if (response.data.success) {
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 결제 검증
    async verifyPayment(impUid, merchantUid, amount) {
      try {
        const response = await api.post('/api/payment/verify', {
          imp_uid: impUid,
          merchant_uid: merchantUid,
          amount: amount
        })
        if (response.data.success) {
          // 잔액 및 내역 새로고침
          await this.fetchPaymentBalance()
          await this.fetchPaymentHistory()
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 템플릿 선택 토글
    toggleTemplate(templateId) {
      if (this.selectedTemplates.includes(templateId)) {
        this.selectedTemplates = this.selectedTemplates.filter(id => id !== templateId)
      } else {
        this.selectedTemplates = [...this.selectedTemplates, templateId]
      }
    },

    // 업종 선택
    setSelectedIndustry(industry) {
      this.selectedIndustry = industry
    },

    // 탭 전환
    setActiveTab(tab) {
      this.activeTab = tab
    }
  }
})

