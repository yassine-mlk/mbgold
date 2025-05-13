# MB Gold - Gestion de Bijouterie

Une application moderne pour la gestion d'une bijouterie, incluant la gestion des stocks, des ventes, et des clients.

## Fonctionnalités

- Gestion complète du stock de bijoux avec prix décomposés (matière première, façonnage, marge)
- Mise à jour automatique des prix en fonction du cours de la matière première
- Affichage des produits en mode tableau et carte
- Gestion des promotions
- Gestion des clients et fournisseurs
- Système de caisse intégré
- Interface administrateur

## Technologies utilisées

- React avec TypeScript
- Vite comme outil de build
- Supabase pour la base de données et le stockage
- TailwindCSS pour le styling
- Shadcn UI pour les composants
- Lucide React pour les icônes

## Installation

1. Clonez le dépôt
   ```
   git clone https://github.com/votre-username/mbgold.git
   cd mbgold
   ```

2. Installez les dépendances
   ```
   npm install
   ```

3. Créez un fichier `.env` à la racine du projet et ajoutez vos variables d'environnement Supabase
   ```
   VITE_SUPABASE_URL=votre-url-supabase
   VITE_SUPABASE_ANON_KEY=votre-clé-anon-supabase
   ```

4. Lancez l'application en mode développement
   ```
   npm run dev
   ```

## Structure du projet

- `src/components` : Composants React réutilisables
- `src/pages` : Pages de l'application
- `src/services` : Services pour interagir avec Supabase
- `src/contexts` : Contextes React (authentification, thème)
- `src/lib` : Utilitaires et configuration

## Notes d'implémentation

- Les prix des produits sont décomposés en trois parties: prix de la matière première, coût de façonnage, et marge.
- Le prix de la matière première est calculé automatiquement en fonction du poids et du cours actuel.
- Les images des produits sont stockées dans un bucket Supabase 'produits'.

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1ba70995-a00d-4328-80eb-6a5101dea3ac

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1ba70995-a00d-4328-80eb-6a5101dea3ac) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1ba70995-a00d-4328-80eb-6a5101dea3ac) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Authentication with Supabase

This project uses Supabase for authentication. To set it up:

1. Create a Supabase account at [supabase.com](https://supabase.com) if you don't have one
2. Create a new Supabase project
3. Get your project URL and anon key from Project Settings > API
4. Create a `.env.local` file in the root of the project (copy from `supabase.env.example`)
5. Update the `.env.local` file with your Supabase URL and anon key:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Creating Test Users

For development purposes, you can create test users using the provided utility function:

```typescript
import { createTestUser } from '@/utils/createTestUser';

// Create a test user (call this in your browser console)
createTestUser('test@example.com', 'password123', 'admin', 'Test User');
```

You can also use the default demo users in the login page:

- **Platform Owner**: Email: super@example.com, Password: platform123
- **Commerce Owner**: Email: owner@example.com, Password: commerce123
- **Team Member**: Email: team@example.com, Password: team123

> ⚠️ **Note**: Make sure to set up proper authentication in Supabase before going to production. The demo users are for development purposes only.
