import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  id: string;
  type_transaction: 'entree' | 'sortie';
  montant: number;
  description: string;
  methode_paiement: string;
  created_at: string;
  reference_vente?: string;
}

interface Caisse {
  id: string;
  solde_initial: number;
  solde_actuel: number;
  date_ouverture: string;
  date_fermeture?: string;
  statut: 'ouverte' | 'fermee';
}

export default function CaissePage() {
  const [caisse, setCaisse] = useState<Caisse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'entree',
    montant: '',
    description: '',
    methode_paiement: 'especes'
  });

  useEffect(() => {
    fetchCaisse();
    fetchTransactions();
  }, []);

  const fetchCaisse = async () => {
    try {
      const { data, error } = await supabase
        .from('caisse')
        .select('*')
        .eq('statut', 'ouverte')
        .single();

      if (error) throw error;
      setCaisse(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la caisse:', error);
      toast.error('Erreur lors du chargement de la caisse');
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions_caisse')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      toast.error('Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCaisse = async () => {
    try {
      const { data, error } = await supabase
        .from('caisse')
        .insert({
          solde_initial: 0,
          solde_actuel: 0,
          statut: 'ouverte'
        })
        .select()
        .single();

      if (error) throw error;
      setCaisse(data);
      toast.success('Caisse ouverte avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la caisse:', error);
      toast.error('Erreur lors de l\'ouverture de la caisse');
    }
  };

  const handleCloseCaisse = async () => {
    if (!caisse) return;

    try {
      const { error } = await supabase
        .from('caisse')
        .update({
          date_fermeture: new Date().toISOString(),
          statut: 'fermee'
        })
        .eq('id', caisse.id);

      if (error) throw error;
      setCaisse(null);
      toast.success('Caisse fermée avec succès');
    } catch (error) {
      console.error('Erreur lors de la fermeture de la caisse:', error);
      toast.error('Erreur lors de la fermeture de la caisse');
    }
  };

  const handleAddTransaction = async () => {
    if (!caisse) return;

    try {
      const { error } = await supabase
        .from('transactions_caisse')
        .insert({
          caisse_id: caisse.id,
          type_transaction: newTransaction.type,
          montant: parseFloat(newTransaction.montant),
          description: newTransaction.description,
          methode_paiement: newTransaction.methode_paiement
        });

      if (error) throw error;

      toast.success('Transaction enregistrée avec succès');
      setIsOpenDialog(false);
      setNewTransaction({
        type: 'entree',
        montant: '',
        description: '',
        methode_paiement: 'especes'
      });
      fetchCaisse();
      fetchTransactions();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la transaction:', error);
      toast.error('Erreur lors de l\'enregistrement de la transaction');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>État de la Caisse</CardTitle>
          </CardHeader>
          <CardContent>
            {caisse ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Solde Initial</Label>
                    <div className="text-2xl font-bold">{formatCurrency(caisse.solde_initial)}</div>
                  </div>
                  <div>
                    <Label>Solde Actuel</Label>
                    <div className="text-2xl font-bold">{formatCurrency(caisse.solde_actuel)}</div>
                  </div>
                </div>
                <div>
                  <Label>Date d'ouverture</Label>
                  <div>{format(new Date(caisse.date_ouverture), 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
                </div>
                <Button onClick={handleCloseCaisse} variant="destructive">
                  Fermer la caisse
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p>Aucune caisse ouverte</p>
                <Button onClick={handleOpenCaisse}>
                  Ouvrir la caisse
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nouvelle Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
              <DialogTrigger asChild>
                <Button disabled={!caisse}>
                  Ajouter une transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Type de transaction</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value) => setNewTransaction(prev => ({ ...prev, type: value as 'entree' | 'sortie' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entree">Entrée</SelectItem>
                        <SelectItem value="sortie">Sortie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Montant</Label>
                    <Input
                      type="number"
                      value={newTransaction.montant}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, montant: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description de la transaction"
                    />
                  </div>
                  <div>
                    <Label>Méthode de paiement</Label>
                    <Select
                      value={newTransaction.methode_paiement}
                      onValueChange={(value) => setNewTransaction(prev => ({ ...prev, methode_paiement: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="especes">Espèces</SelectItem>
                        <SelectItem value="carte">Carte</SelectItem>
                        <SelectItem value="virement">Virement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddTransaction}>
                    Enregistrer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Historique des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Méthode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <span className={transaction.type_transaction === 'entree' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type_transaction === 'entree' ? 'Entrée' : 'Sortie'}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(transaction.montant)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.methode_paiement}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 