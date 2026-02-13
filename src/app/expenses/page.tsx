"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState, useEffect } from "react";
import { Plus, Upload, Receipt, DollarSign, X, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteExpense } from "@/actions/expenses";

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    receiptUrl?: string;
    status: "Pending" | "Approved" | "Rejected";
    submittedBy: string;
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const supabase = createClient();

    // Form State
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [receipt, setReceipt] = useState<File | null>(null);

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    useEffect(() => {
        const fetchExpenses = async () => {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching expenses:', error);
            } else if (data) {
                const mapExpenses = data.map((exp: any) => ({
                    id: exp.id,
                    description: exp.description,
                    amount: exp.amount,
                    date: exp.date,
                    receiptUrl: exp.receipt_url,
                    status: exp.status,
                    submittedBy: "Unknown" // We need a join to get name, or just show ID for now.
                }));
                setExpenses(mapExpenses);
            }
        };

        fetchExpenses();
    }, []);

    const handleAddExpense = async (e: React.FormEvent) => {
        // ... (leave existing implementation alone, don't replace with comment this time!)
        e.preventDefault();

        try {
            // TODO: Handle receipt upload to Supabase Storage if bucket exists

            const { data, error } = await supabase
                .from('expenses')
                .insert([
                    {
                        description,
                        amount: parseFloat(amount),
                        date: new Date().toISOString().split('T')[0],
                        status: 'Pending',
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setExpenses([
                    {
                        id: data.id,
                        description: data.description,
                        amount: data.amount,
                        date: data.date,
                        status: data.status,
                        receiptUrl: data.receipt_url,
                        submittedBy: "Current User" // Placeholder until we fetch user
                    },
                    ...expenses
                ]);
                setIsModalOpen(false);
                setDescription("");
                setAmount("");
                setReceipt(null);
            }
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (confirm("Are you sure you want to delete this expense?")) {
            // Optimistic update
            const previousExpenses = [...expenses];
            setExpenses(expenses.filter(e => e.id !== id));

            try {
                const result = await deleteExpense(id);
                if (result.error) {
                    alert(result.error);
                    setExpenses(previousExpenses); // Revert
                } else {
                    // Success
                }
            } catch (err) {
                console.error(err);
                alert("Failed to delete expense.");
                setExpenses(previousExpenses);
            }
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-blood-orange-500/5 rounded-full blur-[120px]" />
            </div>

            <Navbar />

            <div className="pt-32 px-6 pb-12 max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-gradient-orange">
                            Company Expenses
                        </h1>
                        <p className="text-gray-500 mt-1">Manage and track business expenditures.</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                            <p className="text-gray-500 text-xs uppercase tracking-wider">Total Expenses</p>
                            <p className="text-2xl font-bold font-heading text-gray-900">${totalExpenses.toFixed(2)}</p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blood-orange-600 to-orange-500 hover:from-blood-orange-500 hover:to-orange-400 text-white rounded-lg transition-all shadow-lg shadow-orange-500/20 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Expense</span>
                        </button>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="glass-card overflow-hidden bg-white/60 border-white/40">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="p-4 font-medium text-gray-500 text-sm">Description</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm">Submitted By</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm">Date</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm">Status</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm text-right">Amount</th>
                                    <th className="p-4 font-medium text-gray-500 text-sm text-center">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-blood-orange-50/30 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">{expense.description}</td>
                                        <td className="p-4 text-gray-600">{expense.submittedBy}</td>
                                        <td className="p-4 text-gray-600">{expense.date}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${expense.status === 'Approved' ? 'text-green-700 bg-green-100' :
                                                expense.status === 'Rejected' ? 'text-red-700 bg-red-100' :
                                                    'text-yellow-700 bg-yellow-100'
                                                }`}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-900 font-medium text-right">${expense.amount.toFixed(2)}</td>
                                        <td className="p-4 text-center flex items-center justify-center gap-2">
                                            <button className="text-gray-400 hover:text-blood-orange-600 transition-colors" title="View Receipt">
                                                <Receipt className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete Expense"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500">
                                            <p>No expenses recorded yet.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 mb-6 font-heading">Add New Expense</h2>

                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    placeholder="e.g. Client Dinner"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Image</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-blood-orange-500 transition-colors" />
                                        <span className="text-sm text-gray-400 group-hover:text-gray-600 transition-colors">
                                            {receipt ? receipt.name : "Click to upload receipt"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blood-orange-600 to-orange-500 hover:from-blood-orange-500 hover:to-orange-400 text-white font-medium py-2 rounded-lg transition-colors shadow-md"
                                >
                                    Submit Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
