import { supabase } from '../lib/supabase';
import { Employee } from '../types';

const TABLE_NAME = 'employees';
const CACHE_KEY = 'rfl_employees_cache_v4';
const DELETED_IDENTIFIERS_KEY = 'rfl_deleted_identifiers_v4';
const INITIALIZED_FLAG = 'rfl_app_initialized_v4';

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
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
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
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
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
    fromAddress: 'Dhaka Central Warehouse',
    departureAddress: 'Chattogram Depo',
    leaveStartDate: 'Dhaka Central Warehouse',
    leaveEndDate: 'Chattogram Depo',
    nid: '19952692019485723',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    status: 'on-leave',
    createdAt: Date.now() - 5000000,
    updatedAt: Date.now() - 5000000,
  }
];

const getDeletedIdentifiers = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_IDENTIFIERS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(s => String(s).trim().toLowerCase()));
    }
  } catch (e) {
    console.warn('Error reading deleted identifiers', e);
  }
  return new Set();
};

const saveDeletedIdentifiers = (ids: Set<string>) => {
  try {
    localStorage.setItem(DELETED_IDENTIFIERS_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.warn('Error saving deleted identifiers', e);
  }
};

const isEmployeeDeleted = (emp: Partial<Employee>, deletedSet: Set<string>): boolean => {
  if (emp.id && deletedSet.has(String(emp.id).toLowerCase())) return true;
  if (emp.employeeId && deletedSet.has(String(emp.employeeId).toLowerCase())) return true;
  return false;
};

const getLocalCache = (): Employee[] => {
  const deletedSet = getDeletedIdentifiers();
  try {
    const isInit = localStorage.getItem(INITIALIZED_FLAG);
    const data = localStorage.getItem(CACHE_KEY);
    
    if (isInit === 'true' && data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(emp => emp && !isEmployeeDeleted(emp, deletedSet));
      }
    }
  } catch (e) {
    console.warn('Error reading local employee cache', e);
  }

  // First time initialization only
  const initList = INITIAL_EMPLOYEES.filter(emp => !isEmployeeDeleted(emp, deletedSet));
  localStorage.setItem(INITIALIZED_FLAG, 'true');
  setLocalCache(initList);
  return initList;
};

const setLocalCache = (list: Employee[]) => {
  try {
    const deletedSet = getDeletedIdentifiers();
    const cleanList = list.filter(emp => emp && !isEmployeeDeleted(emp, deletedSet));
    localStorage.setItem(CACHE_KEY, JSON.stringify(cleanList));
    localStorage.setItem(INITIALIZED_FLAG, 'true');
  } catch (e) {
    console.warn('Error writing local employee cache', e);
  }
};

// Global active subscribers set to ensure immediate UI updates
type SubscriberCallback = (employees: Employee[]) => void;
const subscribers = new Set<SubscriberCallback>();

const notifySubscribers = () => {
  const currentList = getLocalCache();
  subscribers.forEach(cb => {
    try {
      cb(currentList);
    } catch (err) {
      console.warn('Subscriber notification error', err);
    }
  });
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

  getAll(): Employee[] {
    return getLocalCache();
  },

  async addEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newId = `emp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Ensure photoUrl is never blank - use smart initials avatar if not provided
    const photo = employee.photoUrl?.trim() 
      ? employee.photoUrl 
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name || 'Staff')}&backgroundColor=c5a059,0f172a,1e293b`;

    const payload: Employee = {
      ...employee,
      photoUrl: photo,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Remove from deleted identifiers if re-added
    const deletedSet = getDeletedIdentifiers();
    let modifiedDeleted = false;
    if (payload.id && deletedSet.has(payload.id.toLowerCase())) {
      deletedSet.delete(payload.id.toLowerCase());
      modifiedDeleted = true;
    }
    if (payload.employeeId && deletedSet.has(payload.employeeId.toLowerCase())) {
      deletedSet.delete(payload.employeeId.toLowerCase());
      modifiedDeleted = true;
    }
    if (modifiedDeleted) {
      saveDeletedIdentifiers(deletedSet);
    }

    // Update local cache immediately
    const current = getLocalCache();
    const updated = [payload, ...current.filter(e => e.id !== newId && e.employeeId !== payload.employeeId)];
    setLocalCache(updated);
    notifySubscribers();

    // Sync with Supabase asynchronously
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([payload])
        .select('id');

      if (error) {
        console.warn('Supabase remote insert fallback to cache:', error.message);
      }
      return (data && data[0] && data[0].id) ? data[0].id : newId;
    } catch (error) {
      console.warn('Supabase remote insert error, using local:', error);
      return newId;
    }
  },

  async updateEmployee(id: string, employee: Partial<Employee>): Promise<void> {
    // Ensure photoUrl fallback if updated to empty
    let updatedPhoto = employee.photoUrl;
    if (updatedPhoto !== undefined && !updatedPhoto.trim() && employee.name) {
      updatedPhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name)}&backgroundColor=c5a059,0f172a,1e293b`;
    }

    const payload = {
      ...employee,
      ...(updatedPhoto ? { photoUrl: updatedPhoto } : {}),
      updatedAt: Date.now(),
    };

    // Update local cache immediately
    const current = getLocalCache();
    const updated = current.map(item => 
      item.id === id || (employee.employeeId && item.employeeId === employee.employeeId)
        ? { ...item, ...payload } 
        : item
    );
    setLocalCache(updated);
    notifySubscribers();

    // Sync with Supabase asynchronously
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update(payload)
        .eq('id', id);

      if (error) {
        console.warn('Supabase update warning:', error.message);
      }
    } catch (error) {
      console.warn('Supabase update error:', error);
    }
  },

  async deleteEmployee(id: string, employeeId?: string): Promise<void> {
    if (!id && !employeeId) return;

    // 1. Record IDs in deleted set so remote sync never resurrects it
    const deletedSet = getDeletedIdentifiers();
    if (id) deletedSet.add(String(id).toLowerCase());
    if (employeeId) deletedSet.add(String(employeeId).toLowerCase());
    saveDeletedIdentifiers(deletedSet);

    // 2. Remove from local cache immediately
    const current = getLocalCache();
    const updated = current.filter(item => {
      if (id && String(item.id).toLowerCase() === String(id).toLowerCase()) return false;
      if (employeeId && String(item.employeeId).toLowerCase() === String(employeeId).toLowerCase()) return false;
      return true;
    });
    setLocalCache(updated);
    notifySubscribers();

    // 3. Delete from Supabase asynchronously (by id or employeeId)
    try {
      if (id) {
        await supabase.from(TABLE_NAME).delete().eq('id', id);
      }
      if (employeeId) {
        await supabase.from(TABLE_NAME).delete().eq('employeeId', employeeId);
      }
    } catch (error) {
      console.warn('Supabase delete error:', error);
    }
  },

  // Reset to initial sample records
  resetToInitialRecords(): void {
    localStorage.removeItem(DELETED_IDENTIFIERS_KEY);
    localStorage.setItem(INITIALIZED_FLAG, 'true');
    setLocalCache(INITIAL_EMPLOYEES);
    notifySubscribers();
  },

  subscribeToEmployees(callback: SubscriberCallback) {
    subscribers.add(callback);

    // Send current data immediately
    callback(getLocalCache());

    let active = true;

    const fetchAndSyncRemote = async () => {
      if (!active) return;
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && Array.isArray(data)) {
          const deletedSet = getDeletedIdentifiers();
          const localList = getLocalCache();
          const localMap = new Map(localList.map(e => [e.id || e.employeeId, e]));

          // Remote rows filtered of all deleted items
          const validRemote = (data as Employee[]).filter(emp => !isEmployeeDeleted(emp, deletedSet));

          // Clean up remote deleted items if they still exist in Supabase
          const deletedRemote = (data as Employee[]).filter(emp => isEmployeeDeleted(emp, deletedSet));
          deletedRemote.forEach(delEmp => {
            if (delEmp.id) {
              supabase.from(TABLE_NAME).delete().eq('id', delEmp.id).then(() => {});
            }
          });

          // Merge by taking most recent updatedAt
          validRemote.forEach(remoteEmp => {
            const key = remoteEmp.id || remoteEmp.employeeId;
            if (!key) return;
            const existing = localMap.get(key);
            if (!existing || (remoteEmp.updatedAt && remoteEmp.updatedAt > existing.updatedAt)) {
              localMap.set(key, remoteEmp);
            }
          });

          const merged = Array.from(localMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setLocalCache(merged);
          if (active) {
            callback(merged);
          }
        }
      } catch (err) {
        // Fallback silently to local cache
      }
    };

    // Trigger initial background remote fetch
    fetchAndSyncRemote();

    // Realtime channel listener
    const channel = supabase
      .channel('employees_realtime_channel_v4')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_NAME },
        () => {
          fetchAndSyncRemote();
        }
      )
      .subscribe();

    // Interval sync backup (every 15s)
    const intervalId = setInterval(fetchAndSyncRemote, 15000);

    return () => {
      active = false;
      subscribers.delete(callback);
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }
};

