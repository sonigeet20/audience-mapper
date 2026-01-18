import { logIntegrationError } from '../error-logger'

export interface LinkedInCredentials {
  client_id: string
  client_secret: string
  access_token?: string
  refresh_token?: string
  expires_at?: number
}

export interface LinkedInAudience {
  id: number
  name: string
  audienceType: string
  size: number
  status: string
}

/**
 * LinkedIn Matched Audiences API connector
 * Uses organization-specific OAuth credentials
 */
export class LinkedInConnector {
  private credentials: LinkedInCredentials
  private adAccountId: string
  private orgId: string

  constructor(credentials: LinkedInCredentials, adAccountId: string, orgId: string) {
    this.credentials = credentials
    this.adAccountId = adAccountId
    this.orgId = orgId
  }

  /**
   * Ensure access token is valid, refresh if needed
   */
  private async ensureValidToken(): Promise<string> {
    if (!this.credentials.access_token || !this.credentials.expires_at) {
      throw new Error('No access token available')
    }

    // Check if token expires in next 5 minutes
    if (this.credentials.expires_at < Date.now() + (5 * 60 * 1000)) {
      await this.refreshAccessToken()
    }

    return this.credentials.access_token!
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.credentials.refresh_token) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refresh_token,
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error_description || data.error)
      }

      this.credentials.access_token = data.access_token
      this.credentials.expires_at = Date.now() + (data.expires_in * 1000)
    } catch (error: any) {
      await logIntegrationError('linkedin', error, {
        orgId: this.orgId,
        action: 'refresh_token'
      })
      throw error
    }
  }

  /**
   * Create Matched Audience
   */
  async createMatchedAudience(name: string): Promise<LinkedInAudience> {
    const token = await this.ensureValidToken()

    try {
      const response = await fetch(
        'https://api.linkedin.com/rest/dmpSegments',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202311',
            'X-RestLi-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify({
            name,
            account: `urn:li:sponsoredAccount:${this.adAccountId}`,
            type: 'USER_UPLOADED',
            matchType: 'EMAIL'
          })
        }
      )

      const data = await response.json()

      if (data.status && data.status >= 400) {
        throw new Error(data.message || 'Failed to create audience')
      }

      return {
        id: data.id,
        name,
        audienceType: 'USER_UPLOADED',
        size: 0,
        status: 'PROCESSING'
      }
    } catch (error: any) {
      await logIntegrationError('linkedin', error, {
        orgId: this.orgId,
        action: 'create_audience'
      })
      throw error
    }
  }

  /**
   * Upload emails to Matched Audience
   * Emails should be SHA256 hashed on client side
   */
  async uploadEmails(audienceId: number, hashedEmails: string[]): Promise<void> {
    const token = await this.ensureValidToken()

    // LinkedIn accepts max 300k records per request
    const batchSize = 300000
    const batches = []

    for (let i = 0; i < hashedEmails.length; i += batchSize) {
      batches.push(hashedEmails.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      try {
        const response = await fetch(
          `https://api.linkedin.com/rest/dmpSegments/${audienceId}/users`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'LinkedIn-Version': '202311',
              'X-RestLi-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify({
              elements: batch.map(email => ({
                email: email,
                idType: 'SHA256_EMAIL'
              })),
              action: 'ADD'
            })
          }
        )

        const data = await response.json()

        if (data.status && data.status >= 400) {
          throw new Error(data.message || 'Failed to upload emails')
        }
      } catch (error: any) {
        await logIntegrationError('linkedin', error, {
          orgId: this.orgId,
          action: 'upload_emails',
          context: { batchSize: batch.length }
        })
        throw error
      }
    }
  }

  /**
   * Get Matched Audience details
   */
  async getAudienceDetails(audienceId: number): Promise<LinkedInAudience> {
    const token = await this.ensureValidToken()

    try {
      const response = await fetch(
        `https://api.linkedin.com/rest/dmpSegments/${audienceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'LinkedIn-Version': '202311',
            'X-RestLi-Protocol-Version': '2.0.0'
          }
        }
      )

      const data = await response.json()

      if (data.status && data.status >= 400) {
        throw new Error(data.message || 'Failed to get audience')
      }

      return {
        id: data.id,
        name: data.name,
        audienceType: data.type,
        size: data.audienceCount || 0,
        status: data.status
      }
    } catch (error: any) {
      await logIntegrationError('linkedin', error, {
        orgId: this.orgId,
        action: 'get_audience'
      })
      throw error
    }
  }

  /**
   * Delete Matched Audience
   */
  async deleteAudience(audienceId: number): Promise<void> {
    const token = await this.ensureValidToken()

    try {
      const response = await fetch(
        `https://api.linkedin.com/rest/dmpSegments/${audienceId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'LinkedIn-Version': '202311',
            'X-RestLi-Protocol-Version': '2.0.0'
          }
        }
      )

      if (response.status >= 400) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to delete audience')
      }
    } catch (error: any) {
      await logIntegrationError('linkedin', error, {
        orgId: this.orgId,
        action: 'delete_audience'
      })
      throw error
    }
  }
}
