FROM node:20-alpine

WORKDIR /app

# Installation des dépendances
COPY package.json ./
RUN npm install

# Copie du code source et configuration initiale
COPY . .

# Build de l'application Next.js (les routes API sont en force-dynamic)
RUN npm run build

EXPOSE 3000

# Démarrage du serveur en production
CMD ["npm", "start"]