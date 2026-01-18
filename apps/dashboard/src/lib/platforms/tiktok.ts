import { logIntegrationError } from '../error-logger'

export interface TikTokCredentials {
  client_key: string
  client_secret: string
  access_token?: string
  expires_at?: number
}

export interface TikTokAudience {
  audience_id: string
  name: string
  audience_size: number
  status: string
}

/**
 * TikTok Audiences API connector
 * Uses organization-specific OAuth credentials
 */
export class TikTokConnector {
  private credentials: TikTokCredentials
  private advertiserId: string
  private orgId: string

  constructor(credentials: TikTokCredentials, advertiserId: string, orgId: string) {
    this.credentials = credentials
    this.advertiserId = advertiserId
    this.orgId = orgId
  }

  /**
   * Create Custom Audience
   */
  async createCustomAudience(name: string): Promise<TikTokAudience> {
    if (!this.credentials.access_token) {
      throw new Error('No access token available')
    }

    try {
      const response = await fetch(
        'https://business-api.tiktok.com/open_api/v1.3/dmp/custom_audience/create/',
        {
          method: 'POST',
          headers: {
            'Access-Token': this.credentials.access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            advertiser_id: this.advertiserId,
            custom_audience_name: name,
            audience_sub_type: 'EMAIL',
            file_paths: []
          })
        }
      )

      const data = await response.json()

      if (data.code !== 0) {
        throw new Error(data.message || 'Failed to create audience')
      }

      return {
        audience_id: data.data.custom_audience_id,
        name,
        audience_size: 0,
        status: 'PENDING'
      }
    } catch (error: any) {
      await logIntegrationError('tiktok', error, {
        orgId: this.orgId,
        action: 'create_audience'
      })
      throw error
    }
  }

  /**
   * Upload emails to Custom Audience
   * Emails should be SHA256 hashed on client side
   */
  async uploadEmails(audienceId: string, hashedEmails: string[]): Promise<void> {
    if (!this.credentials.access_token) {
      throw new Error('No access token available')
    }

    // TikTok accepts max 50k records per request
    const batchSize = 50000
    const batches = []

    for (let i = 0; i < hashedEmails.length; i += batchSize) {
      batches.push(hashedEmails.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      try {
        const response = await fetch(
          'https://business-api.tiktok.com/open_api/v1.3/dmp/custom_audience/update/',
          {
            method: 'POST',
            headers: {
              'Access-Token': this.credentials.access_token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              advertiser_id: this.advertiserId,
              custom_audience_id: audienceId,
              action: 'ADD',
              id_type: 'EMAIL_SHA256',
              id_list: batch
            })
          }
        )

        const data = await response.json()

        if (data.code !== 0) {
          throw new Error(data.message || 'Failed to upload emails')
        }
      } catch (error: any) {
        await logIntegrationError('tiktok', error, {
          orgId: this.orgId,
          action: 'upload_emails',
          context: { batchSize: batch.length }
        })
        throw error
      }
    }
  }

  /**
   * Get Custom Audience details
   */
  async getAudienceDetails(audienceId: string): Promise<TikTokAudience> {
    if (!this.credentials.access_token) {
      throw new Error('No access token available')
    }

    try {
      const response = await fetch(
        `https://business-api.tiktok.com/open_api/v1.3/dmp/custom_audience/list/?` +
        `advertiser_id=${this.advertiserId}&` +
        `custom_audience_ids=${JSON.stringify([audienceId])}`,
        {
          headers: {
            'Access-Token': this.credentials.access_token
          }
        }
      )

      const data = await response.json()

      if (data.code !== 0) {
        throw new Error(data.message || 'Failed to get audience')
      }

      if (!data.data.list || data.data.list.length === 0) {
        throw new Error('Audience not found')
      }

      const audience = data.data.list[0]

      return {
        audience_id: audience.custom_audience_id,
        name: audience.custom_audience_name,
        audience_size: audience.audience_size || 0,
        status: audience.status
      }
    } catch (error: any) {
      await logIntegrationError('tiktok', error, {
        orgId: this.orgId,
        action: 'get_audience'
      })
      throw error
    }
  }

  /**
   * Delete Custom Audience
   */
  async deleteAudience(audienceId: string): Promise<void> {
    if (!this.credentials.access_token) {
      throw new Error('No access token available')
    }

    try {
      const response = await fetch(
        'https://business-api.tiktok.com/open_api/v1.3/dmp/custom_audience/delete/',
        {
          method: 'POST',
          headers: {
            'Access-Token': this.credentials.access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            advertiser_id: this.advertiserId,
            custom_audience_ids: [audienceId]
          })
        }
      )

      const data = await response.json()

      if (data.code !== 0) {
        throw new Error(data.message || 'Failed to delete audience')
      }
    } catch (error: any) {
      await logIntegrationError('tiktok', error, {
        orgId: this.orgId,
        action: 'delete_audience'
      })
      throw error
    }
  }
}
