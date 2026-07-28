import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/** R2 refuses more than a thousand keys in one delete. */
const DELETE_BATCH = 1000;

/**
 * Removes every object ever uploaded for a borrower.
 *
 * By prefix rather than by the two URL columns, and that difference matters. Uploads are
 * keyed `borrowers/{id}/{profile|aadhaar}/{timestamp}.jpg` and the previous file is never
 * removed, so a borrower photographed three times has three images in the bucket while the
 * columns point only at the newest. Deleting what the columns name would leave the older
 * Aadhaar scans behind — which is precisely what a purge is supposed to get rid of.
 *
 * Returns how many objects went. Callers treat a failure as clutter rather than an error:
 * an orphaned object is recoverable, a live row pointing at a deleted image is not, so the
 * database row is always removed first.
 */
export async function deleteBorrowerObjects(borrowerId: string): Promise<number> {
  const prefix = `borrowers/${borrowerId}/`;
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const listed = await r2Client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }));

    const keys = (listed.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key));

    for (let i = 0; i < keys.length; i += DELETE_BATCH) {
      const chunk = keys.slice(i, i + DELETE_BATCH);
      await r2Client.send(new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }));
      deleted += chunk.length;
    }

    // A truncated listing means more keys than one page holds; keep going or the tail
    // would be silently left behind.
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  return deleted;
}
