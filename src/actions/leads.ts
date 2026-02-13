'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteLead(leadId: string) {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized: You must be logged in.' }
    }

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

    if (error) {
        return { error: `Failed to delete lead: ${error.message}` }
    }

    revalidatePath('/leads')
    return { success: true, message: 'Lead deleted successfully' }
}
