## Events

The provided TypeScript module declaration appears to extend the `@ioc:Adonis/Core/Event` module to include custom event types related to NATS messaging. Here's a summary of the extended event types:

1. **`nats:connect`**: An event triggered when a connection to NATS is established or when an error occurs during connection.
   - `connection`: It can either be an instance of `NatsConnection` when the connection is successful or an `Error` object when there's a connection error.

2. **`nats:disconnect`**: An event triggered when the connection to NATS is disconnected.
   - `connection`: An instance of `NatsConnection` representing the disconnected connection.

3. **`nats:closed`**: An event triggered when the NATS connection is closed.
   - `error`: Any error that occurred during the closure, or `null` if there was no error.
   - `connection`: An instance of `NatsConnection` representing the closed connection.

4. **`nats:error`**: An event triggered when there's an error related to NATS, such as a subscription error or a publish error.
   - `error`: The error object indicating the nature of the error.
   - `connection`: It can either be an instance of `NatsConnection` when the error is related to a specific connection or an `Error` object when it's a general NATS error.

5. **`nats:subscribe`**: An event triggered when a subscription to a NATS subject is created.
   - `subject`: The NATS subject to which the subscription was created.
   - `subscription`: An instance of `Subscription` representing the subscription.
   - `connection`: An instance of `NatsConnection` representing the connection associated with the subscription.

These custom event types provide a way to handle various NATS-related events within an AdonisJS application by extending the existing event system. Developers can listen to these events and implement custom logic to respond to NATS connection, disconnection, closure, and error events.
