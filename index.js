const express = require("express");
const http = require("http");
const app = express();
const OrderingApp = require('./OderingApp')

const orderingApp = new OrderingApp()

const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on("connection", (socket) => {
  console.log("a user connected");

  orderingApp.joinSession(socket);

  socket.on('requestOrder', (order, callback) => {

    console.log("Requesting order", order);

    // console.log('Requesting order', order)
    orderingApp.requestOrder(order, (response) => {
      if (typeof callback === "function") {
        callback(response);
      }
    })
    
  })

   socket.on("noresponse", (order) => {
     orderingApp.waitForOrderResponse(order, callback, timeout);
     console.log("Henny said nothin");
   })

  socket.on('acceptOrder', (order) => {
    orderingApp.acceptOrder(order)
  })

  socket.on('rejectOrder', (order) => {
    orderingApp.rejectOrder(order)
  })
});

app.get("/", (req, res) => {
  res.send("Odering App");
});

app.get("/driver", (req, res) => {
  res.sendFile(__dirname + "/driver.html");
});

app.get("/sender", (req, res) => {
  res.sendFile(__dirname + "/sender.html");
});

const port = process.env.PORT || 9000;

server.listen(port, () => {
  console.log(`listening on port ${port} `);
});
