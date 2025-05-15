import React, { useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface BarcodeDisplayProps {
  barcode: string;
  productName: string;
  price?: number;
  weight?: number;
  category?: string;
}

/**
 * Composant pour afficher un code-barres EAN-13 imprimable
 * Dans un environnement de production, il faudrait utiliser une vraie librairie de rendu de codes-barres
 */
const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({ barcode, productName, price, weight, category }) => {
  const barcodeRef = useRef<HTMLDivElement>(null);

  // Fonction pour simuler l'impression du code-barres
  const printBarcode = () => {
    if (!barcodeRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour imprimer le code-barres.');
      return;
    }

    // Create content for the print window
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimer Code-Barres</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
              text-align: center;
            }
            .barcode-container {
              display: inline-block;
              padding: 5px;
              border: 1px solid #ccc;
              border-radius: 5px;
              margin: 10px;
            }
            .barcode {
              font-family: 'Libre Barcode EAN13 Text', cursive;
              font-size: 60px;
              line-height: 1.2;
              margin-bottom: 2px;
            }
            .category-info {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .weight-info {
              font-size: 14px;
              margin-bottom: 5px;
              font-weight: bold;
            }
            .barcode-number {
              font-family: monospace;
              font-size: 12px;
              margin-top: 2px;
            }
            @media print {
              .barcode-container {
                border: none;
                margin: 0;
                padding: 0;
              }
              @page {
                size: 50mm 30mm;
                margin: 5mm;
              }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+EAN13+Text&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="barcode-container">
            ${category ? `<div class="category-info">${category}</div>` : ''}
            ${weight ? `<div class="weight-info">${weight} g</div>` : ''}
            <div class="barcode">${barcode}</div>
            <div class="barcode-number">${barcode}</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                // window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Fonction pour télécharger le code-barres (dans un environnement réel, on génèrerait une image)
  const downloadBarcode = () => {
    alert('Fonctionnalité de téléchargement non implémentée. Dans un environnement réel, cela génèrerait une image du code-barres.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Code-Barres Produit</CardTitle>
        <CardDescription>
          {category && `Catégorie: ${category}`}
          {weight && `${category ? ' - ' : ''}Poids: ${weight} g`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={barcodeRef} className="flex flex-col items-center">
          {/* 
            Ceci est juste une représentation visuelle.
            Dans un environnement réel, vous utiliseriez une bibliothèque 
            comme react-barcode ou JsBarcode pour générer le vrai code-barres.
          */}
          <div className="border border-dashed border-gray-300 rounded-md p-4 w-full text-center">
            {category && <div className="text-xs text-gray-400 italic mb-1">{category}</div>}
            {weight && <div className="text-xs font-medium mb-1">Poids: {weight} g</div>}
            <div className="font-mono text-lg font-bold tracking-wider mb-1">
              {barcode.split('').join(' ')}
            </div>
            <div className="border-t border-b border-black py-3 my-2 flex justify-center">
              {/* Pseudo représentation graphique d'un code-barres */}
              {barcode.split('').map((digit, i) => (
                <div 
                  key={i} 
                  className="inline-block w-1 mx-px" 
                  style={{ 
                    height: `${20 + parseInt(digit) * 2}px`,
                    backgroundColor: 'black'
                  }}
                />
              ))}
            </div>
            <div className="text-xs font-mono">{barcode}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={printBarcode}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </Button>
        <Button variant="outline" onClick={downloadBarcode}>
          <Download className="mr-2 h-4 w-4" />
          Télécharger
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BarcodeDisplay; 