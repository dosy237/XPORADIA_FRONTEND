# ε Xporadia — Mobile (Expo / React Native)

> Application mobile Xporadia — accessible aux enseignants, directeurs
> d'établissement, parents et entreprises.
> **Expo · React Native · Expo Router · NativeWind (Tailwind) · React Query · Zustand**

---

## 🚀 Démarrage rapide

Ce projet a besoin du **backend Django déjà lancé et rempli de données de
démo** — voir le README du dépôt `epsilon-backend` (section "Démarrage
rapide"), en résumé :

```bash
# Dans epsilon-backend/
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver        # http://localhost:8000
```

Puis, ici, dans `epsilon-frontend/mobile/` :

```bash
# 1. Installer les dépendances
npm install

# 2. Variables d'environnement (facultatif si le backend tourne sur localhost:8000)
cp .env.example .env
# .env contient uniquement l'URL de l'API — voir la section dédiée ci-dessous

# 3. Lancer l'app en mode web (le plus simple pour tester rapidement)
npx expo start --web
```

L'app s'ouvre sur http://localhost:19006. Connectez-vous avec l'un des
comptes de démo créés par `seed_demo_data` côté backend (mot de passe commun
`Xporadia2026!`) — la liste complète des comptes et de ce qu'ils contiennent
est dans `SEED_DATA.md` à la racine du dépôt backend.

### Autres cibles (Android / iOS)

```bash
npx expo start           # menu interactif (web, Android, iOS, Expo Go)
npx expo start --android # émulateur Android
npx expo start --ios     # simulateur iOS
```

> Sur émulateur Android, `localhost` depuis la machine hôte ne pointe pas
> vers le même hôte que depuis l'émulateur — voir `.env.example` pour l'URL
> à utiliser (`10.0.2.2`) et adaptez `EXPO_PUBLIC_API_URL` en conséquence.

---

## Variables d'environnement

Un seul fichier, `.env`, avec une seule variable :

```bash
# Simulateur iOS      -> http://localhost:8000/api/v1
# Émulateur Android   -> http://10.0.2.2:8000/api/v1
# Appareil physique    -> http://<IP-locale-de-votre-machine>:8000/api/v1
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Si vous testez uniquement en mode web (`npx expo start --web`) sur la même
machine que le backend, la valeur par défaut (`localhost:8000`) fonctionne
sans rien changer — `.env` est alors facultatif.

---

## Structure du projet

```
mobile/
├── src/
│   ├── app/                    # Écrans — routing par fichiers (Expo Router)
│   │   ├── (auth)/             # Connexion, inscription, vérification OTP
│   │   └── (app)/              # Application authentifiée, un dossier par rôle
│   │       ├── teacher/        # Espace enseignant
│   │       ├── director/       # Espace directeur / établissement
│   │       ├── parent/         # Espace parent
│   │       └── company/        # Espace entreprise
│   ├── components/              # Composants UI réutilisables
│   ├── services/                # Appels API (un fichier par domaine métier)
│   ├── store/                    # État global (Zustand — auth notamment)
│   └── constants/                # Constantes partagées (thème, libellés...)
├── app.json                     # Configuration Expo
├── package.json
└── .env.example
```

Chaque écran d'un rôle vit dans `(app)/<rôle>/...` et est enregistré dans
`(app)/_layout.tsx` (`<Stack.Screen name="..." />`). Les appels réseau
passent systématiquement par un fichier de `src/services/`, jamais
directement dans un écran.

---

## Comptes de démo

Voir **`SEED_DATA.md`** dans le dépôt backend pour la liste complète. En
bref, un compte par profil type :

| Rôle | Email | Mot de passe |
|---|---|---|
| Enseignant (certifié Or) | `aminata.teacher@xporadia.ci` | `Xporadia2026!` |
| Directeur d'établissement | `kouassi.director@xporadia.ci` | `Xporadia2026!` |
| Parent | `fatou.parent@xporadia.ci` | `Xporadia2026!` |
| Entreprise | `contact.entreprise@xporadia.ci` | `Xporadia2026!` |

---

## Notes techniques

- **Expo v57** — en cas de doute sur une API, se référer à la documentation
  versionnée exacte : https://docs.expo.dev/versions/v57.0.0/
- Le cache de routes typées d'Expo Router doit parfois être régénéré après
  l'ajout d'un nouvel écran : ouvrez une fois l'URL correspondante dans le
  navigateur (mode web) pour que `tsc` la reconnaisse.
- `npx tsc --noEmit` doit passer sans erreur avant de committer.

## Aller plus loin avec Expo

- [Documentation Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction)
