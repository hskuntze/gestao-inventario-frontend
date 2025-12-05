import { useEffect, useState } from "react";
import IconePdf from "@/assets/images/icone-pdf.png";
import "./styles.css";

interface ImageCarouselProps {
  blobs: Blob[];
}

const ImagePreviewCarousel = ({ blobs }: ImageCarouselProps) => {
  const [urls, setUrls] = useState<{ url: string; type: string }[]>([]);
  const [current, setCurrent] = useState(0);

  // Gera URLs temporárias a partir dos blobs recebidos
  useEffect(() => {
    const objectUrls = blobs.map((blob) => ({
      url: URL.createObjectURL(blob),
      type: blob.type,
    }));

    setUrls(objectUrls);

    // Libera memória quando o componente desmontar
    return () => {
      objectUrls.forEach((obj) => ({
        url: URL.revokeObjectURL(obj.url),
        type: obj.type,
      }));
    };
  }, [blobs]);

  if (urls.length === 0) {
    return <p className="text-info">Nenhuma imagem disponível</p>;
  }

  const total = urls.length;
  const next = () => setCurrent((prev) => (prev + 1) % total);
  const prev = () => setCurrent((prev) => (prev - 1 + total) % total);

  // Se houver menos de 3 imagens, mostra só o que existe
  const visibleImages = total >= 3 ? [urls[current], urls[(current + 1) % total], urls[(current + 2) % total]] : urls;

  return (
    <div className="img-carousel-container">
      {total > 3 && (
        <button onClick={prev} className="button-carousel left">
          <i className="bi bi-chevron-left"></i>
        </button>
      )}
      <div className="carousel-img-wrapper">
        {visibleImages.map((obj, index) =>
          obj.type === "image/jpg" ? (
            <img key={`${current}-${index}`} src={obj.url} alt={`Imagem ${current + index}`} className="carousel-img" />
          ) : (
            <img key={`${current}-${index}`} src={IconePdf} alt={`Imagem ${current + index}`} className="carousel-img" />
          )
        )}
      </div>
      {total > 3 && (
        <button onClick={next} className="button-carousel right">
          <i className="bi bi-chevron-right"></i>
        </button>
      )}
    </div>
  );
};

export default ImagePreviewCarousel;
