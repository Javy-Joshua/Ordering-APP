const express = require('express');
const http = require('http');
const app = express();
const OrderingApp = require('./OrderingApp');


const orderingApp = new OrderingApp();

const { Server } = require('socket.io');
const ORDER  = require('./utils/constants');

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
  console.log("a user connected");

  orderingApp.joinSession(socket);

  socket.on("requestOrder", (order) => {
    console.log("Requesting order", order);
    orderingApp.requestOrder(order);
  });

  socket.on(ORDER.ACCEPETED, (order) => {
    orderingApp.acceptOrder(order);
    console.log("server side order accepted")
  });

  socket.on(ORDER.REJECTED, (order) => {
    orderingApp.rejectOrder(order);
  });

  socket.on("orderCleared", (order) => {
    orderingApp.clearOrder(order);
    console.log("listening to usersocket");
  });

  socket.on("endRide", (order) => {
    orderingApp.endOrder(order);
    console.log("listening to usersocket");
  });

});

app.get('/', (req, res) => {
    res.send("Ordering App")
});

app.get('/driver', (req, res) => {
    res.sendFile(__dirname + '/driver.html');
})

app.get('/sender', (req, res) => {
    res.sendFile(__dirname + '/sender.html');
})

const port = process.env.PORT || 9000;

server.listen(port, () => {
    console.log(`listening on port ${port}`);
});
