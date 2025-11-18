#!/usr/bin/env bash
set -euo pipefail

# --- activation du venv ---
if [ -f "$HOME/.venv-gemini/bin/activate" ]; then
  source "$HOME/.venv-gemini/bin/activate"
else
  echo "Erreur : le venv ~/.venv-gemini n'existe pas."
  exit 1
fi

# --- vérification clé API ---
if [ -z "${GOOGLE_API_KEY:-}" ]; then
  echo "Erreur : GOOGLE_API_KEY non défini."
  exit 1
fi

# --- récupérer diff staged ---
DIFF=$(git diff --cached)
if [ -z "$DIFF" ]; then
  echo "Aucun fichier staged."
  exit 0
fi

# --- construire prompt ---
PROMPT=$(cat <<EOF
Voici les changements git diff :
$DIFF

Génère un message de commit clair, concis, en français, au format Conventional Commits.
RENVOIE UNIQUEMENT LA LIGNE DU COMMIT, SANS TEXTE SUPPLÉMENTAIRE, SANS GUILLEMETS.
EOF
)

# --- écrire prompt dans un fichier temporaire (évite tout problème d'échappement) ---
TMP_PROMPT=$(mktemp)
trap 'rm -f "$TMP_PROMPT"' EXIT
printf '%s' "$PROMPT" > "$TMP_PROMPT"

# --- appeler Python qui lit le fichier temporaire ---
COMMIT_MESSAGE=$(python3 - "$TMP_PROMPT" <<'PY'
import os, sys, json
try:
    import google.generativeai as genai
except Exception as e:
    print(f"PY_ERR: impossible d'importer google.generativeai: {e}", file=sys.stderr)
    sys.exit(2)

api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("PY_ERR: GOOGLE_API_KEY absent", file=sys.stderr)
    sys.exit(2)

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("gemini-2.0-flash")
except Exception as e:
    print(f"PY_ERR: impossible d'initialiser le modèle: {e}", file=sys.stderr)
    sys.exit(2)

prompt_path = sys.argv[1]
with open(prompt_path, "r", encoding="utf-8") as f:
    prompt = f.read()

if not prompt.strip():
    # aucun contenu → rien à faire
    sys.exit(0)

try:
    response = model.generate_content(prompt)
    text = getattr(response, "text", None)
    if text is None:
        # certaines versions renvoient dict-like
        text = getattr(response, "output", "") or ""
    print(text.strip())
except Exception as e:
    print(f"PY_ERR: appel API échoué: {e}", file=sys.stderr)
    sys.exit(3)
PY
)

# --- vérifier et proposer le commit ---
if [ -z "$COMMIT_MESSAGE" ]; then
  echo "Erreur : réponse vide (voir erreurs Python ci-dessous si présentes)."
  exit 1
fi

echo "Message généré :"
echo "$COMMIT_MESSAGE"
read -p "Confirmer le commit ? [y/N] " yn
case $yn in
  [Yy]* ) git commit -m "$COMMIT_MESSAGE" ;;
  * ) echo "Annulé." ;;
esac
