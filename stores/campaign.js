import { defineStore } from 'pinia'

const API_URL = 'http://localhost:3001/api'

export const useCampaignStore = defineStore('campaign', {
  state: () => ({
    campaigns: [],
    currentCampaign: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchCampaigns() {
      this.loading = true
      this.error = null
      try {
        const data = await $fetch(`${API_URL}/campaigns`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        this.campaigns = data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Неизвестная ошибка'
        console.error('Ошибка при загрузке кампаний:', error)
      } finally {
        this.loading = false
      }
    },

    async createCampaign(campaign) {
      this.loading = true
      this.error = null
      try {
        const data = await $fetch(`${API_URL}/campaigns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(campaign)
        })
        this.campaigns.push(data)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Неизвестная ошибка'
        console.error('Ошибка при создании кампании:', error)
      } finally {
        this.loading = false
      }
    },

    async updateCampaign(campaign) {
      this.loading = true
      this.error = null
      try {
        const data = await $fetch(`${API_URL}/campaigns/${campaign.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(campaign)
        })
        const index = this.campaigns.findIndex(c => c.id === campaign.id)
        if (index !== -1) {
          this.campaigns[index] = data
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Неизвестная ошибка'
        console.error('Ошибка при обновлении кампании:', error)
      } finally {
        this.loading = false
      }
    },

    async deleteCampaign(id) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`${API_URL}/campaigns/${id}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        this.campaigns = this.campaigns.filter(c => c.id !== id)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Неизвестная ошибка'
        console.error('Ошибка при удалении кампании:', error)
      } finally {
        this.loading = false
      }
    },

    setCurrentCampaign(campaign) {
      this.currentCampaign = campaign
    }
  }
}) 