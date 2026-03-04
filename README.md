# Lab Scheduler - Système de Planification Laboratoire

## Description

Ce projet implémente un algorithme de planification pour un laboratoire d’analyses médicales.

L’objectif est d’assigner des échantillons à des techniciens et des équipements en respectant :

- Les priorités : STAT > URGENT > ROUTINE

- Les spécialisations des techniciens

- La compatibilité des équipements

- Les horaires de travail

- Les pauses déjeuner

- Les fenêtres de maintenance

- Les temps de nettoyage

- Les coefficients d’efficacité des techniciens

- L’optimisation du parallélisme

La fonction principale exposée est :

```TypeScript
planifyLab(inputData: LabData) → PlanifyResult
```

Elle retourne :

- `schedule` : liste des analyses planifiées

- `metrics` : métriques opérationnelles du laboratoire

- `metadata` : pauses déjeuner et contraintes appliquées

## Installation

### Prérequis

- Node.js ≥ 18

- Yarn

### Installation des dépendances

```bash
yarn install
```

## Utilisation

### Lancer le planificateur

```bash
yarn dev
```

### Générer output-example.json

```bash
yarn generate
```

### Lancer les tests

```bash
yarn test
```

### Lancer les tests avec couverture

```bash
yarn test:coverage
```

## Architecture

```
src/
├── models/
│   └── types.ts              # Interfaces et types TypeScript
├── scheduler/
│   ├── planifyLab.ts         # Algorithme de planification
│   └── validator.ts          # Validation des données d'entrée
├── tests/
│   ├── fixtures/
│   │   ├── labData.ts        # Données complètes (20 échantillons)
│   │   └── testFixtures.ts   # Fixtures ciblées pour tests unitaires
│   ├── planifyLab.test.ts    # Tests du planificateur
│   └── time.test.ts          # Tests des utilitaires temporels
├── utils/
│   ├── time.ts               # Helpers de conversion temporelle
│   └── math.ts               # Helper de calcul de moyenne
├── generateOutput.ts         # Générateur de sortie JSON
└── index.ts                  # Point d'entrée avec affichage lisible
```

### Algorithme

Planificateur glouton en 4 étapes avec parallélisme opportuniste :

1. **Tri** des échantillons par priorité (STAT > URGENT > ROUTINE), puis heure d'arrivée
2. **Allocation** de chaque échantillon au premier technicien + équipement compatible disponible
3. **Application des contraintes** : pauses déjeuner, fenêtres de maintenance, délais de nettoyage, coefficients d'efficacité
4. **Calcul des métriques** : efficacité, utilisation, temps d'attente, analyses parallèles, taux de respect des priorités

### Métriques

| Métrique                | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `totalTime`             | Durée totale du planning (premier début → dernier fin)                   |
| `efficiency`            | Temps moyen de travail technicien / fenêtre de planning                  |
| `technicianUtilization` | Temps total travaillé / capacité totale des shifts                       |
| `conflicts`             | Échantillons non planifiés                                               |
| `averageWaitTime`       | Attente moyenne par groupe de priorité (arrivée → début)                 |
| `priorityRespectRate`   | % d'échantillons non violés par une planification de priorité inférieure |
| `parallelAnalyses`      | Pic d'analyses simultanées (algorithme sweep-line)                       |
| `lunchInterruptions`    | Nombre de pauses déjeuner interrompues pour une analyse                  |

## Évolution depuis version SIMPLE

| Fonctionnalité                   | SIMPLE        | INTERMÉDIAIRE |
| -------------------------------- | ------------- | ------------- |
| Échantillons                     | 10            | 20            |
| Techniciens                      | 4             | 8             |
| Équipements                      | 3             | 5             |
| Coefficient `efficiency`         | ❌            | ✅            |
| Respect pauses déjeuner          | ❌            | ✅            |
| Fenêtres de maintenance          | ❌            | ✅            |
| Délais de nettoyage              | ❌            | ✅            |
| Métrique `averageWaitTime`       | ❌            | ✅            |
| Métrique `technicianUtilization` | ❌            | ✅            |
| Métrique `priorityRespectRate`   | ❌            | ✅            |
| Métrique `parallelAnalyses`      | ❌            | ✅            |
| Spécialité technicien            | Valeur unique | Tableau       |
| `compatibleTypes` équipement     | ❌            | ✅            |
| Validation des entrées           | ❌            | ✅            |

## Tests

23 tests répartis sur 2 suites — 91.4% de couverture des instructions.

### Scénarios couverts :

- Planification d'un seul échantillon
- Priorité STAT avant ROUTINE (même heure d'arrivée)
- Exécution parallèle avec 2 techniciens
- Coefficient d'efficacité appliqué et arrondi
- Respect des pauses déjeuner (pas de démarrage pendant la pause)
- Pause déjeuner — pas d'ajustement après la fin de la pause
- Délai de nettoyage entre analyses sur le même équipement
- Fenêtre de maintenance — replanification après la fenêtre
- Technicien incompatible → conflit comptabilisé
- Limite de shift → échantillon non planifié
- Détection de violation du taux de respect des priorités
- Métadonnées retournées avec pauses déjeuner et contraintes appliquées

---
