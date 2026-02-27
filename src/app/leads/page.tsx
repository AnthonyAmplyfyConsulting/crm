"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState, useEffect } from "react";
import { Plus, Upload, Search, X, Loader2, Pencil } from "lucide-react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { deleteLead, updateLead } from "@/actions/leads";

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
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    // Edit Form State
    const [editFormData, setEditFormData] = useState({
        businessName: "",
        contactName: "",
        email: "",
        phone: "",
        status: "Cold" as "Hot" | "Warm" | "Cold",
        notes: ""
    });

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

                setLeads([...leads, ...newLeads]); // This might need adjustment if we want to save imported leads to DB immediately
                setIsImporting(false);
            },
            error: (error) => {
                console.error("CSV Error:", error);
                setIsImporting(false);
            }
        });
    };

    useEffect(() => {
        const fetchLeads = async () => {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching leads:', error);
            } else if (data) {
                setLeads(data);
            }
        };

        fetchLeads();
    }, []);

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { data, error } = await supabase
                .from('leads')
                .insert([
                    {
                        business_name: formData.businessName,
                        contact_name: formData.contactName,
                        email: formData.email,
                        phone: formData.phone,
                        status: formData.status,
                        description: formData.notes
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setLeads([...leads, data]);
                setFormData({
                    businessName: "",
                    contactName: "",
                    email: "",
                    phone: "",
                    status: "Cold",
                    notes: ""
                });
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Error adding lead:', error);
        }
    };

    const handleDeleteLead = async (id: string) => {
        if (confirm("Are you sure you want to delete this lead?")) {
            try {
                if (id.startsWith('imported-')) {
                    setLeads(leads.filter(l => l.id !== id));
                    return;
                }

                const result = await deleteLead(id);
                if (result.error) {
                    alert(result.error);
                } else {
                    setLeads(leads.filter(l => l.id !== id));
                }
            } catch (err) {
                console.error(err);
                alert("Failed to delete lead.");
            }
        }
    };

    const openEditModal = (lead: Lead) => {
        setEditingLead(lead);
        setEditFormData({
            businessName: lead.business_name || "",
            contactName: lead.contact_name || "",
            email: lead.email || "",
            phone: lead.phone || "",
            status: lead.status || "Cold",
            notes: lead.description || ""
        });
    };

    const handleEditLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLead) return;

        setIsSaving(true);
        try {
            const result = await updateLead(editingLead.id, {
                business_name: editFormData.businessName,
                contact_name: editFormData.contactName,
                email: editFormData.email,
                phone: editFormData.phone,
                status: editFormData.status,
                description: editFormData.notes
            });

            if (result.error) {
                alert(result.error);
            } else {
                setLeads(leads.map(l =>
                    l.id === editingLead.id
                        ? {
                            ...l,
                            business_name: editFormData.businessName,
                            contact_name: editFormData.contactName,
                            email: editFormData.email,
                            phone: editFormData.phone,
                            status: editFormData.status,
                            description: editFormData.notes
                        }
                        : l
                ));
                setEditingLead(null);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update lead.");
        } finally {
            setIsSaving(false);
        }
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
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your business opportunities.</p>
                    </div>

                    <div className="flex gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
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
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                </div>

                {/* Leads Table */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                    <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Business Name</th>
                                    <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Contact Name</th>
                                    <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Email</th>
                                    <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Phone</th>
                                    <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Status</th>
                                    <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm w-1/3">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {leads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => openEditModal(lead)}
                                        className="hover:bg-blood-orange-50/30 dark:hover:bg-blood-orange-950/20 transition-colors group cursor-pointer"
                                    >
                                        <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{lead.business_name}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400">{lead.contact_name}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400">
                                            <a
                                                href={`mailto:${lead.email}`}
                                                className="hover:text-blood-orange-600 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {lead.email}
                                            </a>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400">{lead.phone}</td>
                                        <td className="p-4">
                                            <span className={
                                                lead.status === 'Hot' ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 px-2 py-1 rounded text-xs font-medium' :
                                                    lead.status === 'Warm' ? 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 px-2 py-1 rounded text-xs font-medium' :
                                                        'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 px-2 py-1 rounded text-xs font-medium'
                                            }>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400 text-sm truncate max-w-xs">{lead.description}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded transition-colors"
                                                title="Delete Lead"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {leads.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500 dark:text-gray-400">
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
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 font-heading">Add New Lead</h2>

                        <form onSubmit={handleAddLead} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    placeholder="Acme Corp"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 appearance-none"
                                    >
                                        <option value="Hot">Hot</option>
                                        <option value="Warm">Warm</option>
                                        <option value="Cold">Cold</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 h-24 resize-none"
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

            {/* Edit Lead Modal */}
            {editingLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                        <button
                            onClick={() => setEditingLead(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 font-heading flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-blood-orange-500" />
                            Edit Lead
                        </h2>

                        <form onSubmit={handleEditLead} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.businessName}
                                    onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.contactName}
                                        onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 appearance-none"
                                    >
                                        <option value="Hot">Hot</option>
                                        <option value="Warm">Warm</option>
                                        <option value="Cold">Cold</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                <textarea
                                    value={editFormData.notes}
                                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 h-24 resize-none"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-gradient-to-r from-blood-orange-600 to-orange-500 hover:from-blood-orange-500 hover:to-orange-400 text-white font-medium py-2 rounded-lg transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

