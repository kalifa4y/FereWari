# 🎨 Guide d'Identité Visuelle & Charte Graphique — FereWari

## 1. Identité de Marque & Règle Typographique
- **Nom Officiel** : `FereWari` *(Respecter strictement la casse : F majuscule et W majuscule)*.
- **Logo** : Logotype textuel épuré **FereWari** avec la police `Darker Grotesque` en couleur `#03045E` ou en dégradé océan (`linear-gradient(135deg, #03045E 0%, #0077B6 100%)`).

---

## 2. Palette Chromatique Officielle

| Token | Code Hex | Rôle & Usage UI |
| :--- | :--- | :--- |
| `navy-deep` | `#03045E` | Titres, headers, texte à contraste fort, barre de statut PWA |
| `blue-primary` | `#023E8A` | Boutons d'action principaux, éléments actifs, CTA de confirmation |
| `blue-vibrant` | `#0077B6` | Onglets sélectionnés, bordures de focus, liens interactifs |
| `blue-medium` | `#0096C7` | Icônes d'action secondaire, accents graphiques |
| `cyan-bright` | `#00B4D8` | Badges de rentabilité élevée, jauges de marge positive |
| `cyan-soft` | `#48CAE4` | Puces d'information, infobulles, indicateurs de progrès |
| `blue-subtle` | `#90E0EF` | Bordures de cartes légères, états de survol |
| `blue-card` | `#ADE8F4` | Fonds de cartes d'information et conteneurs secondaires |
| `blue-pale` | `#CAF0F8` | Arrière-plan des bandeaux d'astuces et bannières douces |
| `bg-main` | `#F8FCFE` | Arrière-plan global de l'application (blanc cassé bleuté) |
| `alert-red` | `#E63946` | Bannière de période de relance, paywall, alertes critiques |
| `alert-dark` | `#D90429` | Boutons de résiliation, erreurs bloquantes |

---

## 3. Typographie

### 3.1 Titres & Display
- **Police** : `Darker Grotesque` (Google Fonts).
- **Graisses** : Bold (700), Extra-Bold (800), Black (900).
- **Usage** : `h1`, `h2`, `h3`, KPI Big Numbers, Logotype de marque.

### 3.2 Corps de texte & Interface (UI)
- **Police** : `Google Sans Flex` (ou fallbacks `Product Sans`, `Inter`, `system-ui`, `sans-serif`).
- **Graisses** : Regular (400), Medium (500), Semi-Bold (600).
- **Usage** : Paragraphes, formulaires, boutons, tableaux, étiquettes de saisie.

---

## 4. Composants UI & Micro-interactions
- **Cartes & Conteneurs** : Coins arrondis `rounded-2xl`, ombres douces `shadow-sm hover:shadow-md`, transitions fluides de 200ms.
- **Boutons** : Hauteur minimale de 48px pour accessibilité tactile mobile (`min-h-[48px]`), padding généreux `px-5 py-3`, coins arrondis `rounded-xl`.
- **Bandeau de Grâce (#E63946)** : Fixé en haut de l'écran, non bloquant, avec compte à rebours interactif et bouton d'action direct `[ Payer maintenant - 5 000 FCFA ]`.
- **Paywall Rassurant** : Modal pleine page avec visuel rassurant, cadenas ouvert stylisé, texte garantissant la préservation intégrale des données dans `IndexedDB`.
