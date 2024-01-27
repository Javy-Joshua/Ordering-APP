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


   socket.on('alreadyAccepted', (data) => {
        console.log(data);
    
        const notificationContainer = document.getElementById('notification-container');

        const  div = document.createElement('div')

        div.innerHTML = `<div style="margin: 10px;" class="card">
            <h5 class="card-header"> Accepted Order </h5>
            <div class="card-body">
                <h5 class="card-title">${data.order.sender.name} is on a ride</h5>
                <p class="card-text">Current Location: ${data.order.current_location}</p>
                <p class="card-text">Destination: ${data.order.destination}</p>
                <p class="card-text">Price: N${data.order.price}</p>
                <button id="${data.order.id}-on-ride" href="#" class="btn btn-primary">On Ride</button>
                <button id="${data.order.id}-end-order" href="#" class="btn btn-danger">End ride</button>
            </div>
            </div>`
        
        notificationContainer.appendChild(div)

        const onRideButton = document.getElementById(`${data.order.id}-on-ride`);
        const endOrderButton = document.getElementById(`${data.order.id}-end-order`);
       
        endOrderButton.addEventListener('click', () => {
            socket.emit('endOrder', { id: data.order.id, driver_id: localStorage.getItem('driverId') });
        })

        if(onRideButton){
            onRideButton.disabled = true
        }

    })