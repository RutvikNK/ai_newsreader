# --- 1. Build Stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# --- 2. Production/Runtime Stage ---
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 
CMD ["nginx", "-g", "daemon off;"]