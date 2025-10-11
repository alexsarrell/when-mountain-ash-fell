import axios from 'axios'
import fs from 'fs/promises'
import crypto from 'crypto'

export class ImageService {
  constructor(
    private apiKey: string,
    private apiUrl: string,
    private storagePath: string,
    private model: string = 'gemini-2.5-flash-image-preview'
  ) {}

  private isDataUrl(u: string) {
    return u.startsWith('data:')
  }

  private parseDataUrl(u: string): Buffer | undefined {
    const m = u.match(/^data:([^;]+);base64,(.+)$/)
    if (!m) return undefined
    const b64 = m[2].replace(/\s+/g, '')
    return Buffer.from(b64, 'base64')
  }

  private pickUrlOrBuffer(data: any): { url?: string; buffer?: Buffer } | undefined {
    const msg = data?.choices?.[0]?.message
    const img = msg?.images?.[0]
    const u = img?.image_url?.url || img?.image_url || data?.image_url || data?.url
    if (typeof u !== 'string') return undefined
    if (this.isDataUrl(u)) {
      const buf = this.parseDataUrl(u)
      if (!buf) return undefined
      return { buffer: buf }
    }
    return { url: u }
  }

  private async fetchToBuffer(url: string): Promise<Buffer> {
    const r = await axios.get(url, { responseType: 'arraybuffer' })
    return Buffer.from(r.data)
  }

  private async generate(prompt: string, prefix: string): Promise<string | undefined> {
    console.log('image: generate start', { prefix, model: this.model })
    const res = await axios.post(
      `${this.apiUrl.replace(/\/$/, '')}/predict`,
      {
        model: this.model,
        messages: [
          { role: 'user', content: [ { type: 'text', text: prompt } ] }
        ]
      },
      { headers: { 'MLP-API-KEY': this.apiKey, 'Content-Type': 'application/json' } }
    )
    console.log('image: predict status', (res as any)?.status)

    const ref = this.pickUrlOrBuffer(res.data)
    if (!ref) {
      console.log('image: no image found in response')
      return undefined
    }

    await fs.mkdir(this.storagePath, { recursive: true })
    const fileName = `${prefix}_${crypto.randomUUID()}.png`
    const filePath = `${this.storagePath}/${fileName}`

    if (ref.buffer) {
      console.log('image: writing buffer', { bytes: ref.buffer.length })
      await fs.writeFile(filePath, ref.buffer)
    } else if (ref.url) {
      console.log('image: downloading url', ref.url.slice(0, 128))
      const buf = await this.fetchToBuffer(ref.url)
      console.log('image: downloaded bytes', buf.length)
      await fs.writeFile(filePath, buf)
    } else {
      console.log('image: invalid ref')
      return undefined
    }

    console.log('image: saved', filePath)
    return `/images/generated/${fileName}`
  }

  async generateCharacterImage(prompt: string): Promise<string | undefined> {
    return this.generate(prompt, 'character')
  }

  async generateLocationImage(prompt: string): Promise<string | undefined> {
    return this.generate(prompt, 'location')
  }

  calculateEquipmentHash(equipment: Record<string, unknown>): string {
    return crypto.createHash('md5').update(JSON.stringify(equipment ?? {})).digest('hex')
  }
}
