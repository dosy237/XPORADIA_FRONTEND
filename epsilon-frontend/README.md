# Xporadia — Frontend

> Plateforme de certification professionnelle des enseignants du secteur privé africain.
> **React 18 · Vite · Tailwind CSS · Zustand · React Query**

**Slogan :** L'innovation au service de l'éducation
**Couleurs principales :** Navy `#1B2A4A` · Orange `#E8510A` · Fond `#F5F6F7`

> ⚠️ **Ce dossier `README.md` documente `web/`**, le tout premier scaffold
> React/Vite (une seule initialisation, jamais poursuivie). **L'application
> réellement développée et à jour est `mobile/`** (Expo/React Native) —
> toutes les fonctionnalités de la plateforme y sont implémentées. Voir
> **[`mobile/README.md`](./mobile/README.md)** pour la lancer.

---

## Table des matières

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation locale](#installation-locale)
- [Structure du projet](#structure-du-projet)
- [Design System Xporadia](#design-system-xporadia)
- [Workflow Git & branches](#workflow-git--branches)
- [Convention de commits](#convention-de-commits)
- [Créer une feature](#créer-une-feature)
- [Tests](#tests)
- [Variables d'environnement](#variables-denvironnement)
- [Déploiement](#déploiement)
- [Commandes utiles](#commandes-utiles)

---

## Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Framework | React | 18 |
| Build tool | Vite | 5 |
| Routing | React Router | v6 |
| State UI | Zustand | 4 |
| Server state | TanStack React Query | 5 |
| HTTP | Axios (+ intercepteurs JWT) | 1.x |
| Styling | Tailwind CSS | 3 |
| Formulaires | React Hook Form + Zod | — |
| Tests | Vitest + Testing Library | — |
| Cartes | Leaflet + React Leaflet | — |
| Dates | date-fns | — |

---

## Prérequis

```bash
Node.js >= 20
npm >= 10
Git
# Le backend Xporadia doit tourner sur http://localhost:8000
```

---

## Installation locale

```bash
# 1. Cloner le repo
git clone git@github.com:ton-org/xporadia-frontend.git
cd xporadia-frontend/web

# 2. Installer les dépendances
npm install

# 3. Variables d'environnement
cp .env.example .env.local
# Éditez .env.local si nécessaire (VITE_API_URL par défaut = http://localhost:8000/api/v1)

# 4. Lancer le serveur de développement
npm run dev
# → http://localhost:3000
```

> ⚠️ Le backend doit être lancé en parallèle sur le port 8000.
> Voir le repo `xporadia-backend` pour les instructions.

---

## Structure du projet

```
xporadia-frontend/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Lint + tests + build check sur chaque PR
│       └── deploy.yml      # Deploy staging (develop) + prod (main)
└── web/                    # Application React Web
    ├── public/             # Assets statiques (logo, favicon)
    ├── src/
    │   ├── assets/         # Images, icônes SVG
    │   ├── components/
    │   │   ├── ui/         # Composants atomiques (Button, Input, Badge, Card...)
    │   │   ├── shared/     # Composants partagés (PrivateRoute, Navbar, Sidebar...)
    │   │   └── layout/     # Layouts par rôle (TeacherLayout, DirectorLayout...)
    │   ├── pages/
    │   │   ├── public/     # Pages visiteur (Accueil, Vérification certificat)
    │   │   ├── auth/       # Connexion, Inscription, Reset MDP
    │   │   ├── teacher/    # E-01 à E-14 (dashboard enseignant...)
    │   │   ├── director/   # D-01 à D-06 (dashboard directeur...)
    │   │   ├── parent/     # P-01 à P-08 (dashboard parent...)
    │   │   ├── company/    # ENT-01 à ENT-04 (dashboard entreprise...)
    │   │   ├── trainer/    # F-01 à F-04 (dashboard formateur...)
    │   │   └── admin/      # ADM-01 à ADM-07 (back-office admin...)
    │   ├── hooks/          # Custom hooks (useAuth, useCertification...)
    │   ├── store/          # Zustand stores (authStore, uiStore...)
    │   ├── services/       # Appels API (api.js + services par domaine)
    │   ├── utils/          # Fonctions utilitaires (format, validation...)
    │   ├── types/          # Types JS (JSDoc ou TypeScript à terme)
    │   ├── styles/         # Styles globaux additionnels
    │   ├── index.css       # Tailwind base + composants Xporadia
    │   ├── main.jsx        # Point d'entrée React
    │   └── App.jsx         # Router principal
    ├── .env.example        # Template variables d'environnement
    ├── .env.local          # Variables locales (ignoré par Git)
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── tailwind.config.js  # Tokens Design System Xporadia
    ├── vite.config.js      # Vite + alias + vitest
    └── eslint.config.js
```

### Structure d'une page par rôle

```
src/pages/teacher/
├── DashboardPage.jsx       # E-01 — Dashboard enseignant
├── ProfilePage.jsx         # E-02 — Mon profil public
├── certification/
│   ├── CertificationPage.jsx    # E-03 — Hub certification
│   ├── ModuleDetailPage.jsx     # E-03a
│   ├── SessionBookPage.jsx      # E-03b
│   ├── PaymentPage.jsx          # E-03c
│   ├── ExamPage.jsx             # E-03d
│   └── ResultsPage.jsx          # E-03e
├── employment/
│   ├── JobMarketPage.jsx        # E-04
│   ├── JobDetailPage.jsx        # E-04a
│   └── ApplicationsPage.jsx     # E-04d
└── ...
```

### Structure d'un composant feature

```
src/components/ui/
├── Button.jsx          # Variantes : primary, secondary, navy, danger
├── Input.jsx           # Input avec label, erreur, icône
├── Badge.jsx           # Bronze, Argent, Or, Non certifié
├── Card.jsx            # Card, CardFlat
├── Skeleton.jsx        # Skeleton loader animé
└── Snackbar.jsx        # Notifications temporaires
```

---

## Design System Xporadia

### Couleurs

| Token Tailwind | Valeur | Usage |
|---|---|---|
| `xporadia-navy` | `#1B2A4A` | Headers, texte fort, fond admin |
| `xporadia-orange` | `#E8510A` | CTA principal, badges actifs, icônes clés |
| `xporadia-bg` | `#F5F6F7` | Fond général des pages |
| `xporadia-green` | `#00C07F` | Succès, certification validée |
| `xporadia-red` | `#E53935` | Erreur, expiration, actions destructives |
| `xporadia-gold` | `#F5A623` | Étoiles, notes, revenus |
| `xporadia-purple` | `#7B2FFF` | Certification Or/premium |
| `xporadia-text-primary` | `#1A1A2E` | Corps de texte |
| `xporadia-text-secondary` | `#5A6A8A` | Labels, métadonnées |

### Typographie

```
Titre H1  → Inter Bold 700    28–32px
Titre H2  → Inter SemiBold 600 20–24px
Titre H3  → Inter SemiBold 600 16–18px
Corps     → Inter Regular 400  14–15px
Labels    → Inter Medium 500   11–12px
Code      → JetBrains Mono 400 12–13px
```

### Composants classes Tailwind prêts

```jsx
// Boutons
<button className="btn-primary">S'inscrire</button>
<button className="btn-secondary">Annuler</button>
<button className="btn-navy">Connexion</button>
<button className="btn-danger">Supprimer</button>

// Cartes
<div className="card">Contenu avec ombre et hover</div>
<div className="card-flat">Contenu sans ombre</div>

// Badges certification
<span className="badge-bronze">Bronze</span>
<span className="badge-argent">Argent</span>
<span className="badge-or">Or</span>
<span className="badge-non-certifie">Non certifié</span>

// Input
<input className="input" placeholder="Email" />
<input className="input input-error" placeholder="Email" />

// Skeleton
<div className="skeleton h-4 w-32" />
```

---

## Workflow Git & branches

### Modèle de branches

```
main
 └── develop                         ← branche d'intégration
      └── feature/EP-01-US-01-01-inscription-enseignant
      └── feature/EP-02-US-02-03-examen-en-ligne
      └── fix/EP-03-US-03-02-offre-bug-affichage
```

| Branche | Rôle | Déploiement auto |
|---|---|---|
| `main` | Code stable — production | → Production (après MVP) |
| `develop` | Intégration de toutes les features | → Staging (automatique) |
| `feature/EP-XX-US-XX-XX-nom` | Une feature = une US Jira | — |
| `fix/EP-XX-nom` | Correction de bug | — |

### Règles strictes

- **On ne push jamais directement sur `main` ou `develop`**
- **Toute feature passe par une Pull Request** (minimum 1 reviewer)
- **La CI doit passer** (lint + tests + build) avant le merge
- **Un nom de branche = un code de User Story Jira** — traçabilité totale

---

## Convention de commits

Format **Conventional Commits** — identique au backend pour cohérence.

```
<type>(<scope>): <description courte>
```

### Types

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité / écran |
| `fix` | Correction de bug visuel ou logique |
| `style` | Ajustement UI/CSS sans changement logique |
| `test` | Ajout ou modification de tests |
| `refactor` | Refactoring composant sans nouveau comportement |
| `docs` | Documentation (README, JSDoc) |
| `chore` | Config, dépendances |

### Exemples

```bash
git commit -m "feat(auth): ajouter page inscription avec choix du rôle

- 4 cartes rôle cliquables (Enseignant, Directeur, Parent, Entreprise)
- Formulaire adapté par rôle avec validation Zod
- Barre de progression étape 1/4
- Design mobile-first conforme Design System Xporadia

Closes EP-01-US-01-01"

git commit -m "style(dashboard): ajuster la couleur du badge certification

Badge Non certifié passe en rouge xporadia-red au lieu de gris.
Closes EP-01"

git commit -m "fix(api): corriger le refresh token sur expiration 401

L'intercepteur Axios boucle si le refresh lui-même expire.
Ajout d'un flag _retry + redirect /connexion.
Closes EP-01-US-01-03"
```

---

## Créer une feature

### Étapes complètes (à suivre dans l'ordre)

```bash
# 1. Se placer sur develop et se mettre à jour
git checkout develop
git pull origin develop

# 2. Créer la branche feature
# Convention : feature/EP-{épique}-US-{story}-{description-courte}
git checkout -b feature/EP-01-US-01-01-inscription-enseignant

# 3. Créer le dossier de documentation de la feature
mkdir -p src/pages/auth/docs/US-01-01-inscription-enseignant
# → Y placer :
#   - maquettes/ (exports Figma PNG ou PDF)
#   - notes-ux.md (décisions design, états, edge cases visuels)

# 4. Créer les composants et la page
# → src/pages/auth/RegisterPage.jsx
# → src/components/ui/ (si nouveau composant générique)

# 5. Écrire les tests
# → src/pages/auth/__tests__/RegisterPage.test.jsx

# 6. Vérifier le lint
npm run lint

# 7. Lancer les tests
npm run test

# 8. Committer
git add .
git commit -m "feat(auth): page inscription avec sélection du rôle"

# 9. Pousser et ouvrir une Pull Request vers develop
git push origin feature/EP-01-US-01-01-inscription-enseignant
# → Ouvrir la PR sur GitHub vers develop
# → Assigner un reviewer
# → Attendre CI verte + review approuvée
```

### Structure d'un dossier docs de feature

```
src/pages/auth/docs/US-01-01-inscription-enseignant/
├── maquettes/
│   ├── mobile-step1-choix-role.png
│   ├── mobile-step2-formulaire.png
│   └── desktop-step1.png
└── notes-ux.md     # Décisions design, comportements, états vides, erreurs
```

---

## Tests

```bash
# Lancer tous les tests
npm run test

# Mode watch (développement)
npm run test:watch

# Avec rapport de couverture
npm run test:coverage
# → Ouvre coverage/index.html
```

**Objectif** : ≥ 80% de couverture par feature, mesuré à chaque CI.

### Exemple de test

```jsx
// src/pages/auth/__tests__/RegisterPage.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import RegisterPage from "../RegisterPage";

const renderWithRouter = (ui) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("RegisterPage", () => {
  it("affiche les 4 cartes de choix de rôle", () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText("Je suis enseignant")).toBeInTheDocument();
    expect(screen.getByText("Je suis directeur d'établissement")).toBeInTheDocument();
    expect(screen.getByText("Je suis parent")).toBeInTheDocument();
    expect(screen.getByText("Je représente une entreprise")).toBeInTheDocument();
  });

  it("affiche le formulaire après sélection du rôle enseignant", async () => {
    renderWithRouter(<RegisterPage />);
    fireEvent.click(screen.getByText("Je suis enseignant"));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    });
  });
});
```

---

## Variables d'environnement

Copier `.env.example` en `.env.local` :

| Variable | Valeur dev | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | URL de l'API backend |
| `VITE_APP_NAME` | `Xporadia` | Nom de l'application |
| `VITE_APP_ENV` | `development` | Environnement actif |

> ⚠️ **Ne jamais committer `.env.local`** — il est dans `.gitignore`

---

## Déploiement

### Staging (automatique)

Chaque merge sur `develop` déclenche automatiquement le build et le déploiement sur staging via GitHub Actions.

### Production (automatique — après MVP)

Chaque merge sur `main` déclenche le build de production et le déploiement.

### Secrets GitHub à configurer

Dans `Settings > Secrets and variables > Actions` :

```
VITE_API_URL_STAGING    → https://api-staging.xporadia.ci/api/v1
VITE_API_URL_PROD       → https://api.xporadia.ci/api/v1
STAGING_HOST            → IP serveur staging
PROD_HOST               → IP serveur production
```

---

## Commandes utiles

```bash
npm run dev             # Serveur de développement (port 3000)
npm run build           # Build de production
npm run preview         # Prévisualiser le build production
npm run lint            # Vérification ESLint
npm run lint:fix        # Correction automatique ESLint
npm run test            # Tests unitaires
npm run test:watch      # Tests en mode watch
npm run test:coverage   # Tests avec rapport de couverture
npm run format          # Formatage Prettier
```

---

## Équipe & contact

Projet **Xporadia** — L'innovation au service de l'éducation
Chef de projet : DONFACK Synthia Calorine
Stack : Django · React · React Native
Méthodologie : Agile Scrum · Jira · GitHub Flow
