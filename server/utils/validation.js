import { URL } from 'url'
import xss from 'xss'

// Валидация URL
export const validateUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Санитизация текста
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return ''
  
  // Удаляем HTML-теги
  text = text.replace(/<[^>]*>/g, '')
  
  // Заменяем специальные символы
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  
  return text
}

// Валидация длины текста
export const validateTextLength = (text, maxLength) => {
  if (typeof text !== 'string') {
    return false
  }
  return text.length <= maxLength
}

// Валидация типа данных
export const validateType = (value, type) => {
  switch (type) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'array':
      return Array.isArray(value)
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    default:
      return false
  }
} 