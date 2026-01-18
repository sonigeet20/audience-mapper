import { decryptCredentials } from '@/lib/shared/encryption'
import { logIntegrationError } from '../error-logger'

export interface GoogleAdsCredentials {
  client_id: string
  client_secret: string
  developer_token: string
  access_token?: string
  refresh_token?: string
  expires_at?: number
}

export interface CustomerMatchList {
  name: string
  description?: string
  membershipLifespan?: number // days
}

export interface GoogleAdsAudience {
  resourceName: string
  id: string
  name: string
  size: number
}

/**
 * Google Ads Customer Match API connector
 * Uses organization-specific OAuth credentials
 */
export class GoogleAdsConnector {
  private credentials: GoogleAdsCredentials
  private customerId: string
  private orgId: string

  constructor(credentials: GoogleAdsCredentials, customerId: string, orgId: string) {
    this.credentials = credentials
    this.customerId = customerId.replace(/-/g, '') // Remove dashes
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
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.credentials.refresh_token) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
          refresh_token: this.credentials.refresh_token,
          grant_type: 'refresh_token'
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error_description || data.error)
      }

      this.credentials.access_token = data.access_token
      this.credentials.expires_at = Date.now() + (data.expires_in * 1000)
    } catch (error: any) {
      await logIntegrationError('google-ads', error, {
        orgId: this.orgId,
        action: 'refresh_token'
      })
      throw error
    }
  }

  /**
   * Create a Customer Match list
   */
  async createCustomerMatchList(list: CustomerMatchList): Promise<GoogleAdsAudience> {
    const token = await this.ensureValidToken()

    try {
      const response = await fetch(
        `https://googleads.googleapis.com/v15/customers/${this.customerId}/userLists:mutate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'developer-token': this.credentials.developer_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operations: [{
              create: {
                name: list.name,
                description: list.description || '',
                membershipLifeSpan: list.membershipLifespan || 10000, // Max lifetime
                crmBasedUserList: {
                  uploadKeyType: 'CONTACT_INFO',
                  dataSourceType: 'FIRST_PARTY'
                }
              }
            }]
          })
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Failed to create list')
      }

      const result = data.results[0]
      const resourceName = result.resourceName
      const listId = resourceName.split('/').pop()

      return {
        resourceName,
        id: listId,
        name: list.name,
        size: 0
      }
    } catch (error: any) {
      await logIntegrationError('google-ads', error, {
        orgId: this.orgId,
        action: 'create_list'
      })
      throw error
    }
  }

  /**
   * Upload emails to Customer Match list
   * Emails should be SHA256 hashed on client side
   */
  async uploadEmails(listResourceName: string, hashedEmails: string[]): Promise<void> {
    const token = await this.ensureValidToken()

    // Google Ads accepts max 100k records per request
    const batchSize = 100000
    const batches = []

    for (let i = 0; i < hashedEmails.length; i += batchSize) {
      batches.push(hashedEmails.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      try {
        const response = await fetch(
          `https://googleads.googleapis.com/v15/customers/${this.customerId}:uploadUserData`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'developer-token': this.credentials.developer_token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              operations: [{
                create: {
                  userIdentifiers: batch.map(email => ({
                    hashedEmail: email
                  }))
                }
              }],
              customerMatchUserListMetadata: {
                userList: listResourceName
              }
            })
          }
        )

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error.message || 'Failed to upload emails')
        }
      } catch (error: any) {
        await logIntegrationError('google-ads', error, {
          orgId: this.orgId,
          action: 'upload_emails',
          context: { batchSize: batch.length }
        })
        throw error
      }
    }
  }

  /**
   * Get Customer Match list details
   */
  async getAudienceDetails(listResourceName: string): Promise<GoogleAdsAudience> {
    const token = await this.ensureValidToken()

    try {
      const query = `
        SELECT
          user_list.id,
          user_list.name,
          user_list.size_for_display,
          user_list.size_for_search
        FROM user_list
        WHERE user_list.resource_name = '${listResourceName}'
      `

      const response = await fetch(
        `https://googleads.googleapis.com/v15/customers/${this.customerId}/googleAds:search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'developer-token': this.credentials.developer_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Failed to get list details')
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('List not found')
      }

      const result = data.results[0].userList

      return {
        resourceName: listResourceName,
        id: result.id,
        name: result.name,
        size: result.sizeForDisplay || result.sizeForSearch || 0
      }
    } catch (error: any) {
      await logIntegrationError('google-ads', error, {
        orgId: this.orgId,
        action: 'get_audience'
      })
      throw error
    }
  }
}
