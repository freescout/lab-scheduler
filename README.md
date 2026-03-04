# Lab Scheduler – Version SIMPLE

## Versions

- SIMPLE version → branch `master`
- INTERMÉDIAIRE version → branch `feat/intermediate`

## 📌 Description

Ce projet implémente la version SIMPLE de l’algorithme de planification d’un laboratoire d’analyses.

L’objectif est de planifier des échantillons en respectant :

- L’ordre de priorité : STAT > URGENT > ROUTINE
- La compatibilité technicien / type d’échantillon
- La compatibilité équipement / type d’échantillon
- Les horaires de travail des techniciens
- L’absence de conflits (pas de double réservation)

---

## ⚙️ Stratégie d’implémentation

1. Les échantillons sont triés par priorité puis par heure d’arrivée.
2. Pour chaque échantillon, toutes les combinaisons compatibles technicien / équipement sont évaluées.
3. Le créneau valide le plus tôt possible est sélectionné.
4. La disponibilité des ressources est suivie via des `Map`.
5. Les métriques sont calculées à partir du planning final.

L’algorithme est déterministe et respecte strictement les contraintes de la version SIMPLE.

---

## 📊 Métriques

- **totalTime** : durée entre le premier début et la dernière fin.
- **efficiency** : (temps total d’analyse / totalTime) × 100.
- **conflicts** : nombre d’échantillons non planifiés.

Note : L’efficacité peut dépasser 100% si plusieurs techniciens travaillent en parallèle.

---

## ▶️ Exécution

```bash
# Installer les dépendances
yarn install

# Lancer les exemples
yarn dev

# Lancer les tests
yarn test

# Couverture de code
yarn test:coverage
```
