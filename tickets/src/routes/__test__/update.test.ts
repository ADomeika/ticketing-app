import request from 'supertest'
import mongoose from 'mongoose'
import { app } from '../../app'

it('should return 404 if provided id does not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString()
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'new title',
      price: 15
    })
    .expect(404)
})

it('should return 401 if user is not authenticated', async () => {
  const id = new mongoose.Types.ObjectId().toHexString()
  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'new title',
      price: 15
    })
    .expect(401)
})

it('should return 401 if user does not own a ticket', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'Concert',
      price: 15
    })
    .expect(201)

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'New Title',
      price: 25
    })
    .expect(401)

  const originalTicketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
  
  expect(originalTicketResponse.body.title).toBe('Concert')
  expect(originalTicketResponse.body.price).toBe(15)
})

it('should return 400 if user provides invalid title or price', async () => {
  const cookie = global.signin()
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'Concert',
      price: 15
    })
    .expect(201)

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'new title',
      price: -5
    })
    .expect(400)

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      price: 400
    })
    .expect(400)
})

it('should update the ticket if valid inputs are provided and user is an owner', async () => {
  const cookie = global.signin()
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'Concert',
      price: 15
    })
    .expect(201)

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'New Title',
      price: 25
    })
    .expect(200)
  
  const updatedResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send()
    .expect(200)

  expect(updatedResponse.body.title).toBe('New Title')
  expect(updatedResponse.body.price).toBe(25)
})
