import { supabase } from '../lib/supabase';
import { Employee } from '../types';

const TABLE_NAME = 'employees';
const CACHE_KEY = 'rfl_employees_cache_v2';
const DELETED_IDS_KEY = 'rfl_deleted_employee_ids_v2';

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
    fromAddress: 'Dhaka Central Warehouse',
    departureAddress: 'Chattogram Depo',
    leaveStartDate: 'Dhaka Central Warehouse',
    leaveEndDate: 'Chattogram Depo',
    nid: '19952692019485723',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'on-leave',
    createdAt: Date.now() - 5000000,
    updatedAt: Date.now() - 5000000,
  }
];

const getDeletedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    console.warn('Error reading deleted IDs', e);
  }
  return new Set();
};

const saveDeletedIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.warn('Error saving deleted IDs', e);
  }
};

const getLocalCache = (): Employee[] => {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const deletedIds = getDeletedIds();
        return parsed.filter(emp => emp?.id && !deletedIds.has(emp.id));
      }
    }
  } catch (e) {
    console.warn('Error reading local employee cache', e);
  }
  // Initialize with INITIAL_EMPLOYEES on first run, excluding any deleted IDs
  const deletedIds = getDeletedIds();
  const initList = INITIAL_EMPLOYEES.filter(emp => emp?.id && !deletedIds.has(emp.id));
  setLocalCache(initList);
  return initList;
};

const setLocalCache = (list: Employee[]) => {
  try {
    const deletedIds = getDeletedIds();
    const cleanList = list.filter(emp => emp?.id && !deletedIds.has(emp.id));
    localStorage.setItem(CACHE_KEY, JSON.stringify(cleanList));
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
    const payload: Employee = {
      ...employee,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Remove from deleted IDs if re-added
    const deletedIds = getDeletedIds();
    if (deletedIds.has(newId)) {
      deletedIds.delete(newId);
      saveDeletedIds(deletedIds);
    }

    // Update local cache immediately
    const current = getLocalCache();
    const updated = [payload, ...current];
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
    // Update local cache immediately
    const current = getLocalCache();
    const updated = current.map(item => 
      item.id === id 
        ? { ...item, ...employee, updatedAt: Date.now() } 
        : item
    );
    setLocalCache(updated);
    notifySubscribers();

    // Sync with Supabase asynchronously
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

  async deleteEmployee(id: string): Promise<void> {
    if (!id) return;

    // 1. Record ID in deleted set so remote polling never resurrects it
    const deletedIds = getDeletedIds();
    deletedIds.add(id);
    saveDeletedIds(deletedIds);

    // 2. Remove from local cache immediately
    const current = getLocalCache();
    const updated = current.filter(item => item.id !== id);
    setLocalCache(updated);
    notifySubscribers();

    // 3. Delete from Supabase asynchronously
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

  // Reset to initial sample records
  resetToInitialRecords(): void {
    localStorage.removeItem(DELETED_IDS_KEY);
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

        if (!error && Array.isArray(data) && data.length > 0) {
          const deletedIds = getDeletedIds();
          const localList = getLocalCache();
          const localMap = new Map(localList.map(e => [e.id || '', e]));

          // Remote rows filtered of deleted items
          const validRemote = (data as Employee[]).filter(emp => emp?.id && !deletedIds.has(emp.id));

          // Merge by taking most recent updatedAt
          validRemote.forEach(remoteEmp => {
            if (!remoteEmp.id) return;
            const existing = localMap.get(remoteEmp.id);
            if (!existing || (remoteEmp.updatedAt && remoteEmp.updatedAt > existing.updatedAt)) {
              localMap.set(remoteEmp.id, remoteEmp);
            }
          });

          const merged = Array.from(localMap.values()).sort((a, b) => b.createdAt - a.createdAt);
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
      .channel('employees_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_NAME },
        () => {
          fetchAndSyncRemote();
        }
      )
      .subscribe();

    // Interval sync backup (every 10s)
    const intervalId = setInterval(fetchAndSyncRemote, 10000);

    return () => {
      active = false;
      subscribers.delete(callback);
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }
};
