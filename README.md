# 🚀 FereWari — Application PWA de Gestion de Production & Ventes

> **FereWari** est une Progressive Web Application (PWA) 100% Client-Side & Offline-First conçue pour les artisans, transformateurs agroalimentaires, savonniers, cosméticiens et petites unités de production en Afrique de l'Ouest.

---

## 🌟 Fonctionnalités Clés

1. **🏭 Gestion des Coûts & Fiches Recettes (BOM)** :
   - Gestion des matières premières (intrants) et prix d'achat au kg, g, L, ml, unité.
   - Intégration des frais d'emballage, de transport et de main d'œuvre.
   - **Calcul automatique du Coût de Revient Unitaire (CRU)** et calcul en direct de la marge brute.
   - Détection et mise en valeur du poste de dépense dominant (matière dominante, emballage...).

2. **⚡ Ventes Express & Classement Fidélité** :
   - Caisse de vente rapide en 2 clics avec auto-complétion intelligente du client.
   - Attribution client non-bloquante par nom et numéro WhatsApp/téléphone.
   - Tableau de classement des clients triable par chiffre d'affaires cumulé et nombre de commandes.
   - Émission et partage de reçus de vente par WhatsApp en un clic.

3. **💳 Cycle de Vie & Monétisation (5 000 FCFA/mois)** :
   - **Essai gratuit de 15 jours** sans restriction.
   - **Période de relance de 10 jours** avec bandeau non bloquant (`#E63946`) et compte à rebours.
   - **Paywall rassurant** garantissant la préservation intégrale et permanente des données dans `IndexedDB`.
   - Module de paiement mobile money (Wave, Orange Money) pour l'abonnement.
   - Simulateur de cycle de vie (Dev Switcher) pour tester facilement les différents états.

4. **💾 Sauvegarde & Sécurité des Données** :
   - Base de données locale maîtresse ultra-rapide via `Dexie.js` (`IndexedDB`).
   - Export et restauration de sauvegardes complètes en fichier JSON (`ferewari-backup-*.json`).
   - Synchronisation client-side avec Google Drive.
   - Rappel de sécurité automatique si la dernière sauvegarde date de plus de 7 jours.

---

## 🎨 Identité Visuelle & Charte Graphique

- **Typographie** :
  - **Titres & Display** : `Darker Grotesque` (Bold, Extra-Bold, Black)
  - **Corps de texte & UI** : `Google Sans Flex` (avec fallbacks `Product Sans`, `Inter`, `sans-serif`)
- **Palette Chromatique** :
  - `#03045E` (Navy profond — Titres, Headers)
  - `#023E8A` (Bleu primaire — Boutons d'action principaux)
  - `#0077B6` & `#0096C7` (Bleu vibrant — Éléments interactifs)
  - `#00B4D8` & `#48CAE4` (Cyan — Badges de rentabilité)
  - `#90E0EF` & `#ADE8F4` (Bleu doux — Fonds de cartes)
  - `#CAF0F8` & `#F8FCFE` (Bleu très pâle — Arrière-plans)
  - `#E63946` / `#D90429` (Rouge alerte — Période de grâce & paywall)

---

## 🛠️ Stack Technique

- **Langage** : TypeScript
- **Framework Frontend** : React 18+
- **Build Tool** : Vite
- **PWA & Offline** : `vite-plugin-pwa` (Workbox)
- **Persistance Locale** : `IndexedDB` orchestré par `Dexie.js` (v4) & `dexie-react-hooks`
- **UI & Style** : Tailwind CSS, Ionic React, Lucide Icons, Framer Motion, Canvas Confetti

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en mode développement
```bash
npm run dev
```

### 3. Exécution des tests unitaires
```bash
npx tsx src/tests/runner.ts
```

### 4. Build de production (PWA)
```bash
npm run build
```

---

## 📂 Documentation du Projet
- [Project Discovery](docs/project-discovery.md)
- [Cahier des Charges & Exigences](docs/requirements.md)
- [Recherche Technique](docs/technical-research.md)
- [Plan d'Exécution](docs/task-planning.md)
- [Architecture Système](docs/system-architecture.md)
- [Conception Base de Données (Dexie.js)](docs/database-design.md)
- [Contrats API & Services](docs/api-design.md)
- [Guide UI/UX & Brand Guidelines](brand-guidelines.md)
- [Architecture Frontend](docs/frontend-architecture.md)
- [Rapport de Tests](docs/testing.md)
- [Revue de Sécurité](docs/security.md)
- [Guide de Déploiement](docs/deployment.md)
- [Vérification Production](docs/production-verification.md)
- [Maintenance & Opérations](docs/monitoring-maintenance.md)
