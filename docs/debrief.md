# Auto-debrief Checkpoint 1

## 1. Qu'est-ce qui a cassé en premier, et comment l'ai-je trouvé ?
Les fichiers VS Code ne se sauvegardaient pas correctement dans le repo Git.
J'ai découvert le problème quand git status retournait "nothing to commit"
malgré les modifications visibles dans l'éditeur. Solution : utiliser
cat > fichier << 'EOF' directement dans le terminal.

## 2. Quelle règle du CLAUDE.md Claude a-t-il violée aujourd'hui, et comment l'ai-je attrapée ?
Le service.js généré utilisait le package uuid (ES modules) incompatible avec Jest.
Remplacé par crypto.randomUUID() natif de Node.js. Détecté lors du premier
lancement des tests qui retournait SyntaxError: Unexpected token 'export'.

## 3. Qu'est-ce que je couperais de mon PRD si je devais refaire cet atelier en 3 heures ?
Je garderais uniquement POST /api/tasks et GET /api/tasks/:id avec TDD strict,
et un seul composant frontend (TaskList). PATCH, DELETE, TaskCreate et l'audit UI
seraient reportés au parcours senior.
