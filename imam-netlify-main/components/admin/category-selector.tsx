"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronLeft } from "lucide-react"

interface Category {
    id: string
    name: string
    slug: string
    type: string
    description?: string
    parent_category_id?: string | null
    icon?: string
    color?: string
    sort_order?: number
}

interface CategorySelectorProps {
    value: string
    onChange: (value: string) => void
    type: "sermon" | "lesson" | "article" | "book" | "media"
    label?: string
    placeholder?: string
    className?: string
}

export function CategorySelector({
    value,
    onChange,
    type,
    label = "التصنيف",
    placeholder = "اختر التصنيف",
    className = "",
}: CategorySelectorProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchCategories()
    }, [type])

    async function fetchCategories() {
        setLoading(true)
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("type", type)
            .eq("is_active", true)
            .order("sort_order", { ascending: true })

        if (!error && data) {
            setCategories(data)
        }
        setLoading(false)
    }

    // Get parent categories (those without parent_category_id)
    const parentCategories = categories.filter(c => !c.parent_category_id)

    // Get child categories for a parent
    const getChildren = (parentId: string) => {
        return categories.filter(c => c.parent_category_id === parentId)
    }

    // Build hierarchical options
    const buildOptions = () => {
        const options: { id: string; name: string; isChild: boolean; color?: string }[] = []

        parentCategories.forEach(parent => {
            // Add parent
            options.push({
                id: parent.id,
                name: parent.name,
                isChild: false,
                color: parent.color
            })

            // Add children
            const children = getChildren(parent.id)
            children.forEach(child => {
                options.push({
                    id: child.id,
                    name: child.name,
                    isChild: true,
                    color: child.color || parent.color
                })
            })
        })

        return options
    }

    const options = buildOptions()

    if (loading) {
        return (
            <div className={`space-y-2 ${className}`}>
                {label && <Label>{label}</Label>}
                <div className="h-10 bg-muted rounded-md flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {label && <Label>{label}</Label>}
            <Select value={value || "none"} onValueChange={onChange}>
                <SelectTrigger className="bg-muted">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">بدون تصنيف</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-2">
                                {option.isChild && (
                                    <ChevronLeft className="h-3 w-3 text-muted-foreground" />
                                )}
                                {option.color && (
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: option.color }}
                                    />
                                )}
                                <span className={option.isChild ? "text-muted-foreground" : ""}>
                                    {option.name}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
