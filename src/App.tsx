import * as React from 'react';
import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { employeeService } from './services/employeeService';
import { excelService } from './services/excelService';
import { Employee } from './types';
import { Login } from './components/Login';
import { EmployeeTable } from './components/EmployeeTable';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeDetail } from './components/EmployeeDetail';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { 
  Plus, 
  LogOut, 
  Search, 
  Users, 
  LayoutDashboard, 
  Settings,
  Bell,
  Menu,
  X,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REGISTRY' | 'ALERTS' | 'TERMINAL'>('DASHBOARD');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = employeeService.subscribeToEmployees((data) => {
        setEmployees(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleAddEmployee = async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Adding employee:', data);
    try {
      await employeeService.addEmployee(data);
      setShowForm(false);
      toast.success('Employee registered successfully');
    } catch (error) {
      console.error('Registration Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      try {
        const errorDetail = JSON.parse(message);
        toast.error(`Registration failed: ${errorDetail.error || 'Check required fields'}`);
      } catch {
        toast.error(`Failed to register employee: ${message}`);
      }
    }
  };

  const handleUpdateEmployee = async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Updating employee:', editingEmployee?.id, data);
    if (editingEmployee?.id) {
      try {
        await employeeService.updateEmployee(editingEmployee.id, data);
        setEditingEmployee(null);
        setShowForm(false);
        toast.success('Record updated successfully');
      } catch (error) {
        console.error('Update Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        try {
          const errorDetail = JSON.parse(message);
          toast.error(`Update failed: ${errorDetail.error || 'Permission denied'}`);
        } catch {
          toast.error(`Failed to update record: ${message}`);
        }
      }
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record? This action is irreversible.')) {
      try {
        await employeeService.deleteEmployee(id);
        toast.success('Record deleted');
      } catch (error) {
        toast.error('Failed to delete record');
      }
    }
  };

  const handleExport = async () => {
    try {
      if (filteredEmployees.length === 0) {
        toast.error('No records found to export');
        return;
      }
      await excelService.exportToExcel(filteredEmployees);
      toast.success(`Exported ${filteredEmployees.length} records to Excel`);
    } catch (error) {
      console.error('Export Failed:', error);
      toast.error('Failed to export data. Please try again.');
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
        toast.error('Failed to import Excel data. Ensure the format is correct.');
      }
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-none animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login />
        <Toaster position="top-center" theme="dark" />
      </>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#0A0A0B] flex text-[#E5E5E5] font-sans">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-[#111112] border-r border-white/5 flex-col sticky top-0 h-screen">
        <div className="p-8">
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
              onClick={() => { 
                setActiveTab('REGISTRY'); 
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
              badge={employees.filter(e => e.status === 'on-leave').length.toString()} 
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

          <div className="mt-12 space-y-3">
             <div className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-4 font-bold">External Operations</div>
             <Button 
                onClick={handleExport}
                className="w-full justify-start gap-3 bg-white/5 border border-white/10 rounded-none text-white/60 hover:text-white hover:bg-white/10 h-10 text-[10px] tracking-widest font-bold"
             >
                <Download className="w-3.5 h-3.5" /> EXPORT EXCEL
             </Button>
             <div className="relative">
                <Button 
                    className="w-full justify-start gap-3 bg-white/5 border border-white/10 rounded-none text-white/60 hover:text-white hover:bg-white/10 h-10 text-[10px] tracking-widest font-bold"
                >
                    <Upload className="w-3.5 h-3.5" /> IMPORT EXCEL
                </Button>
                <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
             <Button 
                onClick={() => excelService.downloadSample()}
                variant="ghost"
                className="w-full justify-start gap-3 text-white/20 hover:text-white/40 h-8 text-[9px] tracking-widest font-bold px-0"
             >
                <FileSpreadsheet className="w-3 h-3" /> DOWNLOAD TEMPLATE
             </Button>
          </div>
        </div>
        
        <div className="mt-auto p-8 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-none bg-white/5 border border-white/5 overflow-hidden">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
              className="w-10 h-10 rounded-none transition-all" 
              alt="Profile" 
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white/90 truncate">{user.displayName}</p>
              <p className="text-[10px] text-white/30 truncate uppercase tracking-tighter">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-white/40 hover:text-white/80 hover:bg-white/5 py-4 border border-white/5 rounded-none text-[10px] tracking-[0.2em] font-bold"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" /> DISCONNECT
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-[#0A0A0B] border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6 text-white/60" />
            </Button>
            <div className="text-[#C5A059] font-serif italic text-xl font-bold">RFL</div>
          </div>



          <div className="flex items-center gap-4">
            <div className="relative mr-4 hidden sm:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/20" />
              <Input 
                placeholder="Scan Registry..." 
                className="pl-9 h-10 bg-white/5 border-white/10 rounded-none text-xs w-64 focus-visible:ring-[#C5A059]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {!showForm && !editingEmployee && !selectedEmployee && (
              <Button 
                onClick={handleExport}
                variant="outline"
                className="flex border-white/10 bg-white/[0.02] hover:bg-white/5 text-white/60 hover:text-white rounded-none h-10 px-4 md:px-6 gap-2 text-[10px] uppercase tracking-widest font-bold font-sans"
              >
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export Data</span>
              </Button>
            )}

            <Button 
              onClick={() => setShowForm(true)}
              className="bg-[#C5A059] hover:bg-[#B48F48] text-black rounded-none h-10 px-6 gap-2 text-[10px] uppercase tracking-widest font-bold font-sans shadow-lg shadow-[#C5A059]/10"
            >
              <Plus className="w-4 h-4" /> Initialize Registry
            </Button>
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
            ) : activeTab === 'DASHBOARD' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Personnel" value={employees.length.toString()} sub="Verified Records" />
                  <StatCard label="Active Status" value={employees.filter(e => e.status === 'active').length.toString()} sub="On-Site" />
                  <StatCard label="Administrative" value={employees.filter(e => e.designation === 'Admin').length.toString()} sub="System Access" />
                  <StatCard label="Alert Status" value={employees.filter(e => e.status === 'on-leave' || e.status === 'resigned').length.toString()} sub="Attention Required" color="text-red-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-none">
                    <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-6">Security Node Status</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-xs font-bold tracking-widest uppercase">Database Connectivity</span>
                        </div>
                        <span className="text-[10px] text-white/40">OPTIMAL</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-xs font-bold tracking-widest uppercase">Encryption Shield</span>
                        </div>
                        <span className="text-[10px] text-white/40">ACTIVE - AES256</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-none">
                    <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-6">Data Operations</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <Button 
                          onClick={handleExport}
                          className="w-full justify-center gap-3 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-none text-[#C5A059] hover:bg-[#C5A059]/20 h-14 text-[10px] tracking-widest font-bold"
                       >
                          <Download className="w-4 h-4" /> EXPORT EXCEL
                       </Button>
                       <div className="relative">
                          <Button 
                              className="w-full justify-center gap-3 bg-white/5 border border-white/10 rounded-none text-white/60 hover:text-white hover:bg-white/10 h-14 text-[10px] tracking-widest font-bold"
                          >
                              <Upload className="w-4 h-4" /> IMPORT EXCEL
                          </Button>
                          <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                    </div>
                    <p className="mt-4 text-[9px] text-white/20 uppercase tracking-[0.2em] italic font-medium">
                      Note: Export action encapsulates current verified registry snapshots.
                    </p>
                  </div>
                </div>
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
                  <h2 className="text-2xl font-serif mb-4">Critical Personnel Alerts</h2>
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
                      <p className="text-white/20 text-xs italic">No critical alerts detected in registry.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'TERMINAL' ? (
              <motion.div 
                key="terminal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-xs text-emerald-500 space-y-4 bg-black p-8 border border-white/10"
              >
                <p>&gt; System initialized...</p>
                <p>&gt; Loading registry nodes...</p>
                <p>&gt; Found {employees.length} valid signatures.</p>
                <p>&gt; Terminal RFL secure.</p>
                <p>&gt; Waiting for input...</p>
                <div className="pt-8 border-t border-white/10 text-white/40">
                  <p>TERMINAL CONFIGURATION</p>
                  <p>Region: ASIA-EAST1</p>
                  <p>Encryption: AES-256-GCM</p>
                  <p>Auth Status: VERIFIED</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="registry"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-serif text-white tracking-tight mb-2 font-bold">Registry Terminal</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold">Analyzing {filteredEmployees.length} security profiles</p>
                  </div>
                  
                  {/* Mobile searchable input shown on mobile screen width */}
                  <div className="relative w-full sm:hidden">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/20" />
                    <Input 
                      placeholder="Scan Registry..." 
                      className="pl-9 h-10 bg-white/5 border-white/10 rounded-none text-xs w-full focus-visible:ring-[#C5A059]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex bg-white/5 p-1 border border-white/5">
                    {['all', 'active', 'on-leave', 'resigned'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
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

                <EmployeeTable 
                  employees={filteredEmployees}
                  onEdit={setEditingEmployee}
                  onDelete={handleDeleteEmployee}
                  onView={setSelectedEmployee}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </main>

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
                  <span className="text-[9px] uppercase tracking-widest text-white/30 font-sans">Terminal Node</span>
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
                    onClick={handleExport}
                    className="w-full justify-start gap-3 bg-white/5 border border-white/10 rounded-none text-white/60 hover:text-white hover:bg-white/10 h-10 text-[9px] tracking-widest font-bold"
                 >
                    <Download className="w-3.5 h-3.5" /> EXPORT
                 </Button>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2 text-white/40 hover:text-white/60 py-4 text-[10px] tracking-widest font-bold"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" /> DISCONNECT
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
