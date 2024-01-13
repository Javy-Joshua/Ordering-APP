const Driver = require("./driver");
const Sender = require("./sender");
const Order = require("./Order");

class OrderingApp {
  constructor() {
    this.orders = [];
    this.drivers = [];
    this.senders = [];
    this.socketUserMap = new Map();
    this.orderTimeouts = new Map();
  }

  joinSession(socket) {
    const { name, id, user_type } = socket.handshake.query;
    if (user_type === "driver") {
      const driver = this.drivers.find((driver) => driver.id === id);
      if (driver) {
        this.assignSocket({ socket, user: driver });
        return;
      } else {
        this.createUser({ name, socket, user_type });
      }
    } else if (user_type == "sender") {
      const sender = this.senders.find((sender) => sender.id === id);
      if (sender) {
        this.assignSocket({ socket, user: sender });
      } else {
        this.createUser({ name, socket, user_type });
      }
    }
  }

  assignSocket({ socket, user }) {
    console.log("Assigning socket to user", user.name);
    this.socketUserMap.set(user.id, socket);
  }

  sendEvent({ socket, data, eventname }) {
    socket.emit(eventname, data);
  }

  createUser({ name, socket, user_type }) {
    switch (user_type) {
      case "driver":
        const driver = new Driver(name);
        this.drivers.push(driver);
        this.assignSocket({ socket, user: driver, user_type });
        this.sendEvent({
          socket,
          data: { driver },
          eventname: "driverCreated",
        });
        console.log("Driver created");
        return driver;
      case "sender":
        const sender = new Sender(name);
        this.senders.push(sender);
        this.assignSocket({ socket, user: sender, user_type });
        this.sendEvent({
          socket,
          data: { sender },
          eventname: "senderCreated",
        });
        console.log("Sender created", this.senders);
        return sender;
      default:
        throw new Error("invalid user type");
    }
  }

  // requestOrder({ current_location, destination, price, id }) {
  //   console.log('Requesting order')
  //   const sender = this.senders.find(sender => sender.id === id)
  //   const order = new Order({ current_location, destination, price, sender });
  //   this.orders.push(order)

  //   //notify drivers
  //   for (const driver of this.drivers) {
  //       if (driver.in_ride) continue
  //       this.sendEvent({socket: this.socketUserMap.get(driver.id), data: {order}, eventname: 'orderRequested'})
  //   }

  //   console.log('Order requested', order)
  //   return order
  // }
  requestOrder({ current_location, destination, price, id }, callback) {
    console.log("Requesting order");
    const sender = this.senders.find((sender) => sender.id === id);
    const order = new Order({ current_location, destination, price, sender });
    this.orders.push(order);

    //notify drivers
    for (const driver of this.drivers) {
      if (driver.in_ride) continue;
      this.sendEvent({
        socket: this.socketUserMap.get(driver.id),
        data: { order, orderId: order.id },
        eventname: "orderRequested",
      });

      console.log("Order requested", order);
      // return order

      //set a timeout for the request
      const date = new Date()
      const timeoutDuration = 10000;
      const timeout = setTimeout(() => {
        console.log("Request timed out for Order:", order);
        if (typeof callback === "function") {
          callback({ order: "Request timed out" });
        }
      }, timeoutDuration);

      this.orderTimeouts.set(order.id, timeout);

      this.waitForOrderResponse(order, callback, timeout);
      return order;
    }
  }

  // waitForOrderResponse(order, callback, timeout) {
  //   const orderId = order.id;
  //   this.socketUserMap.forEach((userSocket, userId) => {
  //     userSocket.once(`orderResponse_${orderId}`, (response) => {
  //       clearTimeout(timeout);
  //       console.log(`Received response for order with ID ${orderId}`, response);
  //       if (response.accepted ) {
  //       callback(response);
  //     }
  //     });
  //   });
  // }
  // waitForOrderResponse(order, callback, timeout) {
  //   const orderId = order.id;
  //   let timeoutOccurred = false

  //   this.socketUserMap.forEach((userSocket, userId) => {
  //     userSocket.once(`orderResponse_${orderId}`, (response) => {
  //       if (timeoutOccurred) {
  //       clearTimeout(timeout);
  //       console.log(`Received response for order with ID ${orderId}`, response);
  //     }
  //       if (response.accepted ) {
  //       callback(response);
  //     }
  //     });
  //   });
  //   timeoutOccurred = false; // reset to false in case the timeout is cleared manually
  //   setTimeout(() => {
  //     timeoutOccurred = true;
  //   }, timeout._idleTimeout);
  //   setTimeout(() => {
  //     if (!timeoutOccurred) {
  //       callback({ order: "Request timed out" });
  //     }
  //   }, timeout._idleTimeout);
  // }

  // waitForOrderResponse(order, callback, timeout) {
  //   const orderId = order.id;
  //   let timeoutId;

  //   const responseListener = (response) => {
  //     clearTimeout(timeoutId);
  //     console.log(`Received response for order with ID ${orderId}`, response);

  //     if (response.accepted) {
  //       callback(response);
  //     }
  //   };

  //   const timeoutCallback = () => {
  //     console.log(`Timeout occurred for order with ID ${orderId}`);
  //     if (typeof callback === "function") {
  //     callback({ order: "Request timed out" });
  //     }
  //   };

  //   this.socketUserMap.forEach((userSocket, userId) => {
  //     userSocket.once(`orderResponse_${orderId}`, responseListener);
  //   });

  //   timeoutId = setTimeout(timeoutCallback, timeout._idleTimeout);
  // }

  // acceptOrder(order) {
  //   const { id, driver_id } = order;
  //   //get all about order
  //   const driver = this.drivers.find((driver) => driver.id === driver_id);
  //   const _order = this.orders.find((order) => order.id === id);
  //   const sender = this.senders.find(
  //     (sender) => sender.id === _order.sender.id
  //   );

  //   console.log("Accepting order", { _order, driver, sender });

  //   _order.assignDriver(driver);

  //   const userSocket = this.socketUserMap.get(sender.id);
  //   userSocket.emit("orderAccepted", { order: _order });

  //   const driverSocket = this.socketUserMap.get(driver.id);
  //   driverSocket.emit("orderAccepted", { order: _order, accepted: true });
  // }

  // waitForOrderResponse(order, callback, timeout) {
  //   const orderId = order.id;
  //   let responseReceived = false;
  //   const driver = this.drivers.find((driver) => driver.id === driver_id);

  //   this.socketUserMap.forEach((userSocket, userId) => {
  //     userSocket.once(`orderResponse_${orderId}`, (response) => {
  //       responseReceived = true;
  //       clearTimeout(timeout);
  //       console.log(`Received response for order with ID ${orderId}`, response);

  //       if (response.accepted) {
  //         callback(response);
  //       }
  //     });
  //   });

  //   // Check the responseReceived flag before calling the timeout callback
  //   setTimeout(() => {
  //     if (!responseReceived) {
  //       if (typeof callback === "function") {
  //         callback({ order: "Request timed out" });
  //       }
  //     }
  //   }, timeout); //timeout._idleTimeout

  //   const driverSocket = this.socketUserMap.get(driver.id)
  //   driverSocket.emit('noDriver', { order: _order})
  // }

  // waitForOrderResponse(order, callback, timeout) {  // 5 trial
  //   // const orderId = order.id;
  //   const { id, driver_id } = order;
  //   let responseReceived = false;
  //   const driver = this.drivers.find((driver) => driver.id === driver_id);
  //   const _order = this.orders.find((order) => order.id === id);
  //   const sender = this.senders.find(
  //     (sender) => sender.id === _order.sender.id
  //   );

  //   if(!driver){
  //     this.socketUserMap.forEach((userSocket, sender) => {
  //       userSocket.once(`orderResponse_${_order}`, (response) => {
  //         responseReceived = true;
  //         clearTimeout(timeout);
  //         console.log(
  //           `Received response for order with ID ${_order}`,
  //           response
  //         );

  //         if (response.accepted) {
  //           callback(response);
  //         }
  //       });
  //     });
  //   }

  //    const driverSocket = this.socketUserMap.get(driver.id);
  //    console.log(driverSocket);
  //    if (driverSocket) {
  //      driverSocket.emit("noDriver", { order: _order });
  //    } else {
  //      console.log("Driver socket not found");
  //    }

  //   // Check the responseReceived flag before calling the timeout callback
  //   setTimeout(() => {
  //     if (!responseReceived) {
  //       if (typeof callback === "function") {
  //         callback({ order: "Request timed out" });
  //       }
  //     }
  //   }, timeout); //timeout._idleTimeout

  // }

  // waitForOrderResponse(order, callback, timeout) {// take 6
  //   const { id, driver_id } = order;
  //   let responseReceived = false;
  //   const driver = this.drivers.find((driver) => driver.id === driver_id);
  //   const _order = this.orders.find((order) => order.id === id);

  //   if (driver) {
  //     const driverSocket = this.socketUserMap.get(driver.id)

  //     if (driverSocket) {
  //       userSocket.once(`orderResponse_${_order}`, (response) => {
  //         responseReceived = true;
  //         clearTimeout(timeout);
  //         console.log(
  //           `Received response for order with ID ${_order}`,
  //           response
  //         );

  //         if (response.accepted) {
  //           callback(response);
  //         }
  //       });

  //       // Emit "noDriver" only if no response is received from the driver within the timeout
  //       //     setTimeout(() => {
  //       //       if (!responseReceived) {
  //       //         console.log("No driver accepted the request");
  //       //         socket.emit("noresponse", { order: _order });
  //       //         console.log(driverSocket)
  //       //       }
  //       //     }, timeout);
  //       //   } else {
  //       //     console.log("Driver socket not found");
  //       //   }
  //       // } else {
  //       //   console.log("No driver found");
  //       // }

  //       // Emit "noresponse" only if no response is received from the driver within the timeout
  //       setTimeout(() => {
  //         if (!responseReceived) { // take 2
  //           console.log("No driver accepted the request");
  //           driverSocket.emit("noresponse", { order: _order });
  //         }
  //       }, timeout);
  //     } else {
  //       console.log("Driver socket not found");
  //     }
  //   } else {
  //     console.log("No driver found");
  //   }
  // }

  // waitForOrderResponse(order, callback, timeout) {// take 7
  //   const { id, driver_id } = order;
  //   let responseReceived = false;
  //   const driver = this.drivers.find((driver) => driver.id === driver_id);
  //   const _order = this.orders.find((order) => order.id === id);

  //   if (driver) {
  //     const driverSocket = this.socketUserMap.get(driver.id);

  //     if (driverSocket) {
  //       driverSocket.once(`orderResponse_${_order.id}`, (response) => {
  //         responseReceived = true;
  //         clearTimeout(timeout);
  //         console.log(
  //           `Received response for order with ID ${_order.id}`,
  //           response
  //         );

  //         if (response.accepted) {
  //           callback(response);
  //         }
  //       });

  //       // Emit "noresponse" only if no response is received from the driver within the timeout
  //       setTimeout(() => {
  //         if (!responseReceived) {
  //           console.log("No driver accepted the request");
  //           driverSocket.emit("noresponse", { order: _order });
  //         }
  //       }, timeout._idleTimeout);
  //     } else {
  //       console.log("Driver socket not found");
  //     }
  //   } else {
  //     console.log("No driver found");
  //   }
  // }

  // waitForOrderResponse(order, callback, timeout) {//take 9
  //   const { id, driver_id } = order;
  //   const driver = this.drivers.find((driver) => driver.id === driver_id);
  //   const _order = this.orders.find((order) => order.id === id);

  //   if (driver) {
  //     const driverSocket = this.socketUserMap.get(driver.id);

  //     if (driverSocket) {
  //       const responseEvent = `orderResponse_${_order.id}`;

  //       const responseListener = (response) => {
  //         clearTimeout(timeout);
  //         console.log(
  //           `Received response for order with ID ${_order.id}`,
  //           response
  //         );

  //         if (response.accepted) {
  //           callback(response);
  //         }
  //       };

  //       // Attach the event listener
  //       driverSocket.once(responseEvent, responseListener);

  //       // Emit "noresponse" only if no response is received from the driver within the timeout
  //       setTimeout(() => {
  //         // Check if the response event listener is still attached
  //         if (
  //           driverSocket.listeners(responseEvent).includes(responseListener)
  //         ) {
  //           console.log("No driver accepted the request");
  //           driverSocket.emit("noresponse", { order: _order });

  //           // Remove the event listener to avoid memory leaks
  //           driverSocket.off(responseEvent, responseListener);
  //         }
  //       }, timeout._idleTimeout);
  //     } else {
  //       console.log("Driver socket not found");
  //     }
  //   } else {
  //     console.log("No driver found");
  //   }
  // }

  // waitForOrderResponse(order, callback, timeoutDuration) {//take 10
  //   const { id, driver_id } = order;
  //   const driver = this.drivers.find((driver) => driver.id === driver_id);
  //   const _order = this.orders.find((order) => order.id === id);
  //   if (driver) {
  //     const driverSocket = this.socketUserMap.get(driver.id);

  //     if (driverSocket) {
  //       const responseEvent = `orderResponse_${_order.id}`;

  //       const responseListener = (response) => {
  //         clearTimeout(timeout);
  //         console.log(
  //           `Received response for order with ID ${_order.id}`,
  //           response
  //         );

  //         if (response.accepted) {
  //           callback(response);
  //         }
  //       };

  //       // Attach the event listener
  //       driverSocket.once(responseEvent, responseListener);

  //       // Set a timeout for the request
  //       const timeout = setTimeout(() => {
  //         console.log("Request timed out for Order:", _order);

  //         // Emit "noresponse" only if no response is received from the driver within the timeout
  //         console.log("No driver accepted the request");
  //         driverSocket.emit("noresponse", { order: _order });
  //         console.log(driverSocket)

  //         // Remove the event listener to avoid memory leaks
  //         driverSocket.off(responseEvent, responseListener);
  //       }, timeoutDuration);

  //       // Save the timeout for potential clearing
  //       this.orderTimeouts.set(order.id, timeout);
  //     } else {
  //       console.log("Driver socket not found");
  //     }
  //   } else {
  //     console.log("No driver found");
  //   }
  // }

  waitForOrderResponse(order, callback, timeout) {
    //take 11
    const { id, driver_id } = order;
    const driver = this.drivers.find((driver) => driver.id === driver_id);
    const _order = this.orders.find((order) => order.id === id);

    if (driver) {
      const driverSocket = this.socketUserMap.get(driver.id);

      if (driverSocket) {
        const responseEvent = `orderResponse_${_order.id}`;
        const acceptEvent = `orderAccepted_${_order.id}`;
        const rejectEvent = `orderRejected_${_order.id}`;

        const responseListener = (response) => {
          clearTimeout(timeout);
          console.log(
            `Received response for order with ID ${_order.id}`,
            response
          );

          if (response.accepted) {
            // Order accepted
            callback({ order: _order, accepted: true });
          } else {
            // Order rejected
            callback({ order: _order, accepted: false });
          }
        };

        // Attach the response event listener
        driverSocket.once(responseEvent, responseListener);

        // Attach the orderAccepted event listener
        driverSocket.once(acceptEvent, () => {
          console.log(`Driver accepted order with ID ${_order.id}`);
          // Additional logic if needed
        });

        // Attach the orderRejected event listener
        driverSocket.once(rejectEvent, () => {
          console.log(`Driver rejected order with ID ${_order.id}`);
          // Additional logic if needed
        });

        // Emit "noresponse" only if no response is received from the driver within the timeout
        setTimeout(() => {
          // Check if the response event listener is still attached
          if (
            driverSocket.listeners(responseEvent).includes(responseListener)
          ) {
            console.log("No driver accepted the request");

            // Emit "noresponse" event
            driverSocket.emit("noresponse", { order: _order });

            // Remove the event listener to avoid memory leaks
            driverSocket.off(responseEvent, responseListener);
          }
        }, timeout._idleTimeout);
      } else {
        console.log("Driver socket not found");
      }
    } else {
      console.log("No driver found");
    }
  }

  acceptOrder(order) {
    const { id, driver_id } = order;
    // get all details about the order
    const driver = this.drivers.find((driver) => driver.id === driver_id);
    const _order = this.orders.find((order) => order.id === id);
    const sender = this.senders.find(
      (sender) => sender.id === _order.sender.id
    );

    console.log("Accepting order", { _order, driver, sender });

    _order.assignDriver(driver);

    const userSocket = this.socketUserMap.get(sender.id);
    userSocket.emit("orderAccepted", { order: _order });

    const driverSocket = this.socketUserMap.get(driver.id);
    // console.log(driverSocket)
    driverSocket.emit("orderAccepted", { order: _order, accepted: true });

    // Clear the timeout associated with the order
    const timeout = this.orderTimeouts.get(order.id);
    if (timeout) {
      clearTimeout(timeout);
      this.orderTimeouts.delete(order.id);
      console.log("Timeout cleared");
    }
  }

  rejectOrder(order) {
    const { id, driver_id } = order;
    const driver = this.drivers.find((driver) => driver.id === driver_id);
    const _order = this.orders.find((order) => order.id === id);
    const sender = this.senders.find(
      (sender) => sender.id === _order.sender.id
    );

    console.log("Rejecting order", { _order, driver, sender });

    const driverSocket = this.socketUserMap.get(driver.id);
    driverSocket.emit("orderRejected", { order: _order, rejected: true });

    // Clear the timeout associated with the order
    const timeout = this.orderTimeouts.get(order.id);
    if (timeout) {
      clearTimeout(timeout);
      this.orderTimeouts.delete(order.id);
    }
  }
}

module.exports = OrderingApp;


