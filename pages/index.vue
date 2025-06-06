<template>
  <div class="container">
    <div v-if="error" class="error-message">
      <span class="error-message-icon">⚠️</span>
      {{ error }}
    </div>

    <div class="page-header">
      <h1 class="page-title">Управление кампаниями</h1>
    </div>

    <CampaignList
      :campaigns="campaigns"
      @edit="editCampaign"
      @delete="deleteCampaign"
      @create="showCreateForm"
    />

    <div v-if="showForm" class="form-container">
      <div class="form-header">
        <h2 class="form-title">{{ editingCampaign ? 'Редактирование кампании' : 'Создание кампании' }}</h2>
      </div>

      <CampaignForm
        :initial-data="editingCampaign || { name: '', messages: [] }"
        @submit="saveCampaign"
        @cancel="hideForm"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CampaignList from '~/components/CampaignList.vue'
import CampaignForm from '~/components/CampaignForm.vue'
import { useCampaignStore } from '~/stores/campaign'
import '~/assets/css/index.css'

const store = useCampaignStore()
const campaigns = ref([])
const error = ref(null)
const showForm = ref(false)
const editingCampaign = ref(null)

const fetchCampaigns = async () => {
  try {
    await store.fetchCampaigns()
    campaigns.value = store.campaigns
  } catch (err) {
    error.value = err.message
    console.error('Ошибка при загрузке кампаний:', err)
  }
}

const saveCampaign = async (campaign) => {
  try {
    if (editingCampaign.value) {
      await store.updateCampaign({
        ...campaign,
        id: editingCampaign.value.id
      })
    } else {
      await store.createCampaign(campaign)
    }
    campaigns.value = store.campaigns
    hideForm()
  } catch (err) {
    error.value = err.message
    console.error('Ошибка при сохранении кампании:', err)
  }
}

const deleteCampaign = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить эту кампанию?')) {
    return
  }

  try {
    await store.deleteCampaign(id)
    await fetchCampaigns()
  } catch (err) {
    error.value = err.message
    console.error('Ошибка при удалении кампании:', err)
  }
}

const editCampaign = (campaign) => {
  editingCampaign.value = campaign
  showForm.value = true
}

const showCreateForm = () => {
  editingCampaign.value = null
  showForm.value = true
}

const hideForm = () => {
  showForm.value = false
  editingCampaign.value = null
}

onMounted(fetchCampaigns)
</script> 