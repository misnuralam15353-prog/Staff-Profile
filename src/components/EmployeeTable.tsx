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
  TooltipProvider
} from './ui/tooltip';
import { Employee } from '../types';
import { EMPLOYEE_STATUS } from '../constants';
import { Edit, Trash2, Eye, User, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
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
      <div className="bg-white/[0.02] rounded-sm border border-white/5 overflow-hidden">
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
                  <TableRow key={employee.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell>
                      <Avatar className="h-12 w-12 rounded-none border border-white/10 group-hover:scale-105 transition-all duration-500">
                        <AvatarImage src={employee.photoUrl} alt={employee.name} className="object-cover" />
                        <AvatarFallback className="bg-white/5 rounded-none">
                          <User className="h-5 w-5 text-white/20" />
                        </AvatarFallback>
                      </Avatar>
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
                            onClick={() => employee.id && onDelete(employee.id)}
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

      {onLeaveEmployees.length > 0 && (
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-serif text-white tracking-tight italic">Leave Status Registry</h3>
           </div>
           <div className="bg-white/[0.01] rounded-sm border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Staff ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Start Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Return Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onLeaveEmployees.map((employee) => (
                  <TableRow key={employee.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="text-xs text-white/40 font-mono font-bold tracking-tighter">#{employee.employeeId}</TableCell>
                    <TableCell className="text-sm text-white/90 font-serif font-bold">{employee.name}</TableCell>
                    <TableCell className="text-xs text-white/60 italic">{employee.leaveStartDate || '--'}</TableCell>
                    <TableCell className="text-xs text-white/60 italic">{employee.leaveEndDate || '--'}</TableCell>
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
        </div>
      )}
    </div>
  );
};
