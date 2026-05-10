# TaskFlow — Runbook d'incident

## 1. L'API ne répond plus
**Diagnostic :** Vérifie https://taskflow-api01.onrender.com/healthz
**Solution :** Redémarre le service sur Render dashboard

## 2. Page blanche sur le frontend
**Diagnostic :** Ouvre la console navigateur (F12)
**Solution :** Vérifier CORS_ORIGIN sur Render, redéployer

## 3. Erreurs 500 sporadiques
**Diagnostic :** Cherche le X-Correlation-Id dans les logs Render
**Solution :** Render → taskflow-api01 → Logs

## 4. Base de données lente
**Diagnostic :** Vérifie les index avec EXPLAIN ANALYZE
**Solution :** Ajouter un index sur la colonne lente

## 5. Utilisateur ne peut pas se connecter
**Diagnostic :** Vérifie CORS_ORIGIN et cookie SameSite=none
**Solution :** Render → taskflow-api01 → Environment → vérifier CORS_ORIGIN

## URLs utiles
- Frontend : https://taskflow-web-784f.onrender.com
- Backend : https://taskflow-api01.onrender.com
- Render status : https://status.render.com
