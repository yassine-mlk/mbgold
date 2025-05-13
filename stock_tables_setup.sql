-- Activer l'extension uuid-ossp si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer la fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table produits
CREATE OR REPLACE FUNCTION create_produits_table()
RETURNS void AS $$
BEGIN
  -- Suppression de la table si elle existe déjà
  DROP TABLE IF EXISTS produits CASCADE;
  
  -- Création de la table produits
  CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    description TEXT,
    reference TEXT NOT NULL,
    codeBarres TEXT NOT NULL,
    prixAchat DECIMAL(12, 2) NOT NULL,
    prixVente DECIMAL(12, 2) NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 0,
    poids DECIMAL(10, 3) NOT NULL, -- Poids en grammes avec 3 décimales
    categorieId UUID NOT NULL REFERENCES categories(id),
    depotId UUID REFERENCES depots(id),
    image TEXT NOT NULL, -- URL de l'image stockée
    teamMemberId UUID REFERENCES auth.users(id),
    compose BOOLEAN DEFAULT FALSE,
    composants JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Ajout des politiques de sécurité RLS
  ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
  
  -- Création des politiques pour permettre toutes les opérations aux utilisateurs authentifiés
  CREATE POLICY "Utilisateurs authentifiés peuvent lire les produits" 
    ON produits FOR SELECT USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Utilisateurs authentifiés peuvent créer des produits" 
    ON produits FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
  CREATE POLICY "Utilisateurs authentifiés peuvent mettre à jour les produits" 
    ON produits FOR UPDATE USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Utilisateurs authentifiés peuvent supprimer des produits" 
    ON produits FOR DELETE USING (auth.role() = 'authenticated');

  -- Créer un déclencheur pour mettre à jour automatiquement le champ updated_at
  CREATE TRIGGER update_produits_modtime
  BEFORE UPDATE ON produits
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer la table promotions
CREATE OR REPLACE FUNCTION create_promotions_table()
RETURNS void AS $$
BEGIN
  -- Suppression de la table si elle existe déjà
  DROP TABLE IF EXISTS promotions CASCADE;
  
  -- Création de la table promotions
  CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produitId UUID REFERENCES produits(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('pourcentage', 'montant', 'bundle')),
    valeur DECIMAL(12, 2) NOT NULL,
    dateDebut DATE NOT NULL,
    dateFin DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Ajout des politiques de sécurité RLS
  ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
  
  -- Création des politiques pour permettre toutes les opérations aux utilisateurs authentifiés
  CREATE POLICY "Utilisateurs authentifiés peuvent lire les promotions" 
    ON promotions FOR SELECT USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Utilisateurs authentifiés peuvent créer des promotions" 
    ON promotions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
  CREATE POLICY "Utilisateurs authentifiés peuvent mettre à jour les promotions" 
    ON promotions FOR UPDATE USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Utilisateurs authentifiés peuvent supprimer des promotions" 
    ON promotions FOR DELETE USING (auth.role() = 'authenticated');

  -- Créer un déclencheur pour mettre à jour automatiquement le champ updated_at
  CREATE TRIGGER update_promotions_modtime
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter les fonctions pour créer les tables
SELECT create_produits_table();
SELECT create_promotions_table();

-- Insertion de données de test (facultatif)
INSERT INTO produits (id, nom, description, reference, codeBarres, prixAchat, prixVente, quantite, poids, categorieId, depotId, image)
VALUES 
  (uuid_generate_v4(), 'Bracelet en or', 'Bracelet en or 18 carats', 'BRA-2023-001', '6110000000017', 350, 599, 25, 25.5, (SELECT id FROM categories LIMIT 1), (SELECT id FROM depots LIMIT 1), 'https://exemple.com/images/bracelet.jpg'),
  (uuid_generate_v4(), 'Bague diamant', 'Bague en or avec diamant', 'BAG-2023-002', '6110000000024', 650, 1299, 12, 8.3, (SELECT id FROM categories LIMIT 1), (SELECT id FROM depots LIMIT 1), 'https://exemple.com/images/bague.jpg'),
  (uuid_generate_v4(), 'Collier argent', 'Collier en argent 925', 'COL-2023-003', '6110000000031', 45, 89.99, 30, 15.7, (SELECT id FROM categories LIMIT 1), (SELECT id FROM depots LIMIT 1 OFFSET 1), 'https://exemple.com/images/collier.jpg'); 