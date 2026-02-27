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

interface LeadUpdate {
    business_name?: string
    contact_name?: string
    email?: string
    phone?: string
    description?: string
    status?: 'Hot' | 'Warm' | 'Cold'
}

export async function updateLead(leadId: string, updates: LeadUpdate) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized: You must be logged in.' }
    }

    const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)

    if (error) {
        return { error: `Failed to update lead: ${error.message}` }
    }

    revalidatePath('/leads')
    return { success: true, message: 'Lead updated successfully' }
}
