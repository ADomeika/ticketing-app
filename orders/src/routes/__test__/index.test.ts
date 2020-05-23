import request from 'supertest'
import mongoose from 'mongoose'
import { app } from '../../app'
import { Ticket } from '../../models/ticket'

const createTicket = async () => {
  const ticket =  Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  })
  await ticket.save()
  return ticket
}

it('should fetch orders for a particular user', async () => {
  const ticket1 = await createTicket()
  const ticket2 = await createTicket()
  const ticket3 = await createTicket()

  const user1cookie = global.signin()
  const user2cookie = global.signin()

  const { body: wrongOrder } = await request(app)
    .post('/api/orders')
    .set('Cookie', user1cookie)
    .send({ ticketId: ticket1.id })
    .expect(201)

  const { body: orderOne } = await request(app)
    .post('/api/orders')
    .set('Cookie', user2cookie)
    .send({ ticketId: ticket2.id })
    .expect(201)

  const { body: orderTwo } = await request(app)
    .post('/api/orders')
    .set('Cookie', user2cookie)
    .send({ ticketId: ticket3.id })
    .expect(201)

  const response = await request(app)
    .get('/api/orders')
    .set('Cookie', user2cookie)
    .send()
    .expect(200)
  
  expect(response.body.length).toBe(2)
  expect(response.body).toContainEqual(orderOne)
  expect(response.body).toContainEqual(orderTwo)
  expect(response.body).not.toContainEqual(wrongOrder)
})
