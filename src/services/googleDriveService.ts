import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Employee } from '../types';
import * as XLSX from 'xlsx';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  parents?: string[];
}

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface DriveUserInfo {
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
}

export interface DriveAboutInfo {
  user?: DriveUserInfo;
  storageQuota?: DriveStorageQuota;
}

export const googleDriveService = {
  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  setAccessToken(token: string | null) {
    cachedAccessToken = token;
  },

  initAuth(
    onAuthSuccess?: (user: User, token: string) => void,
    onAuthFailure?: () => void
  ) {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    });
  },

  async signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Failed to obtain Google Drive access token');
      }
      cachedAccessToken = credential.accessToken;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      isSigningIn = false;
    }
  },

  async signOutFromGoogle(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      cachedAccessToken = null;
    }
  },

  async getAboutInfo(): Promise<DriveAboutInfo> {
    if (!cachedAccessToken) throw new Error('Not authenticated with Google Drive');
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Failed to fetch Google Drive profile');
    }
    return await res.json();
  },

  async listFiles(searchTerm = '', folderId?: string): Promise<DriveFileItem[]> {
    if (!cachedAccessToken) throw new Error('Not authenticated with Google Drive');

    const queries: string[] = ["trashed = false"];
    if (folderId) {
      queries.push(`'${folderId}' in parents`);
    }
    if (searchTerm.trim()) {
      queries.push(`name contains '${searchTerm.replace(/'/g, "\\'")}'`);
    }

    const q = queries.join(' and ');
    const params = new URLSearchParams({
      q,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, iconLink, parents)',
      orderBy: 'folder,modifiedTime desc',
      pageSize: '50',
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to retrieve Google Drive files');
    }

    const data = await res.json();
    return data.files || [];
  },

  async createFolder(name: string, parentId?: string): Promise<DriveFileItem> {
    if (!cachedAccessToken) throw new Error('Not authenticated with Google Drive');

    const metadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
      metadata.parents = [parentId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Drive folder');
    }

    return await res.json();
  },

  async uploadFile(file: File | Blob, filename: string, mimeType: string, parentId?: string): Promise<DriveFileItem> {
    if (!cachedAccessToken) throw new Error('Not authenticated with Google Drive');

    const metadata: any = {
      name: filename,
      mimeType: mimeType || 'application/octet-stream',
    };
    if (parentId) {
      metadata.parents = [parentId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,createdTime', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to upload file to Google Drive');
    }

    return await res.json();
  },

  async exportEmployeesToDrive(employees: Employee[], folderId?: string): Promise<DriveFileItem> {
    if (!cachedAccessToken) throw new Error('Not authenticated with Google Drive');

    // 1. Prepare Excel workbook buffer
    const flatData = employees.map((emp) => ({
      ID: emp.id,
      'Employee ID': emp.employeeId,
      'Full Name': emp.name,
      Designation: emp.designation,
      'Salary (BDT)': emp.salary,
      Phone: emp.phone,
      NID: emp.nid,
      'Joining Date': emp.joiningDate,
      Status: emp.status,
      'Present Address': emp.presentAddress,
      'Permanent Address': emp.permanentAddress,
      'Guardian 1 Name': emp.guardian1?.name || '',
      'Guardian 1 Relation': emp.guardian1?.relation || '',
      'Guardian 1 Phone': emp.guardian1?.phone || '',
      'Guardian 2 Name': emp.guardian2?.name || '',
      'Guardian 2 Relation': emp.guardian2?.relation || '',
      'Guardian 2 Phone': emp.guardian2?.phone || '',
      'Created At': new Date(emp.createdAt).toLocaleString(),
      'Updated At': new Date(emp.updatedAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `RFL_Employee_Registry_Backup_${timestamp}.xlsx`;

    return await this.uploadFile(
      blob,
      filename,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      folderId
    );
  },

  async deleteFile(fileId: string): Promise<void> {
    if (!cachedAccessToken) throw new Error('Not authenticated with Google Drive');

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to delete file from Google Drive');
    }
  },

  async downloadFile(fileId: string): Promise<Blob> {
    if (!cachedAccessToken) throw new Error('Not authenticated with Google Drive');

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to download file from Google Drive');
    }

    return await res.blob();
  },
};
