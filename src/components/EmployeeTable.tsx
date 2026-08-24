import * as React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Button, buttonVariants } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
} from './ui/tooltip';
import { Employee } from '../types';
import { EMPLOYEE_STATUS } from '../constants';
import { Edit, Trash2, Eye, User, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onView: (employee: Employee) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ 
  employees, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const onLeaveEmployees = employees.filter(e => e.status === 'on-leave');

  return (
    <div className="space-y-12">
      {/* Desktop view: Hidden on mobile, shown on md and up */}
      <div className="hidden md:block bg-white/[0.02] rounded-sm border border-white/5 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Image</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Staff Data</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Position</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Phone Number</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Registry Date</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">NID Number</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Status</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableCell colSpan={8} className="h-64 text-center text-white/20 italic text-sm">
                  No active records discovered in terminal
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                const status = EMPLOYEE_STATUS.find(s => s.value === employee.status);
                return (
                  <TableRow key={employee.id || employee.employeeId} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell>
                      <div 
                        onClick={() => onView(employee)}
                        className="h-12 w-12 rounded-none border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center cursor-pointer group-hover:border-[#C5A059]/40 transition-all flex-shrink-0"
                      >
                        <img 
                          src={employee.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name)}&backgroundColor=c5a059,0f172a,1e293b`} 
                          alt={employee.name} 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name)}&backgroundColor=c5a059,0f172a,1e293b`;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-serif text-white/90 mb-0.5 tracking-tight font-bold">{employee.name}</span>
                        <span className="text-[10px] text-[#C5A059] uppercase tracking-widest font-mono font-bold">ID: {employee.employeeId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-white/60 font-medium tracking-wide">{employee.designation}</TableCell>
                    <TableCell className="text-xs text-white/40 font-mono italic">{employee.phone}</TableCell>
                    <TableCell className="text-xs text-white/40">{employee.joiningDate}</TableCell>
                    <TableCell className="text-xs text-white/40 font-mono">{employee.nid}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${employee.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : employee.status === 'resigned' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-amber-500'}`}></span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">{status?.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger 
                            className={cn(
                              buttonVariants({ variant: 'ghost', size: 'icon' }),
                              "h-9 w-9 text-white/20 hover:text-[#C5A059] hover:bg-white/5"
                            )}
                            onClick={() => onView(employee)}
                          >
                            <Eye className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#111112] border-white/10 text-[10px] uppercase tracking-widest font-bold text-[#C5A059]">
                            View Record
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger 
                            className={cn(
                              buttonVariants({ variant: 'ghost', size: 'icon' }),
                              "h-9 w-9 text-white/20 hover:text-white/80 hover:bg-white/5"
                            )}
                            onClick={() => onEdit(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#111112] border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/80">
                            Edit Record
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger 
                            className={cn(
                              buttonVariants({ variant: 'ghost', size: 'icon' }),
                              "h-9 w-9 text-white/20 hover:text-red-500 hover:bg-red-500/10"
                            )}
                            onClick={() => onDelete(employee)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#111112] border-white/10 text-[10px] uppercase tracking-widest font-bold text-red-500">
                            Delete Record
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view: Hidden on desktop, shown on mobile/tablet */}
      <div className="block md:hidden space-y-4">
        {employees.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/5 p-8 text-center text-white/20 italic text-sm">
            No active records discovered in terminal
          </div>
        ) : (
          employees.map((employee) => {
            const status = EMPLOYEE_STATUS.find(s => s.value === employee.status);
            return (
              <div 
                key={employee.id || employee.employeeId} 
                className="bg-white/[0.02] border border-white/5 p-5 space-y-4 relative group"
              >
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => onView(employee)}
                    className="h-14 w-14 rounded-none border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center cursor-pointer flex-shrink-0"
                  >
                    <img 
                      src={employee.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name)}&backgroundColor=c5a059,0f172a,1e293b`} 
                      alt={employee.name} 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name)}&backgroundColor=c5a059,0f172a,1e293b`;
                      }}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-serif text-white/90 font-bold truncate">{employee.name}</h4>
                    <p className="text-[10px] text-[#C5A059] uppercase tracking-widest font-mono font-bold">ID: {employee.employeeId}</p>
                    <p className="text-xs text-white/40 mt-0.5">{employee.designation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-3 border-t border-white/5 text-[11px]">
                  <div>
                    <span className="text-white/25 block text-[9px] uppercase tracking-wider">Phone</span>
                    <span className="text-white/70 font-mono">{employee.phone}</span>
                  </div>
                  <div>
                    <span className="text-white/25 block text-[9px] uppercase tracking-wider">Registry Date</span>
                    <span className="text-white/70">{employee.joiningDate}</span>
                  </div>
                  <div>
                    <span className="text-white/25 block text-[9px] uppercase tracking-wider">NID Number</span>
                    <span className="text-white/70 font-mono">{employee.nid}</span>
                  </div>
                  <div>
                    <span className="text-white/25 block text-[9px] uppercase tracking-wider">Status</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${employee.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : employee.status === 'resigned' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-amber-500'}`}></span>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-white/60">{status?.label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-white/40 hover:text-[#C5A059] hover:bg-white/5 text-[9px] uppercase tracking-wider gap-1.5 px-3"
                    onClick={() => onView(employee)}
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-white/40 hover:text-white/80 hover:bg-white/5 text-[9px] uppercase tracking-wider gap-1.5 px-3"
                    onClick={() => onEdit(employee)}
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-white/40 hover:text-red-500 hover:bg-red-500/10 text-[9px] uppercase tracking-wider gap-1.5 px-3"
                    onClick={() => onDelete(employee)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {onLeaveEmployees.length > 0 && (
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-serif text-white tracking-tight italic">Leave Status Registry</h3>
           </div>
           
            {/* Desktop view */}
           <div className="hidden sm:block bg-white/[0.01] rounded-sm border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Staff ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">From Address</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Departure Address</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onLeaveEmployees.map((employee) => (
                  <TableRow key={employee.id || employee.employeeId} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="text-xs text-white/40 font-mono font-bold tracking-tighter">#{employee.employeeId}</TableCell>
                    <TableCell className="text-sm text-white/90 font-serif font-bold">{employee.name}</TableCell>
                    <TableCell className="text-xs text-white/60 italic">{employee.fromAddress || employee.leaveStartDate || '--'}</TableCell>
                    <TableCell className="text-xs text-white/60 italic">{employee.departureAddress || employee.leaveEndDate || '--'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-none text-[9px] font-bold uppercase tracking-widest border border-amber-500/20">
                         On Leave
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           </div>

           {/* Mobile view */}
           <div className="block sm:hidden space-y-3">
             {onLeaveEmployees.map((employee) => (
               <div key={employee.id || employee.employeeId} className="bg-white/[0.01] border border-white/5 p-4 space-y-2">
                 <div className="flex justify-between items-baseline">
                   <h4 className="text-sm font-serif text-white/90 font-bold">{employee.name}</h4>
                   <span className="text-[9px] text-[#C5A059] font-mono tracking-tighter">ID: {employee.employeeId}</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-white/5">
                   <div>
                     <span className="text-white/20 block text-[8px] uppercase tracking-wider">From Address</span>
                     <span className="text-white/60 italic">{employee.fromAddress || employee.leaveStartDate || '--'}</span>
                   </div>
                   <div>
                     <span className="text-white/20 block text-[8px] uppercase tracking-wider">Departure Address</span>
                     <span className="text-white/60 italic">{employee.departureAddress || employee.leaveEndDate || '--'}</span>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
