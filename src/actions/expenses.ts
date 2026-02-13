'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteExpense(expenseId: string) {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized: You must be logged in.' }
    }

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

    if (error) {
        return { error: `Failed to delete expense: ${error.message}` }
    }

    revalidatePath('/expenses')
    return { success: true, message: 'Expense deleted successfully' }
}
