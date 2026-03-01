import { createClient } from '@/lib/supabase/server' export interface Category { id: string name: string type: 'content' | 'lesson' description?: string count?: number }

export async 
function getCategories(): Promise<Category[]>
 { const supabase = await createClient() const { data } = await supabase.from('categories').select('*') 
  return data || [] }

export async 
function createCategory(category: Omit<Category, 'id'>
): Promise<void>
 { const supabase = await createClient() await supabase.from('categories').insert(category) }

export async 
function deleteCategory(id: string): Promise<void>
 { const supabase = await createClient() await supabase.from('categories').delete().eq('id', id) }
