import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

// Gerar URL pré-assinada para upload
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = true
) {
  // Determinar o prefixo baseado no tipo de arquivo
  const isProposalImage = fileName.includes('proposal-images/');
  const cleanFileName = isProposalImage ? fileName : `logos/${Date.now()}-${fileName}`;
  
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/${cleanFileName}`
    : `${folderPrefix}${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { uploadUrl, cloud_storage_path };
}

// Obter URL do arquivo (pública ou assinada)
export async function getFileUrl(cloud_storage_path: string, isPublic = true) {
  if (isPublic) {
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// Deletar arquivo
export async function deleteFile(cloud_storage_path: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  await s3Client.send(command);
}

// Upload direto de buffer para S3
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
  isPublic = true
): Promise<string> {
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/${key}`
    : `${folderPrefix}${key}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Retornar URL pública
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
}
