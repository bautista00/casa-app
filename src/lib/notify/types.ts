// Casa — Notification channel abstraction

export interface NotificationChannel {
  send(
    to: string, // phone number or endpoint
    template: string,
    params: string[]
  ): Promise<{ success: boolean; error?: string }>
}

export type ChannelType = 'whatsapp' | 'webpush'
