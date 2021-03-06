import request from 'supertest'
import { app } from '../../app'
import { Ticket } from '../../models/ticket'
import { natsWrapper } from '../../nats-wrapper'

it('should have a route handler listening to /api/tickets for POST request', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .send({})

  expect(response.status).not.toBe(404)
})

it('should be only accessed if user is signed in', async () => {
  await request(app)
    .post('/api/tickets')
    .send({})
    .expect(401)
})

it('should return a status other than 401 if user is signed in', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({})

  expect(response.status).not.toBe(401)
})

it('should return an error if an invalid title is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: '',
      price: 2000
    })
    .expect(400)
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      price: 2000
    })
    .expect(400)
})

it('should return an error if an invalid price is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'New title',
      price: -10
    })
    .expect(400)
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'New title'
    })
    .expect(400)
})

it('should create a ticket with valid inputs', async () => {
  let tickets = await Ticket.find({})
  expect(tickets.length).toBe(0)

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'New title',
      price: 50
    })
    .expect(201)

  tickets = await Ticket.find({})
  expect(tickets.length).toBe(1)
  expect(tickets[0].title).toBe('New title')
  expect(tickets[0].price).toBe(50)
})

it('should publish an event', async () => {
  const title = 'New Title'

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price: 50
    })
    .expect(201)

  expect(natsWrapper.client.publish).toHaveBeenCalled()
})
