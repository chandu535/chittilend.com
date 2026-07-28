import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { db } from '../db';
import { borrowers } from '../db/schema';
import { borrowerLive } from '../db/softDelete';
import { getAuthenticatedUser } from '../middleware/auth';
import { requirePermission } from '../middleware/roleGuard';

export const uploadBorrowerPhoto = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const input = data as {
      borrowerId: string;
      docType: 'profile' | 'aadhaar';
      fileData: string;
      contentType: string;
    };
    if (!input.borrowerId || !input.docType || !input.fileData || !input.contentType) {
      throw new Error('borrowerId, docType, fileData, and contentType are required');
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(input.contentType)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }
    return input;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'borrowers.write');

    const ext = data.contentType === 'image/jpeg' ? 'jpg' : data.contentType.split('/')[1];
    const fileKey = `borrowers/${data.borrowerId}/${data.docType}/${Date.now()}.${ext}`;

    const buffer = Buffer.from(data.fileData, 'base64');
    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      Body: buffer,
      ContentType: data.contentType,
    }));

    const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;

    const updateData = data.docType === 'profile'
      ? { profilePhotoUrl: publicUrl, updatedAt: new Date() }
      : { aadhaarPhotoUrl: publicUrl, updatedAt: new Date() };

    // No uploading onto a binned borrower — the row would change under the Bin.
    const [updated] = await db
      .update(borrowers).set(updateData)
      .where(and(eq(borrowers.id, data.borrowerId), borrowerLive))
      .returning({ id: borrowers.id });
    if (!updated) throw new Error('Borrower not found');

    return { url: publicUrl };
  });
