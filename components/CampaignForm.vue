<template>
  <form class="campaign-form" :class="{ closing: isClosing }" @submit.prevent="handleSubmit">
    <div class="form-content">
      <div class="form-group">
        <label for="name">Название кампании</label>
        <input 
          id="name"
          v-model="campaign.name"
          type="text"
          class="form-control"
          required
        >
      </div>

      <div class="messages-section">
        <div v-for="(message, index) in campaign.messages" :key="index" class="message-block">
          <div class="message-header">
            <div class="message-title">
              <button 
                type="button"
                class="btn btn-icon btn-collapse"
                @click="message.isCollapsed = !message.isCollapsed"
                :title="message.isCollapsed ? 'Развернуть' : 'Свернуть'"
              >
                {{ message.isCollapsed ? '▶' : '▼' }}
              </button>
              <select v-model="message.channel" class="form-control">
                <option v-for="(name, type) in CHANNEL_TYPES" :key="type" :value="type">
                  {{ name }}
                </option>
              </select>
              <div v-if="message.channel !== 'sms'" class="keyboard-tabs">
                <button 
                  type="button"
                  class="keyboard-type"
                  :class="{ active: message.keyboardType === 'standard' }"
                  @click="message.keyboardType = 'standard'"
                >
                  {{ KEYBOARD_TYPES.standard }}
                </button>
                <button 
                  type="button"
                  class="keyboard-type"
                  :class="{ active: message.keyboardType === 'inline' }"
                  @click="message.keyboardType = 'inline'"
                >
                  {{ KEYBOARD_TYPES.inline }}
                </button>
              </div>
            </div>
            <div class="message-actions">
              <button 
                type="button"
                class="btn btn-icon btn-danger"
                @click="removeMessage(index)"
                title="Удалить сообщение"
              >
                🗑️
              </button>
            </div>
          </div>

          <div v-show="!message.isCollapsed" class="message-content">
            <div class="form-group">
              <label>Текст сообщения</label>
              <textarea 
                v-model="message.text"
                class="form-control"
                required
              ></textarea>
              <div v-if="getMessageTextError(message)" class="error-message">
                {{ getMessageTextError(message) }}
              </div>
            </div>

            <div class="buttons-section">
              <div v-for="(button, btnIndex) in message.buttons" :key="btnIndex" class="button-block">
                <div class="button-header">
                  <div class="button-title">
                    <input 
                      v-model="button.title"
                      type="text"
                      class="form-control button-title-input"
                      placeholder="Название кнопки"
                    >
                  </div>
                  <div class="button-actions">
                    <div class="button-type-selector" v-if="message.channel !== 'sms' && CHANNEL_LIMITS[message.channel].keyboardTypes[message.keyboardType].supportsUrlButtons">
                      <button 
                        type="button"
                        class="btn btn-sm"
                        :class="{ active: button.type === 'text' }"
                        @click="button.type = 'text'"
                        title="Обычная кнопка"
                      >
                        Текст
                      </button>
                      <button 
                        type="button"
                        class="btn btn-sm"
                        :class="{ active: button.type === 'url' }"
                        @click="button.type = 'url'"
                        title="Кнопка-ссылка"
                      >
                        URL
                      </button>
                    </div>
                    <button 
                      type="button"
                      class="btn btn-icon btn-danger"
                      @click="removeButton(message, btnIndex)"
                      title="Удалить кнопку"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label>Текст кнопки</label>
                  <input 
                    v-model="button.text"
                    type="text"
                    class="form-control"
                    required
                  >
                  <div v-if="getButtonTextError(message, button)" class="error-message">
                    {{ getButtonTextError(message, button) }}
                  </div>
                </div>

                <div class="form-group" v-if="message.channel !== 'sms' && button.type === 'url' && (message.keyboardType === 'inline' || CHANNEL_LIMITS[message.channel].keyboardTypes[message.keyboardType].supportsUrlButtons)">
                  <label>URL кнопки</label>
                  <input 
                    v-model="button.url"
                    type="url"
                    class="form-control"
                    :required="message.keyboardType === 'inline'"
                  >
                  <div v-if="getButtonUrlError(message, button)" class="error-message">
                    {{ getButtonUrlError(message, button) }}
                  </div>
                </div>
              </div>

              <div class="message-actions">
                <button 
                  type="button"
                  class="btn btn-secondary add-button"
                  @click="addButton(message)"
                  :disabled="!canAddButton(message)"
                  v-if="message.channel !== 'sms'"
                >
                  Добавить кнопку
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="messages-actions">
          <button 
            type="button"
            class="btn btn-secondary"
            @click="addMessage"
            :disabled="campaign.messages.length >= 10"
          >
            Добавить канал
          </button>
          <div class="form-actions">
            <button 
              type="button"
              class="btn btn-secondary"
              @click="handleCancel"
            >
              Отмена
            </button>
            <button 
              type="submit"
              class="btn btn-primary"
              :class="{ 'btn-disabled': !isValid }"
              :disabled="!isValid"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CHANNEL_TYPES, KEYBOARD_TYPES, CHANNEL_LIMITS, validateMessage } from '~/types/campaign'
import '~/assets/css/campaign-form.css'
import { useCampaignStore } from '~/stores/campaign'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      messages: []
    })
  }
})

const emit = defineEmits(['submit', 'cancel'])
const isClosing = ref(false)

const campaign = ref({
  name: props.initialData.name,
  messages: props.initialData.messages.map(msg => ({
    id: msg.id,
    channel: msg.channel || 'vk',
    text: msg.text || '',
    keyboardType: msg.keyboardType || 'standard',
    buttons: (msg.buttons || []).map(btn => ({
      id: btn.id,
      text: btn.text || '',
      url: btn.url || '',
      type: btn.type || 'text',
      title: btn.title || `Кнопка ${msg.buttons.indexOf(btn) + 1}`
    })),
    isCollapsed: true
  }))
})

// Следим за изменениями initialData
watch(() => props.initialData, (newData) => {
  campaign.value = {
    name: newData.name,
    messages: newData.messages.map(msg => ({
      id: msg.id,
      channel: msg.channel || 'vk',
      text: msg.text || '',
      keyboardType: msg.keyboardType || 'standard',
      buttons: (msg.buttons || []).map(btn => ({
        id: btn.id,
        text: btn.text || '',
        url: btn.url || '',
        type: btn.type || 'text',
        title: btn.title || `Кнопка ${msg.buttons.indexOf(btn) + 1}`
      })),
      isCollapsed: true
    }))
  }
}, { deep: true })

const isValid = computed(() => {
  if (!campaign.value.name.trim()) return false
  if (campaign.value.messages.length === 0) return false

  return campaign.value.messages.every(message => {
    // Проверка текста сообщения
    if (getMessageTextError(message)) return false
    // Проверка типа клавиатуры
    if (getMessageError(message)) return false
    // Проверка кнопок
    return message.buttons.every(button => {
      if (getButtonTextError(message, button)) return false
      if (getButtonUrlError(message, button)) return false
      return true
    })
  })
})

const store = useCampaignStore()

const handleSubmit = async () => {
  try {
    isClosing.value = true
    setTimeout(() => {
      emit('submit', campaign.value)
    }, 300)
  } catch (error) {
    console.error('Ошибка при сохранении кампании:', error)
  }
}

const addMessage = () => {
  if (campaign.value.messages.length < 10) {
    const newMessage = {
      channel: 'vk',
      text: '',
      buttons: [],
      isCollapsed: false
    }
    if (newMessage.channel !== 'sms') {
      newMessage.keyboardType = 'standard'
    }
    campaign.value.messages.push(newMessage)
  }
}

const removeMessage = (index) => {
  campaign.value.messages.splice(index, 1)
}

const addButton = (message) => {
  if (canAddButton(message)) {
    message.buttons.push({
      text: '',
      url: '',
      type: 'text',
      title: `Кнопка ${message.buttons.length + 1}`
    })
  }
}

const removeButton = (message, index) => {
  message.buttons.splice(index, 1)
}

const canAddButton = (message) => {
  if (message.channel === 'sms') return false
  const limits = CHANNEL_LIMITS[message.channel]
  const keyboardLimits = limits.keyboardTypes[message.keyboardType]
  return keyboardLimits && message.buttons.length < keyboardLimits.maxButtons
}

const getMessageTextError = (message) => {
  if (!message.text.trim()) {
    return 'Текст сообщения обязателен'
  }
  const limits = CHANNEL_LIMITS[message.channel]
  if (limits.maxTextLength && message.text.length > limits.maxTextLength) {
    return `Текст сообщения не должен превышать ${limits.maxTextLength} символов`
  }
  return ''
}

const getButtonTextError = (message, button) => {
  if (message.channel === 'sms') return ''
  const limits = CHANNEL_LIMITS[message.channel]
  const keyboardLimits = limits.keyboardTypes[message.keyboardType]
  
  if (!button.text.trim()) {
    return 'Текст кнопки обязателен'
  }
  
  if (keyboardLimits.maxButtonTextLength && button.text.length > keyboardLimits.maxButtonTextLength) {
    return `Текст кнопки не должен превышать ${keyboardLimits.maxButtonTextLength} символов`
  }
  
  return ''
}

const getButtonUrlError = (message, button) => {
  if (message.channel === 'sms') return ''
  const limits = CHANNEL_LIMITS[message.channel]
  const keyboardLimits = limits.keyboardTypes[message.keyboardType]

  if (button.type === 'url') {
    if (!keyboardLimits.supportsUrlButtons) {
      return 'Данный канал не поддерживает кнопки-ссылки'
    }
    if (message.keyboardType === 'inline' && !button.url.trim()) {
      return 'URL кнопки обязателен для inline-клавиатуры'
    }
    if (keyboardLimits.maxUrlButtons) {
      const urlButtonsCount = message.buttons.filter(btn => btn.type === 'url').length
      if (urlButtonsCount > keyboardLimits.maxUrlButtons) {
        return `Максимальное количество кнопок-ссылок: ${keyboardLimits.maxUrlButtons}`
      }
    }
  }
  return ''
}

const getMessageError = (message) => {
  if (!message.keyboardType && message.channel !== 'sms') {
    return 'Тип клавиатуры обязателен'
  }
  return ''
}

const handleCancel = () => {
  isClosing.value = true
  setTimeout(() => {
    emit('cancel')
  }, 300)
}
</script>