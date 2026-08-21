import React, { useState, useEffect, useRef } from 'react';
import { 
  googleDriveService, 
  DriveFileItem, 
  DriveAboutInfo 
} from '../services/googleDriveService';
import { Employee } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  HardDrive, 
  Upload, 
  Download, 
  Trash2, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  FolderPlus, 
  FileSpreadsheet, 
  FileText, 
  Image as ImageIcon, 
  Folder, 
  File as FileIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Lock,
  CloudUpload,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface GoogleDriveManagerProps {
  employees: Employee[];
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({ employees }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!googleDriveService.getAccessToken());
  const [loading, setLoading] = useState(false);
  const [aboutInfo, setAboutInfo] = useState<DriveAboutInfo | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<{ id?: string; name: string }[]>([{ name: 'My Drive' }]);
  
  // Modals & Forms
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = googleDriveService.initAuth(
      (_user, token) => {
        setIsAuthenticated(true);
        loadDriveData();
      },
      () => {
        if (!googleDriveService.getAccessToken()) {
          setIsAuthenticated(false);
        }
      }
    );

    if (googleDriveService.getAccessToken()) {
      setIsAuthenticated(true);
      loadDriveData();
    }

    return () => unsubscribe();
  }, []);

  const loadDriveData = async (folderId?: string) => {
    setLoading(true);
    try {
      const [about, fileList] = await Promise.all([
        googleDriveService.getAboutInfo().catch((err) => {
          console.warn('Failed to load about info:', err);
          return null;
        }),
        googleDriveService.listFiles(searchQuery, folderId),
      ]);
      if (about) setAboutInfo(about);
      setFiles(fileList);
    } catch (err: any) {
      console.error('Error loading Drive data:', err);
      toast.error(err.message || 'Failed to load Google Drive files');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await googleDriveService.signInWithGoogle();
      setIsAuthenticated(true);
      toast.success(`Connected to Google Drive as ${user.displayName || user.email}`);
      await loadDriveData(currentFolderId);
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err.message || 'Google Drive authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleDriveService.signOutFromGoogle();
      setIsAuthenticated(false);
      setAboutInfo(null);
      setFiles([]);
      toast.info('Google Drive disconnected');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackupEmployees = async () => {
    if (employees.length === 0) {
      toast.error('No employee records to backup');
      return;
    }

    setIsBackingUp(true);
    try {
      const uploadedFile = await googleDriveService.exportEmployeesToDrive(employees, currentFolderId);
      toast.success(`Backed up ${employees.length} employee records to Google Drive!`);
      await loadDriveData(currentFolderId);
      if (uploadedFile.webViewLink) {
        window.open(uploadedFile.webViewLink, '_blank');
      }
    } catch (err: any) {
      console.error('Backup error:', err);
      toast.error(err.message || 'Failed to backup records to Google Drive');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await googleDriveService.uploadFile(file, file.name, file.type, currentFolderId);
      toast.success(`"${file.name}" uploaded to Google Drive`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDriveData(currentFolderId);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setLoading(true);
    try {
      await googleDriveService.createFolder(newFolderName.trim(), currentFolderId);
      toast.success(`Folder "${newFolderName}" created`);
      setNewFolderName('');
      setShowCreateFolder(false);
      await loadDriveData(currentFolderId);
    } catch (err: any) {
      console.error('Create folder error:', err);
      toast.error(err.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    const target = fileToDelete;
    setFileToDelete(null);
    setLoading(true);
    try {
      await googleDriveService.deleteFile(target.id);
      toast.success(`"${target.name}" removed from Google Drive`);
      await loadDriveData(currentFolderId);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder: DriveFileItem) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
    loadDriveData(folder.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    const target = folderPath[index];
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(target.id);
    loadDriveData(target.id);
  };

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '0 B';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-[#C5A059]" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-cyan-400" />;
    }
    if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) {
      return <FileText className="w-5 h-5 text-blue-400" />;
    }
    return <FileIcon className="w-5 h-5 text-white/50" />;
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#111112] border border-white/5 p-8 md:p-12 text-center rounded-none relative overflow-hidden">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-none flex items-center justify-center mx-auto text-[#C5A059]">
            <HardDrive className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-serif text-white font-bold mb-2">Google Drive Integration</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Connect your Google account with permission to store verified employee registries, export Excel backups, and manage personnel documents directly inside Google Drive.
            </p>
          </div>

          <div className="bg-white/5 border border-white/5 p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/80">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>One-click automatic registry backups (.xlsx)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>Upload NID copies, contracts & employee photos</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>Access & organize files securely from Google Drive</span>
            </div>
          </div>

          {/* Official styled Google Sign In Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold px-6 py-3 rounded-none shadow-md transition-all cursor-pointer border border-neutral-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span className="text-xs uppercase tracking-wider font-bold">
                {loading ? 'Connecting...' : 'Sign in with Google'}
              </span>
            </button>
          </div>

          <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
            Authorization grants Drive file management capabilities with your permission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Account and Storage Info */}
      <div className="bg-[#111112] border border-white/5 p-6 rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-none overflow-hidden flex items-center justify-center">
            {aboutInfo?.user?.photoLink ? (
              <img src={aboutInfo.user.photoLink} alt="Google Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserCheck className="w-6 h-6 text-[#C5A059]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{aboutInfo?.user?.displayName || 'Google Drive Connected'}</h3>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 font-mono">
                Active Node
              </span>
            </div>
            <p className="text-[11px] text-white/40">{aboutInfo?.user?.emailAddress || 'Connected Account'}</p>
            {aboutInfo?.storageQuota && (
              <p className="text-[10px] text-white/30 font-mono mt-1">
                Used {formatBytes(aboutInfo.storageQuota.usageInDrive || aboutInfo.storageQuota.usage)} of {formatBytes(aboutInfo.storageQuota.limit)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button
            onClick={handleBackupEmployees}
            disabled={isBackingUp}
            className="bg-[#C5A059] hover:bg-[#B48F48] text-black rounded-none h-10 px-4 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2"
          >
            {isBackingUp ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            Backup Registry to Drive
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-none h-10 px-4 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2"
          >
            {isUploading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            onClick={() => setShowCreateFolder(true)}
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/5 border border-white/5 rounded-none h-10 px-3 text-[10px] uppercase tracking-widest font-bold"
          >
            <FolderPlus className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => loadDriveData(currentFolderId)}
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/5 border border-white/5 rounded-none h-10 px-3 text-[10px] uppercase tracking-widest font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={handleGoogleLogout}
            variant="ghost"
            className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-red-500/10 rounded-none h-10 px-3 text-[10px] uppercase tracking-widest font-bold"
          >
            Disconnect
          </Button>
        </div>
      </div>

      {/* Navigation Breadcrumb & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-white/50 overflow-x-auto py-1">
          {folderPath.map((item, idx) => (
            <React.Fragment key={idx}>
              <button
                type="button"
                onClick={() => handleBreadcrumbClick(idx)}
                className={`hover:text-[#C5A059] transition-colors uppercase tracking-wider ${
                  idx === folderPath.length - 1 ? 'text-white font-bold' : ''
                }`}
              >
                {item.name}
              </button>
              {idx < folderPath.length - 1 && <span className="text-white/20">/</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/20" />
          <Input
            placeholder="Search Drive files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadDriveData(currentFolderId);
            }}
            className="pl-9 h-10 bg-white/5 border-white/10 rounded-none text-xs w-full focus-visible:ring-[#C5A059]"
          />
        </div>
      </div>

      {/* Drive File Explorer Table */}
      <div className="bg-[#111112] border border-white/5 overflow-hidden">
        {loading && files.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-white/40">
            <RefreshCw className="w-6 h-6 animate-spin text-[#C5A059]" />
            <span className="text-xs tracking-widest uppercase">Fetching Google Drive Index...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <HardDrive className="w-10 h-10 text-white/20 mx-auto" />
            <p className="text-xs text-white/40 uppercase tracking-widest">No files found in this directory</p>
            <p className="text-[10px] text-white/20">Click &quot;Backup Registry to Drive&quot; or upload files to start.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  <th className="py-4 px-6 font-semibold">Item Name</th>
                  <th className="py-4 px-6 font-semibold">Type</th>
                  <th className="py-4 px-6 font-semibold">Size</th>
                  <th className="py-4 px-6 font-semibold">Last Modified</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white/80">
                {files.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  return (
                    <tr
                      key={file.id}
                      className="hover:bg-white/[0.03] transition-colors group cursor-default"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.mimeType)}
                          {isFolder ? (
                            <button
                              type="button"
                              onClick={() => handleFolderClick(file)}
                              className="font-bold text-white hover:text-[#C5A059] transition-colors text-left"
                            >
                              {file.name}
                            </button>
                          ) : (
                            <span className="font-medium text-white/90 truncate max-w-xs">{file.name}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-white/40 font-mono text-[10px]">
                        {isFolder ? 'Folder' : file.mimeType.split('/').pop()?.toUpperCase() || 'FILE'}
                      </td>

                      <td className="py-4 px-6 text-white/40 font-mono text-[10px]">
                        {isFolder ? '—' : formatBytes(file.size)}
                      </td>

                      <td className="py-4 px-6 text-white/40 font-mono text-[10px]">
                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {!isFolder && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  toast.info(`Downloading "${file.name}"...`);
                                  const blob = await googleDriveService.downloadFile(file.id);
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = file.name;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                  toast.success('Download complete');
                                } catch (err: any) {
                                  toast.error(err.message || 'Download failed');
                                }
                              }}
                              className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                              title="Download to computer"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {showCreateFolder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111112] border border-white/10 max-w-sm w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <FolderPlus className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Create New Folder</h3>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-4">
                <Input
                  placeholder="e.g. Employee Documents"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-none text-xs"
                  autoFocus
                  required
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateFolder(false)}
                    className="text-xs uppercase tracking-widest text-white/40"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#C5A059] text-black font-bold text-xs uppercase tracking-widest rounded-none"
                  >
                    Create
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY USER CONFIRMATION DIALOG FOR FILE DELETION */}
      <AnimatePresence>
        {fileToDelete && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18181B] border border-red-500/20 max-w-md w-full p-6 space-y-4 text-white shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider">Confirm Google Drive Deletion</h4>
                  <p className="text-[10px] text-white/40 font-mono">Workspace File Mutating Operation</p>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/5 text-xs space-y-1">
                <p className="text-white/60">Are you sure you want to permanently delete this item from Google Drive?</p>
                <p className="font-bold text-white font-mono truncate">{fileToDelete.name}</p>
                <p className="text-[10px] text-white/40 font-mono">
                  {fileToDelete.mimeType === 'application/vnd.google-apps.folder' ? 'Folder and all its contents' : `File (${formatBytes(fileToDelete.size)})`}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFileToDelete(null)}
                  className="text-xs uppercase tracking-widest text-white/40 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmDeleteFile}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-none shadow-lg shadow-red-600/20"
                >
                  Confirm Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
