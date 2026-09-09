// Casa — WhatsApp via Meta Cloud API
import type { NotificationChannel } from './types'

export class WhatsAppChannel implements NotificationChannel {
  private token: string
  private phoneNumberId: string

  constructor() {
    this.token = process.env.WHATSAPP_TOKEN!
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!
  }

  async send(
    to: string,
    template: string,
    params: string[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.token || !this.phoneNumberId) {
      return { success: false, error: 'WhatsApp not configured' }
    }

    // Strip non-numeric characters from phone
    const cleanPhone = to.replace(/\D/g, '')

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'template',
            template: {
              name: template,
              language: { code: 'es_AR' },
              components: [
                {
                  type: 'body',
                  parameters: params.map((p) => ({
                    type: 'text',
                    text: p,
                  })),
                },
              ],
            },
          }),
        }
      )

      if (!response.ok) {
        const err = await response.text()
        return { success: false, error: err }
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }
}
