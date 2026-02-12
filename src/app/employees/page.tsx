"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";
import { Plus, Search, User, Mail, Phone, Briefcase, Trash2, ShieldCheck, X } from "lucide-react";
import { inviteEmployee } from "@/actions/employees";

interface Employee {
    id: string;
    name: string;
    position: string;
    email: string;
    phone: string;
    role: "Admin" | "User";
    joinedDate: string;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAdminWarning, setShowAdminWarning] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [position, setPosition] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<"Admin" | "User">("User");

    // Mock Admin Check (In real app, check user role from Supabase)
    const isAdmin = true;

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', name);
        formData.append('position', position);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('role', role);

        try {
            const result = await inviteEmployee(null, formData);
            if (result.error) {
                alert(result.error);
            } else {
                alert(result.message);
                setIsModalOpen(false);
                resetForm();
                // We should ideally re-fetch the list here, but server action revalidates path
            }
        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred.");
        }
    };

    const handleDeleteEmployee = (id: string) => {
        if (confirm("Are you sure you want to remove this employee? This will revoke their access.")) {
            setEmployees(employees.filter(e => e.id !== id));
        }
    };

    const resetForm = () => {
        setName("");
        setPosition("");
        setEmail("");
        setPhone("");
        setRole("User");
    };

    if (!isAdmin) {
        return (
            <main className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
                <Navbar />
                <div className="pt-40 text-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-2">Access Denied</h1>
                    <p className="text-gray-400">You do not have permission to view this page.</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-blood-orange-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-orange-400/5 rounded-full blur-[100px]" />
            </div>

            <Navbar />

            <div className="pt-32 px-6 pb-12 max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-gradient-orange">
                            Team Management
                        </h1>
                        <p className="text-gray-500 mt-1">Manage employee access and roles.</p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blood-orange-600 to-orange-500 hover:from-blood-orange-500 hover:to-orange-400 text-white rounded-lg transition-all shadow-lg shadow-orange-500/20 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Employee</span>
                    </button>
                </div>

                {/* Employees List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((employee) => (
                        <div key={employee.id} className="glass-card p-6 flex flex-col group relative bg-white/60 border-white/40">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDeleteEmployee(employee.id)}
                                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blood-orange-500 to-orange-400 flex items-center justify-center text-xl font-bold text-white shadow-md">
                                    {employee.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-blood-orange-600 font-medium">
                                        <Briefcase className="w-3 h-3" />
                                        <span>{employee.position}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mt-auto">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{employee.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{employee.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 pt-2 border-t border-gray-100">
                                    <ShieldCheck className={`w-4 h-4 ${employee.role === 'Admin' ? 'text-yellow-500' : 'text-gray-400'}`} />
                                    <span className={employee.role === 'Admin' ? 'text-yellow-600 font-medium' : ''}>{employee.role} Access</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {employees.length === 0 && (
                        <div className="col-span-full p-12 text-center text-gray-500 glass-card bg-white/60 border-white/40">
                            <p>No employees found. Add your first team member.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Employee</h2>

                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                <input
                                    type="text"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="User"
                                            checked={role === "User"}
                                            onChange={() => setRole("User")}
                                            className="accent-blood-orange-600"
                                        />
                                        <span className="text-gray-700">Standard User</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="Admin"
                                            checked={role === "Admin"}
                                            onChange={() => setRole("Admin")}
                                            className="accent-blood-orange-600"
                                        />
                                        <span className="text-gray-700">Admin</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blood-orange-600 to-orange-500 hover:from-blood-orange-500 hover:to-orange-400 text-white font-medium py-2 rounded-lg transition-colors shadow-md"
                                >
                                    Create Account
                                </button>
                                <p className="text-xs text-center text-gray-500 mt-2">
                                    User will receive login instructions via email.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
