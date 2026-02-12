"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";
import { Plus, Upload, Search, X, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";

interface Lead {
    id: string;
    business_name: string;
    contact_name: string;
    email: string;
    phone: string;
    description: string;
    status: "Hot" | "Warm" | "Cold";
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const supabase = createClient();

    // Form State
    const [formData, setFormData] = useState({
        businessName: "",
        contactName: "",
        email: "",
        phone: "",
        status: "Cold" as "Hot" | "Warm" | "Cold",
        notes: ""
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                console.log("Parsed CSV:", results.data);
                const newLeads = results.data.map((row: any, index) => ({
                    id: `imported-${index}`,
                    business_name: row.BusinessName || row.business_name || "Unknown",
                    contact_name: row.ContactName || row.contact_name || "Unknown",
                    email: row.Email || row.email || "",
                    phone: row.Phone || row.phone || "",
                    description: row.Description || row.description || "",
                    status: "Cold",
                })) as Lead[];

                setLeads([...leads, ...newLeads]);
                setIsImporting(false);
            },
            error: (error) => {
                console.error("CSV Error:", error);
                setIsImporting(false);
            }
        });
    };

    const handleAddLead = (e: React.FormEvent) => {
        e.preventDefault();
        const newLead: Lead = {
            id: Math.random().toString(36).substr(2, 9),
            business_name: formData.businessName,
            contact_name: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            status: formData.status,
            description: formData.notes
        };

        setLeads([...leads, newLead]);
        setFormData({
            businessName: "",
            contactName: "",
            email: "",
            phone: "",
            status: "Cold",
            notes: ""
        });
        setIsModalOpen(false);
    };

    return (
        <main className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blood-orange-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-400/5 rounded-full blur-[100px]" />
            </div>

            <Navbar />

            <div className="pt-32 px-6 pb-12 max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-gradient-orange">
                            Leads Management
                        </h1>
                        <p className="text-gray-500 mt-1">Track and manage your business opportunities.</p>
                    </div>

                    <div className="flex gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-600 shadow-sm">
                            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span>Import CSV</span>
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
                        </label>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blood-orange-600 to-orange-500 hover:from-blood-orange-500 hover:to-orange-400 text-white rounded-lg transition-all shadow-lg shadow-orange-500/20 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Lead</span>
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 text-gray-900 placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                </div>

                {/* Leads Table */}
                <div className="glass-card overflow-hidden bg-white/60 border-white/40">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="p-4 font-medium text-gray-500 text-sm">Business Name</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm">Contact Name</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm">Email</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm">Phone</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm">Status</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm w-1/3">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-blood-orange-50/30 transition-colors group">
                                        <td className="p-4 font-medium text-gray-900">{lead.business_name}</td>
                                        <td className="p-4 text-gray-600">{lead.contact_name}</td>
                                        <td className="p-4 text-gray-600">
                                            <a href={`mailto:${lead.email}`} className="hover:text-blood-orange-600 transition-colors">{lead.email}</a>
                                        </td>
                                        <td className="p-4 text-gray-600">{lead.phone}</td>
                                        <td className="p-4">
                                            <span className={
                                                lead.status === 'Hot' ? 'text-red-700 bg-red-100 px-2 py-1 rounded text-xs font-medium' :
                                                    lead.status === 'Warm' ? 'text-orange-700 bg-orange-100 px-2 py-1 rounded text-xs font-medium' :
                                                        'text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs font-medium'
                                            }>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm truncate max-w-xs">{lead.description}</td>
                                    </tr>
                                ))}
                                {leads.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Search className="w-8 h-8 text-gray-300" />
                                                <p>No leads found. Import CSV or add manually to get started.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Lead Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 mb-6 font-heading">Add New Lead</h2>

                        <form onSubmit={handleAddLead} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    placeholder="Acme Corp"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 appearance-none"
                                    >
                                        <option value="Hot">Hot</option>
                                        <option value="Warm">Warm</option>
                                        <option value="Cold">Cold</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 h-24 resize-none"
                                    placeholder="Add any additional details here..."
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blood-orange-600 to-orange-500 hover:from-blood-orange-500 hover:to-orange-400 text-white font-medium py-2 rounded-lg transition-colors shadow-md"
                                >
                                    Save Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

