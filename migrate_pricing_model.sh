#!/bin/bash

# Script de migration pour appliquer le nouveau modèle de prix dans Supabase
# Ce script nécessite la CLI Supabase et une connexion configurée

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Migration du modèle de prix des produits${NC}"
echo "Ce script va ajouter les nouvelles colonnes pour le modèle de prix décomposé"
echo ""

# Vérification de la CLI Supabase
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Erreur: La CLI Supabase n'est pas installée${NC}"
    echo "Veuillez l'installer via: npm install -g supabase"
    exit 1
fi

echo -e "${YELLOW}Exécution du script SQL de migration...${NC}"

# Option 1: Exécution directe via la CLI Supabase (si configurée)
# supabase db execute --file update_product_table.sql

# Option 2: Exécution via le dashboard (méthode manuelle)
echo -e "${GREEN}Instructions pour exécuter le SQL manuellement via le Dashboard:${NC}"
echo "1. Connectez-vous à votre Dashboard Supabase"
echo "2. Allez dans la section SQL Editor"
echo "3. Créez une nouvelle requête"
echo "4. Copiez et collez le contenu du fichier 'update_product_table.sql'"
echo "5. Exécutez la requête"

echo -e "${YELLOW}Contenu du fichier SQL à exécuter:${NC}"
cat update_product_table.sql

echo ""
echo -e "${YELLOW}Après avoir appliqué les modifications SQL, veuillez mettre à jour votre code TypeScript:${NC}"
echo "1. Assurez-vous que l'interface Produit inclut les nouveaux champs"
echo "2. Vérifiez que les fonctions createProduit et updateProduit incluent les nouveaux champs"
echo "3. Assurez-vous que ProduitFormWithTeam gère correctement les nouveaux champs"

echo ""
echo -e "${GREEN}Migration terminée!${NC}" 