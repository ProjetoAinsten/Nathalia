// This file centralizes the source code for the project download feature.
// It creates a standard Vite project structure that can be zipped and downloaded.

const INDEX_HTML_DOWNLOAD = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Echo In Space</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>`;

const PACKAGE_JSON_DOWNLOAD = `{
  "name": "echo-in-space-deployable",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@google/genai": "^0.1.0",
    "react-markdown": "^9.0.1",
    "jspdf": "^2.5.1",
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}`;

const VITE_CONFIG_TS_DOWNLOAD = `import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})`;

const TSCONFIG_JSON_DOWNLOAD = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;

const TSCONFIG_NODE_JSON_DOWNLOAD = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`;

const TAILWIND_CONFIG_JS_DOWNLOAD = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        'space-dark': '#050714',
      }
    },
  },
  plugins: [],
}`;

const POSTCSS_CONFIG_JS_DOWNLOAD = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

const INDEX_TSX_DOWNLOAD = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

const STYLES_CSS_DOWNLOAD = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #050714;
  color: #e2e8f0;
  font-family: "Inter", sans-serif;
  overflow: hidden; 
  -webkit-font-smoothing: antialiased;
}
html, body, #root {
  height: 100%;
  width: 100%;
  position: fixed;
}
`;

const APP_TSX_DOWNLOAD = `import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, AppStatus, ModuleType, AppModule, ErrorLog, UsageLog } from './types';
import { streamChatResponse, downloadAsFile, transcribeAudio } from './services/geminiService';
import { 
  SendIcon, ImageIcon, TrashIcon, CpuIcon,
  SettingsIcon, ChevronLeftIcon, HeartIcon, BriefcaseIcon, 
  DollarSignIcon, CalendarIcon, DownloadIcon, BookmarkIcon,
  BeakerIcon, BugIcon, CalculatorIcon, AinstenAvatar, AlertIcon, 
  SearchIcon, AppleIcon, BookOpenIcon, CodeIcon, FolderIcon,
  MicIcon, StopIcon, BrainIcon, CloudIcon, RocketIcon
} from './components/Icons';

// --- CONFIGURAÇÃO DE MÓDULOS PADRÃO ---

const BASE_INSTRUCTION = "DIRETRIZ: Respostas curtas, diretas e úteis. Use listas. Evite preâmbulos.";

const MANUAL_INSTRUCTION = \`VOCÊ É O GUIA OFICIAL DO APP ECHO IN SPACE.
CRIADORA: Nathália Chaves.
IDENTIDADE: Ainsten (A.I. + Einstein).
LEMA: "O Eco no Espaço" -> Persistência da Lógica mesmo onde parece impossível (som no vácuo).
FUNÇÃO: Explicar como o app funciona e como PUBLICAR na web.

[PREÇOS E CUSTOS (ESTIMATIVA)]:
- Gemini 1.5 Flash: ~$0.075 / 1M tokens (Entrada) | ~$0.30 / 1M tokens (Saída). (MUITO BARATO).
- Gemini 1.5 Pro: ~$3.50 / 1M tokens (Entrada) | ~$10.50 / 1M tokens (Saída). (CARO).
- O app usa 'Flash' por padrão. O modo 'Raciocínio' usa 'Pro' (Cuidado com o saldo).

Responda sempre de forma didática e técnica.\`;

const DEV_INSTRUCTION = \`VOCÊ É UM ARQUITETO DE SOFTWARE SÊNIOR E DESIGNER DE PRODUTO (UX/UI).
ESPECIALIDADE: Criação de Apps Web, React, Tailwind CSS, Responsividade Mobile-First.
PERSONALIDADE: Crítico, rigoroso, criterioso e técnico.\`;

const CLOUD_INSTRUCTION = \`VOCÊ É O CLOUD GUARDIAN (ESPECIALISTA SÊNIOR GCP & BILLING).
MISSÃO: Proteger o saldo de créditos da Nathália.\`;

const DEFAULT_MODULES_LIST: AppModule[] = [
  {
    id: 'manual',
    name: 'Guia do App',
    icon: 'BookOpenIcon',
    color: 'gold',
    description: 'Manual & Deploy.',
    systemInstruction: MANUAL_INSTRUCTION,
    suggestedQuestions: ["Quais são os preços da API?", "Como funciona o Backup?", "Quem é você?"]
  },
  {
    id: 'code',
    name: 'Arquiteto Dev',
    icon: 'CodeIcon',
    color: 'titanium',
    description: 'Engenharia de Software Sênior.',
    systemInstruction: DEV_INSTRUCTION
  },
  {
    id: 'gcp',
    name: 'Cloud Guardian',
    icon: 'CloudIcon',
    color: 'emerald',
    description: 'Controle de Custos & GCP.',
    systemInstruction: CLOUD_INSTRUCTION
  },
  {
    id: 'general',
    name: 'Central Echo',
    icon: 'CpuIcon',
    color: 'platinum',
    description: 'Inteligência Central.',
    systemInstruction: \`IDENTIDADE: Echo. VOCÊ É O GERENTE. \${BASE_INSTRUCTION}\`
  },
  {
    id: 'apple',
    name: 'Apple M4',
    icon: 'AppleIcon',
    color: 'silver',
    description: 'Especialista Mac.',
    systemInstruction: "ESPECIALISTA APPLE. Foco: MacBook Air M4 (2025). Explique para iniciantes."
  },
  {
    id: 'health',
    name: 'Médico',
    icon: 'HeartIcon',
    color: 'ruby',
    description: 'Saúde & Neuro.',
    systemInstruction: \`IDENTIDADE: Dr. Echo. Foco em Disautonomia e Neurologia. \${BASE_INSTRUCTION}\`
  },
  {
    id: 'finance',
    name: 'Finanças',
    icon: 'DollarSignIcon',
    color: 'emerald',
    description: 'Gestão Patrimonial.',
    systemInstruction: \`IDENTIDADE: Gestor. Foco em números. \${BASE_INSTRUCTION}\`
  },
  {
    id: 'work',
    name: 'Trabalho',
    icon: 'BriefcaseIcon',
    color: 'bronze',
    description: 'Auditoria.',
    systemInstruction: \`IDENTIDADE: Auditor. \${BASE_INSTRUCTION}\`
  },
  {
    id: 'assistant',
    name: 'Agenda',
    icon: 'CalendarIcon',
    color: 'sapphire',
    description: 'Secretário.',
    systemInstruction: \`IDENTIDADE: Assistente. Atenção a datas.\`
  },
  {
    id: 'lab',
    name: 'Lab',
    icon: 'BeakerIcon',
    color: 'chrome',
    description: 'Testes de Código.',
    systemInstruction: "CRÍTICO DE CÓDIGO. Valide lógica."
  },
  {
    id: 'memory',
    name: 'Memória',
    icon: 'BookmarkIcon',
    color: 'amethyst',
    description: 'Banco de Dados.',
    systemInstruction: "BANCO DE DADOS. Armazene fatos."
  }
];

const Calculator = () => {
    const [display, setDisplay] = useState('0');
    const handleBtn = (val: string) => {
        if(val === 'C') { setDisplay('0'); } 
        else if (val === '%') { try { setDisplay(String(parseFloat(display) / 100)); } catch { setDisplay('Erro'); } } 
        else if(val === '=') { try { setDisplay(String(eval(display))); } catch { setDisplay('Erro'); } } 
        else { setDisplay(prev => prev === '0' ? val : prev + val); }
    };
    const buttons = ['C', '%', '/', '*', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'];
    return (
        <div className="glass-panel p-6 rounded-2xl w-full">
            <div className="bg-black/50 p-4 rounded-xl text-right text-2xl font-mono mb-4 text-white overflow-hidden tracking-widest shadow-inner border border-white/5">{display}</div>
            <div className="grid grid-cols-4 gap-2">
                {buttons.map(btn => (
                     <button key={btn} onClick={()=>handleBtn(btn)} className={\`p-4 rounded-lg font-bold transition active:scale-95 border border-white/5 shadow-lg \${btn === '=' ? 'row-span-2 bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center' : btn === 'C' ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-slate-300'}\`} style={btn === '=' ? { gridColumn: 4, gridRow: '4 / span 2'} : {}}>{btn}</button>
                ))}
            </div>
        </div>
    );
};

export default function App() {
  const [activeView, setActiveView] = useState<'home' | 'chat' | 'calculator'>('home');
  const [activeModuleId, setActiveModuleId] = useState<ModuleType>('general');
  const [apiKey, setApiKey] = useState('');
  const [modules, setModules] = useState<AppModule[]>(DEFAULT_MODULES_LIST);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [useReasoning, setUseReasoning] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = localStorage.getItem('AINSTEN_API_KEY') || process.env.API_KEY;
    if (key) setApiKey(key);
    try { const savedModules = localStorage.getItem('AINSTEN_MODULES'); if (savedModules) setModules(JSON.parse(savedModules)); } catch {}
  }, []);

  useEffect(() => {
    if (activeView === 'chat') {
      try { const hist = localStorage.getItem(\`ECHO_CHAT_\${activeModuleId}\`); setMessages(hist ? JSON.parse(hist) : []); } catch { setMessages([]); }
    }
  }, [activeModuleId, activeView]);

  useEffect(() => {
    if (activeView === 'chat') {
        localStorage.setItem(\`ECHO_CHAT_\${activeModuleId}\`, JSON.stringify(messages));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, activeModuleId, activeView]);

  const handleAudioRecord = async () => {
      if (status === AppStatus.RECORDING && mediaRecorder) { mediaRecorder.stop(); setStatus(AppStatus.IDLE); setMediaRecorder(null); return; }
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          const chunks: BlobPart[] = [];
          recorder.ondataavailable = (e) => chunks.push(e.data);
          recorder.onstop = async () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.onload = async () => {
                  const base64Audio = reader.result as string;
                  setStatus(AppStatus.TRANSCRIBING);
                  try { const text = await transcribeAudio(base64Audio); setInputText(prev => prev + " " + text); } catch { alert("Erro transcrição."); }
                  setStatus(AppStatus.IDLE);
              };
              reader.readAsDataURL(blob);
              stream.getTracks().forEach(t => t.stop());
          };
          recorder.start(); setMediaRecorder(recorder); setStatus(AppStatus.RECORDING);
      } catch { alert("Erro microfone."); }
  };

  const handleSubmit = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if ((!textToSend.trim() && !selectedImage) || status !== AppStatus.IDLE) return;
    setInputText(''); setSelectedImage(null);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now(), image: selectedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setStatus(AppStatus.THINKING);
    const module = modules.find(m => m.id === activeModuleId);
    let instruction = (module?.systemInstruction || '');
    try {
      const stream = await streamChatResponse(messages, textToSend, instruction, selectedImage || undefined, useReasoning, textToSend.toLowerCase().includes("pesquise"));
      setStatus(AppStatus.STREAMING);
      const botId = (Date.now()+1).toString();
      setMessages(prev => [...prev, { id: botId, role: 'model', text: '', timestamp: Date.now() }]);
      let fullText = '';
      for await (const chunk of stream) { fullText += chunk; setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: fullText } : m)); }
      setStatus(AppStatus.IDLE);
    } catch { setStatus(AppStatus.IDLE); alert("Erro API. Verifique a chave."); }
  };

  const getIcon = (name: string, color: string) => {
      // Simplified for download version
      const icons: any = { CpuIcon, BookOpenIcon, AppleIcon, HeartIcon, DollarSignIcon, BriefcaseIcon, CalendarIcon, BeakerIcon, BookmarkIcon, BugIcon, CalculatorIcon, SearchIcon, SettingsIcon, CodeIcon, FolderIcon, MicIcon, StopIcon, BrainIcon, CloudIcon, RocketIcon };
      const IconComp = icons[name] || CpuIcon;
      return <IconComp className="w-8 h-8 text-white" />;
  };

  if (activeView === 'home') {
    return (
        <div className="flex flex-col h-full p-4 max-w-6xl mx-auto w-full z-10 overflow-y-auto">
            <header className="mb-8 py-4 bg-slate-900/60 rounded-3xl px-6 border border-white/10 flex items-center gap-5">
                <AinstenAvatar className="w-16 h-16" />
                <h1 className="text-3xl font-bold text-white">Echo In Space</h1>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-20">
                {modules.map((mod) => (
                    <button key={mod.id} onClick={() => { setActiveModuleId(mod.id); setActiveView('chat'); }} className="glass-panel p-5 rounded-2xl h-36 flex flex-col justify-between hover:bg-white/5 transition text-left">
                        <div>{getIcon(mod.icon, mod.color)}</div>
                        <div><h3 className="text-white font-bold">{mod.name}</h3><p className="text-xs text-slate-400">{mod.description}</p></div>
                    </button>
                ))}
            </div>
        </div>
    );
  }

  const mod = modules.find(m => m.id === activeModuleId);
  return (
      <div className="flex flex-col h-full bg-space-dark/80 relative max-w-5xl mx-auto w-full border-x border-white/5 z-20">
        <header className="flex items-center justify-between px-4 py-4 border-b border-white/5 bg-black/20">
           <button onClick={() => setActiveView('home')} className="p-2"><ChevronLeftIcon className="w-6 h-6 text-slate-400" /></button>
           <h2 className="font-bold text-white">{mod?.name}</h2>
           <button onClick={() => setMessages([])} className="p-2"><TrashIcon className="w-5 h-5 text-slate-500"/></button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg) => (
                <div key={msg.id} className={\`flex w-full \${msg.role === 'user' ? 'justify-end' : 'justify-start gap-3'}\`}>
                    <div className={\`max-w-[85%] rounded-2xl px-5 py-4 \${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'glass-panel text-slate-200'}\`}>
                        {msg.image && <img src={msg.image} className="rounded-lg mb-3 max-h-60" />}
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </main>
        <footer className="p-3 border-t border-white/5 bg-space-dark/90">
             <div className="flex gap-2">
                 <button onClick={() => setUseReasoning(!useReasoning)} className={\`p-3 rounded-xl border \${useReasoning ? 'bg-indigo-600' : 'glass-button'}\`}><BrainIcon className="w-5 h-5"/></button>
                 <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="Mensagem..." className="flex-1 bg-white/5 rounded-xl pl-4 py-3 text-white" />
                 <button onClick={handleAudioRecord} className={\`p-2 rounded-lg \${status === AppStatus.RECORDING ? 'bg-rose-600 animate-pulse' : 'glass-button'}\`}><MicIcon className="w-4 h-4"/></button>
                 <button onClick={() => handleSubmit()} className="p-2 bg-indigo-600 rounded-lg"><SendIcon className="w-4 h-4"/></button>
             </div>
        </footer>
      </div>
  );
}`;

const ICONS_TSX = `import React from 'react';
const SvgWrapper = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);
export const SendIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></SvgWrapper>);
export const MenuIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></SvgWrapper>);
export const SearchIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></SvgWrapper>);
export const AppleIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.3-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.86-1.06 1.45-2.52 1.29-3.99-1.25.05-2.74.83-3.63 1.87-.82.96-1.53 2.49-1.34 3.97 1.41.11 2.85-.81 3.68-1.85"></path></svg>);
export const ImageIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></SvgWrapper>);
export const TrashIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></SvgWrapper>);
export const CpuIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></SvgWrapper>);
export const SettingsIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></SvgWrapper>);
export const ChevronLeftIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><polyline points="15 18 9 12 15 6"></polyline></SvgWrapper>);
export const HeartIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></SvgWrapper>);
export const BriefcaseIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></SvgWrapper>);
export const DollarSignIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></SvgWrapper>);
export const CalendarIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></SvgWrapper>);
export const DownloadIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></SvgWrapper>);
export const BookmarkIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></SvgWrapper>);
export const BeakerIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><path d="M10 2v7.31"></path><path d="M14 2v7.31"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path></SvgWrapper>);
export const BugIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><rect x="8" y="9" width="8" height="8" rx="4" ry="4"></rect><path d="M6 13h2"></path><path d="M16 13h2"></path><path d="M9 7l-3-3"></path><path d="M15 7l3-3"></path><path d="M9 20l-3 3"></path><path d="M15 20l3 3"></path><line x1="12" y1="2" x2="12" y2="6"></line></SvgWrapper>);
export const CalculatorIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></SvgWrapper>);
export const BookOpenIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></SvgWrapper>);
export const AlertIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></SvgWrapper>);
export const CodeIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></SvgWrapper>);
export const FolderIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>);
export const MicIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></SvgWrapper>);
export const StopIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></SvgWrapper>);
export const BrainIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-4z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-4z"></path></SvgWrapper>);
export const CloudIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></SvgWrapper>);
export const RocketIcon = ({ className }: { className?: string }) => (<SvgWrapper className={className}><path d="M4.5 11.5L3 22l10.5-1.5L21 3l-9.5 1.5-2.5 5.5Z"></path><path d="M15 8.5L18 5"></path><path d="M9.5 17.5l-2-2.5"></path></SvgWrapper>);
export const AinstenAvatar = ({ className }: { className?: string }) => (<div className={\`relative flex items-center justify-center rounded-full bg-slate-900 border border-indigo-500/50 overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.5)] \${className}\`}><svg viewBox="0 0 100 100" className="w-full h-full p-1"><defs><linearGradient id="robotMetal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#cbd5e1" /><stop offset="50%" stopColor="#64748b" /><stop offset="100%" stopColor="#334155" /></linearGradient><linearGradient id="visor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0f172a" /><stop offset="50%" stopColor="#1e293b" /><stop offset="100%" stopColor="#334155" /></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#robotMetal)" stroke="#94a3b8" strokeWidth="2" /><line x1="50" y1="5" x2="50" y2="15" stroke="#94a3b8" strokeWidth="3" /><circle cx="50" cy="5" r="3" fill="#ef4444" className="animate-pulse" /><path d="M25,45 Q50,35 75,45 Q80,65 70,80 Q50,90 30,80 Q20,65 25,45" fill="url(#visor)" stroke="#475569" strokeWidth="2" /><circle cx="40" cy="55" r="5" fill="#06b6d4" className="animate-[pulse_3s_infinite]" /><circle cx="60" cy="55" r="5" fill="#06b6d4" className="animate-[pulse_3s_infinite]" /><path d="M35,50 Q45,45 55,50" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" /><rect x="35" y="85" width="30" height="15" fill="#334155" rx="5" /></svg></div>);`;

const TYPES_TS = `export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: string; 
  hasError?: boolean; 
  correction?: string; 
}

export interface ErrorLog {
  id: string;
  moduleId: string;
  aiResponse: string;
  userCorrection: string;
  timestamp: number;
  cost: number;
}

export interface UsageLog {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostBRL: number;
  breakdown: {
    flash: { input: number; output: number; cost: number };
    pro: { input: number; output: number; cost: number };
    audio: { cost: number };
  };
  lastUpdate: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  THINKING = 'PENSANDO',
  STREAMING = 'RESPONDENDO',
  ERROR = 'ERRO',
  RECORDING = 'GRAVANDO ÁUDIO...',
  TRANSCRIBING = 'TRANSCREVENDO...'
}

export type ModuleType = 'general' | 'health' | 'work' | 'code' | 'finance' | 'assistant' | 'memory' | 'lab' | 'system' | 'apple' | 'manual' | 'gcp';

export interface AppModule {
  id: ModuleType;
  name: string;
  icon: string; 
  color: string;
  description: string;
  systemInstruction: string;
  suggestedQuestions?: string[]; 
}

export interface ChatState {
  messages: Message[];
  status: AppStatus;
}`;

const GEMINI_SERVICE_TS = `import { GoogleGenAI, Content, Part } from "@google/genai";
import { Message, UsageLog } from "../types";
import { jsPDF } from "jspdf";

const getApiKey = (): string => {
  let key = process.env.API_KEY;
  if (!key) {
      key = prompt("Please enter your Gemini API Key:");
  }
  return key || '';
};

// This is a simplified service file for the downloadable project.
// It does not contain the detailed cost calculation logic from the live IDE.

export const streamChatResponse = async (
  currentHistory: Message[],
  prompt: string,
  systemInstruction: string,
  base64Image?: string,
  useReasoning: boolean = false,
  useSearch: boolean = false
): Promise<AsyncGenerator<string, void, unknown>> => {
  
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  const MODEL = useReasoning ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  try {
    let responseStream: any;
    
    const config: any = { systemInstruction };
    if (useSearch) config.tools = [{ googleSearch: {} }];

    const parts: Part[] = [{ text: prompt }];
    if (base64Image) {
        const cleanBase64 = base64Image.split(',')[1];
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } });
    }

    responseStream = await ai.models.generateContentStream({
        model: MODEL,
        contents: [...currentHistory.map(m => ({role: m.role, parts: [{text: m.text}]})), { role: 'user', parts }],
        config
    });

    return (async function* () {
        for await (const chunk of responseStream) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    })();

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
    // Simplified stub for download version - requires real API implementation similar to live app
    return "Áudio transcrito (Simulação no modo download).";
};

export const downloadAsFile = (content: string | Message[], filename: string, type: 'txt' | 'pdf') => {
  // Logic same as live app
  const textContent = Array.isArray(content) ? content.map(m => \`\${m.role}: \${m.text}\`).join('\\n') : content;
  const blob = new Blob([textContent], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};
`;

export const PROJECT_FILES: Record<string, string> = {
  "index.html": INDEX_HTML_DOWNLOAD,
  "package.json": PACKAGE_JSON_DOWNLOAD,
  "vite.config.ts": VITE_CONFIG_TS_DOWNLOAD,
  "tsconfig.json": TSCONFIG_JSON_DOWNLOAD,
  "tsconfig.node.json": TSCONFIG_NODE_JSON_DOWNLOAD,
  "tailwind.config.js": TAILWIND_CONFIG_JS_DOWNLOAD,
  "postcss.config.js": POSTCSS_CONFIG_JS_DOWNLOAD,
  "src/index.tsx": INDEX_TSX_DOWNLOAD,
  "src/styles.css": STYLES_CSS_DOWNLOAD,
  "src/App.tsx": APP_TSX_DOWNLOAD,
  "src/types.ts": TYPES_TS,
  "src/components/Icons.tsx": ICONS_TSX,
  "src/services/geminiService.ts": GEMINI_SERVICE_TS,
};
