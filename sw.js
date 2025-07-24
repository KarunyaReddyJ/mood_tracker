import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);
self.addEventListener("push",function(o){let t=o.data.json(),i=t.title||"Mood Reminder \uD83E\uDDE0",e={body:t.body||"Time to log your mood!",icon:"/apple-touch-icon.png",badge:"/apple-touch-icon.png"};o.waitUntil(self.registration.showNotification(i,e))});