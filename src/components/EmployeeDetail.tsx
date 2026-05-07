import React from 'react';
import { Employee } from '../types';
import { Button } from './ui/button';
import { 
  X, Phone, MapPin, Calendar, CreditCard, 
  DollarSign, Briefcase, User, Users,
  ArrowLeft, Download, CalendarDays
} from 'lucide-react';
import { motion } from 'motion/react';
import { excelService } from '../services/excelService';

interface EmployeeDetailProps {
  employee: Employee;
  onClose: () => void;
}

export const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employee, onClose }) => {
  const handleExportProfile = async () => {
    await excelService.exportToExcel([employee], `Profile_${employee.employeeId}.xlsx`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-10 bg-transparent"
    >
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-center gap-10 bg-white/[0.02] p-6 md:p-10 border border-white/5 rounded-sm">
        <div className="relative">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 border border-white/10 rounded-none flex items-center justify-center overflow-hidden">
             {employee.photoUrl ? (
               <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover transition-all duration-700" />
             ) : (
               <User className="w-16 h-16 text-white/5" />
             )}
          </div>
          <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-none border-4 border-[#0A0A0B] ${employee.status === 'active' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : employee.status === 'on-leave' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-red-500'}`}></div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight">{employee.name}</h1>
            <div className="flex gap-2 justify-center">
               <Button onClick={onClose} variant="ghost" className="text-white/20 hover:text-white/60 hover:bg-white/5 h-10 w-10 rounded-none p-0 border border-white/5">
                  <ArrowLeft className="w-5 h-5" />
               </Button>
               <Button 
                onClick={handleExportProfile}
                className="bg-[#C5A059] hover:bg-[#B48F48] text-black h-10 px-6 rounded-none uppercase text-[10px] font-bold tracking-widest flex gap-2"
               >
                  <Download className="w-4 h-4" /> Export Profile
               </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
            <span className="text-[#C5A059] uppercase text-[11px] font-bold tracking-[0.2em]">{employee.designation}</span>
            <span className="hidden md:block h-3 w-[1px] bg-white/10"></span>
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-mono">STAFF-ID: {employee.employeeId}</span>
            <span className="hidden md:block h-3 w-[1px] bg-white/10"></span>
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em]">STATUS: {employee.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Leave Info Banner */}
      {employee.status === 'on-leave' && (
        <div className="bg-amber-500/5 border-l-4 border-amber-500 p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <CalendarDays className="w-8 h-8 text-amber-500" />
              <div>
                <h4 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">Administrative Leave Status</h4>
                <p className="text-white/60 text-sm italic">Deployed on leave from <span className="text-white font-bold">{employee.leaveStartDate}</span> until <span className="text-white font-bold">{employee.leaveEndDate}</span></p>
              </div>
           </div>
           <div className="text-[10px] text-white/20 uppercase tracking-widest font-bold hidden sm:block">
              Registry Log: #{Math.floor(Math.random() * 90000) + 10000}
           </div>
        </div>
      )}

      {/* Detailed Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Employment & Contact */}
        <div className="space-y-8">
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-sm shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#C5A059] mb-6 font-bold">Employment Records</h3>
            <div className="space-y-5">
              <StatRow label="Joining Date" value={employee.joiningDate} italic />
              <StatRow label="NID Reference" value={employee.nid} />
              <StatRow label="Monthly Salary" value={`${employee.salary.toLocaleString()} BDT`} />
              <StatRow label="Accountability" value={employee.status === 'active' ? 'Operational' : 'Restricted'} />
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-sm shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#C5A059] mb-6 font-bold">Communications</h3>
            <div className="space-y-5">
              <StatRow label="Phone Line" value={employee.phone} />
              <StatRow label="System Mail" value={`${employee.name.toLowerCase().replace(' ', '.')}@rfl-group.com`} italic />
            </div>
          </div>
        </div>

        {/* Column 2: Guardian Registry */}
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-sm flex flex-col shadow-sm">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#C5A059] mb-8 font-bold">Liaison Profile</h3>
          <div className="space-y-10 flex-1">
            <div className="group">
              <div className="text-[10px] text-white/20 uppercase tracking-widest mb-2 font-bold">Guardian Information 1</div>
              <div className="text-lg text-white/90 font-serif mb-1 font-bold">{employee.guardian1.name}</div>
              <div className="text-[11px] text-[#C5A059]/60 italic font-mono mb-2">Relationship: {employee.guardian1.relation}</div>
              <div className="text-xs text-white/40 flex items-center gap-2"><Phone className="w-3 h-3" /> {employee.guardian1.phone}</div>
            </div>
            
            <div className="pt-8 border-t border-white/5 group">
              <div className="text-[10px] text-white/20 uppercase tracking-widest mb-2 font-bold">Guardian Information 2</div>
              <div className="text-lg text-white/90 font-serif mb-1 font-bold">{employee.guardian2.name || 'Not Registered'}</div>
              {employee.guardian2.name && (
                <>
                  <div className="text-[11px] text-[#C5A059]/60 italic font-mono mb-2">Relationship: {employee.guardian2.relation}</div>
                  <div className="text-xs text-white/40 flex items-center gap-2"><Phone className="w-3 h-3" /> {employee.guardian2.phone}</div>
                </>
              )}
            </div>
          </div>
          <div className="mt-10 p-4 bg-white/5 flex gap-3 border-l-2 border-[#C5A059]/40">
             <div className="text-[10px] text-white/30 italic leading-relaxed">
               Authorized personnel for critical notifications and emergency extraction protocols.
             </div>
          </div>
        </div>

        {/* Column 3: Address Registry */}
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-sm shadow-sm">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#C5A059] mb-8 font-bold">Location Registry</h3>
          <div className="space-y-10">
            <div>
              <div className="text-[10px] text-white/20 uppercase tracking-widest mb-3 font-bold">Present Address</div>
              <p className="text-sm leading-relaxed text-white/60 font-medium">
                {employee.presentAddress}
              </p>
            </div>
            <div className="pt-8 border-t border-white/5">
              <div className="text-[10px] text-white/20 uppercase tracking-widest mb-3 font-bold">Permanent Address</div>
              <p className="text-sm leading-relaxed text-white/60 font-medium italic">
                {employee.permanentAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatRow = ({ label, value, italic }: { label: string, value: string, italic?: boolean }) => (
  <div className="flex justify-between border-b border-white/5 pb-3 items-baseline">
    <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">{label}</span>
    <span className={`text-xs text-white/80 ${italic ? 'italic' : ''} font-medium`}>{value}</span>
  </div>
);
