const firebaseConfig = {
  apiKey: "AIzaSyCLR4W3kuEHnPgASLvEOLLYp-VkQ46t12U",
  authDomain: "subscriddit.firebaseapp.com",
  databaseURL: "https://subscriddit.firebaseio.com",
  projectId: "subscriddit",
  storageBucket: "subscriddit.appspot.com",
  messagingSenderId: "969737676662",
  appId: "1:969737676662:web:eee8ffb919e6f4fe44fc57"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js", { scope: "/" })
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