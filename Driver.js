class Driver {
    constructor(name) {
        this.id = Math.floor(Math.random() * 1000000).toString();
        this.name = name;
        this.in_ride = false;
    }
    
    acceptOrder(order) {
        console.log(`${this.name} accepts order ${order.id}`);
        order.assignDriver(this);
        this.in_ride = true
    }

    rejectOrder(order) {
        console.log(`${this.name} rejects order ${order.id}`);
    }

    endOrder(order) {
        console.log(`${this.name} ended order ${order.id}`);
        this.in_ride = false;
    }

    activeDrivers(){
        this.activeDrivers.map(driver=> driver.in_ride === false)
    }
}

module.exports = Driver;