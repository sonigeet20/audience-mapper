import { logIntegrationError } from '../error-logger'

export interface FacebookCredentials {
  app_id: string
  app_secret: string
  access_token?: string
  expires_at?: number
}

export interface FacebookAudience {
  id: string
  name: string
  approximate_count: number
  delivery_status?: {
    code: number
    description: string
  }
}

/**
 * Facebook Custom Audiences API connector
 * Uses organization-specific OAuth credentials
 */
export class FacebookConnector {
  private credentials: FacebookCredentials
  private adAccountId: string
  private orgId: string

  constructor(credentials: FacebookCredentials, adAccountId: string, orgId: string) {
    this.credentials = credentials
    this.adAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
    this.orgId = orgId
  }

  /**
   * Create Custom Audience
   */
  async createCustomAudience(name: string, description?: string): Promise<FacebookAudience> {
    if (!this.credentials.access_token) {
      throw new Error('No access token available')
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.adAccountId}/customaudiences`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: description || '',
            subtype: 'CUSTOM',
            customer_file_source: 'USER_PROVIDED_ONLY',
            access_token: this.credentials.access_token
          })
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Failed to create audience')
      }

      return {
        id: data.id,
        name,
        approximate_count: 0
      }
    } catch (error: any) {
      await logIntegrationError('facebook', error, {
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

    // Facebook accepts max 10k records per request
    const batchSize = 10000
    const batches = []

    for (let i = 0; i < hashedEmails.length; i += batchSize) {
      batches.push(hashedEmails.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${audienceId}/users`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payload: {
                schema: ['EMAIL_SHA256'],
                data: batch.map(email => [email])
              },
              access_token: this.credentials.access_token
            })
          }
        )

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error.message || 'Failed to upload emails')
        }
      } catch (error: any) {
        await logIntegrationError('facebook', error, {
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
  async getAudienceDetails(audienceId: string): Promise<FacebookAudience> {
    if (!this.credentials.access_token) {
      throw new Error('No access token available')
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${audienceId}?` +
        `fields=id,name,approximate_count,delivery_status&` +
        `access_token=${this.credentials.access_token}`
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Failed to get audience')
      }

      return {
        id: data.id,
        name: data.name,
        approximate_count: data.approximate_count || 0,
        delivery_status: data.delivery_status
      }
    } catch (error: any) {
      await logIntegrationError('facebook', error, {
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
        `https://graph.facebook.com/v18.0/${audienceId}?access_token=${this.credentials.access_token}`,
        {
          method: 'DELETE'
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Failed to delete audience')
      }
    } catch (error: any) {
      await logIntegrationError('facebook', error, {
        orgId: this.orgId,
        action: 'delete_audience'
      })
      throw error
    }
  }
}
