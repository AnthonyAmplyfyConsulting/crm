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
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const position = formData.get('position') as string
    const phone = formData.get('phone') as string

    if (!email || !password || !name || !role) {
        return { error: 'Missing required fields' }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: 'Server Configuration Error: Missing Service Role Key' }
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: name,
            role: role,
            position: position,
            phone: phone
        }
    })

    if (error) {
        return { error: `Failed to create user: ${error.message}` }
    }

    revalidatePath('/employees')
    return { success: true, message: 'Employee created successfully. They can now login with these credentials.' }
}

export async function deleteEmployee(userId: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'Unauthorized: You must be logged in.' }
    }

    // Check if current user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'Admin') {
        return { error: 'Unauthorized: Only admins can delete users.' }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: 'Server Configuration Error: Missing Service Role Key' }
    }

    const adminClient = createAdminClient()

    // Delete user from Auth (this should cascade to public.profiles if configured, 
    // but typically we might need to delete from profiles manually if no cascade)
    // Supabase Auth deletion typically removes the user from auth.users. 
    // If profiles.id references auth.users.id with ON DELETE CASCADE, it's auto.
    // If not, we might need to delete from profiles first or after.
    // Let's assume standard setup or manual cleanup.

    // Attempt delete from Auth
    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) {
        return { error: `Failed to delete user: ${error.message}` }
    }

    // Optional: Delete from profiles if cascade isn't set up (safeguard)
    // adminClient can bypass RLS if needed, or we use the standard client since we are admin (?)
    // But adminClient is safer for backend ops.
    // await adminClient.from('profiles').delete().eq('id', userId)

    revalidatePath('/employees')
    return { success: true, message: 'Employee deleted successfully.' }
}
