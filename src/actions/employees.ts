'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteEmployee(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'Unauthorized: You must be logged in.' }
    }

    // Check if current user is admin
    // We use the 'supabase' client which is scoped to the user, checking their profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'Admin') {
        return { error: 'Unauthorized: Only admins can invite users.' }
    }

    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const position = formData.get('position') as string
    const phone = formData.get('phone') as string

    if (!email || !name || !role) {
        return { error: 'Missing required fields' }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: 'Server Configuration Error: Missing Service Role Key' }
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
            full_name: name,
            role: role,
            position: position,
            phone: phone
        }
    })

    if (error) {
        return { error: `Failed to invite user: ${error.message}` }
    }

    revalidatePath('/employees')
    return { success: true, message: 'Invitation sent successfully. The user will receive an email to set their password.' }
}
