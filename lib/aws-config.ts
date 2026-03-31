import { S3Client } from '@aws-sdk/client-s3';

export function getBucketConfig() {
  const bucketName = process.env.AWS_BUCKET_NAME ?? '';
  const folderPrefix = process.env.AWS_FOLDER_PREFIX ?? '';
  
  if (!bucketName) {
    console.warn('AWS_BUCKET_NAME não configurado');
  }
  
  return {
    bucketName,
    folderPrefix,
  };
}

export function createS3Client() {
  const region = process.env.AWS_REGION || 'us-east-1';
  
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? '';
  
  if (!accessKeyId || !secretAccessKey) {
    console.warn('Credenciais AWS não configuradas (AWS_ACCESS_KEY_ID ou AWS_SECRET_ACCESS_KEY)');
  }
  
  return new S3Client({
    region: region,
    credentials: accessKeyId && secretAccessKey ? {
      accessKeyId,
      secretAccessKey,
    } : undefined,
  });
}
