FROM node:20-alpine

WORKDIR /app

# Installation sécurisée avec verrouillage strict des versions (npm ci)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copie explicite des fichiers applicatifs (évite toute copie récursive globale de données sensibles)
COPY src ./src
COPY config ./config
COPY jsconfig.json next.config.js tailwind.config.js postcss.config.js ./

# Build de l'application Next.js
RUN npm run build

# Exécution sous un utilisateur non-root pour la sécurité du conteneur
USER node

EXPOSE 3000

# Démarrage du serveur en production
CMD ["npm", "start"]
