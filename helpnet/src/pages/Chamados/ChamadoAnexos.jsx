import { Download, FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { anexosApi } from "../../api/anexosApi";
import { ErrorBanner, Spinner } from "../../components/ui/Feedback";

// RF07 / RNF04: upload, listagem, download e exclusão de anexos.
// Extensões aceitas — o backend hoje só valida o tamanho do arquivo, então
// a extensão precisa ser barrada aqui antes do POST.
const EXTENSOES_PERMITIDAS = [".pdf", ".png", ".jpg", ".jpeg", ".svg"];

function extensaoValida(nomeArquivo) {
  const nome = nomeArquivo.toLowerCase();
  return EXTENSOES_PERMITIDAS.some((ext) => nome.endsWith(ext));
}

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ChamadoAnexos({ chamadoId }) {
  const [anexos, setAnexos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setAnexos(await anexosApi.listar(chamadoId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [chamadoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!extensaoValida(file.name)) {
      setError(`Formato não permitido. Use: ${EXTENSOES_PERMITIDAS.join(", ")}`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      await anexosApi.upload(chamadoId, file);
      await carregar();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(anexo) {
    try {
      const blob = await anexosApi.download(anexo.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = anexo.nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(anexo) {
    if (!confirm(`Remover o anexo "${anexo.nomeArquivo}"?`)) return;
    try {
      await anexosApi.deletar(chamadoId, anexo.id);
      await carregar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <Paperclip size={15} />
          Anexos
        </h3>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-3 hover:text-text">
          <Upload size={14} />
          {uploading ? "Enviando..." : "Enviar arquivo"}
          <input
            ref={inputRef}
            type="file"
            accept={EXTENSOES_PERMITIDAS.join(",")}
            className="hidden"
            disabled={uploading}
            onChange={handleFileChange}
          />
        </label>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Spinner size={16} />
      ) : anexos.length === 0 ? (
        <p className="text-xs text-text-faint">Nenhum anexo enviado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {anexos.map((anexo) => (
            <li
              key={anexo.id}
              className="flex items-center gap-2 rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-sm"
            >
              <FileText size={16} className="shrink-0 text-text-faint" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-text">{anexo.nomeArquivo}</p>
                <p className="text-xs text-text-faint">
                  {formatarTamanho(anexo.tamanho)} · {anexo.enviadoPorNome}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(anexo)}
                aria-label="Baixar"
                className="rounded-md p-1.5 text-text-muted hover:bg-surface-3 hover:text-accent cursor-pointer"
              >
                <Download size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(anexo)}
                aria-label="Excluir"
                className="rounded-md p-1.5 text-text-muted hover:bg-surface-3 hover:text-danger cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
