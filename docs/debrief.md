# Auto-debrief Checkpoint 2

## 1. Quel concept des Modules 6-10 ai-je le moins compris ?
Le pipeline d'agregation MongoDB et les configurations CORS en production 
ont ete les plus difficiles a apprehender. Je dois relire la documentation 
sur SameSite cookies et les headers HTTP de securite.

## 2. Quelle erreur aurait pu etre catastrophique ?
Le secret JWT_SECRET aurait pu etre commite dans le repo Git. 
C'est la regle absolue : jamais de secrets dans le code.
Le endpoint /api/test/reset-db aurait pu etre expose en production 
sans la protection NODE_ENV === 'test_e2e'.

## 3. Si je refaisais ce Checkpoint 2 en 3 heures, je couperais quoi ?
Je couperais le cache Redis et les tests E2E complexes pour me concentrer 
sur le deploiement et la securite de base.

## 4. Quel module sera utile dans tous mes projets futurs ?
- Transferable : JWT auth, Docker multi-stage, CI/CD GitHub Actions, 
  logging structure JSON
- Specifique a TaskFlow : le modele multi-tenant, les invariants 
  d'isolation par organisation
