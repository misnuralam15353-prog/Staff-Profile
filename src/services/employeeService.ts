import { supabase } from '../lib/supabase';
import { Employee } from '../types';

const TABLE_NAME = 'employees';
const CACHE_KEY = 'rfl_employees_cache';

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-101',
    employeeId: 'RFL-10142',
    name: 'Rahim Ahmed',
    designation: 'Senior Developer',
    salary: 75000,
    phone: '+880 1712-345678',
    permanentAddress: 'Vill: Char Fasson, Dist: Bhola',
    presentAddress: 'House 24, Road 5, Block B, Mirpur-10, Dhaka',
    guardian1: {
      name: 'Late Kabir Ahmed',
      relation: 'Father',
      phone: '+880 1819-876543'
    },
    guardian2: {
      name: 'Rashida Begum',
      relation: 'Mother',
      phone: '+880 1819-876544'
    },
    joiningDate: '2022-03-15',
    nid: '19882692019485721',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: Date.now() - 10000000,
    updatedAt: Date.now() - 10000000,
  },
  {
    id: 'emp-102',
    employeeId: 'RFL-10189',
    name: 'Nusrat Jahan',
    designation: 'Manager',
    salary: 95000,
    phone: '+880 1911-223344',
    permanentAddress: 'Kotwali, Rangpur',
    presentAddress: 'Sector 4, Uttara, Dhaka',
    guardian1: {
      name: 'Mahbubur Rahman',
      relation: 'Father',
      phone: '+880 1711-556677'
    },
    guardian2: {
      name: 'Salma Khatun',
      relation: 'Mother',
      phone: '+880 1711-556678'
    },
    joiningDate: '2021-08-01',
    nid: '19922692019485722',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: Date.now() - 8000000,
    updatedAt: Date.now() - 8000000,
  },
  {
    id: 'emp-103',
    employeeId: 'RFL-10204',
    name: 'Tanvir Hossain',
    designation: 'Store',
    salary: 45000,
    phone: '+880 1612-998877',
    permanentAddress: 'Sonargaon, Narayanganj',
    presentAddress: 'Dhanmondi 27, Dhaka',
    guardian1: {
      name: 'Anwar Hossain',
      relation: 'Father',
      phone: '+880 1512-443322'
    },
    guardian2: {
      name: 'Fatema Begum',
      relation: 'Mother',
      phone: '+880 1512-443323'
    },
    joiningDate: '2023-01-10',
    nid: '19952692019485723',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'on-leave',
    createdAt: Date.now() - 5000000,
    updatedAt: Date.now() - 5000000,
  }
];

const getLocalCache = (): Employee[] => {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(e);
  }
  return INITIAL_EMPLOYEES;
};

const setLocalCache = (list: Employee[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
};

export const employeeService = {
  // Test connection
  async testConnection() {
    try {
      const { error } = await supabase.from(TABLE_NAME).select('id').limit(1);
      if (error) {
        console.warn("Supabase test connection info:", error.message);
      }
    } catch (error) {
      console.error("Please check your Supabase configuration.", error);
    }
  },

  async addEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) {
    const newId = `emp-${Date.now()}`;
    const payload: Employee = {
      ...employee,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Update local cache immediately
    const current = getLocalCache();
    const updated = [payload, ...current];
    setLocalCache(updated);

    // Sync with Supabase
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([payload])
        .select('id');

      if (error) {
        console.warn('Supabase remote insert fallback to cache:', error.message);
      }
      return data && data[0] ? data[0].id : newId;
    } catch (error) {
      console.warn('Supabase remote insert error, using local:', error);
      return newId;
    }
  },

  async updateEmployee(id: string, employee: Partial<Employee>) {
    // Update local cache
    const current = getLocalCache();
    const updated = current.map(item => item.id === id ? { ...item, ...employee, updatedAt: Date.now() } : item);
    setLocalCache(updated);

    // Sync with Supabase
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          ...employee,
          updatedAt: Date.now(),
        })
        .eq('id', id);

      if (error) {
        console.warn('Supabase update warning:', error.message);
      }
    } catch (error) {
      console.warn('Supabase update error:', error);
    }
  },

  async deleteEmployee(id: string) {
    // Update local cache
    const current = getLocalCache();
    const updated = current.filter(item => item.id !== id);
    setLocalCache(updated);

    // Sync with Supabase
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase delete warning:', error.message);
      }
    } catch (error) {
      console.warn('Supabase delete error:', error);
    }
  },

  subscribeToEmployees(callback: (employees: Employee[]) => void) {
    let active = true;

    // Send local cache first
    callback(getLocalCache());

    const fetchAndCallback = async () => {
      if (!active) return;
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && data && data.length > 0) {
          setLocalCache(data as Employee[]);
          if (active) {
            callback(data as Employee[]);
          }
        } else {
          // Keep using local cache
          if (active) {
            callback(getLocalCache());
          }
        }
      } catch (err) {
        if (active) {
          callback(getLocalCache());
        }
      }
    };

    // Trigger fetch from Supabase
    fetchAndCallback();

    // Configure real-time subscription channel
    const channel = supabase
      .channel('employees_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_NAME },
        () => {
          fetchAndCallback();
        }
      )
      .subscribe();

    // Polling backup
    const intervalId = setInterval(fetchAndCallback, 6000);

    return () => {
      active = false;
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }
};
