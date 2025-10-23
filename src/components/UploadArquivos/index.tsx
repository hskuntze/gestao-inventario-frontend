import "./styles.css";
import { requestBackend } from "@/utils/requests";
import { DragEvent, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AxiosRequestConfig } from "axios";

interface BackendFile {
  id: number;
  nome: string;
  conteudo: string; // base64 (com prefixo data:image/... ou puro)
}

type FormData = {
  tipoAtivo: string;
  idAtivo: string;
  file: FileList;
};

interface FilePreview {
  name: string;
  url: string;
  size?: number;
  isNew?: boolean; // indica se foi recém-adicionado
}

interface UploadArquivosProps {
  defaultFiles?: BackendFile[];
  tipoAtivo: string;
  idAtivo?: string;
}

const UploadArquivos = ({ defaultFiles = [], tipoAtivo, idAtivo }: UploadArquivosProps) => {
  const { control, handleSubmit, setValue, watch } = useForm<FormData>();
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const files = watch("file");

  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
  const ALLOWED_TYPES = ["image/jpg", "image/jpeg", "image/png", "image/gif", "application/pdf"];

  // Gera previews quando o usuário seleciona novos arquivos
  useEffect(() => {
    if (defaultFiles.length > 0) {
      const converted = defaultFiles.map((file) => ({
        name: file.nome,
        url: file.conteudo.startsWith("data:") ? file.conteudo : `data:application/octet-stream;base64,${file.conteudo}`,
        isNew: false,
      }));
      setFilePreviews(converted);
    }
  }, [defaultFiles]);

  useEffect(() => {
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`Tipo de arquivo não permitido: ${file.name}`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`Arquivo muito grande (máx. 1 MB): ${file.name}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setErrorMessage(errors.join("\n"));
    } else {
      setErrorMessage(null);
    }

    const newPreviews = validFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      isNew: true,
    }));

    setFilePreviews((prev) => [...prev, ...newPreviews]);
  }, [files]);

  useEffect(() => {
    if (idAtivo) {
      setValue("idAtivo", idAtivo);
      setValue("tipoAtivo", tipoAtivo);
    }
  }, [idAtivo, setValue, tipoAtivo]);

  const onSubmit = async (data: FormData) => {
    if (!data.file || data.file.length === 0) {
      alert("Nenhum arquivo selecionado.");
      return;
    }

    const tipo: { [key: string]: string } = {
      t: "TANGIVEL",
      i: "INTANGIVEL",
      tl: "TANGIVEL_LOCACAO",
    };

    for (const file of data.file) {
      const formData = new FormData();
      formData.append("tipoAtivo", tipo[data.tipoAtivo]);
      formData.append("idAtivo", data.idAtivo);
      formData.append("file", file);

      const requestParams: AxiosRequestConfig = {
        url: "/imagens/upload",
        withCredentials: true,
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      try {
        const response = await requestBackend(requestParams);
        //if (!response.status) throw new Error(`Erro ao enviar ${file.name}`);
      } catch (error) {
        console.error(error);
        alert(`Erro ao enviar ${file.name}`);
      }
    }

    alert("Upload finalizado!");
  };

  const handleRemoveFile = (fileName: string) => {
    setFilePreviews((prev) => prev.filter((file) => file.name !== fileName));
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    setValue("file", droppedFiles);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="upload-card">
      <div
        className={`upload-dropzone ${dragOver ? "drag-over" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <i className="bi bi-cloud-arrow-up upload-icon" />
        <span className="upload-span">Arraste e solte arquivos aqui ou</span>
        <label className="upload-label">
          <Controller
            name="file"
            control={control}
            render={({ field }) => (
              <input type="file" multiple onChange={(e) => field.onChange(e.target.files)} accept=".jpg,.jpeg,.png,.gif,.pdf" hidden />
            )}
          />
          <span>procure em seus arquivos</span>
        </label>
      </div>

      {errorMessage && (
        <div className="upload-error">
          <strong>⚠️ Erro nos arquivos:</strong>
          <pre>{errorMessage}</pre>
        </div>
      )}

      {/* Lista de arquivos */}
      <div className="upload-file-list">
        {filePreviews.map((file) => {
          const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.name);
          return (
            <div key={file.name} className="upload-file-item">
              <div className="file-info">
                {isImage ? <i className="bi bi-card-image image-icon" /> : <i className="bi bi-file-earmark-text file-icon" />}
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </a>
              </div>
              <div className="file-actions">
                <span className="file-size">{formatSize(file.size)}</span>
                <a href={file.url} download={file.name}>
                  <i className="bi bi-download"></i>
                </a>
                <button type="button" className="file-remove" onClick={() => handleRemoveFile(file.name)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="form-buttons">
        <button className="button submit-button">Salvar</button>
      </div>
    </form>
  );
};

export default UploadArquivos;
