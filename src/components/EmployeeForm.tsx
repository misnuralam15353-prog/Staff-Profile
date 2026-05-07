import * as React from 'react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Employee } from '../types';
import { DESIGNATIONS, EMPLOYEE_STATUS } from '../constants';
import { X, Save, Phone, MapPin, User, Calendar, CreditCard, DollarSign, Camera, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface EmployeeFormProps {
  initialData?: Employee;
  onSubmit: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>({
    employeeId: initialData?.employeeId || '',
    name: initialData?.name || '',
    designation: initialData?.designation || DESIGNATIONS[0],
    salary: initialData?.salary || 0,
    phone: initialData?.phone || '',
    permanentAddress: initialData?.permanentAddress || '',
    presentAddress: initialData?.presentAddress || '',
    guardian1: initialData?.guardian1 || { name: '', relation: '', phone: '' },
    guardian2: initialData?.guardian2 || { name: '', relation: '', phone: '' },
    joiningDate: initialData?.joiningDate || '',
    leaveStartDate: initialData?.leaveStartDate || '',
    leaveEndDate: initialData?.leaveEndDate || '',
    nid: initialData?.nid || '',
    photoUrl: initialData?.photoUrl || '',
    status: initialData?.status || 'active',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'salary' ? Number(value) : value
      }));
    }
  };

  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set target dimensions
          canvas.width = 300;
          canvas.height = 300;
          
          if (ctx) {
            // Draw image to 300x300 (using cover strategy)
            const aspectRatio = img.width / img.height;
            let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
            
            if (aspectRatio > 1) {
              srcWidth = img.height;
              srcX = (img.width - srcWidth) / 2;
            } else {
              srcHeight = img.width;
              srcY = (img.height - srcHeight) / 2;
            }
            
            ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, 300, 300);
            
            // Convert to data URL and set state
            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            
            // Simulate system scan delay for aesthetic
            setTimeout(() => {
              setFormData(prev => ({ ...prev, photoUrl: resizedDataUrl }));
              setUploading(false);
              toast.success('Biometric scan complete (300x300)');
            }, 800);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation based on Firestore rules
    const fieldMapping: Record<string, string> = {
      employeeId: 'Staff ID',
      name: 'Full Name',
      phone: 'Phone Number',
      nid: 'NID Number',
      joiningDate: 'Joining Date',
      presentAddress: 'Present Address',
      permanentAddress: 'Permanent Address',
      photoUrl: 'Employee Photo'
    };

    const missingFields = Object.entries(fieldMapping)
      .filter(([key]) => !formData[key as keyof typeof formData])
      .map(([, label]) => label);
    
    if (missingFields.length > 0) {
      toast.error(`Please provide required info: ${missingFields.join(', ')}`);
      return;
    }

    if (!formData.guardian1.name || !formData.guardian1.phone) {
      toast.error('Guardian 1 information is incomplete');
      return;
    }

    console.log('Form Submit Triggered', formData);
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-[#111112] p-6 sm:p-10 rounded-sm shadow-2xl border border-white/5 max-w-6xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight mb-1 font-bold">
            {initialData ? 'Update Record' : 'Add Employee Registration'}
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Terminal Entry v3.0</p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" type="button" onClick={onCancel} className="text-white/20 hover:text-white/60">
             <X className="w-6 h-6" />
           </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <div className="flex justify-end mb-6">
           <div className="flex flex-col items-end">
              <Label className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Status Protocol</Label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="bg-white/5 border border-white/5 rounded-none px-4 py-1 text-xs text-[#C5A059] font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A059] uppercase tracking-widest"
              >
                {EMPLOYEE_STATUS.map(s => (
                  <option key={s.value} value={s.value} className="bg-[#111112]">{s.label}</option>
                ))}
              </select>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Photo Section */}
          <div className="md:col-span-3 flex flex-col items-center gap-4">
             <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-none overflow-hidden flex items-center justify-center relative group">
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent animate-spin"></div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] animate-pulse">Scanning...</span>
                  </div>
                ) : formData.photoUrl ? (
                  <div className="relative w-full h-full">
                    <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute top-2 right-2 bg-[#C5A059] text-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest">Verified</div>
                    <div className="absolute inset-0 border-2 border-emerald-500/20 pointer-events-none"></div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-white/10">
                    <Camera className="w-12 h-12 mb-2" />
                    <span className="text-[10px] uppercase tracking-widest">No Signal</span>
                  </div>
                )}
                
                {!uploading && (
                  <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-sm">
                     <Upload className="w-8 h-8 text-[#C5A059] mb-2" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-white">{formData.photoUrl ? 'Update Cipher' : 'Upload Portrait'}</span>
                     <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
             </div>
             <div className="w-full p-3 bg-white/[0.02] border border-white/5">
                <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] text-center leading-relaxed font-bold">
                  Target Acquisition Protocol: Required for secure access identification.
                </p>
             </div>
          </div>

          {/* Form Fields */}
          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <div className="col-span-1 sm:col-span-2 border-b border-white/5 pb-2 mb-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold flex items-center gap-2">
                 <User className="w-3.5 h-3.5" /> Personnel Information
              </h3>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Staff ID</Label>
              <Input name="employeeId" value={formData.employeeId} onChange={handleChange} required 
                className="bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white font-mono" />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Full Legal Name</Label>
              <Input name="name" value={formData.name} onChange={handleChange} required 
                className="bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white" />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Designation</Label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-none h-9 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
              >
                {DESIGNATIONS.map(d => (
                  <option key={d} value={d} className="bg-[#111112]">{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Salary (BDT)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/20" />
                <Input name="salary" type="number" value={formData.salary} onChange={handleChange} 
                  className="pl-9 bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/20" />
                <Input name="phone" value={formData.phone} onChange={handleChange} 
                  className="pl-9 bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white" required />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">NID Number</Label>
              <div className="relative">
                <CreditCard className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/20" />
                <Input name="nid" value={formData.nid} onChange={handleChange} 
                  className="pl-9 bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white" required />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Joining Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/20" />
                <Input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} 
                  className="pl-9 bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white uppercase" required />
              </div>
            </div>

            {formData.status === 'on-leave' && (
              <>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Leave Start Date</Label>
                  <Input name="leaveStartDate" type="date" value={formData.leaveStartDate} onChange={handleChange} 
                    className="bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Leave End Date</Label>
                  <Input name="leaveEndDate" type="date" value={formData.leaveEndDate} onChange={handleChange} 
                    className="bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white" />
                </div>
              </>
            )}

            <div className="col-span-1 sm:col-span-2 border-b border-white/5 pb-2 mt-4 mb-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold flex items-center gap-2">
                 <MapPin className="w-3.5 h-3.5" /> Address Registry
              </h3>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Present Address</Label>
              <textarea
                name="presentAddress"
                value={formData.presentAddress}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059] min-h-[60px]"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Permanent Address</Label>
              <textarea
                name="permanentAddress"
                value={formData.permanentAddress}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059] min-h-[60px]"
                required
              />
            </div>

            {/* Guardians */}
            <div className="col-span-1 sm:col-span-2 mt-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="bg-white/[0.02] border border-white/10 p-5 rounded-none space-y-3">
                    <Label className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold border-b border-white/5 block pb-2">Guardian Information 1</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Name" name="guardian1.name" value={formData.guardian1.name} onChange={handleChange} 
                        className="bg-white/5 border-white/10 rounded-none text-xs text-white h-8" />
                      <Input placeholder="Relation" name="guardian1.relation" value={formData.guardian1.relation} onChange={handleChange} 
                        className="bg-white/5 border-white/10 rounded-none text-xs text-white h-8" />
                    </div>
                    <Input placeholder="Contact Phone" name="guardian1.phone" value={formData.guardian1.phone} onChange={handleChange} 
                      className="bg-white/5 border-white/10 rounded-none text-xs text-white h-8" />
                  </div>

                  <div className="bg-white/[0.02] border border-white/10 p-5 rounded-none space-y-3">
                    <Label className="text-[10px] uppercase tracking-widest text-white/20 font-bold border-b border-white/5 block pb-2">Guardian Information 2</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Name" name="guardian2.name" value={formData.guardian2.name} onChange={handleChange} 
                        className="bg-white/5 border-white/10 rounded-none text-xs text-white h-8" />
                      <Input placeholder="Relation" name="guardian2.relation" value={formData.guardian2.relation} onChange={handleChange} 
                        className="bg-white/5 border-white/10 rounded-none text-xs text-white h-8" />
                    </div>
                    <Input placeholder="Contact Phone" name="guardian2.phone" value={formData.guardian2.phone} onChange={handleChange} 
                      className="bg-white/5 border-white/10 rounded-none text-xs text-white h-8" />
                  </div>
               </div>
            </div>

          </div>
        </div>

        <div className="flex gap-4 pt-8 border-t border-white/5">
          <Button type="submit" className="flex-1 h-11 bg-[#C5A059] hover:bg-[#B48F48] text-black font-bold uppercase tracking-widest text-[11px] rounded-none gap-3 shadow-lg shadow-[#C5A059]/10">
            <Save className="w-4 h-4" /> Finalize Registration
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 h-11 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-none border border-white/10 tracking-widest text-[11px] uppercase">
            Abandon Entry
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
