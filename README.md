# TaskFlow

Un outil de suivi de tâches pour des équipes de 5 à 50 personnes.

Chaque organisation a son propre espace, isolé des autres : ses projets, ses tâches et ses membres. Une tâche s'assigne à quelqu'un, passe par trois états (à faire, en cours, terminée) et porte une priorité et une date d'échéance.

![Tableau de bord de TaskFlow](debug-dashboard-orgA.png)

## Ce que fait l'application

- Connexion sécurisée, avec un jeton stocké dans un cookie
- Chaque organisation ne voit que ses propres données
- Création, modification et suivi des tâches
- Statut, priorité et date d'échéance sur chaque tâche

## Technologies

| Partie | Outils |
|---|---|
| Interface | React, Vite, React Router |
| Serveur | Node.js, Express |
| Base de données | PostgreSQL, Knex (migrations et données de départ) |
| Sécurité | JWT, bcrypt, Helmet, limitation du nombre de requêtes, validation avec Joi |
| Tests | Jest et Supertest pour l'API, Playwright pour les parcours complets |
| Journalisation | Pino |

Le serveur est organisé en couches : routes, middleware, contrôleur, service, accès aux données. Chaque couche ne parle qu'à la suivante.

## Lancer le projet

Il faut Node.js 20 et Docker.

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# 3. Créer un fichier .env à partir de .env.example, et y ajouter :
#    DATABASE_URL=postgres://taskflow:MOT_DE_PASSE@localhost:5434/taskflow_dev

# 4. Créer les tables et les données de départ
npx knex migrate:latest
npx knex seed:run

# 5. Lancer l'API (port 4000)
node server.js

# 6. Dans un second terminal, lancer l'interface
npm run dev
```

## Tests

```bash
npm test            # tests de l'API
npm run test:e2e    # parcours complets dans le navigateur
```

## Auteure

Aya Aidibi, [aya-portefolio.netlify.app](https://aya-portefolio.netlify.app)
