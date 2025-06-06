import { pool, getClient } from '../../db/index.js'
import { validateUrl, sanitizeText } from '../../utils/validation.js'

// Валидация данных кампании
export const validateCampaign = (data) => {
  const errors = []
  
  if (!data.name || typeof data.name !== 'string' || data.name.length > 255) {
    errors.push('Некорректное название кампании')
  }
  
  if (!Array.isArray(data.messages)) {
    errors.push('Некорректный формат сообщений')
    return errors
  }
  
  data.messages.forEach((message, index) => {
    if (!message.channel || !['vk', 'telegram', 'whatsapp', 'sms'].includes(message.channel)) {
      errors.push(`Некорректный канал в сообщении ${index + 1}`)
    }
    
    if (!message.text || typeof message.text !== 'string' || message.text.length > 4096) {
      errors.push(`Некорректный текст в сообщении ${index + 1}`)
    }
    
    if (message.channel !== 'sms' && (!message.keyboardType || !['standard', 'inline'].includes(message.keyboardType))) {
      errors.push(`Некорректный тип клавиатуры в сообщении ${index + 1}`)
    }
    
    if (Array.isArray(message.buttons)) {
      message.buttons.forEach((button, btnIndex) => {
        if (!button.text || typeof button.text !== 'string' || button.text.length > 64) {
          errors.push(`Некорректный текст кнопки ${btnIndex + 1} в сообщении ${index + 1}`)
        }
        
        if (button.type === 'url' && (!button.url || !validateUrl(button.url))) {
          errors.push(`Некорректный URL кнопки ${btnIndex + 1} в сообщении ${index + 1}`)
        }
        
        if (!button.title || typeof button.title !== 'string' || button.title.length > 255) {
          errors.push(`Некорректное название кнопки ${btnIndex + 1} в сообщении ${index + 1}`)
        }
      })
    }
  })
  
  return errors
}

// Форматирование данных кампании
const formatCampaign = (campaign, messages) => {
  return {
    id: campaign.id,
    name: campaign.name,
    created_at: campaign.created_at,
    messages: messages.map(message => ({
      id: message.id,
      channel: message.channel,
      text: message.text,
      keyboardType: message.keyboard_type,
      buttons: message.buttons || []
    }))
  }
}

// Получить все кампании
export const getAllCampaigns = async () => {
  const client = await getClient()
  try {
    // Получаем все кампании
    const campaignsResult = await client.query(`
      SELECT * FROM campaigns
      ORDER BY created_at DESC
    `)
    
    const campaigns = []
    
    // Для каждой кампании получаем сообщения и кнопки
    for (const campaign of campaignsResult.rows) {
      const messagesResult = await client.query(`
        SELECT * FROM messages
        WHERE campaign_id = $1
      `, [campaign.id])
      
      const messages = []
      
      // Для каждого сообщения получаем кнопки
      for (const message of messagesResult.rows) {
        const buttonsResult = await client.query(`
          SELECT * FROM buttons
          WHERE message_id = $1
        `, [message.id])
        
        messages.push({
          ...message,
          buttons: buttonsResult.rows
        })
      }
      
      campaigns.push(formatCampaign(campaign, messages))
    }
    
    return campaigns
  } finally {
    client.release()
  }
}

// Создать новую кампанию
export const createCampaign = async (campaignData) => {
  const client = await getClient()
  try {
    const { name, messages } = campaignData
    
    // Санитизация данных
    const sanitizedName = sanitizeText(name)
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      text: sanitizeText(msg.text),
      buttons: msg.buttons?.map(btn => ({
        ...btn,
        text: sanitizeText(btn.text),
        title: sanitizeText(btn.title),
        url: btn.type === 'url' ? validateUrl(btn.url) ? btn.url : null : null
      }))
    }))

    await client.query('BEGIN')

    // Создаем кампанию
    const campaignResult = await client.query(
      'INSERT INTO campaigns (name) VALUES ($1) RETURNING *',
      [sanitizedName]
    )
    const campaign = campaignResult.rows[0]

    // Создаем сообщения и кнопки
    const createdMessages = []
    for (const message of sanitizedMessages) {
      const messageResult = await client.query(
        'INSERT INTO messages (campaign_id, channel, text, keyboard_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [campaign.id, message.channel, message.text, message.keyboardType]
      )
      const createdMessage = messageResult.rows[0]

      const createdButtons = []
      if (message.buttons && message.buttons.length > 0) {
        for (const button of message.buttons) {
          const buttonResult = await client.query(
            'INSERT INTO buttons (message_id, text, url, type, title) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [createdMessage.id, button.text, button.url, button.type, button.title]
          )
          createdButtons.push(buttonResult.rows[0])
        }
      }

      createdMessages.push({
        ...createdMessage,
        buttons: createdButtons
      })
    }

    await client.query('COMMIT')
    return formatCampaign(campaign, createdMessages)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Обновить кампанию
export const updateCampaign = async (id, campaignData) => {
  const client = await getClient()
  try {
    const { name, messages } = campaignData
    
    // Санитизация данных
    const sanitizedName = sanitizeText(name)
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      text: sanitizeText(msg.text),
      buttons: msg.buttons?.map(btn => ({
        ...btn,
        text: sanitizeText(btn.text),
        title: sanitizeText(btn.title),
        url: btn.type === 'url' ? validateUrl(btn.url) ? btn.url : null : null
      }))
    }))

    await client.query('BEGIN')

    // Обновляем кампанию
    const campaignResult = await client.query(
      'UPDATE campaigns SET name = $1 WHERE id = $2 RETURNING *',
      [sanitizedName, id]
    )
    
    if (campaignResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return null
    }
    
    const campaign = campaignResult.rows[0]

    // Удаляем старые сообщения и кнопки
    await client.query('DELETE FROM messages WHERE campaign_id = $1', [id])

    // Создаем новые сообщения и кнопки
    const createdMessages = []
    for (const message of sanitizedMessages) {
      const messageResult = await client.query(
        'INSERT INTO messages (campaign_id, channel, text, keyboard_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, message.channel, message.text, message.keyboardType]
      )
      const createdMessage = messageResult.rows[0]

      const createdButtons = []
      if (message.buttons && message.buttons.length > 0) {
        for (const button of message.buttons) {
          const buttonResult = await client.query(
            'INSERT INTO buttons (message_id, text, url, type, title) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [createdMessage.id, button.text, button.url, button.type, button.title]
          )
          createdButtons.push(buttonResult.rows[0])
        }
      }

      createdMessages.push({
        ...createdMessage,
        buttons: createdButtons
      })
    }

    await client.query('COMMIT')
    return formatCampaign(campaign, createdMessages)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Удалить кампанию
export const deleteCampaign = async (id) => {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await client.query('DELETE FROM campaigns WHERE id = $1 RETURNING id', [id])
    await client.query('COMMIT')
    return result.rows.length > 0
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
} 