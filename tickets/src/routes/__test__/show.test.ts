import request from 'supertest'
import mongoose from 'mongoose'
import { app } from '../../app'

it('should return 404 if ticket is not found', async () => {
  const id = new mongoose.Types.ObjectId().toHexString()
  
  await request(app)
    .get(`/api/tickets/${id}`)
    .send()
    .expect(404)
})

it('should return ticket if ticket is found', async () => {
  const title = 'Concert'
  const price = 25

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({ title, price })
    .expect(201)

  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200)

  expect(ticketResponse.body.title).toBe(title)
  expect(ticketResponse.body.price).toBe(price)
})
