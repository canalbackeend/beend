'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Trash2, Loader2, Crop, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  onLogoUpdate: (logoUrl: string | null) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function LogoUpload({ currentLogoUrl, onLogoUpdate }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  
  // Crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<CropType | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas arquivos de imagem são permitidos');
      return;
    }

    setSelectedFile(file);
    
    // Criar preview para crop
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    
    // Limpar input
    e.target.value = '';
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Aspecto livre para permitir ajuste flexível
    const newCrop = centerAspectCrop(width, height, 16 / 9);
    setCrop(newCrop);
    setCompletedCrop(newCrop);
  }, []);

  const getCroppedImg = async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (completedCrop.x / 100) * image.width * scaleX,
      y: (completedCrop.y / 100) * image.height * scaleY,
      width: (completedCrop.width / 100) * image.width * scaleX,
      height: (completedCrop.height / 100) * image.height * scaleY,
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  };

  const handleCropConfirm = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      // Obter imagem cortada
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) {
        throw new Error('Erro ao processar imagem');
      }

      const croppedFile = new File([croppedBlob], selectedFile.name.replace(/\.[^.]+$/, '.png'), {
        type: 'image/png',
      });

      // 1. Gerar URL pré-assinada
      const presignedResponse = await fetch('/api/users/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: croppedFile.name,
          contentType: croppedFile.type,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Erro ao gerar URL de upload');
      }

      const { uploadUrl, cloud_storage_path } = await presignedResponse.json();

      // 2. Upload direto para S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': croppedFile.type,
        },
        body: croppedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload');
      }

      // 3. Atualizar banco de dados
      const updateResponse = await fetch('/api/users/logo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path }),
      });

      if (!updateResponse.ok) {
        throw new Error('Erro ao atualizar logo');
      }

      const { logoUrl } = await updateResponse.json();
      setPreviewUrl(logoUrl);
      onLogoUpdate(logoUrl);
      toast.success('Logo atualizada com sucesso!');
      
      // Fechar modal
      setShowCropModal(false);
      setImageSrc(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageSrc(null);
    setSelectedFile(null);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover a logo?')) return;

    setDeleting(true);

    try {
      const response = await fetch('/api/users/logo', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao remover logo');
      }

      setPreviewUrl(null);
      onLogoUpdate(null);
      toast.success('Logo removida com sucesso!');
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Erro ao remover logo');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo da Empresa
          </CardTitle>
          <CardDescription>
            Esta logo aparecerá nas pesquisas. Tamanho máximo: 5MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {previewUrl ? (
              <div className="relative group">
                <div className="relative w-48 h-36 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={previewUrl}
                    alt="Logo da empresa"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={uploading}
                  >
                    <Crop className="h-4 w-4 mr-1" />
                    Trocar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="w-48 h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  Clique para enviar sua logo
                </p>
              </div>
            )}
            
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal de Crop */}
      {showCropModal && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Crop className="h-5 w-5" />
              Ajustar Imagem
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Arraste para ajustar a área de corte da sua logo
            </p>
            
            <div className="flex justify-center mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
                className="max-h-[50vh]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Imagem para corte"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '50vh', maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCropCancel}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleCropConfirm}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
