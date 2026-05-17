importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC1vnVFbzezdpqAxjU5GXgAxu63DN05eyE",
  authDomain: "vibegadgets-ae9d1.firebaseapp.com",
  projectId: "vibegadgets-ae9d1",
  storageBucket: "vibegadgets-ae9d1.firebasestorage.app",
  messagingSenderId: "50155075863",
  appId: "1:50155075863:web:469bb97fffbd37767bdf52",
  measurementId: "G-64DGWNB9MZ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/apple-touch-icon.png',
    image: payload.notification.image
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
