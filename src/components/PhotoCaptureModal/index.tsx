import React from "react";
import "./styles.css";

interface PhotoCaptureModalProps {
  isOpen: boolean;
  photoBase64: string | null;
  onConfirm: () => void;
  onRetake: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Modal para preview de foto + confirmação
 * Exibe foto capturada (base64) e oferece opções:
 * - Confirmar (usar essa foto)
 * - Retomar (tirar outra)
 * - Cancelar
 */
const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  isOpen,
  photoBase64,
  onConfirm,
  onRetake,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="photo-capture-modal-overlay">
      <div className="photo-capture-modal-content">
        <h2>Preview de Foto</h2>

        {loading ? (
          <div className="photo-loading">
            <p>Capturando localização...</p>
          </div>
        ) : photoBase64 ? (
          <>
            <img
              src={`data:image/jpeg;base64,${photoBase64}`}
              alt="Preview"
              className="photo-preview-image"
            />
            <div className="photo-capture-actions">
              <button
                className="btn btn-success"
                onClick={onConfirm}
                disabled={loading}
              >
                ✓ Confirmar Foto
              </button>
              <button
                className="btn btn-warning"
                onClick={onRetake}
                disabled={loading}
              >
                🔄 Tirar Outra
              </button>
              <button
                className="btn btn-danger"
                onClick={onCancel}
                disabled={loading}
              >
                ✗ Cancelar
              </button>
            </div>
          </>
        ) : (
          <p>Nenhuma foto capturada</p>
        )}
      </div>
    </div>
  );
};

export default PhotoCaptureModal;
