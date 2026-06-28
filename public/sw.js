// KILL-SWITCH. El service worker causó pantallas congeladas al servir bundles
// viejos cacheados. Para una app de crisis, fiabilidad > offline-shell.
// Este SW borra TODO el caché, se desregistra a sí mismo y recarga las ventanas
// una vez. Tras esto el sitio corre SIN service worker (siempre fresco).
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const c of clients) {
        if ("navigate" in c) c.navigate(c.url).catch(() => {});
      }
    })(),
  );
});

// ── FASE 4 (futuro): Web Push para notificaciones logísticas ───────────────
// Hoy el SW es kill-switch (no se registra). Cuando se reactive el registro,
// estos handlers ya entregan la alerta al teléfono aunque la app esté cerrada.
// Backend pendiente: guardar la PushSubscription del médico y enviar con VAPID.
//
// self.addEventListener("push", (e) => {
//   const data = e.data ? e.data.json() : {};
//   e.waitUntil(self.registration.showNotification(data.titulo || "AviHelp", {
//     body: data.mensaje || "Tienes una nueva notificación.",
//     icon: "/icon-192.png", badge: "/icon-192.png", data: { url: data.url || "/" },
//   }));
// });
// self.addEventListener("notificationclick", (e) => {
//   e.notification.close();
//   e.waitUntil(self.clients.openWindow(e.notification.data?.url || "/"));
// });
