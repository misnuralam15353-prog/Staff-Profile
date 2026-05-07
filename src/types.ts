export interface Guardian {
  name: string;
  relation: string;
  phone: string;
}

export interface Employee {
  id?: string;
  employeeId: string;
  name: string;
  designation: string;
  salary: number;
  phone: string;
  permanentAddress: string;
  presentAddress: string;
  guardian1: Guardian;
  guardian2: Guardian;
  joiningDate: string;
  leaveStartDate?: string;
  leaveEndDate?: string;
  nid: string;
  photoUrl: string;
  status: 'active' | 'resigned' | 'on-leave';
  createdAt: number;
  updatedAt: number;
}
