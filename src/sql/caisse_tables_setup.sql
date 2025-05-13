-- Table pour la caisse
CREATE TABLE IF NOT EXISTS caisse (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    solde_initial DECIMAL(10,2) NOT NULL DEFAULT 0,
    solde_actuel DECIMAL(10,2) NOT NULL DEFAULT 0,
    date_ouverture TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_fermeture TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(20) NOT NULL DEFAULT 'ouverte',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les transactions de caisse
CREATE TABLE IF NOT EXISTS transactions_caisse (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caisse_id UUID REFERENCES caisse(id),
    type_transaction VARCHAR(20) NOT NULL CHECK (type_transaction IN ('entree', 'sortie')),
    montant DECIMAL(10,2) NOT NULL,
    description TEXT,
    methode_paiement VARCHAR(50) NOT NULL,
    reference_vente UUID REFERENCES ventes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonction pour mettre à jour le solde de la caisse
CREATE OR REPLACE FUNCTION update_solde_caisse()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type_transaction = 'entree' THEN
        UPDATE caisse
        SET solde_actuel = solde_actuel + NEW.montant
        WHERE id = NEW.caisse_id;
    ELSE
        UPDATE caisse
        SET solde_actuel = solde_actuel - NEW.montant
        WHERE id = NEW.caisse_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le solde de la caisse
CREATE TRIGGER update_solde_after_transaction
    AFTER INSERT ON transactions_caisse
    FOR EACH ROW
    EXECUTE FUNCTION update_solde_caisse();

-- Ajout des politiques de sécurité RLS
ALTER TABLE caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_caisse ENABLE ROW LEVEL SECURITY;

-- Politiques pour la caisse
CREATE POLICY "Utilisateurs authentifiés peuvent lire la caisse" 
    ON caisse FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Utilisateurs authentifiés peuvent créer une caisse" 
    ON caisse FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Utilisateurs authentifiés peuvent mettre à jour la caisse" 
    ON caisse FOR UPDATE USING (auth.role() = 'authenticated');

-- Politiques pour les transactions
CREATE POLICY "Utilisateurs authentifiés peuvent lire les transactions" 
    ON transactions_caisse FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Utilisateurs authentifiés peuvent créer des transactions" 
    ON transactions_caisse FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 