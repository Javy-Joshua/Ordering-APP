 waitForOrderResponse(order, callback, timeout) {
    // const orderId = order.id;
     const { id, driver_id } = order;
    let responseReceived = false;
    const driver = this.drivers.find((driver) => driver.id === driver_id);
    const _order = this.orders.find((order) => order.id === id);
     const sender = this.senders.find(
      (sender) => sender.id === _order.sender.id
    );


    this.socketUserMap.forEach((userSocket, sender) => {
      userSocket.once(`orderResponse_${orderId}`, (response) => {
        responseReceived = true;
        clearTimeout(timeout);
        console.log(`Received response for order with ID ${_order}`, response);

        if (response.accepted) {
          callback(response);
        }
      });
    });

    // Check the responseReceived flag before calling the timeout callback
    setTimeout(() => {
      if (!responseReceived) {
        if (typeof callback === "function") {
          callback({ order: "Request timed out" });
        }
      }
    }, timeout); //timeout._idleTimeout

    const driverSocket = this.socketUserMap.get(driver.id)
    driverSocket.emit('noDriver', { order: _order})
  }