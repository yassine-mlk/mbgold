-- Script pour ajouter le champ prix_faconnage_par_gramme à la table settings

-- Vérifier d'abord si la colonne existe déjà
DO $$
DECLARE
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'prix_faconnage_par_gramme'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        -- Ajout de la colonne prix_faconnage_par_gramme
        ALTER TABLE settings 
        ADD COLUMN prix_faconnage_par_gramme DECIMAL(10, 2) DEFAULT 0.00;
        
        RAISE NOTICE 'Colonne prix_faconnage_par_gramme ajoutée avec succès à la table settings';
    ELSE
        RAISE NOTICE 'La colonne prix_faconnage_par_gramme existe déjà dans la table settings';
    END IF;
END
$$; 