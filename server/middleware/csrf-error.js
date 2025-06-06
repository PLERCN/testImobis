import { eventHandler, createError } from 'h3'

export default eventHandler(async (event) => {
  const error = event.node.req.error
  if (error?.code === 'EBADCSRFTOKEN') {
    throw createError({
      statusCode: 403,
      message: 'Недействительный CSRF токен'
    })
  }
}) 