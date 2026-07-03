# Cápsula del tiempo

Web estática (GitHub Pages) + automatización (GitHub Actions) que guarda un
documento de texto bajo llave hasta una fecha límite, avisa al móvil diez
días antes por si quieres ampliar el plazo, avisa a un amigo por Discord dos
días antes, y abre el contenido en cuanto llega la fecha — todo con GitHub
gratuito, sin servidor propio y sin contraseñas que gestionar.

## Cómo se protege el contenido (importante)

Con la cuenta gratuita de GitHub, **GitHub Pages solo funciona con
repositorios públicos** (Pages en repo privado requiere plan de pago). Eso
significa que todo lo que subas al repositorio como archivo normal —aunque
luego lo borres— queda visible para siempre en el historial de git, porque
el repo entero es público.

Por eso el documento **no se sube nunca como archivo**. Se pega su texto
directamente en un **secreto de GitHub Actions** (`CAPSULE_CONTENT`):

- Los secretos de GitHub están cifrados por GitHub y nunca aparecen en el
  código, en el historial de commits, ni en los registros de Actions
  (GitHub los oculta automáticamente si algún paso los imprime).
- El robot solo lee ese secreto una vez, el día en que debe abrirse la
  cápsula, y en ese momento lo escribe en la web pública — que es
  precisamente cuando debe dejar de ser secreto.
- Ni tú ni Carlos necesitáis recordar ninguna contraseña: todo es
  automático.

**Límite a tener en cuenta:** los secretos de GitHub admiten hasta 48 KB de
texto (unas 48.000 caracteres, de sobra para una carta o documento normal).
Si tu documento fuera mucho más largo, dímelo y lo adaptamos.

## Configuración inicial (una sola vez)

1. Sube estos archivos a un repositorio de GitHub (puede ser público sin
   problema, ya que el contenido no vive ahí).
2. Ve a **Settings → Pages** y en "Build and deployment" elige **Source: GitHub Actions**.
3. Instala la app **ntfy** en tu móvil ([ntfy.sh](https://ntfy.sh), gratis, sin
   registro) y suscríbete a un "topic" (canal) con un nombre largo y difícil
   de adivinar, por ejemplo `capsula-a8f3k9d2`.
4. En el repositorio, ve a **Settings → Secrets and variables → Actions →
   New repository secret** y crea:
   - `NTFY_TOPIC` → el nombre del canal de ntfy del paso anterior.
   - `DISCORD_WEBHOOK_URL` → la URL del webhook de Discord (ver paso 5).
   - `CAPSULE_CONTENT` → aquí es donde va **el texto real de tu documento**,
     pegado directamente (no un archivo).
5. Crea el webhook de Discord: en el canal donde quieras que llegue el aviso
   a Carlos, ve a **Editar canal → Integraciones → Webhooks → Nuevo
   webhook**, ponle un nombre y copia la "URL del webhook".
6. Ve a la pestaña **Actions** y habilita los workflows si te lo pide.

## Crear una cápsula

1. Abre tu documento de texto, selecciona todo el contenido y cópialo.
2. Ve a **Settings → Secrets and variables → Actions**, abre el secreto
   `CAPSULE_CONTENT` (o créalo si es la primera vez) y pega el texto ahí.
   Guarda.
3. Ve a **Actions → "Crear cápsula" → Run workflow** y rellena:
   - **deadline**: fecha límite, formato `YYYY-MM-DD`.
   - **filename**: nombre que se mostrará (por ejemplo `carta.txt`) — solo es
     una etiqueta, no es sensible.
   - **notify_days**: antelación del aviso al móvil (por defecto 10).
   - **discord_notify_days**: antelación del aviso a Discord (por defecto 2).
4. Ejecuta. El workflow guarda solo la fecha y el nombre en el repositorio
   (nada de contenido) y publica la cuenta atrás en la web.

## Qué pasa automáticamente

Cada día a las 08:00 UTC se ejecuta el workflow **"Revisar cápsula"**:

- Si faltan `notify_days` días o menos y todavía no se ha avisado, manda una
  notificación a tu móvil vía ntfy con los días restantes y un enlace directo
  para ampliar el plazo.
- Si faltan `discord_notify_days` días o menos (2 por defecto) y todavía no
  se ha avisado, manda un mensaje a Discord con el texto:
  *"Mensaje automático: faltan X días para la fecha límite del contenido.
  Ponte en contacto con Carlos para que lo renueve."* — incluye además el
  enlace a la web para que tu amigo pueda consultarla cuando se desbloquee.
- Si no haces nada, la cápsula sigue su curso normal.
- Si llega la fecha límite (o ya pasó), el robot lee el secreto
  `CAPSULE_CONTENT` y lo escribe en `public/data/content.json`, lo que
  dispara el despliegue de la web. A partir de ahí el contenido queda
  visible ahí **tanto para ti como para Carlos** — es la misma URL pública
  para cualquiera que la visite, no hace falta nada extra.

## Ampliar el plazo

Si recibes el aviso y quieres más tiempo:

1. Ve a **Actions → "Ampliar plazo de la cápsula" → Run workflow**.
2. Escribe la nueva fecha (`new_deadline`, formato `YYYY-MM-DD`).
3. Ejecuta. Se actualiza la fecha y se reinician ambos avisos (móvil y
   Discord), que volverán a dispararse en sus plazos correspondientes antes
   de la nueva fecha. El secreto `CAPSULE_CONTENT` no se toca, sigue siendo
   el mismo documento.

## Probar que funciona sin esperar semanas

Puedes lanzar manualmente **Actions → "Revisar cápsula" → Run workflow** en
cualquier momento para forzar la comprobación (por ejemplo, tras crear una
cápsula con fecha de mañana, para ver el aviso o la revelación sin esperar al
cron diario).

## Estructura del proyecto

```
public/                  → lo único que se publica en GitHub Pages
  index.html, style.css, app.js
  data/status.json        → fecha límite y si está revelada (sin contenido)
  data/content.json        → solo existe tras la revelación
capsules/capsule.json    → solo metadatos (fecha, nombre, avisos), SIN texto
.github/workflows/
  create-capsule.yml      → crea la cápsula a partir del secreto CAPSULE_CONTENT
  check-capsule.yml       → cron diario: avisa (móvil y Discord) y revela
  extend-capsule.yml      → amplía el plazo
  deploy-pages.yml        → publica public/ en GitHub Pages
```

Secretos necesarios (**Settings → Secrets and variables → Actions**):
`NTFY_TOPIC`, `DISCORD_WEBHOOK_URL`, `CAPSULE_CONTENT`.

## Limitaciones que conviene saber

- El repositorio es público (requisito de la cuenta gratuita para usar
  Pages), pero el texto real nunca pasa por el código ni por el historial de
  git — vive solo en el secreto `CAPSULE_CONTENT` hasta el día de la
  revelación.
- Los secretos de GitHub admiten hasta 48 KB de texto por secreto.
- Los `schedule` de GitHub Actions no son exactos al minuto; puede haber
  hasta un rato de retraso, sin importancia para algo con margen de días.
- Solo admite una cápsula activa a la vez con esta versión.
- ntfy.sh es un servicio gratuito de terceros; el nombre del "topic" hace de
  contraseña débil del aviso — no expone el contenido de la cápsula.
- La URL del webhook de Discord funciona como una contraseña: quien la tenga
  puede publicar mensajes en ese canal. Está guardada como secreto de
  GitHub, evita compartirla fuera de ahí.
- Una vez pegado el secreto `CAPSULE_CONTENT`, ni siquiera tú puedes volver a
  leerlo desde la interfaz de GitHub (los secretos no se pueden consultar,
  solo sobrescribir) — solo el workflow puede usarlo. Guarda tú aparte una
  copia del documento si crees que la vas a necesitar antes de la revelación.
