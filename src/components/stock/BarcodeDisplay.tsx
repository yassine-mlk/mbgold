import React, { useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Barcode from 'react-barcode';

interface BarcodeDisplayProps {
  barcode: string;
  productName: string;
  price?: number;
  weight?: number;
  category?: string;
}

/**
 * Composant pour afficher un code-barres Code 128 imprimable
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
            svg {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${category ? `<div class="category-info">${category}</div>` : ''}
            ${weight ? `<div class="weight-info">${weight} g</div>` : ''}
            <div id="barcode-container"></div>
          </div>
          <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function() {
              // Créer l'élément SVG
              var svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              document.getElementById('barcode-container').appendChild(svgElement);
              
              // Générer le code-barres
              JsBarcode(svgElement, "${barcode}", {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 12,
                margin: 5
              });
              
              // Imprimer après chargement
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
          <div className="border border-dashed border-gray-300 rounded-md p-4 w-full text-center">
            {category && <div className="text-xs text-gray-400 italic mb-1">{category}</div>}
            {weight && <div className="text-xs font-medium mb-1">Poids: {weight} g</div>}
            <Barcode 
              value={barcode} 
              format="CODE128"
              width={2}
              height={50}
              fontSize={12}
              margin={5}
              displayValue={true}
            />
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