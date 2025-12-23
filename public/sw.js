// Service Worker for Push Notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  
  const title = data.title || "WK Voorspellingen";
  const options = {
    body: data.body || "Je hebt wedstrijden die wachten op voorspellingen!",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "deadline-reminder",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
