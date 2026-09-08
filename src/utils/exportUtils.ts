/**
 * Helper to generate export file names according to specification:
 * editorsuite-studio-[namamodel3d]-[tanggal]-[pukul]-[5idunik].[ext]
 */
export function generateExportFileName(modelName: string, ext: string): string {
  const safeModel = modelName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'model';

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const tanggal = `${year}${month}${day}`;
  const pukul = `${hours}${minutes}${seconds}`;

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomId = '';
  for (let i = 0; i < 5; i++) {
    randomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const cleanExt = ext.replace(/^\.+/, '');
  return `editorsuite-studio-${safeModel}-${tanggal}-${pukul}-${randomId}.${cleanExt}`;
}
