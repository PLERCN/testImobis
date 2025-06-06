import express from 'express'
import { 
  validateCampaign, 
  getAllCampaigns, 
  createCampaign, 
  updateCampaign, 
  deleteCampaign 
} from './controllers.js'

const router = express.Router()

// Тестовый роут
router.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Тестовый роут кампаний работает' })
})

// GET /api/campaigns - получить все кампании
router.get('/', async (req, res) => {
  try {
    const campaigns = await getAllCampaigns()
    res.json(campaigns)
  } catch (error) {
    console.error('Ошибка при получении кампаний:', error)
    res.status(500).json({ message: 'Ошибка при получении кампаний' })
  }
})

// POST /api/campaigns - создать новую кампанию
router.post('/', async (req, res) => {
  try {
    const { name, messages } = req.body
    
    // Валидация входных данных
    const errors = validateCampaign({ name, messages })
    if (errors.length > 0) {
      return res.status(400).json({ errors })
    }
    
    const campaign = await createCampaign({ name, messages })
    res.status(201).json(campaign)
  } catch (error) {
    console.error('Ошибка при создании кампании:', error)
    res.status(500).json({ message: 'Ошибка при создании кампании' })
  }
})

// PUT /api/campaigns/:id - обновить кампанию
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, messages } = req.body
    
    // Валидация входных данных
    const errors = validateCampaign({ name, messages })
    if (errors.length > 0) {
      return res.status(400).json({ errors })
    }
    
    const campaign = await updateCampaign(id, { name, messages })
    if (!campaign) {
      return res.status(404).json({ message: 'Кампания не найдена' })
    }
    
    res.json(campaign)
  } catch (error) {
    console.error('Ошибка при обновлении кампании:', error)
    res.status(500).json({ message: 'Ошибка при обновлении кампании' })
  }
})

// DELETE /api/campaigns/:id - удалить кампанию
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const success = await deleteCampaign(id)
    
    if (!success) {
      return res.status(404).json({ message: 'Кампания не найдена' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка при удалении кампании:', error)
    res.status(500).json({ message: 'Ошибка при удалении кампании' })
  }
})

export default router 