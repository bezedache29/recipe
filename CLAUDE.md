# Mes Recettes — règles du projet

Application Android de recettes, React Native CLI (sans Expo), 100 % hors ligne.
Les données vivent dans une base SQLite sur le téléphone (op-sqlite).

## Façon de travailler

- **Une étape à la fois.** Découper chaque demande en petites étapes, présenter le plan
  avant de coder, et attendre le feu vert de Christophe pour tout changement important
  (nouvel écran, refonte, changement de schéma de base).
- **Pas de nouvelle dépendance npm sans accord.** Expliquer à quoi elle sert et pourquoi
  le code existant ne suffit pas.
- **Expliquer simplement** ce qui a été fait et pourquoi, sans jargon.
- **Vérifier avant de dire « c'est fini »** : `npx tsc --noEmit`, `npm test` et `npm run lint`
  doivent passer. Si un test échoue, le dire avec le message d'erreur.
- **Ne pas committer** sans qu'on le demande.

## Commandes

```sh
npm start          # serveur Metro
npm run android    # compile et installe sur l'émulateur / le téléphone
npm test           # tests Jest (le SQL tourne sur le SQLite intégré à Node)
npx tsc --noEmit   # vérification des types
npm run lint       # ESLint + Prettier
```

## Organisation du code

```
App.tsx          ouvre la base, puis monte la navigation
src/
  db/            schéma + migrations (database.ts), requêtes par table
  screens/       un fichier par écran
  components/    composants métier réutilisables (RecipeCard…)
  components/ui/ composants d'interface génériques façon shadcn (Button, Card, Input…)
  theme.ts       couleurs, rayons, espacements, typo : la seule source des valeurs visuelles
  context/       état partagé entre écrans (filtres)
  navigation/    pile de navigation + types des paramètres de route
  utils/         helpers sans UI (photos, texte)
  types.ts       types métier partagés
```

## Conventions de code

- TypeScript strict, composants en fonctions, un composant exporté par défaut par fichier.
- Prettier : guillemets simples, virgules finales, pas de parenthèses autour d'un seul
  argument de flèche.
- Styles avec `StyleSheet.create` en bas du fichier.
- Code, noms et commentaires en anglais ; **tout texte visible par l'utilisateur en français**.
- Commentaires seulement pour expliquer un « pourquoi » non évident.

## Interface (UI)

- **Dark mode uniquement.** Pas de thème clair, pas de détection du thème du téléphone.
- **Style shadcn/ui** reproduit à la main (pas de NativeWind ni de librairie UI) :
  palette zinc sombre, bordures fines, coins arrondis modérés, peu d'ombres, une seule
  couleur d'accent.
- **Aucune couleur ni taille codée en dur dans les écrans** : tout vient de `src/theme.ts`.
- Avant de créer un bouton, un champ ou une carte dans un écran, utiliser (ou compléter)
  le composant de `src/components/ui/`.
- Textes de l'interface : verbes d'action clairs (« Enregistrer », « Supprimer la recette »),
  phrases courtes, messages d'erreur qui disent quoi faire.

## Base de données

- Pour faire évoluer le schéma : **ajouter** une entrée à la fin de `MIGRATIONS` dans
  `src/db/database.ts`. Ne jamais modifier une migration existante.
- Toutes les requêtes SQL passent par `src/db/`, jamais directement depuis un écran.
- Toute nouvelle requête ou nouveau filtre a son test dans `__tests__/`.

## Suppression de fichiers

Jamais de suppression définitive : passer par la Corbeille Windows (voir les règles
globales de Christophe). Demander avant de supprimer `node_modules`, `android/build`, etc.
