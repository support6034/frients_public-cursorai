import { defineStore } from 'pinia'
import api from '../api'

export const useAiBotStore = defineStore('aiBot', {
  state: () => ({
    settings: null,
    templates: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchSettings(industry = 'shopping') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/api/ai-alimbot/settings?industry=${industry}`)
        if (response.data.success) {
          this.settings = response.data.data
        }
      } catch (error) {
        this.error = error.message
        console.error('AI 봇 설정 로드 오류:', error)
      } finally {
        this.loading = false
      }
    },
    
    async saveSettings(settings) {
      try {
        const response = await api.post('/api/ai-alimbot/settings', settings)
        if (response.data.success) {
          this.settings = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async fetchTemplates(industry = 'shopping') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/api/ai-alimbot/templates?industry=${industry}`)
        if (response.data.success) {
          this.templates = response.data.data
        }
      } catch (error) {
        this.error = error.message
        console.error('템플릿 로드 오류:', error)
      } finally {
        this.loading = false
      }
    },
    
    async saveTemplates(templates) {
      try {
        const response = await api.post('/api/ai-alimbot/templates', templates)
        if (response.data.success) {
          this.templates = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
})

