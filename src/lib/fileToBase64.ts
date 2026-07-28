/**
 * A file's bytes as base64, without the `data:` prefix.
 *
 * The upload server function takes base64 rather than multipart form data, so every caller
 * that sends a photo needs this. It was written out separately in three places before.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // readAsDataURL yields "data:image/jpeg;base64,XXXX" — the server wants only the XXXX.
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
