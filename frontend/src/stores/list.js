import { defineStore } from 'pinia'
import api from '../api'

export const useListStore = defineStore('list', {
  state: () => ({
    lists: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchLists() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/api/lists')
        if (response.data.success) {
          this.lists = response.data.data
        }
      } catch (error) {
        this.error = error.message
        console.error('리스트 로드 오류:', error)
      } finally {
        this.loading = false
      }
    },
    
    async createList(list) {
      try {
        const response = await api.post('/api/lists', list)
        if (response.data.success) {
          await this.fetchLists()
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async updateList(id, list) {
      try {
        const response = await api.put(`/api/lists/${id}`, list)
        if (response.data.success) {
          await this.fetchLists()
          return response.data.data
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async deleteList(id) {
      try {
        const response = await api.delete(`/api/lists/${id}`)
        if (response.data.success) {
          await this.fetchLists()
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
})

