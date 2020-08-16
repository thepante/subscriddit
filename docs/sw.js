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

messaging.getToken().then(function(token){ 
  console.log("TOKEN:", token);
})
.catch(function(err){ 
  console.log("ERROR:", err);
});


messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});
