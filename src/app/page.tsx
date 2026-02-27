"use client";

import { Navbar } from "@/components/layout/Navbar";
import { ArrowUpRight, Users, DollarSign, TrendingUp } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [metrics, setMetrics] = useState({
    totalExpenses: 0,
    totalLeads: 0,
    leadsByStatus: { Hot: 0, Warm: 0, Cold: 0 },
    activeClients: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('status');

        if (leadsError) throw leadsError;

        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('amount, status');

        if (expensesError) throw expensesError;

        const leadsByStatus = (leads || []).reduce((acc: any, lead: any) => {
          const status = lead.status as "Hot" | "Warm" | "Cold";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, { Hot: 0, Warm: 0, Cold: 0 });

        const totalExpenses = (expenses || [])
          .filter((e: any) => e.status !== 'Rejected')
          .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

        setMetrics({
          totalExpenses,
          totalLeads: (leads || []).length,
          leadsByStatus,
          activeClients: 0
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const getPercent = (count: number) => metrics.totalLeads > 0 ? (count / metrics.totalLeads) * 100 : 0;

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blood-orange-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-400/5 rounded-full blur-[100px]" />
      </div>

      <Navbar />

      <div className="pt-32 px-6 pb-12 max-w-7xl mx-auto relative z-10">
        <div className="mb-12">
          <h1 className="text-5xl font-heading font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Welcome back, Anthony
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Here&apos;s what&apos;s happening at Amplyfy today.</p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[180px]">

          {/* Revenue Card - Large */}
          <div className="md:col-span-2 md:row-span-2 glass-card p-8 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Revenue</p>
                <h3 className="text-5xl font-heading font-bold text-gray-900 dark:text-white mt-2">$0.00</h3>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gradient-to-t from-blood-orange-500/5 to-transparent rounded-lg border border-blood-orange-500/10 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  No revenue data available
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                <span>Waiting for data...</span>
              </div>
            </div>
          </div>

          {/* Active Clients */}
          <div className="md:col-span-1 glass-card p-6 flex flex-col justify-between group hover:border-blood-orange-500/30">
            <div className="flex justify-between items-start">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Clients</p>
              <Users className="w-5 h-5 text-blood-orange-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.activeClients}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No active clients</p>
            </div>
          </div>

          {/* Expenses Summary */}
          <div className="md:col-span-1 glass-card p-6 flex flex-col justify-between group hover:border-orange-500/30">
            <div className="flex justify-between items-start">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Expenses</p>
              <DollarSign className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                ${metrics.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total pending & approved</p>
            </div>
          </div>

          {/* Leads Breakdown */}
          <div className="md:col-span-2 glass-card p-5 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Leads Pipeline</p>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">Total: {metrics.totalLeads}</span>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {/* Hot */}
              <div className="group">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-500 font-medium">Hot Leads</span>
                  <span className="text-gray-400 dark:text-gray-500">{metrics.leadsByStatus.Hot}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000 ease-out"
                    style={{ width: `${getPercent(metrics.leadsByStatus.Hot)}%` }}
                  />
                </div>
              </div>

              {/* Warm */}
              <div className="group">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-orange-500 font-medium">Warm Leads</span>
                  <span className="text-gray-400 dark:text-gray-500">{metrics.leadsByStatus.Warm}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-1000 ease-out"
                    style={{ width: `${getPercent(metrics.leadsByStatus.Warm)}%` }}
                  />
                </div>
              </div>

              {/* Cold */}
              <div className="group">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-500 font-medium">Cold Leads</span>
                  <span className="text-gray-400 dark:text-gray-500">{metrics.leadsByStatus.Cold}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: `${getPercent(metrics.leadsByStatus.Cold)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
