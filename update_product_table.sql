-- Script pour ajouter les nouveaux champs de prix aux produits
-- Ajout des colonnes pour le modèle de prix décomposé

-- Ajout de la colonne prixMatierePremiere (prix de la matière première)
ALTER TABLE produits 
ADD COLUMN IF NOT EXISTS prixMatierePremiere DECIMAL(12, 2);

-- Ajout de la colonne prixFaconnage (coût de main d'œuvre)
ALTER TABLE produits 
ADD COLUMN IF NOT EXISTS prixFaconnage DECIMAL(12, 2);

-- Ajout de la colonne marge (bénéfice)
ALTER TABLE produits 
ADD COLUMN IF NOT EXISTS marge DECIMAL(12, 2);

-- Mise à jour des produits existants pour calculer des valeurs par défaut
-- Pour les produits existants, nous allons:
-- - utiliser prixAchat comme valeur pour prixMatierePremiere
-- - initialiser prixFaconnage et marge avec des valeurs temporaires
-- Note: Ces valeurs seront ajustées manuellement par l'utilisateur pour chaque produit

UPDATE produits
SET 
  prixMatierePremiere = prixAchat,
  prixFaconnage = 0,  -- Valeur par défaut, sera ajustée individuellement par l'utilisateur
  marge = prixVente - prixAchat  -- Différence temporaire, sera ajustée individuellement par l'utilisateur
WHERE 
  prixMatierePremiere IS NULL OR
  prixFaconnage IS NULL OR
  marge IS NULL;

-- Création d'un déclencheur pour calculer automatiquement le prix de vente
-- basé sur la somme des trois composantes de prix

CREATE OR REPLACE FUNCTION calculate_prix_vente()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcul du prix de vente en additionnant les trois composantes
  NEW.prixVente = COALESCE(NEW.prixMatierePremiere, 0) + 
                  COALESCE(NEW.prixFaconnage, 0) + 
                  COALESCE(NEW.marge, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajout du déclencheur sur la table produits
DROP TRIGGER IF EXISTS calculate_prix_vente_trigger ON produits;

CREATE TRIGGER calculate_prix_vente_trigger
BEFORE INSERT OR UPDATE OF prixMatierePremiere, prixFaconnage, marge ON produits
FOR EACH ROW
WHEN (pg_trigger_depth() = 0)
EXECUTE FUNCTION calculate_prix_vente();

-- Commentaires sur les colonnes pour la documentation
COMMENT ON COLUMN produits.prixMatierePremiere IS 'Prix de la matière première qui varie avec les cours du marché';
COMMENT ON COLUMN produits.prixFaconnage IS 'Coût de façonnage saisi indépendamment pour chaque produit';
COMMENT ON COLUMN produits.marge IS 'Marge bénéficiaire définie indépendamment pour chaque produit'; 