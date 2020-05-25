import request from 'supertest'
import mongoose from 'mongoose'
import { app } from '../../app'
import { Order } from '../../models/order'
import { OrderStatus } from '@adtickets/common'
import { stripe } from '../../stripe'
import { Payment } from '../../models/payment'

// jest.mock('../../stripe')

it('should return 404 for purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'token',
      orderId: mongoose.Types.ObjectId().toHexString()
    })
    .expect(404)
})

it('should return 401 for purchasing an order that does not belong to user', async () => {
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Created,
    userId: mongoose.Types.ObjectId().toHexString()
  })

  await order.save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'token',
      orderId: order.id
    })
    .expect(401)
})

it('should return 400 when purchasing cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString()
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled,
    userId: userId
  })

  await order.save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'token',
      orderId: order.id
    })
    .expect(400)
})

it('should return a 201 with valid inputs', async () => {
  const userId = mongoose.Types.ObjectId().toHexString()
  const price = Math.floor(Math.random() * 100000)
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price,
    status: OrderStatus.Created,
    userId: userId
  })

  await order.save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id
    })
    .expect(201)

  const stripeCharges = await stripe.charges.list({ limit: 50 })

  const stripeCharge = stripeCharges.data.find(charge => charge.amount === price * 100)

  expect(stripeCharge).toBeDefined()
  expect(stripeCharge!.currency).toBe('usd')

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id
  })

  expect(payment).not.toBeNull()
  // const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0]
  // expect(chargeOptions.source).toBe('tok_visa')
  // expect(chargeOptions.amount).toBe(2000)
  // expect(chargeOptions.currency).toBe('usd')
})
