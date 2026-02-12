"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Receipt, Calendar, UserCog, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Employees", href: "/employees", icon: UserCog }, // Admin only technically
];

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="glass rounded-full px-6 py-3 flex items-center justify-between mx-auto max-w-7xl">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blood-orange-600 to-orange-500 shadow-lg shadow-orange-500/20" />
                    <span className="font-heading font-bold text-xl tracking-tight text-gray-900 hidden md:block">
                        Amplyfy
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                    isActive
                                        ? "bg-blood-orange-50 text-blood-orange-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <button
                    onClick={handleSignOut}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </nav>
    );
}
