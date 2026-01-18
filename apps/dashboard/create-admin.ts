/**
 * Script to create a super admin user
 * Run with: tsx create-admin.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lmmspmhzezesexeyndvq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbXNwbWh6ZXplc2V4ZXluZHZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjg3MjE1MSwiZXhwIjoyMDUyNDQ4MTUxfQ.4oJaOAV8IfKMOqq_2rOGzJojUGQSz-Aez0YoY8V1pAo'

async function createSuperAdmin() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('Creating super admin user...')

  // Create the user
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: 'geet@adquark.io',
    password: 'Dang7898$',
    email_confirm: true,
    user_metadata: {
      role: 'super_admin',
      name: 'Geet Soni'
    }
  })

  if (userError) {
    console.error('Error creating user:', userError)
    return
  }

  console.log('✅ User created:', user.user?.id)

  // Create an organization for the user
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'AdQuark',
      owner_id: user.user?.id,
      settings: {
        features: ['all']
      }
    })
    .select()
    .single()

  if (orgError) {
    console.error('Error creating organization:', orgError)
    return
  }

  console.log('✅ Organization created:', org.id)

  // Add user to organization_members
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.user?.id,
      role: 'owner'
    })

  if (memberError) {
    console.error('Error adding organization member:', memberError)
    return
  }

  console.log('✅ User added to organization as owner')
  console.log('\n🎉 Super admin setup complete!')
  console.log('Email: geet@adquark.io')
  console.log('Password: Dang7898$')
  console.log('Dashboard: https://audience-mapper.vercel.app')
}

createSuperAdmin().catch(console.error)
