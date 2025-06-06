<template>
  <div class="flex items-center space-x-4">
    <label class="block text-sm font-medium text-gray-700">Канал</label>
    <select
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value as ChannelType)"
      class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    >
      <option value="vk">ВКонтакте</option>
      <option value="telegram">Telegram</option>
      <option value="whatsapp">WhatsApp</option>
      <option value="sms">SMS</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { ChannelType } from '~/types/campaign'

const props = defineProps<{
  modelValue: ChannelType
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ChannelType): void
}>()
</script> 