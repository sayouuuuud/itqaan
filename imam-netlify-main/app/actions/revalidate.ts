"use server"

import { revalidatePath } from "next/cache"

export async function revalidateNavbar() {
  // Revalidate all pages that might contain navbar/header
  revalidatePath("/", "layout")
  revalidatePath("/books", "layout")
  revalidatePath("/admin", "layout")
  revalidatePath("/admin/navbar", "layout")
}

export async function revalidateAll() {
  revalidatePath("/", "layout")
}
