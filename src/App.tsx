import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { employeeService } from './services/employeeService';
import { excelService } from './services/excelService';
import { Employee } from './types';
import { EmployeeTable } from './components/EmployeeTable';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeDetail } from './components/EmployeeDetail';
import { GoogleDriveManager } from './components/GoogleDriveManager';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { 
  Plus, 
  Search, 
  Users, 
  LayoutDashboard, 
  Settings,
  Bell,
  Menu,
  X,
  Download,
  Upload,
  FileSpreadsheet,
  HardDrive,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';

interface AppUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
}

const DEFAULT_USER: AppUser = {
  id: 'rfl-admin',
  email: 'admin@rflgroupbd.com',
  displayName: 'RFL Registry',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export default function App() {
  // Direct open without login screen
  const [user] = useState<AppUser>(DEFAULT_USER);
  const [employees, setEmployees] = useState<Employee[]>(() => employeeService.getAll());
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REGISTRY' | 'DRIVE' | 'ALERTS' | 'TERMINAL'>('DASHBOARD');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Subscribe to employee data updates
    const unsubscribe = employeeService.subscribeToEmployees((data) => {
      setEmployees(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAddEmployee = async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await employeeService.addEmployee(data);
      setShowForm(false);
      toast.success('Employee registered successfully into Registry');
    } catch (error) {
      console.error('Registration Error:', error);
      toast.error('Failed to register employee');
    }
  };

  const handleUpdateEmployee = async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEmployee?.id) {
      try {
        await employeeService.updateEmployee(editingEmployee.id, data);
        setEditingEmployee(null);
        setShowForm(false);
        toast.success(`Record for "${data.name}" updated successfully`);
      } catch (error) {
        console.error('Update Error:', error);
        toast.error('Failed to update record');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete?.id) return;
    const target = employeeToDelete;
    setIsDeleting(true);
    try {
      await employeeService.deleteEmployee(target.id);
      setEmployeeToDelete(null);
      toast.success(`"${target.name}" removed from registry`);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete employee record');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const dataToExport = filteredEmployees.length > 0 ? filteredEmployees : employees;
      if (dataToExport.length === 0) {
        toast.error('No employee records to export');
        return;
      }
      await excelService.exportToExcel(dataToExport);
      toast.success(`Exported ${dataToExport.length} records to Excel`);
    } catch (error) {
      console.error('Export Failed:', error);
      toast.error('Failed to export data');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const importedData = await excelService.importFromExcel(file);
        for (const emp of importedData) {
          await employeeService.addEmployee(emp);
        }
        toast.success(`Imported ${importedData.length} records successfully`);
      } catch (error) {
        toast.error('Failed to import Excel data. Ensure the format is valid.');
      }
      // Reset input value
      e.target.value = '';
    }
  };

  const handleResetSampleData = () => {
    employeeService.resetToInitialRecords();
    toast.success('Registry initialized with sample data');
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nid.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#0A0A0B] flex text-[#E5E5E5] font-sans">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-[#111112] border-r border-white/5 flex-col sticky top-0 h-screen">
        <div className="p-8 flex-1 flex flex-col">
          <div className="flex flex-col mb-10">
            <div className="text-[#C5A059] font-serif italic text-3xl tracking-tight mb-1 font-bold">RFL</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Employee Registry</div>
          </div>
          
          <nav className="space-y-1">
            <SidebarLink 
              icon={<LayoutDashboard />} 
              label="DASHBOARD" 
              active={activeTab === 'DASHBOARD'} 
              onClick={() => { 
                setActiveTab('DASHBOARD'); 
                setShowForm(false);
                setEditingEmployee(null);
                setSelectedEmployee(null);
                setIsMobileMenuOpen(false); 
              }}
            />
            <SidebarLink 
              icon={<Users />} 
              label="REGISTRY" 
              active={activeTab === 'REGISTRY'} 
              badge={employees.length.toString()}
              onClick={() => { 
                setActiveTab('REGISTRY'); 
                setShowForm(false);
                setEditingEmployee(null);
                setSelectedEmployee(null);
                setIsMobileMenuOpen(false); 
              }}
            />
            <SidebarLink 
              icon={<HardDrive />} 
              label="GOOGLE DRIVE" 
              active={activeTab === 'DRIVE'} 
              onClick={() => { 
                setActiveTab('DRIVE'); 
                setShowForm(false);
                setEditingEmployee(null);
                setSelectedEmployee(null);
                setIsMobileMenuOpen(false); 
              }}
            />
            <SidebarLink 
              icon={<Bell />} 
              label="ALERTS" 
              active={activeTab === 'ALERTS'}
              badge={employees.filter(e => e.status === 'on-leave' || e.status === 'resigned').length.toString()} 
              onClick={() => { 
                setActiveTab('ALERTS'); 
                setShowForm(false);
                setEditingEmployee(null);
                setSelectedEmployee(null);
                setIsMobileMenuOpen(false); 
              }}
            />
            <SidebarLink 
              icon={<Settings />} 
              label="TERMINAL" 
              active={activeTab === 'TERMINAL'}
              onClick={() => { 
                setActiveTab('TERMINAL'); 
                setShowForm(false);
                setEditingEmployee(null);
                setSelectedEmployee(null);
                setIsMobileMenuOpen(false); 
              }}
            />
          </nav>
        </div>
        
        {/* Sidebar Footer Profile */}
        <div className="p-8 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-none bg-white/5 border border-white/5 overflow-hidden">
            <img 
              src={user.photoURL} 
              className="w-10 h-10 rounded-none transition-all object-cover" 
              alt="Profile" 
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white/90 truncate">{user.displayName}</p>
              <p className="text-[10px] text-white/30 truncate uppercase tracking-tighter">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-[#0A0A0B] border-b border-white/5 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6 text-white/60" />
            </Button>
            <div className="text-[#C5A059] font-serif italic text-xl font-bold">RFL</div>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-white/40 font-bold">Current Node:</span>
            <span className="text-xs text-[#C5A059] font-mono font-bold tracking-wider">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            {!showForm && !editingEmployee && !selectedEmployee && activeTab === 'REGISTRY' && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-[#C5A059] hover:bg-[#B48F48] text-black rounded-none h-10 px-5 gap-2 text-[10px] uppercase tracking-widest font-bold font-sans shadow-lg shadow-[#C5A059]/10"
              >
                <Plus className="w-4 h-4" /> Initialize Register
              </Button>
            )}
          </div>
        </header>

        <div className="p-6 md:p-10 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {showForm || editingEmployee ? (
              <EmployeeForm 
                initialData={editingEmployee || undefined}
                onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEmployee(null);
                }}
              />
            ) : selectedEmployee ? (
              <EmployeeDetail 
                employee={selectedEmployee} 
                onClose={() => setSelectedEmployee(null)} 
              />
            ) : activeTab === 'REGISTRY' ? (
              <motion.div 
                key="registry"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Registry Tab Header & Primary Operations Panel */}
                <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-serif text-white tracking-tight font-bold">Staff Registry</h2>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-1">
                        {employees.length} Personnel Records Registered
                      </p>
                    </div>

                    {/* Integrated Operations: Initialize Register, Export, Import, Template */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        onClick={() => setShowForm(true)}
                        className="bg-[#C5A059] hover:bg-[#B48F48] text-black rounded-none h-9 px-4 gap-1.5 text-[10px] uppercase tracking-widest font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Initialize Register
                      </Button>

                      <Button 
                        onClick={handleExport}
                        variant="outline"
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-none h-9 px-4 gap-1.5 text-[10px] uppercase tracking-widest font-bold"
                      >
                        <Download className="w-3.5 h-3.5 text-[#C5A059]" /> Export Excel
                      </Button>

                      <div className="relative">
                        <Button 
                          variant="outline"
                          className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-none h-9 px-4 gap-1.5 text-[10px] uppercase tracking-widest font-bold"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#C5A059]" /> Import Excel
                        </Button>
                        <input 
                          type="file" 
                          accept=".xlsx, .xls" 
                          onChange={handleImport} 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>

                      <Button 
                        onClick={() => excelService.downloadSample()}
                        variant="ghost"
                        className="text-white/40 hover:text-white hover:bg-white/5 rounded-none h-9 px-3 gap-1.5 text-[10px] uppercase tracking-widest font-bold"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Template
                      </Button>

                      <Button
                        onClick={handleResetSampleData}
                        variant="ghost"
                        title="Restore initial sample employee records"
                        className="text-white/20 hover:text-white/60 hover:bg-white/5 rounded-none h-9 px-2 text-[10px] uppercase tracking-widest"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Filter & Search Bar inside Registry */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                      <Input 
                        placeholder="Search by name, ID, phone, NID..." 
                        className="pl-9 h-10 bg-white/5 border-white/10 rounded-none text-xs w-full focus-visible:ring-[#C5A059]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="flex bg-white/5 p-1 border border-white/5 w-full sm:w-auto overflow-x-auto">
                      {['all', 'active', 'on-leave', 'resigned'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                            statusFilter === status 
                            ? 'bg-[#C5A059] text-black shadow-lg shadow-[#C5A059]/20' 
                            : 'text-white/40 hover:text-white/60'
                          }`}
                        >
                          {status.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table View */}
                <EmployeeTable 
                  employees={filteredEmployees}
                  onEdit={(emp) => setEditingEmployee(emp)}
                  onDelete={(emp) => setEmployeeToDelete(emp)}
                  onView={(emp) => setSelectedEmployee(emp)}
                />
              </motion.div>
            ) : activeTab === 'DASHBOARD' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Header Welcome banner inside Dashboard */}
                <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-serif text-white tracking-tight font-bold">Executive Dashboard</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-1">
                      System Operational Overview & High-Level Personnel Analytics
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      onClick={() => {
                        setActiveTab('REGISTRY');
                        setShowForm(true);
                      }}
                      className="bg-[#C5A059] hover:bg-[#B48F48] text-black rounded-none h-9 px-4 gap-1.5 text-[10px] uppercase tracking-widest font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Initialize Register
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('REGISTRY')}
                      variant="outline"
                      className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-none h-9 px-4 gap-1.5 text-[10px] uppercase tracking-widest font-bold"
                    >
                      <Users className="w-3.5 h-3.5 text-[#C5A059]" /> View Full Registry
                    </Button>
                  </div>
                </div>

                {/* Key Metrics / Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Personnel" value={employees.length.toString()} sub="Verified Records" />
                  <StatCard label="Active Status" value={employees.filter(e => e.status === 'active').length.toString()} sub="On-Site" />
                  <StatCard label="On Leave" value={employees.filter(e => e.status === 'on-leave').length.toString()} sub="Active Leaves" color="text-amber-400" />
                  <StatCard label="Resigned" value={employees.filter(e => e.status === 'resigned').length.toString()} sub="Past Personnel" color="text-red-400" />
                </div>

                {/* Recent Personnel Overview & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Staff Activity List (2 cols) */}
                  <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-6 md:p-8 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-serif text-white font-bold">Recent Registered Staff</h3>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">Latest 5 Personnel Entries</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('REGISTRY')}
                        className="text-[10px] uppercase tracking-widest text-[#C5A059] hover:bg-[#C5A059]/10 rounded-none h-8 px-3"
                      >
                        All ({employees.length}) &rarr;
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {employees.slice(0, 5).map((emp) => (
                        <div 
                          key={emp.id || emp.employeeId}
                          onClick={() => setSelectedEmployee(emp)}
                          className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 hover:border-[#C5A059]/30 hover:bg-white/[0.07] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img 
                              src={emp.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`} 
                              alt={emp.name} 
                              className="w-10 h-10 object-cover border border-white/10 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-serif font-bold text-white/90 group-hover:text-[#C5A059] transition-colors truncate">{emp.name}</p>
                              <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{emp.designation} &bull; ID: {emp.employeeId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`w-2 h-2 rounded-full ${
                              emp.status === 'active' 
                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                                : emp.status === 'resigned' 
                                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                                : 'bg-amber-500'
                            }`} />
                            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold hidden sm:inline">{emp.status}</span>
                          </div>
                        </div>
                      ))}

                      {employees.length === 0 && (
                        <div className="p-8 text-center text-white/20 italic text-xs">
                          No personnel registered yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security & System Connectivity (1 col) */}
                  <div className="space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 space-y-4">
                      <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">System Nodes</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3.5 bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[11px] font-bold tracking-wider uppercase">Database Sync</span>
                          </div>
                          <span className="text-[9px] text-white/40 font-mono">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center p-3.5 bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-[11px] font-bold tracking-wider uppercase">Storage Vault</span>
                          </div>
                          <span className="text-[9px] text-white/40 font-mono">SECURE</span>
                        </div>
                        <div className="flex justify-between items-center p-3.5 bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-[#C5A059] rounded-full"></div>
                            <span className="text-[11px] font-bold tracking-wider uppercase">Drive Link</span>
                          </div>
                          <span className="text-[9px] text-white/40 font-mono">READY</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 space-y-4">
                      <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">Quick Operations</h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        <Button 
                          onClick={handleExport}
                          className="w-full justify-start gap-2 bg-white/5 border border-white/10 rounded-none text-white hover:bg-white/10 h-10 text-[10px] tracking-widest font-bold uppercase"
                        >
                          <Download className="w-3.5 h-3.5 text-[#C5A059]" /> Export Personnel Excel
                        </Button>
                        <Button 
                          onClick={() => setActiveTab('DRIVE')}
                          className="w-full justify-start gap-2 bg-white/5 border border-white/10 rounded-none text-white hover:bg-white/10 h-10 text-[10px] tracking-widest font-bold uppercase"
                        >
                          <HardDrive className="w-3.5 h-3.5 text-[#C5A059]" /> Open Cloud Backup
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'DRIVE' ? (
              <motion.div 
                key="drive"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-serif text-white tracking-tight mb-2 font-bold">Google Drive Storage</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold">Manage Registry backups, document attachments & cloud sync</p>
                  </div>
                </div>
                <GoogleDriveManager employees={employees} />
              </motion.div>
            ) : activeTab === 'ALERTS' ? (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-8 border border-white/5 bg-white/[0.02]">
                  <h2 className="text-2xl font-serif mb-4 font-bold">Critical Personnel Alerts</h2>
                  <div className="space-y-4">
                    {employees.filter(e => e.status === 'on-leave' || e.status === 'resigned').map(emp => (
                      <div key={emp.id} className="p-4 bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 flex items-center justify-center">
                             <Bell className="w-4 h-4 text-red-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest">{emp.name}</p>
                            <p className="text-[10px] text-white/40">{emp.status === 'on-leave' ? 'PERSONNEL ON LEAVE' : 'PERSONNEL RESIGNED'}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(emp)} className="text-[9px] uppercase tracking-widest hover:bg-white/5">Analyze</Button>
                      </div>
                    ))}
                    {employees.filter(e => e.status === 'on-leave' || e.status === 'resigned').length === 0 && (
                      <div className="p-8 text-center text-white/20 text-xs italic flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500/40" />
                        No critical alerts detected in registry.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="terminal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-xs text-emerald-500 space-y-4 bg-black p-8 border border-white/10"
              >
                <p>&gt; RFL Registry System Initialized...</p>
                <p>&gt; Loading registry nodes...</p>
                <p>&gt; Total records found: {employees.length}</p>
                <p>&gt; Terminal status: READY</p>
                <div className="pt-8 border-t border-white/10 text-white/40 space-y-1">
                  <p>TERMINAL CONFIGURATION</p>
                  <p>Storage: Local Persistent Cache + Supabase Realtime Sync</p>
                  <p>Drive Integration: Active</p>
                  <p>Status: OPERATIONAL</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Delete In-App Confirmation Modal (Guaranteed to work in iframe) */}
      <AnimatePresence>
        {employeeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111112] border border-red-500/30 p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-2.5 bg-red-500/10 rounded-none border border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Delete Employee Record</h3>
                  <p className="text-[10px] uppercase tracking-widest text-red-400/80 font-bold">Irreversible Action</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 space-y-2">
                <p className="text-xs text-white/80 font-serif font-bold text-base">
                  {employeeToDelete.name}
                </p>
                <div className="flex gap-4 text-[10px] text-white/40 font-mono">
                  <span>ID: {employeeToDelete.employeeId}</span>
                  <span>{employeeToDelete.designation}</span>
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed">
                Are you sure you want to permanently delete this employee record from the registry?
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setEmployeeToDelete(null)}
                  disabled={isDeleting}
                  className="rounded-none text-xs uppercase tracking-wider text-white/60 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-none text-xs uppercase tracking-wider font-bold gap-2 px-5"
                >
                  <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[#111112] z-50 lg:hidden p-8 flex flex-col border-r border-white/5"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex flex-col">
                  <span className="text-[#C5A059] font-serif italic text-2xl font-bold">RFL</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/30 font-sans">Employee Registry</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-white/40">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="space-y-6">
                <SidebarLink 
                  icon={<LayoutDashboard />} 
                  label="DASHBOARD" 
                  active={activeTab === 'DASHBOARD'} 
                  onClick={() => { 
                    setActiveTab('DASHBOARD'); 
                    setShowForm(false);
                    setEditingEmployee(null);
                    setSelectedEmployee(null);
                    setIsMobileMenuOpen(false); 
                  }} 
                />
                <SidebarLink 
                  icon={<Users />} 
                  label="REGISTRY" 
                  active={activeTab === 'REGISTRY'} 
                  onClick={() => { 
                    setActiveTab('REGISTRY'); 
                    setShowForm(false);
                    setEditingEmployee(null);
                    setSelectedEmployee(null);
                    setIsMobileMenuOpen(false); 
                  }} 
                />
                <SidebarLink 
                  icon={<HardDrive />} 
                  label="GOOGLE DRIVE" 
                  active={activeTab === 'DRIVE'} 
                  onClick={() => { 
                    setActiveTab('DRIVE'); 
                    setShowForm(false);
                    setEditingEmployee(null);
                    setSelectedEmployee(null);
                    setIsMobileMenuOpen(false); 
                  }} 
                />
                <SidebarLink 
                  icon={<Bell />} 
                  label="ALERTS" 
                  active={activeTab === 'ALERTS'} 
                  onClick={() => { 
                    setActiveTab('ALERTS'); 
                    setShowForm(false);
                    setEditingEmployee(null);
                    setSelectedEmployee(null);
                    setIsMobileMenuOpen(false); 
                  }} 
                />
                <SidebarLink 
                  icon={<Settings />} 
                  label="TERMINAL" 
                  active={activeTab === 'TERMINAL'} 
                  onClick={() => { 
                    setActiveTab('TERMINAL'); 
                    setShowForm(false);
                    setEditingEmployee(null);
                    setSelectedEmployee(null);
                    setIsMobileMenuOpen(false); 
                  }} 
                />
              </nav>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
                 <Button 
                    onClick={() => {
                      handleExport();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start gap-3 bg-white/5 border border-white/10 rounded-none text-white/60 hover:text-white hover:bg-white/10 h-10 text-[9px] tracking-widest font-bold"
                 >
                    <Download className="w-3.5 h-3.5 text-[#C5A059]" /> EXPORT EXCEL
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </TooltipProvider>
  );
}

const SidebarLink = ({ icon, label, active, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-3 transition-all group outline-none ${
      active ? 'text-white bg-white/5 border-r-2 border-[#C5A059]' : 'text-white/30 hover:text-white/60'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={active ? 'text-[#C5A059]' : 'text-white/20 group-hover:text-white/40 transition-colors'}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      </span>
      <span className="text-[11px] font-sans tracking-widest font-bold">{label}</span>
    </div>
    {badge && (
      <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold tracking-tighter ${active ? 'bg-[#C5A059] text-black font-sans shadow-[0_0_8px_rgba(197,160,89,0.4)]' : 'bg-white/5 text-white/40'}`}>
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ label, value, sub, color = "text-white" }: { label: string, value: string, sub: string, color?: string }) => (
  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-none flex flex-col gap-2 group hover:bg-white/[0.04] transition-all">
    <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{label}</span>
    <div className="flex items-baseline gap-2">
      <span className={`text-3xl font-serif ${color} font-bold`}>{value}</span>
      <div className="h-[1px] flex-1 bg-[#C5A059]/20"></div>
    </div>
    <span className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-medium">{sub}</span>
  </div>
);
