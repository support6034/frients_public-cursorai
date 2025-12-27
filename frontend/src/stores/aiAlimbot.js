import { defineStore } from 'pinia'
import api from '../api'

export const useAiAlimbotStore = defineStore('aiAlimbot', {
  state: () => ({
    settings: null,
    templates: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchSettings() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/api/ai-alimbot/settings')
        if (response.data.success) {
          this.settings = response.data.data
        }
      } catch (error) {
        this.error = error.message
        console.error('AI 알림봇 설정 로드 오류:', error)
      } finally {
        this.loading = false
      }
    },
    
    async saveSettings(settings) {
      try {
        const response = await api.post('/api/ai-alimbot/settings', settings)
        if (response.data.success) {
          this.settings = settings
          return response.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async saveIntegration(integration) {
      try {
        const response = await api.post('/api/ai-alimbot/integration', integration)
        if (response.data.success) {
          if (this.settings) {
            this.settings.integration = integration
          }
          return response.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async fetchTemplates() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/api/ai-alimbot/templates')
        if (response.data.success) {
          this.templates = response.data.data || []
        }
      } catch (error) {
        this.error = error.message
        console.error('템플릿 로드 오류:', error)
      } finally {
        this.loading = false
      }
    },
    
    async saveTemplates(templateIds) {
      try {
        const response = await api.post('/api/ai-alimbot/templates', { templateIds })
        if (response.data.success) {
          this.templates = templateIds
          return response.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async syncWorkflows() {
      try {
        const response = await api.post('/api/ai-alimbot/sync-workflows')
        if (response.data.success) {
          return response.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
})

