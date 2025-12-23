import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { canteenService } from '../../services/canteenService';
import { formatCurrency } from '../../utils/formatCurrency';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import type { Stall, Bill } from '../../types/canteen';

export const CanteenPage: React.FC = () => {
    // --- STATES ---
    const [activeTab, setActiveTab] = useState<'dashboard' | 'stalls' | 'billing'>('dashboard');
    const [stalls, setStalls] = useState<Stall[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    // Modal States
    const [isStallModalOpen, setIsStallModalOpen] = useState(false);
    const [newStall, setNewStall] = useState({ name: '', location: 'Main Canteen', monthly_rent: '' });
    const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
    const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
    const [newTenant, setNewTenant] = useState({ name: '', contact_number: '', contract_start: new Date().toISOString().split('T')[0] });

    // --- DATA FETCHING ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [stallsData, billsData] = await Promise.all([
                canteenService.getStalls(),
                canteenService.getBills()
            ]);
            setStalls(stallsData);
            setBills(billsData);
        } catch (error) {
            console.error("Error fetching canteen data:", error);
            alert("Failed to load canteen data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- ANALYTICS CALCULATIONS ---
    const { lineData, barData, pieData, stats } = useMemo(() => {
        // Monthly Revenue Map
        const monthlyMap: Record<string, number> = {};
        // Stall Revenue Map
        const stallMap: Record<string, number> = {};

        bills.filter(b => b.status === 'paid').forEach(bill => {
            monthlyMap[bill.month_year] = (monthlyMap[bill.month_year] || 0) + Number(bill.amount);
            const sName = bill.tenant?.stall?.name || 'Unknown';
            stallMap[sName] = (stallMap[sName] || 0) + Number(bill.amount);
        });

        const lineData = Object.keys(monthlyMap).map(m => ({ month: m, revenue: monthlyMap[m] }));
        const barData = Object.keys(stallMap).map(s => ({ stall: s, total: stallMap[s] }));

        const occupied = stalls.filter(s => s.status === 'occupied').length;
        const vacant = stalls.length - occupied;
        const pieData = [
            { name: 'Occupied', value: occupied, color: '#2563eb' },
            { name: 'Vacant', value: vacant, color: '#e5e7eb' }
        ];

        return {
            lineData,
            barData,
            pieData,
            stats: {
                total: stalls.length,
                occupied,
                unpaid: bills.filter(b => b.status === 'unpaid'),
                revenue: bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + Number(b.amount), 0)
            }
        };
    }, [stalls, bills]);

    // --- HANDLERS ---
    const handleSaveStall = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (selectedStall) {
                // FIX: If selectedStall exists, we call UPDATE, not CREATE
                await canteenService.updateStall(selectedStall.id, newStall);
            } else {
                // ADD LOGIC
                await canteenService.createStall(newStall);
            }
            setIsStallModalOpen(false);
            setSelectedStall(null); // IMPORTANT: Reset to null so next click is "Add"
            setNewStall({ name: '', location: 'Main Canteen', monthly_rent: '' });
            fetchData();
        } catch (error) {
            alert("Error saving stall.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAssignTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStall) return;
        setActionLoading(true);
        try {
            await canteenService.createTenant({ ...newTenant, stall_id: selectedStall.id });
            setIsTenantModalOpen(false);
            fetchData();
        } catch (error) { alert("Error assigning tenant."); } finally { setActionLoading(false); }
    };

    const handleMarkAsPaid = async (billId: number) => {
        if (!confirm("Mark this bill as PAID?")) return;
        try {
            await canteenService.payBill(billId);
            fetchData();
        } catch (error) { alert("Failed to update payment."); }
    };

    const handleGenerateMonthlyBills = async () => {
        if (!confirm("Generate bills for all active tenants for the current month?")) return;
        setActionLoading(true);
        try {
            await canteenService.generateBills();
            alert("Bills generated successfully!");
            fetchData();
        } catch (error) {
            alert("Failed to generate bills. Check server logs.");
        } finally {
            setActionLoading(false);
        }
    };



    const handleDeleteStall = async (id: number) => {
        if (!confirm("Are you sure you want to delete this stall? All related data may be lost.")) return;
        setActionLoading(true);
        try {
            await canteenService.deleteStall(id); // Ensure this exists in your canteenService
            fetchData();
        } catch (error) {
            alert("Error deleting stall.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditStall = (stall: Stall) => {
        setSelectedStall(stall);
        setNewStall({
            name: stall.name,
            location: stall.location,
            monthly_rent: stall.monthly_rent.toString()
        });
        setIsStallModalOpen(true);
    };


    if (loading) return <div className="p-10 text-center text-gray-500">Loading Canteen Module...</div>;

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col p-6 space-y-6 overflow-hidden bg-gray-50/50">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Canteen Management</h1>
                <div className="flex bg-gray-200 p-1 rounded-lg">
                    {(['dashboard', 'stalls', 'billing'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {/* 1. DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <DashboardCard title="Total Stalls" value={stats.total} icon="🏪" color="bg-blue-50 text-blue-600" />
                            <DashboardCard title="Occupancy" value={`${stats.occupied}/${stats.total}`} icon="👥" color="bg-indigo-50 text-indigo-600" />
                            <DashboardCard title="Unpaid Bills" value={stats.unpaid.length} icon="⚠️" color="bg-red-50 text-red-600" />
                            <DashboardCard title="Total Revenue" value={formatCurrency(stats.revenue)} icon="💰" color="bg-green-50 text-green-600" />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Revenue Trend Line Chart */}
                            <div className="lg:col-span-2 bg-white p-5 rounded-xl border shadow-sm">
                                <h3 className="font-bold text-gray-700 mb-4">Collection Trend</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={lineData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" fontSize={12} tickMargin={10} />
                                            <YAxis fontSize={12} tickFormatter={(v) => `₱${v}`} />
                                            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#2563eb"
                                                strokeWidth={3}
                                                dot={{ r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Occupancy Pie Chart */}
                            <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col items-center">
                                <h3 className="font-bold text-gray-700 mb-4 self-start">Stall Availability</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" />
                                        </PieChart>
                                    </ResponsiveContainer>

                                </div>
                            </div>

                            {/* Stall Performance Bar Graph */}
                            <div className="lg:col-span-2 bg-white p-5 rounded-xl border shadow-sm">
                                <h3 className="font-bold text-gray-700 mb-4">Revenue by Stall</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={barData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="stall" fontSize={11} />
                                            <YAxis fontSize={12} />
                                            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                            <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pending Payments List */}
                            <div className="bg-white p-5 rounded-xl border shadow-sm overflow-hidden">
                                <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                                    <span>⚠️</span> Pending Collections
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {stats.unpaid.length === 0 ? (
                                        <p className="text-gray-400 text-sm italic">All bills are settled.</p>
                                    ) : (
                                        stats.unpaid.map(bill => (
                                            <div key={bill.id} className="p-3 bg-red-50 rounded-lg border border-red-100 flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{bill.tenant?.name}</p>
                                                    <p className="text-xs text-gray-500">{bill.month_year}</p>
                                                </div>
                                                <span className="text-sm font-bold text-red-600">{formatCurrency(Number(bill.amount))}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. STALLS TAB */}
                {activeTab === 'stalls' && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button size="sm" onClick={() => setIsStallModalOpen(true)}>+ Add New Stall</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stalls.map(stall => (
                                <StallCard
                                    key={stall.id}
                                    stall={stall}
                                    onAssign={() => { setSelectedStall(stall); setIsTenantModalOpen(true); }}
                                    onEdit={() => handleEditStall(stall)}
                                    onDelete={() => handleDeleteStall(stall.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. BILLING TAB */}
                {activeTab === 'billing' && (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Collection Logs</h3>
                            <Button onClick={handleGenerateMonthlyBills} isLoading={actionLoading}>
                                ⚡ Generate Monthly Bills
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Tenant / Stall</th>
                                        <th className="px-4 py-3">Month</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bills.map(bill => (
                                        <tr key={bill.id} className="border-b hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {bill.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold">{bill.tenant?.name || 'N/A'}</div>
                                                <div className="text-xs text-gray-400">{bill.tenant?.stall?.name}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{bill.month_year}</td>
                                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(Number(bill.amount))}</td>
                                            <td className="px-4 py-3 text-center">
                                                {bill.status === 'unpaid' ? (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(bill.id)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBill(bill);
                                                            setIsReceiptModalOpen(true);
                                                        }}
                                                        className="text-green-600 hover:text-green-800 font-medium text-xs border border-green-200 px-3 py-1 rounded hover:bg-green-50 transition"
                                                    >
                                                        View Receipt
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS (Stall, Tenant, Receipt) */}
            <Modal
                isOpen={isStallModalOpen}
                onClose={() => {
                    setIsStallModalOpen(false);
                    setSelectedStall(null);
                    setNewStall({ name: '', location: 'Main Canteen', monthly_rent: '' });
                }}
                title={selectedStall ? "Edit Canteen Stall" : "Add New Canteen Stall"}
            >
                <form onSubmit={handleSaveStall} className="space-y-4">
                    <Input
                        label="Stall Name"
                        placeholder="e.g. Stall 01"
                        value={newStall.name}
                        onChange={(e) => setNewStall({ ...newStall, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Location"
                        placeholder="e.g. Main Canteen"
                        value={newStall.location}
                        onChange={(e) => setNewStall({ ...newStall, location: e.target.value })}
                        required
                    />
                    <Input
                        label="Monthly Rent (₱)"
                        type="number"
                        placeholder="0.00"
                        value={newStall.monthly_rent}
                        onChange={(e) => setNewStall({ ...newStall, monthly_rent: e.target.value })}
                        required
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" type='button' onClick={() => {
                            setIsStallModalOpen(false);
                            setSelectedStall(null);
                        }}>Cancel</Button>
                        <Button type="submit" isLoading={actionLoading}>
                            {selectedStall ? "Update Stall" : "Save Stall"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isTenantModalOpen}
                onClose={() => setIsTenantModalOpen(false)}
                title={`Assign Tenant to ${selectedStall?.name}`}
            >
                <form onSubmit={handleAssignTenant} className="space-y-4">
                    <Input
                        label="Tenant Full Name"
                        placeholder="e.g. Maria Clara"
                        value={newTenant.name}
                        onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Contact Number"
                        placeholder="0912 345 6789"
                        value={newTenant.contact_number}
                        onChange={(e) => setNewTenant({ ...newTenant, contact_number: e.target.value })}
                    />
                    <Input
                        label="Contract Start Date"
                        type="date"
                        value={newTenant.contract_start}
                        onChange={(e) => setNewTenant({ ...newTenant, contract_start: e.target.value })}
                        required
                    />

                    <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                        Assigning a tenant will automatically mark this stall as <strong>Occupied</strong>.
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" type="button" onClick={() => setIsTenantModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={actionLoading}>
                            Confirm Assignment
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                title="Payment Receipt"
            >
                <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm border-2 border-dashed border-gray-300">
                    <div className="text-center border-b border-gray-300 pb-4 mb-4">
                        <h2 className="font-bold text-lg">FilSync CANTEEN</h2>
                        <p>Official Receipt</p>
                    </div>

                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between"><span>Date:</span> <span>{selectedBill?.paid_at ? new Date(selectedBill.paid_at).toLocaleDateString() : 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Bill ID:</span> <span>#{selectedBill?.id}</span></div>
                        <div className="flex justify-between font-bold"><span>Tenant:</span> <span>{selectedBill?.tenant?.name}</span></div>
                        <div className="flex justify-between"><span>Stall:</span> <span>{selectedBill?.tenant?.stall?.name}</span></div>
                    </div>

                    <div className="border-t border-b border-gray-300 py-2 mb-4 font-bold text-center uppercase">
                        {selectedBill?.month_year} RENT
                    </div>

                    <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL PAID:</span>
                        <span>{formatCurrency(Number(selectedBill?.amount || 0))}</span>
                    </div>

                    <div className="mt-6 text-center text-xs text-gray-500 italic">
                        Thank you for your payment!
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button onClick={() => window.print()} variant="outline">Print Receipt</Button>
                </div>
            </Modal>
        </div>
    );
};

// --- SUB-COMPONENTS ---
const DashboardCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>{icon}</div>
        <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{title}</p>
            <p className="text-2xl font-black text-gray-800">{value}</p>
        </div>
    </div>
);

const StallCard = ({ stall, onAssign, onEdit, onDelete }: any) => (
    <div className="bg-white border rounded-xl p-5 shadow-sm relative overflow-hidden transition-hover hover:shadow-md">
        <div className="absolute top-2 right-2 flex space-x-1">
            {/* Edit Button */}
            <button onClick={onEdit} className="p-1.5 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-md transition">
                ✏️
            </button>
            {/* Delete Button */}
            <button onClick={onDelete} className="p-1.5 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-md transition">
                🗑️
            </button>
        </div>
        <h3 className="font-bold text-lg text-gray-800">{stall.name}</h3>
        <p className="text-xs text-gray-400 mb-3">{stall.location}</p>
        <p className="text-blue-600 font-black text-xl">{formatCurrency(Number(stall.monthly_rent))}</p>
        <div className="mt-4 pt-4 border-t border-gray-50">
            {stall.status === 'occupied' ? (
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Current Tenant</p>
                    <p className="font-bold text-gray-700">{stall.tenant?.name}</p>
                </div>
            ) : (
                <Button variant="outline" className="w-full py-1 text-xs" onClick={onAssign}>+ Assign Tenant</Button>
            )}
        </div>
    </div>
);


