import { defineStore } from 'pinia'
import api from '../api'

export const useWorkflowStore = defineStore('workflow', {
  state: () => ({
    workflows: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchWorkflows() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/api/workflows')
        if (response.data.success) {
          this.workflows = response.data.data
        }
      } catch (error) {
        this.error = error.message
        console.error('워크플로우 로드 오류:', error)
      } finally {
        this.loading = false
      }
    },
    
    async createWorkflow(workflow) {
      try {
        const response = await api.post('/api/workflows', workflow)
        if (response.data.success) {
          await this.fetchWorkflows()
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async updateWorkflow(id, workflow) {
      try {
        const response = await api.put(`/api/workflows/${id}`, workflow)
        if (response.data.success) {
          await this.fetchWorkflows()
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async deleteWorkflow(id) {
      try {
        const response = await api.delete(`/api/workflows/${id}`)
        if (response.data.success) {
          await this.fetchWorkflows()
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async launchWorkflow(id) {
      try {
        const response = await api.post(`/api/workflows/${id}/launch`)
        if (response.data.success) {
          await this.fetchWorkflows()
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async stopWorkflow(id) {
      try {
        const response = await api.post(`/api/workflows/${id}/stop`)
        if (response.data.success) {
          await this.fetchWorkflows()
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
})

