import { useState } from "react";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

/**
 * Hook para escanear QR codes usando @capacitor-mlkit/barcode-scanning.
 * Retorna função scan() que resolve o texto lido ou null em caso de cancelamento/erro.
 */
export const useBarcodeScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = async (): Promise<string | null> => {
    setScanning(true);
    setError(null);

    try {
      // O plugin costuma retornar um objeto com informações.
      // Logamos o retorno completo para facilitar debugging.
      // Em navegadores sem plugin instalado, isso pode lançar.
      const result: any = await BarcodeScanner.scan();
      console.log("[BarcodeScanner] raw result:", result);

      // Tentar extrair texto do resultado de formas comuns
      let text: string | null = null;
      if (!result) {
        text = null;
      } else if (typeof result === "string") {
        text = result;
      } else if (result.value) {
        text = result.value;
      } else if (result.rawValue) {
        text = result.rawValue;
      } else if (result.displayValue) {
        text = result.displayValue;
      } else if (Array.isArray(result)) {
        // alguns plugins retornam array de códigos
        text = result[0]?.value || result[0]?.rawValue || result[0]?.displayValue || null;
      } else if (result.barcodes && Array.isArray(result.barcodes) && result.barcodes.length > 0) {
        // Formato observado: { barcodes: [ { rawValue, displayValue, ... } ] }
        const b = result.barcodes[0];
        text = b?.rawValue || b?.displayValue || null;
      } else {
        // stringify como fallback
        text = JSON.stringify(result);
      }

      setScanning(false);
      return text;
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("[BarcodeScanner Error]", msg, err);
      setError(msg);
      setScanning(false);
      return null;
    }
  };

  return { scanning, error, scan };
};
