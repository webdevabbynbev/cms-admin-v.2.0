# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Declare build arguments
ARG VITE_API_URL
ARG VITE_APP_NAME
ARG VITE_ADONIS_API_URL

# Perbaikan di sini: Hanya salin package.json dan package-lock.json
COPY package*.json ./

# Gunakan npm ci (ini akan mencari package-lock.json)
RUN npm install

COPY . .

# Set environment variables
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV SKIP_PREFLIGHT_CHECK=true
ENV VITE_ADONIS_API_URL=${VITE_ADONIS_API_URL}

RUN npm run build

# Stage 2: Production stage
FROM nginx:alpine

# Pastikan "builder" alias ada di baris pertama
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.config /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]