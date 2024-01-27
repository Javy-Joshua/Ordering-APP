const  ORDER={
    ACCEPETED:"acceptOrder",
    REJECTED:"rejectOrder",
    ALREADY:"alreadyAccepted"
}
module.exports = ORDER

// orderAccepted;



// socket.on("orderAccepted", (data) => {
//   console.log(data);

//   const acceptOrderButton = document.getElementById(
//     `${data.order.id}-accept-order`
//   );
//   const rejectOrderButton = document.getElementById(
//     `${data.order.id}-reject-order`
//   );
//   const endOrderButton = document.getElementById(`${data.order.id}-end-order`);
  // // show the END Ride button only for the accepted driver
  // const endRideButton = document.getElementById("end-ride-button")
  // endRideButton.style.display = "block"

//   if (acceptOrderButton) {
//     acceptOrderButton.disabled = true;
//     acceptOrderButton.innerHTML = "Accepted";
//   }

//   if (rejectOrderButton) {
//     rejectOrderButton.disabled = true;
//   }

  // if (endOrderButton) {
  //     endOrderButton.disabled = true;
  //     endOrderButton.innerHTML = 'Ride Ended';
  // }
// });