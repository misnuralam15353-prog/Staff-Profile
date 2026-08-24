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
    fromAddress: initialData?.fromAddress || initialData?.leaveStartDate || '',
    departureAddress: initialData?.departureAddress || initialData?.leaveEndDate || '',
    leaveStartDate: initialData?.fromAddress || initialData?.leaveStartDate || '',
    leaveEndDate: initialData?.departureAddress || initialData?.leaveEndDate || '',
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
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing to optimal dimensions
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set target dimensions (400x400)
          canvas.width = 400;
          canvas.height = 400;
          
          if (ctx) {
            // Draw image with aspect cover strategy
            const aspectRatio = img.width / img.height;
            let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
            
            if (aspectRatio > 1) {
              srcWidth = img.height;
              srcX = (img.width - srcWidth) / 2;
            } else {
              srcHeight = img.width;
              srcY = (img.height - srcHeight) / 2;
            }
            
            ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, 400, 400);
            
            // Convert to data URL and set state immediately
            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setFormData(prev => ({ ...prev, photoUrl: resizedDataUrl }));
            setUploading(false);
            toast.success('Photo attached and processed successfully');
          }
        };
        img.onerror = () => {
          setUploading(false);
          toast.error('Failed to parse selected image file');
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        setUploading(false);
        toast.error('Could not read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (!photoUrlInput.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    setFormData(prev => ({ ...prev, photoUrl: photoUrlInput.trim() }));
    toast.success('Photo URL applied');
    setShowUrlInput(false);
  };

  const handleGenerateAvatar = () => {
    const nameSeed = formData.name.trim() || formData.employeeId || 'Staff';
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameSeed)}&backgroundColor=c5a059,0f172a,1e293b`;
    setFormData(prev => ({ ...prev, photoUrl: avatarUrl }));
    toast.success('Generated avatar assigned to profile');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation based on required fields
    const fieldMapping: Record<string, string> = {
      employeeId: 'Staff ID',
      name: 'Full Name',
      phone: 'Phone Number',
      nid: 'NID Number',
      joiningDate: 'Joining Date',
      presentAddress: 'Present Address',
      permanentAddress: 'Permanent Address',
    };

    const missingFields = Object.entries(fieldMapping)
      .filter(([key]) => !formData[key as keyof typeof formData])
      .map(([, label]) => label);
    
    if (missingFields.length > 0) {
      toast.error(`Please provide required info: ${missingFields.join(', ')}`);
      return;
    }

    if (!formData.guardian1.name || !formData.guardian1.phone) {
      toast.error('Guardian 1 information is incomplete (Name and Phone required)');
      return;
    }

    // Ensure photoUrl is never blank
    const finalizedPhoto = formData.photoUrl?.trim() 
      ? formData.photoUrl 
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.name)}&backgroundColor=c5a059,0f172a,1e293b`;

    const finalData = {
      ...formData,
      photoUrl: finalizedPhoto,
    };

    console.log('Form Submit Triggered', finalData);
    onSubmit(finalData);
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
          <div className="md:col-span-3 flex flex-col items-center gap-3">
             <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-none overflow-hidden flex items-center justify-center relative group">
                {uploading ? (
                  <div className="flex flex-col items-center gap-3 p-4 text-center">
                    <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent animate-spin"></div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] animate-pulse">Processing...</span>
                  </div>
                ) : formData.photoUrl ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={formData.photoUrl} 
                      alt="Preview" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.name || 'Staff')}&backgroundColor=c5a059,0f172a,1e293b`;
                      }}
                      className="w-full h-full object-cover transition-all duration-300" 
                    />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                      Photo Loaded
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-white/20 p-4 text-center">
                    <Camera className="w-12 h-12 mb-2 text-white/30" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">No Photo Selected</span>
                  </div>
                )}
             </div>

             {/* Action Buttons for Photo */}
             <div className="w-full space-y-2">
               <label className="w-full h-9 bg-[#C5A059] hover:bg-[#b58f48] text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                 <Upload className="w-3.5 h-3.5" />
                 <span>{formData.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                 <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
               </label>

               <div className="grid grid-cols-2 gap-2">
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={() => setShowUrlInput(!showUrlInput)}
                   className="h-8 bg-white/5 border-white/10 text-white/70 hover:text-white text-[9px] uppercase tracking-wider rounded-none font-bold"
                 >
                   Image URL
                 </Button>
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={handleGenerateAvatar}
                   className="h-8 bg-white/5 border-white/10 text-white/70 hover:text-[#C5A059] text-[9px] uppercase tracking-wider rounded-none font-bold"
                 >
                   Auto Avatar
                 </Button>
               </div>

               {showUrlInput && (
                 <div className="space-y-1.5 p-2.5 bg-white/5 border border-white/10 rounded-none">
                   <Label className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold block">Paste Image Link</Label>
                   <div className="flex gap-1.5">
                     <Input
                       type="url"
                       placeholder="https://..."
                       value={photoUrlInput}
                       onChange={(e) => setPhotoUrlInput(e.target.value)}
                       className="bg-black/50 border-white/10 text-xs h-7 text-white font-mono rounded-none"
                     />
                     <Button
                       type="button"
                       size="sm"
                       onClick={handleApplyUrl}
                       className="h-7 px-2.5 bg-[#C5A059] text-black text-[9px] uppercase font-bold rounded-none"
                     >
                       Set
                     </Button>
                   </div>
                 </div>
               )}

               {formData.photoUrl && (
                 <Button
                   type="button"
                   variant="ghost"
                   size="sm"
                   onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                   className="w-full h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[9px] uppercase tracking-wider rounded-none"
                 >
                   Remove Photo
                 </Button>
               )}
             </div>

             <div className="w-full p-2.5 bg-white/[0.02] border border-white/5 text-center">
                <p className="text-[8px] text-white/30 uppercase tracking-[0.15em] font-bold">
                  Portrait will be saved securely with the employee profile.
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
                  <Label className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">From Address</Label>
                  <Input 
                    name="fromAddress" 
                    type="text" 
                    placeholder="Enter from address / starting location"
                    value={formData.fromAddress || formData.leaveStartDate || ''} 
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        fromAddress: e.target.value,
                        leaveStartDate: e.target.value,
                      }));
                    }} 
                    className="bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Departure Address</Label>
                  <Input 
                    name="departureAddress" 
                    type="text" 
                    placeholder="Enter departure / destination address"
                    value={formData.departureAddress || formData.leaveEndDate || ''} 
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        departureAddress: e.target.value,
                        leaveEndDate: e.target.value,
                      }));
                    }} 
                    className="bg-white/5 border-white/10 rounded-none text-xs h-9 focus-visible:ring-[#C5A059] text-white" 
                  />
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
