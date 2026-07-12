import { join } from 'node:path'
const MIME_TO_EXT: Record<string, string> = { 'image/png':'png', 'image/jpeg':'jpg', 'image/webp':'webp', 'image/gif':'gif' }
export function extensionForMime(mime: string) { return MIME_TO_EXT[mime] || null }
export function detectImageExtension(buffer: Buffer) {
  if (buffer.length >= 8 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png'
  if (buffer.length >= 3 && buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff) return 'jpg'
  if (buffer.length >= 12 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') return 'webp'
  const gif=buffer.toString('ascii',0,6); if(gif==='GIF87a'||gif==='GIF89a')return 'gif'
  return null
}
export function uploadDirectory(){ return process.env.UPLOAD_DIR?.trim() || join(/* turbopackIgnore: true */ process.cwd(),'data','uploads') }
export const IMAGE_MIME_BY_EXT: Record<string,string>={png:'image/png',jpg:'image/jpeg',webp:'image/webp',gif:'image/gif'}
