-- Activer l'extension pour le stockage
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Script pour configurer les buckets de stockage dans Supabase

-- Fonction pour créer des buckets et des politiques de manière sécurisée (ignore les erreurs)
DO $$ 
BEGIN
    -- Créer le bucket "produits" s'il n'existe pas déjà
    BEGIN
        PERFORM storage.create_bucket(
            'produits',
            'Bucket pour stocker les images des produits',
            public := true
        );
    EXCEPTION WHEN OTHERS THEN
        -- Ignorer l'erreur si le bucket existe déjà
        RAISE NOTICE 'Le bucket produits existe peut-être déjà: %', SQLERRM;
    END;

    -- Créer le bucket "logos" s'il n'existe pas déjà
    BEGIN
        PERFORM storage.create_bucket(
            'logos',
            'Bucket pour stocker les logos',
            public := true
        );
    EXCEPTION WHEN OTHERS THEN
        -- Ignorer l'erreur si le bucket existe déjà
        RAISE NOTICE 'Le bucket logos existe peut-être déjà: %', SQLERRM;
    END;

    -- Créer les politiques pour le bucket "produits"
    -- Politique pour permettre la lecture publique des images produits
    BEGIN
        PERFORM storage.create_policy(
            'produits',
            'Lecture publique des images produits',
            'SELECT',
            'public',
            true
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création de la politique de lecture produits: %', SQLERRM;
    END;

    -- Politique pour permettre l'upload des images produits par les utilisateurs authentifiés
    BEGIN
        PERFORM storage.create_policy(
            'produits',
            'Upload des images produits',
            'INSERT',
            'authenticated',
            true
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création de la politique d''upload produits: %', SQLERRM;
    END;

    -- Politique pour permettre la mise à jour des images produits
    BEGIN
        PERFORM storage.create_policy(
            'produits',
            'Mise à jour des images produits',
            'UPDATE',
            'authenticated',
            true
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création de la politique de mise à jour produits: %', SQLERRM;
    END;

    -- Politique pour permettre la suppression des images produits
    BEGIN
        PERFORM storage.create_policy(
            'produits',
            'Suppression des images produits',
            'DELETE',
            'authenticated',
            true
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création de la politique de suppression produits: %', SQLERRM;
    END;

    -- Créer les politiques pour le bucket "logos"
    -- Politique pour permettre la lecture publique des logos
    BEGIN
        PERFORM storage.create_policy(
            'logos',
            'Lecture publique des logos',
            'SELECT',
            'public',
            true
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création de la politique de lecture logos: %', SQLERRM;
    END;

    -- Politique pour permettre l'upload des logos par les utilisateurs authentifiés
    BEGIN
        PERFORM storage.create_policy(
            'logos',
            'Upload des logos',
            'INSERT',
            'authenticated',
            true
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création de la politique d''upload logos: %', SQLERRM;
    END;

    -- Politique pour permettre la mise à jour des logos
    BEGIN
        PERFORM storage.create_policy(
            'logos',
            'Mise à jour des logos',
            'UPDATE',
            'authenticated',
            true
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création de la politique de mise à jour logos: %', SQLERRM;
    END;

    -- Politique pour permettre la suppression des logos
    BEGIN
        PERFORM storage.create_policy(
            'logos',
            'Suppression des logos',
            'DELETE',
            'authenticated',
            true
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création de la politique de suppression logos: %', SQLERRM;
    END;
END
$$; 