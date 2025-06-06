export const CHANNEL_TYPES = {
  vk: 'ВКонтакте',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  sms: 'SMS'
}

export const KEYBOARD_TYPES = {
  standard: 'Standart',
  inline: 'Inline'
}

export const BUTTON_TYPES = {
  TEXT: 'text',
  URL: 'url'
}

export const CHANNEL_LIMITS = {
  vk: {
    maxTextLength: 4096,
    keyboardTypes: {
      standard: {
        maxButtons: 40,
        maxButtonTextLength: 40,
        supportsUrlButtons: true,
        maxUrlButtons: 40
      },
      inline: {
        maxButtons: 10,
        maxButtonTextLength: 64,
        supportsUrlButtons: true,
        maxUrlButtons: 10
      }
    }
  },
  telegram: {
    maxTextLength: 4096,
    keyboardTypes: {
      standard: {
        maxButtons: 8,
        maxButtonTextLength: 64,
        supportsUrlButtons: true,
        maxUrlButtons: 8
      },
      inline: {
        maxButtons: 8,
        maxButtonTextLength: 64,
        supportsUrlButtons: true,
        maxUrlButtons: 8
      }
    }
  },
  whatsapp: {
    maxTextLength: 1000,
    keyboardTypes: {
      standard: {
        maxButtons: 10,
        maxButtonTextLength: 20,
        supportsUrlButtons: false,
        maxUrlButtons: 0 // Не поддерживает кнопки-ссылки
      },
      inline: {
        maxButtons: 3,
        maxButtonTextLength: 20,
        supportsUrlButtons: true,
        maxUrlButtons: 1 // Максимум 1 кнопка-ссылка
      }
    }
  },
  sms: {
    maxTextLength: 160,
    keyboardTypes: {}
  }
}

export const validateMessage = (message) => {
  const errors = []
  const limits = CHANNEL_LIMITS[message.channel]

  if (!message.text.trim()) {
    errors.push('Текст сообщения обязателен')
  } else if (limits.maxTextLength && message.text.length > limits.maxTextLength) {
    errors.push(`Текст сообщения не должен превышать ${limits.maxTextLength} символов`)
  }

  if (message.channel !== 'sms') {
    if (!message.keyboardType) {
      errors.push('Тип клавиатуры обязателен')
    } else {
      const keyboardLimits = limits.keyboardTypes[message.keyboardType]
      if (!keyboardLimits) {
        errors.push('Неподдерживаемый тип клавиатуры')
      } else {
        if (message.buttons.length > keyboardLimits.maxButtons) {
          errors.push(`Максимальное количество кнопок: ${keyboardLimits.maxButtons}`)
        }

        const urlButtonsCount = message.buttons.filter(btn => btn.type === 'url').length
        if (keyboardLimits.maxUrlButtons && urlButtonsCount > keyboardLimits.maxUrlButtons) {
          errors.push(`Максимальное количество кнопок-ссылок: ${keyboardLimits.maxUrlButtons}`)
        }

        message.buttons.forEach(button => {
          if (!button.text.trim()) {
            errors.push('Текст кнопки обязателен')
          } else if (button.text.length > keyboardLimits.maxButtonTextLength) {
            errors.push(`Текст кнопки не должен превышать ${keyboardLimits.maxButtonTextLength} символов`)
          }

          if (button.type === 'url') {
            if (!keyboardLimits.supportsUrlButtons) {
              errors.push('Данный канал не поддерживает кнопки-ссылки')
            } else if (message.keyboardType === 'inline' && !button.url.trim()) {
              errors.push('URL кнопки обязателен для inline-клавиатуры')
            }
          }
        })
      }
    }
  }

  return errors
} 