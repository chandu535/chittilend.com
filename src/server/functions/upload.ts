import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { db } from '../db';
import { borrowers } from '../db/schema';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

export const getPresignedUploadUrl = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const input = data as {
      fileType: 'profile' | 'aadhaar';
      contentType: string;
      borrowerId: string;
    };
    if (!input.fileType || !input.contentType || !input.borrowerId) {
      throw new Error('fileType, contentType, and borrowerId are required');
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(input.contentType)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }
    return input;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const ext = data.contentType.split('/')[1] === 'jpeg' ? 'jpg' : data.contentType.split('/')[1];
    const timestamp = Date.now();
    const fileKey = `borrowers/${data.borrowerId}/${data.fileType}/${timestamp}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      ContentType: data.contentType,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 });

    return {
      uploadUrl: presignedUrl,
      fileKey,
      publicUrl: `${R2_PUBLIC_URL}/${fileKey}`,
    };
  });

export const confirmUpload = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const input = data as {
      fileKey: string;
      borrowerId: string;
      docType: 'profile' | 'aadhaar';
    };
    if (!input.fileKey || !input.borrowerId || !input.docType) {
      throw new Error('fileKey, borrowerId, and docType are required');
    }
    return input;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const publicUrl = `${R2_PUBLIC_URL}/${data.fileKey}`;

    const updateData =
      data.docType === 'profile'
        ? { profilePhotoUrl: publicUrl, updatedAt: new Date() }
        : { aadhaarPhotoUrl: publicUrl, updatedAt: new Date() };

    await db
      .update(borrowers)
      .set(updateData)
      .where(eq(borrowers.id, data.borrowerId));

    return { url: publicUrl };
  });
