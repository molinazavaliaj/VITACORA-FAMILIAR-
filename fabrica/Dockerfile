# La fábrica necesita ffmpeg (audiolibro) y Chromium (PDF del libro).
# Railway usa este Dockerfile automáticamente — receta explícita, sin sorpresas
# de builders (Railpack ignoraba nixpacks.toml y dejaba el runtime sin Chromium).

FROM node:22-bookworm-slim

# Chromium se instala DENTRO de node_modules para que viaje con la imagen.
ENV PLAYWRIGHT_BROWSERS_PATH=0

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci
# --with-deps instala también las librerías de sistema que Chromium necesita.
RUN npx playwright install --with-deps chromium

COPY . .
RUN npm run build

CMD ["node", "dist/worker.js"]
