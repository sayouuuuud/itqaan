
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function createVisitor() {
    const email = 'visitor@gmail.com'
    const password = 'VisitorPassword123!' // Strong password

    console.log(`Creating/Checking user: ${email}`)

    // 1. Check if user exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError)
        return
    }

    const existingUser = users.users.find(u => u.email === email)

    if (existingUser) {
        console.log('User already exists:', existingUser.id)
        return
    }

    // 2. Create user
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'visitor' }
    })

    if (error) {
        console.error('Error creating user:', error)
    } else {
        console.log('User created successfully:', data.user.id)
        console.log('Password:', password)
    }
}

createVisitor()
