# El entrevistador solo necesita Node: no genera PDFs ni procesa audio localmente
# (Whisper y TTS son llamadas HTTP). Receta explícita porque Railway usa Railpack
# e ignora nixpacks.toml — lo aprendimos a los golpes con la fábrica.

FROM node:22-bookworm-slim

WORKDIR /app

# Las dependencias primero: si no cambian, Docker reusa esta capa y el build vuela.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Railway inyecta PORT; config.ts lo lee con prioridad sobre PUERTO.
CMD ["node", "dist/servidor.js"]
