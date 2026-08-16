# 🌍 GUIDE DE MISE EN PRODUCTION — FereWari PWA

Tout le travail technique et la compilation de production ont été préparés automatiquement. Vous pouvez mettre l'application en ligne gratuitement en moins de 2 minutes.

---

## ⚡ Option 1 : Netlify Drop (La plus simple — 30 secondes chrono, 0 commande)

1. Ouvrez votre navigateur et allez sur : **[https://app.netlify.com/drop](https://app.netlify.com/drop)**.
2. Ouvrez votre explorateur de fichiers Windows dans le dossier :
   📁 `C:\Users\legion\Desktop\FereW`
3. **Glissez et déposez (Drag & Drop)** le dossier **`dist`** directement sur la page de Netlify.
4. 🎉 **C'est fini !** Netlify vous donne instantanément une adresse HTTPS sécurisée (ex: `https://ferewari-artisan.netlify.app`).

---

## 🚀 Option 2 : Vercel (Recommandé pour un domaine personnalisé & mises à jour)

### Méthode A : Avec la commande Vercel
Ouvrez votre terminal dans le projet et tapez :
```bash
npx vercel --prod
```
- Suivez les instructions rapides (appuyez sur Entrée pour valider les choix par défaut).
- Votre application sera déployée sur un lien de type `https://ferewari.vercel.app`.

### Méthode B : Via GitHub
1. Créez un dépôt sur GitHub et poussez votre code :
   ```bash
   git remote add origin https://github.com/VOTRE_PSEUDO/ferewari.git
   git branch -M main
   git push -u origin main
   ```
2. Rendez-vous sur **[vercel.com](https://vercel.com)** $\rightarrow$ **"Add New Project"** $\rightarrow$ Importez votre dépôt.
3. Cliquez sur **"Deploy"**. Chaque fois que vous modifierez votre code, Vercel le mettra à jour automatiquement !

---

## 📱 Comment installer FereWari sur téléphone (Android & iPhone)

Une fois votre lien HTTPS obtenu (sur Netlify, Vercel ou votre propre domaine) :

### Sur Android (Google Chrome)
1. Ouvrez le lien sur votre smartphone.
2. Un bouton **"Installer l'application"** apparaît en bas. (Ou appuyez sur les 3 points verticaux en haut à droite $\rightarrow$ **"Ajouter à l'écran d'accueil"** / **"Installer l'application"**).
3. L'icône **FereWari** apparaît sur l'écran d'accueil de votre téléphone et fonctionne même en mode avion (sans Internet).

### Sur iPhone / iPad (Safari)
1. Ouvrez le lien dans **Safari**.
2. Appuyez sur le bouton de **Partage** (le carré avec la flèche vers le haut en bas de l'écran).
3. Faites défiler et appuyez sur **"Sur l'écran d'accueil"**.
4. Appuyez sur **"Ajouter"**.

---

## 🛠️ Ce qui a été préparé automatiquement pour vous :
- ✅ **Dossier de production optimisé `dist/`** : Minifié, ultra-léger et compilé avec support PWA hors-ligne.
- ✅ **Fichier de configuration Vercel (`vercel.json`)** : Gestion du routage SPA, en-têtes de sécurité et mise en cache.
- ✅ **Fichier de configuration Netlify (`netlify.toml`)** : Règles de redirection et headers PWA.
- ✅ **Fichier Firebase (`firebase.json`)** : Configuration Firebase Hosting.
- ✅ **Workflow GitHub Actions (`.github/workflows/deploy.yml`)** : Tests et build automatisés.
- ✅ **Dépôt Git initialisé** : Prêt pour `git push`.
- ✅ **Tests unitaires validés** : 100% de réussite.
