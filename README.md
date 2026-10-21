# Mes Recettes

Application Android de recettes (React Native CLI, sans Expo), 100 % hors ligne : les données sont stockées dans une base SQLite sur le téléphone (op-sqlite).

## Fonctionnalités

- Recettes : titre, photo (appareil photo ou galerie), catégorie (entrée / plat / dessert / en-cas), cuissons multiples, ingrédients + quantités, temps de préparation, étapes, favori.
- Liste des cuissons modifiable (ajout, renommage, suppression).
- **Filtres** : recherche texte (titre + ingrédients, sans tenir compte des accents), catégories, cuissons, ingrédients (tous requis), temps de préparation max, favoris, tri.

## Prérequis

- Node 22.11 ou plus récent
- JDK 17 (`JAVA_HOME`)
- Android Studio + SDK Android (`ANDROID_HOME`), et un émulateur ou un téléphone en mode développeur

## Lancer l'application

```sh
npm install
npm start          # terminal 1 : le serveur Metro
npm run android    # terminal 2 : compile et installe l'appli
```

## Vérifications

```sh
npm test           # tests (les requêtes SQL et les filtres tournent sur le SQLite intégré à Node)
npx tsc --noEmit   # vérification des types
npm run lint
```

## Organisation du code

```
src/
  db/          base SQLite : schéma + migrations (database.ts), requêtes
  screens/     écrans (liste, détail, formulaire, filtres, cuissons)
  components/  composants réutilisables
  context/     filtres partagés entre les écrans
  utils/       photos, texte (recherche sans accents, durées)
```

Pour faire évoluer la base, ajouter une nouvelle entrée à la fin de `MIGRATIONS` dans `src/db/database.ts` (ne jamais modifier une migration existante).
