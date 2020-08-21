
const messaging = firebase.messaging();

const requestSW = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("https://thepante.github.io/subscriddit/firebase-messaging-sw.js", { scope: "/subscriddit/" })
      .then(function (reg) {
        if (reg.installing) {
          console.log("Service worker installing");
        } else if (reg.waiting) {
          console.log("Service worker installed");
        } else if (reg.active) {
          console.log("Service worker active");
        }

        messaging.getToken().then(function (token) {
          console.log("Token:", token);
        })
        .catch(function (err) {
          console.log("Error:", err);
        });
        
      })
      .catch(function (error) {
        console.log("Registration failed with:", error);
      });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("notificationsRequest").addEventListener("click", () => {
    requestSW();
  });
});