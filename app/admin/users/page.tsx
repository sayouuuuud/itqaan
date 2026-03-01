"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search, Users, BookOpen, UserCheck,
  UserX, Edit, Trash2, UserPlus, Filter, TrendingUp, Loader2
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function AdminUsersPage() {
  const { t } = useI18n()
  const router = useRouter()
  const isAr = t.locale === "ar"

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"students" | "readers">("students")
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "student" })
  const [submitting, setSubmitting] = useState(false)

  // Fetch users based on activeTab
  useEffect(() => {
    fetchUsers()
  }, [activeTab])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const role = activeTab === "students" ? "student" : "reader"
      const res = await fetch(`/api/admin/users?role=${role}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (u) => u.name.includes(searchQuery) || u.email.includes(searchQuery)
  )

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentStatus })
      })
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u))
      }
    } catch {
      alert(isAr ? "حدث خطأ أثناء تعديل حالة المستخدم" : "Error toggling status")
    }
  }

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsAddUserOpen(false)
        fetchUsers()
      } else {
        const err = await res.json()
        alert(err.error || "Error creating user")
      }
    } catch {
      alert("Error")
    } finally {
      setSubmitting(false)
      setFormData({ name: "", email: "", password: "", role: activeTab === "students" ? "student" : "reader" })
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const { name, email, password } = formData
      const body: any = { userId: selectedUser.id }
      if (name) body.name = name
      if (email) body.email = email
      if (password) body.password = password

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setIsEditUserOpen(false)
        fetchUsers()
      } else {
        const err = await res.json()
        alert(err.error || "Error updating user")
      }
    } catch {
      alert("Error")
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (user: any) => {
    setSelectedUser(user)
    setFormData({ name: user.name, email: user.email, password: "", role: user.role })
    setIsEditUserOpen(true)
  }

  const avatarColors = [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-[#8b5cf6]/15 text-[#8b5cf6]",
    "bg-red-100 text-red-600",
    "bg-indigo-100 text-indigo-600",
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.admin.usersManagementTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.admin.usersManagementDesc}
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header with Tabs */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "students"
                ? "bg-white text-[#0B3D2E] shadow-sm"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              {t.admin.students}
            </button>
            <button
              onClick={() => setActiveTab("readers")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "readers"
                ? "bg-white text-[#0B3D2E] shadow-sm"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              {t.admin.readers}
            </button>
          </div>
          <div className="flex gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t.admin.search || (isAr ? "بحث..." : "Search...")}
                className="pr-10 w-64 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="sm" className="flex items-center gap-2 bg-[#0B3D2E] hover:bg-[#0a3326] text-white" onClick={() => {
              setFormData({ name: "", email: "", password: "", role: activeTab === "students" ? "student" : "reader" })
              setIsAddUserOpen(true)
            }}>
              <UserPlus className="w-4 h-4" />
              {t.admin.addUser}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
            </div>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">
                    {t.auth.fullName}
                  </th>
                  <th className="px-6 py-4">
                    {t.auth.email}
                  </th>
                  <th className="px-6 py-4">
                    {t.admin.joinDate}
                  </th>
                  <th className="px-6 py-4">
                    {t.auth.role}
                  </th>
                  <th className="px-6 py-4">
                    {t.reader.status}
                  </th>
                  <th className="px-6 py-4 text-center">
                    {t.admin.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${avatarColors[idx % avatarColors.length]}`}
                          >
                            {(user.name || "م").charAt(0)}
                          </div>
                          {user.is_active && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate w-24 sm:w-auto" title={user.id}>
                            ID: #{user.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString(
                        isAr ? "ar-SA" : "en-US"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'student' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {t.auth.student}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                          {t.auth.reader}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                          {t.active}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                          {t.admin.banned}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(user)
                          }}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title={isAr ? "تعديل" : "Edit"}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleStatus(user.id, user.is_active)
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${user.is_active
                            ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                            : "text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700"
                            }`}
                          title={
                            user.is_active
                              ? t.admin.block
                              : t.admin.activate
                          }
                        >
                          {user.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Dummy */}
        <div className="bg-muted/30 px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t.admin.totalUsersCount}: {filteredUsers.length}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.admin.newUserModalTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.auth.fullName}</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.auth.email}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.admin.passwordRequirement}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.auth.role}</Label>
              <select
                className="w-full h-10 border border-input rounded-md px-3 bg-background font-sans"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">{t.auth.student}</option>
                <option value="reader">{t.auth.reader}</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleCreateUser} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.admin.editUserModalTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.auth.fullName}</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.auth.email}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.admin.passwordLeaveBlank}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.profile.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
