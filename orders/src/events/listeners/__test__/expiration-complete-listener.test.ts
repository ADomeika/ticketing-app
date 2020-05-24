import mongoose from 'mongoose'
import { Message } from 'node-nats-streaming'
import { OrderStatus, ExpirationCompleteEvent } from '@adtickets/common'
import { ExpirationCompleteListener } from '../expiration-complete-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Order } from '../../../models/order'
import { Ticket } from '../../../models/ticket'

const setup = async () => {
  const listener = new ExpirationCompleteListener(natsWrapper.client)

  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  })
  
  await ticket.save()

  const order = Order.build({
    status: OrderStatus.Created,
    userId: 'asdfg',
    expiresAt: new Date(),
    ticket
  })

  order.set({
    status: OrderStatus.Cancelled
  })
  await order.save()

  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id
  }

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  }

  return { msg, listener, order, data, ticket }
}

it('should update order status to cancelled', async () => {
  const { msg, listener, order, data } = await setup()

  await listener.onMessage(data, msg)

  const updatedOrder = await Order.findById(order.id)

  expect(updatedOrder!.status).toBe(OrderStatus.Cancelled)
})

it('should emit order:cancelled event', async () => {
  const { msg, listener, order, data } = await setup()

  await listener.onMessage(data, msg)

  expect(natsWrapper.client.publish).toHaveBeenCalled()

  const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1])
  expect(eventData.id).toBe(order.id)
})

it('should ack the message', async () => {
  const { msg, listener, data } = await setup()

  await listener.onMessage(data, msg)

  expect(msg.ack).toHaveBeenCalled()
})
