# 🌍 La Grandeur des Choses

Bot Twitter automatisé qui génère et publie quotidiennement des tweets scientifiques et culturels surprenants, avec des comparaisons de grandeurs et des faits incroyables.

## 📖 Principe de l'application

**La Grandeur des Choses** est un bot Twitter intelligent qui :

- 🤖 **Génère automatiquement** du contenu original basé sur des faits scientifiques et historiques
- 📊 **Analyse les performances** des tweets publiés pour optimiser le contenu futur
- ⏰ **Publie quotidiennement** de manière autonome
- 📈 **Suit les métriques** (likes, retweets, réponses, impressions) pour calculer un score de popularité
- 🧠 **Apprend de ses succès** en s'inspirant des tweets les plus populaires

Le bot crée des tweets dans le style "Et si on...", mélangeant science, culture et faits surprenants avec des emojis pour rendre le contenu attractif et engageant.

### Exemples de tweets générés

> "Et si on reliait tous les humains par la main ? 🌍  
> La chaîne ferait ~8 millions de km… soit 200 fois le tour de la Terre ! 🤯"

> "Et si on transformait la Terre en trou noir ? 🕳️  
> Son horizon des événements ferait à peine 9 mm… une planète entière dans une bille 😱"

## 🛠 Technologies utilisées

### Backend & Runtime
- **Node.js** - Environnement d'exécution JavaScript
- **TypeScript** - Typage statique pour JavaScript
- **ts-node** - Exécution directe de TypeScript en développement

### Base de données
- **PostgreSQL** - Base de données relationnelle
- **Prisma ORM** - ORM moderne avec typage TypeScript
  - Gestion des migrations
  - Client généré automatiquement
  - Schéma déclaratif

### APIs & Services
- **OpenAI API** (GPT-4o-mini) - Génération de contenu IA
- **Twitter API v2** (`twitter-api-v2`) - Publication et récupération de métriques
- **dotenv** - Gestion des variables d'environnement

### Automatisation
- **node-cron** - Planification de tâches (cron jobs)
  - 8h00 : Mise à jour des métriques
  - 8h15 : Génération de nouveaux brouillons
  - 8h30 : Publication automatique

### Qualité de code
- **ESLint** - Linting et analyse statique
- **Prettier** - Formatage automatique du code
- **TypeScript ESLint** - Règles ESLint pour TypeScript

## 🏗 Architecture

```
src/
├── index.ts                 # Point d'entrée, configuration des cron jobs
├── lib/
│   └── prisma.ts           # Instance Prisma client
├── services/
│   ├── open-ai.service.ts  # Génération de contenu avec OpenAI
│   ├── x.service.ts        # Interaction avec l'API Twitter
│   └── tweet.service.ts    # Logique métier des tweets
└── generated/
    └── prisma/             # Client Prisma généré
```

## 📊 Modèle de données

Le schéma Prisma définit un modèle `Tweet` avec :

- **Informations du tweet** : contenu, statut (DRAFT, SCHEDULED, POSTED, FAILED)
- **Métriques de performance** : likes, retweets, réponses, impressions
- **Score de popularité** : calculé automatiquement selon la formule :
  ```
  score = likes × 1 + retweets × 2 + replies × 1.5 + impressions × 0.001
  ```

## 🚀 Installation

### Prérequis

- Node.js (v16 ou supérieur)
- PostgreSQL
- Compte OpenAI avec clé API
- Compte Twitter Developer avec accès API v2

### Configuration

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd la-grandeur-des-choses
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   
   Créer un fichier `.env` à la racine :
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   
   OPENAI_API_KEY="sk-..."
   
   TWITTER_API_KEY="..."
   TWITTER_API_KEY_SECRET="..."
   TWITTER_ACCESS_TOKEN="..."
   TWITTER_ACCESS_TOKEN_SECRET="..."
   ```

4. **Initialiser la base de données**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

## 💻 Utilisation

### Développement
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Autres commandes
```bash
# Linter
npm run lint

# Formatage du code
npm run format
```

## ⏰ Fonctionnement des tâches planifiées

### 8h00 - Mise à jour des métriques
- Récupère tous les tweets avec le statut `POSTED`
- Interroge l'API Twitter pour obtenir les métriques actuelles
- Met à jour la base de données et recalcule le score de popularité

### 8h15 - Génération de brouillon
- Vérifie s'il existe déjà un tweet en `DRAFT`
- Si aucun brouillon n'existe :
  - Récupère les 20 tweets les plus populaires
  - Envoie un prompt à OpenAI avec l'historique et le style souhaité
  - Sauvegarde le nouveau tweet généré comme `DRAFT`

### 8h30 - Publication
- Récupère le tweet en `DRAFT`
- Le publie sur Twitter via l'API
- Met à jour le statut en `POSTED` avec l'ID Twitter

## 📝 Licence

ISC

## 👤 Auteur

Sylvain

---

⭐️ **Note** : Cette application nécessite des clés API valides pour OpenAI et Twitter pour fonctionner correctement.
