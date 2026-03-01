import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        const logType = searchParams.get('type') // filter by log_type
        const success = searchParams.get('success') // 'true' | 'false' | null
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        // Build query
        let query = supabase
            .from('bandwidth_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (logType) {
            query = query.eq('log_type', logType)
        }

        if (success !== null) {
            query = query.eq('success', success === 'true')
        }

        if (from) {
            query = query.gte('created_at', from)
        }

        if (to) {
            query = query.lte('created_at', to)
        }

        const { data: logs, count, error } = await query

        if (error) throw error

        return NextResponse.json({
            logs: logs || [],
            total: count || 0,
            limit,
            offset
        })

    } catch (error: any) {
        console.error('Error fetching bandwidth logs:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch logs' },
            { status: 500 }
        )
    }
}

// Delete old logs (admin action)
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        const days = parseInt(searchParams.get('days') || '90')
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)

        const { error, count } = await supabase
            .from('bandwidth_logs')
            .delete()
            .lt('created_at', cutoffDate.toISOString())

        if (error) throw error

        return NextResponse.json({
            success: true,
            message: `Deleted logs older than ${days} days`,
            deletedCount: count || 0
        })

    } catch (error: any) {
        console.error('Error deleting bandwidth logs:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete logs' },
            { status: 500 }
        )
    }
}
