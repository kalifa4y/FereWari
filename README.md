<div align="center">

# 💎 FereWari
### *L'application PWA intelligente de calcul de coût de revient (CRU), gestion de stocks et ventes express pour artisans et unités de production.*

[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25_Offline--First-03045E?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Dexie.js](https://img.shields.io/badge/Database-Dexie_IndexedDB-0096C7?style=for-the-badge&logo=databricks&logoColor=white)](https://dexie.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-00B4D8?style=for-the-badge)](LICENSE)

[Fonctionnalités](#-fonctionnalités-clés) • [Architecture](#-architecture--technologies) • [Installation](#-démarrage-rapide) • [Déploiement](#-déploiement-en-production) • [Documentation](#-documentation-technique)

</div>

---

## 📖 À propos de FereWari

**FereWari** est une Progressive Web Application (PWA) **100% Client-Side**, **Offline-First** et ultra-performante spécialement conçue pour les **artisans, savonniers, cosméticiens, transformateurs agroalimentaires et petites unités de production**.

Elle résout le défi majeur des petites entreprises : **maîtriser la rentabilité réelle de chaque produit fabriqué**, suivre les stocks d'ingrédients et encaisser les ventes sans aucune complexité comptable ni dépendance à une connexion Internet instable.

---

## 🌟 Fonctionnalités Clés

### 🔐 1. Sécurité & Configuration d'Atelier
- **Onboarding personnalisé** : Définition du nom de l'entreprise/atelier dès le premier lancement.
- **Code PIN de protection à 4 chiffres** : Clavier tactile ergonomique et protection physique/clavier pour sécuriser vos recettes et marges.
- **Verrouillage instantané** : Bouton cadenas dans le header pour verrouiller l'application en un geste.
- **Politique Zéro Fausse Donnée** : Démarrage propre avec base de données vide pour une utilisation immédiate.

### 🏭 2. Fiches Recettes Dynamiques & Coût de Revient (BOM)
- **Gestion des intrants** : Suivi des matières premières avec conversion d'unités (`kg`, `g`, `L`, `ml`, `unité`, `sac`, `paquet`).
- **Calculateur de CRU automatique** :
  $$\text{CRU} = \sum (\text{Ingrédients}) + \text{Emballage} + \text{Transport} + \text{Main d'œuvre}$$
- **Jauge de marge brute en temps réel** : Affichage en direct du bénéfice net en FCFA et du taux de marge (%).
- **Analyse visuelle des coûts** : Détection automatique du poste de dépense dominant pour optimiser vos achats.

### ⚡ 3. Caisse Express & Classement Clients
- **Enregistrement de vente en 2 clics** : Sélection du produit, quantité, et encaissement immédiat.
- **Auto-complétion client** : Recherche instantanée du client par nom ou numéro de téléphone depuis `IndexedDB`.
- **Classement de fidélité** : Tableau des meilleurs clients triés par chiffre d'affaires et nombre de commandes.
- **Reçus numériques WhatsApp** : Partage instantané du ticket de caisse pré-formaté via WhatsApp en 1 clic.

### 💾 4. Sauvegarde Maîtresse & Synchronisation
- **Base locale IndexedDB** via `Dexie.js` : Vos données restent 100% privées et stockées sur votre appareil.
- **Export & Restauration JSON** : Export complet horodaté (`ferewari-backup-YYYY-MM-DD.json`) et import atomique.
- **Synchronisation Google Drive** : Sauvegarde dans le cloud via OAuth2 client-side.
- **Rappels de sécurité automatiques** : Notification intelligente si aucune sauvegarde n'a été effectuée depuis plus de 7 jours.

### ❤️ 5. Modèle Libre & Soutien Communautaire
- **100% Gratuit & Illimité** : Aucune restriction de fonctionnalités, aucun blocage par paywall.
- **Dons volontaires** : Possibilité de soutenir le développement via **Wave** et **Orange Money** au numéro **`73 38 67 43`** (`+221 73 38 67 43`).

---

## 🎨 Charte Graphique & Design Océan

FereWari applique une identité visuelle moderne inspirée des nuances de l'océan, conçue pour un confort de lecture optimal :

| Couleur | Code HEX | Usage |
|---|---|---|
| **Deep Ocean Navy** | `#03045E` | En-têtes, typographie display principale, barres de statut |
| **Ocean Blue** | `#023E8A` | Boutons d'action primaires (CTA) |
| **Vibrant Ocean** | `#0077B6` / `#0096C7` | Éléments interactifs, sélecteurs, onglets actifs |
| **Aqua Cyan** | `#00B4D8` / `#48CAE4` | Badges de rentabilité, jauges de marge positive |
| **Soft Wave Blue** | `#90E0EF` / `#CAF0F8` | Arrière-plans de cartes, bordures subtiles |
| **Clean Background** | `#F8FCFE` | Fond principal de l'application |

**Typographies officielles :**
- **Titres & Display** : `Darker Grotesque` (Bold, Extra-Bold, Black)
- **Corps de texte & UI** : `Google Sans Flex` (avec fallbacks `Product Sans`, `Inter`, `sans-serif`)

---

## 🛠️ Architecture & Technologies

```text
┌────────────────────────────────────────────────────────┐
│                      FereWari PWA                      │
├────────────────────────────────────────────────────────┤
│  UI Layer      : React 18 + Tailwind CSS + Lucide Icons│
│  State & Logic : React Hooks + Services purs TypeScript│
│  Offline Cache : Service Worker (Workbox / VitePWA)    │
│  Local Storage : IndexedDB (Dexie.js Schema v2)        │
│  Sync & Backup : JSON Engine + Google Drive API        │
└────────────────────────────────────────────────────────┘
```

- **Frontend** : React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Persistance** : Dexie.js v4 (IndexedDB) avec hooks réactifs `useLiveQuery`
- **PWA** : `vite-plugin-pwa`, Workbox, Manifest v3 avec support maskable icons
- **Qualité & Tests** : Suite de tests automatisée TypeScript (`src/tests/runner.ts`)

---

## 🚀 Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- `npm` ou `pnpm`

### Installation & Lancement
```bash
# 1. Cloner le dépôt
git clone https://github.com/VOTRE_PSEUDO/ferewari.git
cd ferewari

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev

# 4. Exécuter la suite de tests
npx tsx src/tests/runner.ts

# 5. Compiler pour la production
npm run build
```

---

## 🌐 Déploiement en Production

Le projet est pré-configuré pour un déploiement instantané :

### 1. Déploiement sur Netlify (Drag & Drop — 30 secondes)
1. Rendez-vous sur **[app.netlify.com/drop](https://app.netlify.com/drop)**.
2. Glissez-déposez le dossier `dist/` généré par `npm run build`.
3. Votre PWA est en ligne avec HTTPS gratuit !

### 2. Déploiement sur Vercel
```bash
npx vercel --prod
```

### 3. Fichiers de configuration inclus
- `vercel.json` : Routage SPA, headers de sécurité stricts (CSP, X-Frame-Options, nosniff).
- `netlify.toml` : Redirections SPA 200 et cache PWA.
- `firebase.json` : Déploiement Firebase Hosting.
- `.github/workflows/deploy.yml` : Intégration continue (CI/CD) GitHub Actions.

---

## 📱 Installation sur Mobile (PWA)

- **Android (Chrome)** : Ouvrez le lien $\rightarrow$ Appuyez sur **"Installer l'application"** ou les 3 points $\rightarrow$ *Ajouter à l'écran d'accueil*.
- **iOS (Safari)** : Ouvrez le lien $\rightarrow$ Bouton **Partager** $\rightarrow$ *Sur l'écran d'accueil*.

---

## 📂 Documentation Technique

La documentation complète du cycle de vie est disponible dans le dossier [`docs/`](docs/) :
- [📋 Découverte du Projet & Vision](docs/project-discovery.md)
- [🎯 Cahier des Charges & Exigences](docs/requirements.md)
- [🔬 Recherche Technique & Benchmarks](docs/technical-research.md)
- [🏗️ Architecture Système](docs/system-architecture.md)
- [🗄️ Modèle de Données Dexie.js](docs/database-design.md)
- [🔌 Contrats API & Services](docs/api-design.md)
- [🎨 Charte Graphique & Brand Guidelines](brand-guidelines.md)
- [🧪 Rapport de Tests](docs/testing.md)
- [🛡️ Revue de Sécurité](docs/security.md)
- [🚀 Guide de Déploiement](docs/deployment.md)

---

## 📄 Licence & Contribution

Projet distribué sous licence **MIT**. Développé avec passion pour les artisans et producteurs d'Afrique et d'ailleurs.
