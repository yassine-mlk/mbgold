-- Activer l'extension uuid-ossp si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vérifier si la fonction update_modified_column existe déjà, sinon la créer
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END
$$;

-- Fonction pour créer la table team_members
CREATE OR REPLACE FUNCTION create_team_members_table()
RETURNS void AS $$
BEGIN
  -- Suppression de la table si elle existe déjà
  DROP TABLE IF EXISTS team_members CASCADE;
  
  -- Création de la table team_members
  CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT NOT NULL,
    telephone TEXT,
    role TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    adresse TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Ajout des politiques de sécurité RLS
  ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
  
  -- Création des politiques pour permettre toutes les opérations aux utilisateurs authentifiés
  CREATE POLICY "Utilisateurs authentifiés peuvent lire les membres d'équipe" 
    ON team_members FOR SELECT USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Utilisateurs authentifiés peuvent créer des membres d'équipe" 
    ON team_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
  CREATE POLICY "Utilisateurs authentifiés peuvent mettre à jour les membres d'équipe" 
    ON team_members FOR UPDATE USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Utilisateurs authentifiés peuvent supprimer des membres d'équipe" 
    ON team_members FOR DELETE USING (auth.role() = 'authenticated');

  -- Créer un déclencheur pour mettre à jour automatiquement le champ updated_at
  CREATE TRIGGER update_team_members_modtime
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter la fonction pour créer la table
SELECT create_team_members_table();

-- Insertion de données de test (facultatif)
INSERT INTO team_members (id, nom, prenom, email, telephone, role)
VALUES 
  (uuid_generate_v4(), 'Alaoui', 'Karim', 'karim.alaoui@example.com', '0612345678', 'Vendeur'),
  (uuid_generate_v4(), 'Benani', 'Salma', 'salma.benani@example.com', '0623456789', 'Responsable'),
  (uuid_generate_v4(), 'Tahiri', 'Hamid', 'hamid.tahiri@example.com', '0634567890', 'Technicien'); 