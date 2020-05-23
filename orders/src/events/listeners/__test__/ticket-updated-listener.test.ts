import mongoose from 'mongoose'
import { Message } from 'node-nats-streaming'
import { TicketUpdatedEvent } from '@adtickets/common'

import { TicketUpdatedListener } from '../ticket-updated-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Ticket } from '../../../models/ticket'

const setup = async () => {
  // create an instance of listener
  const listener = new TicketUpdatedListener(natsWrapper.client)

  // create and save a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 25
  })

  await ticket.save()

  // create fake data object
  const data: TicketUpdatedEvent['data'] = {
    version: ticket.version + 1,
    id: ticket.id,
    title: 'new concert',
    price: 50,
    userId: new mongoose.Types.ObjectId().toHexString()
  }

  // create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  }

  // return everything
  return {
    listener,
    data,
    ticket,
    msg
  }
}

it('should find, update and save a ticket', async () => {
  const { msg, data, ticket, listener } = await setup()

  await listener.onMessage(data, msg)

  const updatedTicket = await Ticket.findById(ticket.id)

  expect(updatedTicket!.title).toBe(data.title)
  expect(updatedTicket!.price).toBe(data.price)
  expect(updatedTicket!.version).toBe(data.version)
})

it('should ack the message', async () => {
  const { msg, data, listener } = await setup()

  await listener.onMessage(data, msg)

  expect(msg.ack).toHaveBeenCalled()
})

it('should not call ack if the event has a skipped version number', async () => {
  const { msg, data, listener, ticket } = await setup()

  data.version = 10

  try {
    await listener.onMessage(data, msg)
  } catch (e) {}

  expect(msg.ack).not.toHaveBeenCalled()
})
