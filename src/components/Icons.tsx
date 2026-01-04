
import React, { useRef } from 'react';

// Icons wrapper to allow gradient text effects, updated to support extra props like onClick
const SvgWrapper = ({ children, className, ...props }: { children?: React.ReactNode, className?: string, [key: string]: any }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    {children}
  </svg>
);

export const SendIcon = (props: any) => (
  <SvgWrapper {...props}>
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </SvgWrapper>
);

export const MenuIcon = (props: any) => (
  <SvgWrapper {...props}>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </SvgWrapper>
);

export const ActivityIcon = (props: any) => (
  <SvgWrapper {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </SvgWrapper>
);

export const SearchIcon = (props: any) => (
  <SvgWrapper {...props}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </SvgWrapper>
);

export const GlobeIcon = (props: any) => (
  <SvgWrapper {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </SvgWrapper>
);

export const AppleIcon = ({ className, ...props }: { className?: string, [key: string]: any }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.3-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.86-1.06 1.45-2.52 1.29-3.99-1.25.05-2.74.83-3.63 1.87-.82.96-1.53 2.49-1.34 3.97 1.41.11 2.85-.81 3.68-1.85"></path>
  </svg>
);

export const ImageIcon = (props: any) => (
  <SvgWrapper {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </SvgWrapper>
);

export const TrashIcon = (props: any) => (
  <SvgWrapper {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </SvgWrapper>
);

export const CpuIcon = (props: any) => (
  <SvgWrapper {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="14" x2="23" y2="14"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="14" x2="4" y2="14"></line>
  </SvgWrapper>
);

export const SettingsIcon = (props: any) => (
  <SvgWrapper {...props}>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </SvgWrapper>
);

export const ChevronLeftIcon = (props: any) => (
  <SvgWrapper {...props}>
    <polyline points="15 18 9 12 15 6"></polyline>
  </SvgWrapper>
);

export const HeartIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </SvgWrapper>
);

export const BriefcaseIcon = (props: any) => (
  <SvgWrapper {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </SvgWrapper>
);

export const DollarSignIcon = (props: any) => (
  <SvgWrapper {...props}>
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </SvgWrapper>
);

export const CalendarIcon = (props: any) => (
  <SvgWrapper {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </SvgWrapper>
);

export const DownloadIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </SvgWrapper>
);

export const UploadIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </SvgWrapper>
);

export const DatabaseIcon = (props: any) => (
  <SvgWrapper {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </SvgWrapper>
);

export const BookmarkIcon = (props: any) => (
    <SvgWrapper {...props}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </SvgWrapper>
);

export const BeakerIcon = (props: any) => (
    <SvgWrapper {...props}>
      <path d="M10 2v7.31"></path>
      <path d="M14 2v7.31"></path>
      <path d="M8.5 2h7"></path>
      <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
    </SvgWrapper>
);

export const BugIcon = (props: any) => (
    <SvgWrapper {...props}>
      <rect x="8" y="9" width="8" height="8" rx="4" ry="4"></rect>
      <path d="M6 13h2"></path>
      <path d="M16 13h2"></path>
      <path d="M9 7l-3-3"></path>
      <path d="M15 7l3-3"></path>
      <path d="M9 20l-3 3"></path>
      <path d="M15 20l3 3"></path>
      <line x1="12" y1="2" x2="12" y2="6"></line>
    </SvgWrapper>
);

export const CalculatorIcon = (props: any) => (
    <SvgWrapper {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2"></rect>
      <line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line>
      <path d="M16 10h.01"></path>
      <path d="M12 10h.01"></path>
      <path d="M8 10h.01"></path>
      <path d="M12 14h.01"></path>
      <path d="M8 14h.01"></path>
      <path d="M12 18h.01"></path>
      <path d="M8 18h.01"></path>
    </SvgWrapper>
);

export const BookOpenIcon = (props: any) => (
    <SvgWrapper {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </SvgWrapper>
);

export const AlertIcon = (props: any) => (
    <SvgWrapper {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </SvgWrapper>
);

export const CodeIcon = (props: any) => (
    <SvgWrapper {...props}>
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
    </SvgWrapper>
);

export const FolderIcon = ({ className, ...props }: { className?: string, [key: string]: any }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} {...props}>
       <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

export const MicIcon = (props: any) => (
    <SvgWrapper {...props}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </SvgWrapper>
);

export const StopIcon = (props: any) => (
    <SvgWrapper {...props}>
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    </SvgWrapper>
);

export const BrainIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-4z"></path>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-4z"></path>
  </SvgWrapper>
);

export const CloudIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
  </SvgWrapper>
);

export const RocketIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M4.5 11.5L3 22l10.5-1.5L21 3l-9.5 1.5-2.5 5.5Z"></path>
    <path d="M15 8.5L18 5"></path>
    <path d="M9.5 17.5l-2-2.5"></path>
  </SvgWrapper>
);

export const LayersIcon = (props: any) => (
  <SvgWrapper {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </SvgWrapper>
);

export const FileTextIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </SvgWrapper>
);

export const FileIcon = FileTextIcon; // Alias for FileIcon

export const PaperclipIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </SvgWrapper>
);

export const BellIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </SvgWrapper>
);

export const EditIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </SvgWrapper>
);

export const BotIcon = (props: any) => (
  <SvgWrapper {...props}>
    <path d="M12 8V4H8"></path>
    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
    <path d="M2 14h2"></path>
    <path d="M20 14h2"></path>
    <path d="M15 13v2"></path>
    <path d="M9 13v2"></path>
  </SvgWrapper>
);

export const HistoryIcon = (props: any) => (
  <SvgWrapper {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </SvgWrapper>
);

export const SaveIcon = (props: any) => (
    <SvgWrapper {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </SvgWrapper>
);

export const XIcon = (props: any) => (
  <SvgWrapper {...props}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </SvgWrapper>
);

// NOVOS ÍCONES PARA AS FUNCIONALIDADES SOLICITADAS
export const CopyIcon = (props: any) => (
  <SvgWrapper {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </SvgWrapper>
);

export const SquareIcon = (props: any) => (
  <SvgWrapper {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  </SvgWrapper>
);

export const CheckSquareIcon = (props: any) => (
  <SvgWrapper {...props}>
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </SvgWrapper>
);

export const PlusIcon = (props: any) => (
  <SvgWrapper {...props}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </SvgWrapper>
);

interface AvatarProps {
  className?: string;
  editable?: boolean;
  currentImage?: string | null;
  onImageUpdate?: (newImage: string) => void;
}

export const AinstenAvatar = ({ className = "w-10 h-10", editable = false, currentImage, onImageUpdate }: AvatarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (editable && fileInputRef.current) {
      e.stopPropagation();
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpdate) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImageUpdate(base64String); // Envia para o App salvar
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Botão Invisível de Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* O Avatar em si */}
      <div 
        onClick={handleClick}
        className={`w-full h-full rounded-full overflow-hidden border-2 border-cyan-500/30 bg-slate-900 flex items-center justify-center shadow-lg shadow-cyan-500/20 ${editable ? 'cursor-pointer hover:border-cyan-400 transition-colors' : ''}`}
      >
        {currentImage ? (
          <img src={currentImage} alt="Ainsten" className="w-full h-full object-cover" />
        ) : (
          <BotIcon className="w-1/2 h-1/2 text-cyan-400" />
        )}
      </div>

      {/* Ícone de Lápis (Só aparece se editable = true) */}
      {editable && (
        <button 
          onClick={handleClick}
          className="absolute bottom-0 right-0 bg-cyan-600 text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-cyan-500 transition-transform hover:scale-110 z-10 flex items-center justify-center border-2 border-slate-900"
          title="Alterar Avatar"
        >
          <EditIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
