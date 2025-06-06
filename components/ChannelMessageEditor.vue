<template>
  <div class="p-4 border rounded-lg shadow-sm">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center space-x-4">
        <ChannelSelector v-model="message.channel" />
        <h3 class="text-lg font-semibold">{{ channelName }}</h3>
      </div>
      <button @click="$emit('remove')" class="text-red-500 hover:text-red-700">
        <span class="sr-only">Удалить</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Текст сообщения</label>
        <textarea
          v-model="message.text"
          :maxlength="channelLimits.maxTextLength"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows="4"
        ></textarea>
        <p class="mt-1 text-sm text-gray-500">
          {{ message.text.length }}/{{ channelLimits.maxTextLength }} символов
        </p>
      </div>

      <div v-if="supportsKeyboard">
        <div class="flex items-center space-x-4 mb-2">
          <label class="block text-sm font-medium text-gray-700">Тип клавиатуры</label>
          <select
            v-model="message.keyboardType"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option v-for="(value, key) in KEYBOARD_TYPES" :key="value" :value="value">
              {{ key }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <div v-for="(button, index) in message.buttons" :key="button.id" class="flex items-center space-x-2">
            <input
              v-model="button.text"
              :maxlength="getMaxButtonTextLength"
              class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Текст кнопки"
            />
            <select
              v-model="button.type"
              class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option v-for="(value, key) in BUTTON_TYPES" :key="value" :value="value">
                {{ key }}
              </option>
            </select>
            <input
              v-if="button.type === BUTTON_TYPES.URL"
              v-model="button.url"
              class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="URL"
            />
            <button
              @click="removeButton(index)"
              class="text-red-500 hover:text-red-700"
            >
              <span class="sr-only">Удалить кнопку</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            v-if="canAddButton"
            @click="addButton"
            class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Добавить кнопку
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { CHANNEL_LIMITS, CHANNEL_TYPES, KEYBOARD_TYPES, BUTTON_TYPES } from '~/types/campaign'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:message', 'remove'])

const channelLimits = computed(() => CHANNEL_LIMITS[props.message.channel])
const supportsKeyboard = computed(() => {
  const limits = channelLimits.value
  if (!limits.standardKeyboard && !limits.inlineKeyboard) return false
  return limits.standardKeyboard?.maxButtons > 0 || limits.inlineKeyboard?.maxButtons > 0
})

const supportsUrlButtons = computed(() => {
  const limits = channelLimits.value
  return props.message.keyboardType === 'standard'
    ? limits.standardKeyboard.supportsUrlButtons
    : limits.inlineKeyboard.supportsUrlButtons
})

const getMaxButtonTextLength = computed(() => {
  const limits = channelLimits.value
  return props.message.keyboardType === 'standard'
    ? limits.standardKeyboard.maxButtonTextLength || Infinity
    : limits.inlineKeyboard.maxButtonTextLength || Infinity
})

const canAddButton = computed(() => {
  const limits = channelLimits.value
  const maxButtons = props.message.keyboardType === 'standard'
    ? limits.standardKeyboard.maxButtons
    : limits.inlineKeyboard.maxButtons
  return props.message.buttons.length < maxButtons
})

const channelName = computed(() => {
  const names = {
    vk: 'ВКонтакте',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    sms: 'SMS'
  }
  return names[props.message.channel]
})

// Добавляем watch для keyboardType
watch(() => props.message.keyboardType, (newType) => {
  const limits = channelLimits.value
  const keyboardConfig = newType === KEYBOARD_TYPES.STANDARD 
    ? limits.standardKeyboard 
    : limits.inlineKeyboard

  // Если клавиатура не поддерживается, очищаем кнопки
  if (!keyboardConfig) {
    props.message.buttons = []
    return
  }

  // Удаляем лишние кнопки
  if (props.message.buttons.length > keyboardConfig.maxButtons) {
    props.message.buttons = props.message.buttons.slice(0, keyboardConfig.maxButtons)
  }

  // Проверяем URL-кнопки для WhatsApp
  if (props.message.channel === CHANNEL_TYPES.WHATSAPP && newType === KEYBOARD_TYPES.INLINE) {
    const urlButtons = props.message.buttons.filter(btn => btn.type === BUTTON_TYPES.URL)
    if (urlButtons.length > 1) {
      // Оставляем только первую URL-кнопку
      const firstUrlButtonIndex = props.message.buttons.findIndex(btn => btn.type === BUTTON_TYPES.URL)
      props.message.buttons = props.message.buttons.filter((btn, index) => 
        index === firstUrlButtonIndex || btn.type !== BUTTON_TYPES.URL
      )
    }
  }

  // Проверяем поддержку URL-кнопок
  if (!keyboardConfig.supportsUrlButtons) {
    props.message.buttons = props.message.buttons.map(btn => ({
      ...btn,
      type: BUTTON_TYPES.TEXT,
      url: ''
    }))
  }
})

// Добавляем watch для channel
watch(() => props.message.channel, (newChannel) => {
  const limits = CHANNEL_LIMITS[newChannel]
  
  // Если канал не поддерживает клавиатуры, очищаем их
  if (!limits.standardKeyboard && !limits.inlineKeyboard) {
    props.message.buttons = []
    props.message.keyboardType = null
    return
  }

  // Если канал поддерживает только один тип клавиатуры, устанавливаем его
  if (!limits.standardKeyboard) {
    props.message.keyboardType = KEYBOARD_TYPES.INLINE
  } else if (!limits.inlineKeyboard) {
    props.message.keyboardType = KEYBOARD_TYPES.STANDARD
  }
})

function addButton() {
  if (!canAddButton.value) return
  props.message.buttons.push({
    id: crypto.randomUUID(),
    text: '',
    type: BUTTON_TYPES.TEXT,
    url: ''
  })
}

function removeButton(index) {
  props.message.buttons.splice(index, 1)
}
</script> 