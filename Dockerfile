FROM node:20-alpine

WORKDIR /app

# Installation sécurisée des dépendances sans exécution de scripts arbitraires
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

# Copie explicite des fichiers applicatifs (évite la copie récursive globale de données sensibles)
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
