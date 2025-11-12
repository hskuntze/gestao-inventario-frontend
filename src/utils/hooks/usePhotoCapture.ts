import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { useState } from "react";

export interface PhotoCaptureResult {
  photoBase64: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: string;
}

/**
 * Hook customizado para capturar foto via câmera Capacitor
 * e obter localização (geolocation) após confirmação.
 *
 * Usa Camera para tirar foto (com preview base64).
 * Usa Geolocation para obter coordenadas GPS.
 */
export const usePhotoCapture = () => {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Abre câmera para tirar foto
   * Retorna base64 da foto (para preview)
   */
  const capturePhoto = async (): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64, // Retorna base64 direto
        source: CameraSource.Camera, // Força uso de câmera (não galeria)
        promptLabelPicture: "Tirar Foto",
        promptLabelCancel: "Cancelar",
      });

      const base64 = image.base64String || "";
      setPhotoBase64(base64);

      console.log("[Photo Capture] Foto capturada com sucesso");
      console.log(`[Photo Capture] Tamanho: ${base64.length} bytes`);

      setLoading(false);
      return base64;
    } catch (err: any) {
      const errorMsg = err?.message || "Erro ao capturar foto";
      console.error("[Photo Capture Error]", errorMsg);
      setError(errorMsg);
      setLoading(false);
      return null;
    }
  };

  /**
   * Obtém localização do dispositivo via GPS
   */
  const captureLocation = async (): Promise<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  }> => {
    try {
      setLoading(true);
      setError(null);

      const coordinates = await Geolocation.getCurrentPosition();

      const { latitude, longitude, accuracy } = coordinates.coords;

      console.log("[Geolocation] Localização obtida:");
      console.log(`[Geolocation] Latitude: ${latitude}`);
      console.log(`[Geolocation] Longitude: ${longitude}`);
      console.log(`[Geolocation] Acurácia: ${accuracy}m`);

      setLoading(false);

      return { latitude, longitude, accuracy };
    } catch (err: any) {
      const errorMsg = err?.message || "Erro ao obter localização";
      console.error("[Geolocation Error]", errorMsg);
      setError(errorMsg);
      setLoading(false);

      return { latitude: null, longitude: null, accuracy: null };
    }
  };

  /**
   * Fluxo completo:
   * 1. Tirar foto
   * 2. Usuário confirma (ou retira outra)
   * 3. Se confirma: obter localização
   * 4. Retornar resultado completo (foto + localização)
   */
  const capturePhotoWithLocation = async (): Promise<PhotoCaptureResult | null> => {
    try {
      // Etapa 1: Tirar foto
      const base64 = await capturePhoto();
      if (!base64) {
        console.log("[Photo Capture Flow] Usuário cancelou captura de foto");
        return null;
      }

      // Etapa 2: Obter localização
      const location = await captureLocation();

      const result: PhotoCaptureResult = {
        photoBase64: base64,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date().toISOString(),
      };

      // Etapa 3: Logar resultado completo
      console.log("=== [Photo Capture Complete] ===");
      console.log("[Result] Foto capturada e localização obtida:");
      console.log(JSON.stringify(result, null, 2));
      console.log("================================");

      return result;
    } catch (err: any) {
      const errorMsg = err?.message || "Erro no fluxo de captura";
      console.error("[Photo Capture Flow Error]", errorMsg);
      setError(errorMsg);
      return null;
    }
  };

  /**
   * Cancelar/resetar
   */
  const reset = () => {
    setPhotoBase64(null);
    setError(null);
  };

  return {
    photoBase64,
    loading,
    error,
    capturePhoto,
    captureLocation,
    capturePhotoWithLocation,
    reset,
  };
};
