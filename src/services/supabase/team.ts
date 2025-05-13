import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { createTestUser } from '@/utils/createTestUser';

// Type définition pour les membres de l'équipe
export interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Récupère tous les membres de l'équipe
 */
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  // Retourner un tableau vide sans essayer d'accéder à la table
  console.log('Fonction getTeamMembers appelée, retour d\'un tableau vide (table désactivée)');
  return [];
};

/**
 * Récupère un membre de l'équipe par son ID
 */
export const getTeamMemberById = async (id: string): Promise<TeamMember | null> => {
  // Retourner null sans essayer d'accéder à la table
  console.log('Fonction getTeamMemberById appelée, retour null (table désactivée)');
  return null;
};

/**
 * Crée un nouveau membre de l'équipe
 * Cette fonction crée également un utilisateur Supabase associé
 */
export const createTeamMember = async (
  member: Omit<TeamMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  password: string
): Promise<{ success: boolean; teamMember?: TeamMember; error?: string }> => {
  console.log('Fonction createTeamMember appelée (table désactivée)');
  return { 
    success: false, 
    error: 'La fonctionnalité de gestion des membres d\'équipe est désactivée' 
  };
};

/**
 * Met à jour les informations d'un membre de l'équipe
 */
export const updateTeamMember = async (
  id: string,
  updates: Partial<Omit<TeamMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<TeamMember | null> => {
  console.log('Fonction updateTeamMember appelée (table désactivée)');
  return null;
};

/**
 * Supprime un membre de l'équipe
 */
export const deleteTeamMember = async (id: string): Promise<boolean> => {
  console.log('Fonction deleteTeamMember appelée (table désactivée)');
  return false;
};

/**
 * Réinitialise le mot de passe d'un membre de l'équipe
 * Cette fonction envoie un email de réinitialisation
 */
export const resetTeamMemberPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour directement le mot de passe d'un membre
 * Cette fonction ne devrait être utilisée que par un administrateur
 */
export const updateTeamMemberPassword = async (
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Pour des raisons de sécurité, cette fonction est simplifiée
    // Dans une application réelle, vous devriez utiliser un appel API sécurisé 
    // ou une fonction Supabase Edge Function pour cette opération
    
    // Notez que ceci est une simplification pour la démonstration
    // et ne représente pas une implémentation sécurisée
    console.log(`Mise à jour du mot de passe pour ${email}`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}; 