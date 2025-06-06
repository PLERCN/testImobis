<template>
  <div class="campaign-list">
    <div v-if="campaigns.length === 0" class="no-campaigns">
      <div class="no-campaigns-icon">📝</div>
      <div class="no-campaigns-text">Нет доступных кампаний</div>
      <button class="btn btn-primary" @click="$emit('create')">
        Создать кампанию
      </button>
    </div>
    
    <div v-else class="campaign-grid">
      <div v-for="campaign in campaigns" :key="campaign.id" class="campaign-card">
        <div class="campaign-header">
          <h3 class="campaign-title">{{ campaign.name }}</h3>
          <div class="campaign-actions">
            <button 
              @click="$emit('edit', campaign)" 
              class="btn btn-icon btn-primary" 
              title="Редактировать"
            >
              ✏️
            </button>
            <button 
              @click="$emit('delete', campaign.id)" 
              class="btn btn-icon btn-danger" 
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div class="campaign-messages">
          <div v-for="(message, index) in campaign.messages" :key="index" class="message-preview">
            <div class="message-header">
              <span class="channel-badge" :class="message.channel">{{ message.channel ? CHANNEL_TYPES[message.channel] : 'Неизвестный канал' }}</span>
              <span v-if="message.channel !== 'sms'" class="keyboard-type" :class="message.keyboardType">{{ message.keyboardType ? KEYBOARD_TYPES[message.keyboardType] : 'Неизвестный тип' }}</span>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.text }}</div>
              <div v-if="message.buttons.length > 0" class="message-buttons">
                <div v-for="(button, btnIndex) in message.buttons" :key="btnIndex" class="button-preview">
                  <span class="button-text">{{ button.title }}</span>
                  <span v-if="button.url" class="button-url">🔗</span>
                  <div class="button-details">
                    <div class="button-detail">
                      <span class="detail-label">Текст:</span>
                      <span class="detail-value">{{ button.text }}</span>
                    </div>
                    <div v-if="button.url" class="button-detail">
                      <span class="detail-label">URL:</span>
                      <span class="detail-value">{{ button.url }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="campaign-card create-card" @click="$emit('create')">
        <div class="create-card-content">
          <span class="create-card-icon">+</span>
          <span class="create-card-text">Создать кампанию</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CHANNEL_TYPES, KEYBOARD_TYPES } from '~/types/campaign'
import '~/assets/css/campaign-list.css'

defineProps({
  campaigns: {
    type: Array,
    required: true
  }
})

defineEmits(['edit', 'delete', 'create'])
</script>
 