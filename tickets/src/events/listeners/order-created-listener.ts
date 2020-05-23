import { Listener, OrderCreatedEvent, Subjects } from '@adtickets/common'
import { Message } from 'node-nats-streaming'
import { queueGroupName } from './queue-group-name'
import { Ticket } from '../../models/ticket'
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher'

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated
  queueGroupName = queueGroupName

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    // reach into ticket collection and find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id)

    // if no ticket, throw error
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    // mark ticket as being reserved, by setting it's order id prop
    ticket.set({ orderId: data.id })

    // save the ticket
    await ticket.save()

    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
      orderId: ticket.orderId
    })

    // ack the msg
    msg.ack()
  }
}


