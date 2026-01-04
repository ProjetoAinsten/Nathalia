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
  "version": "1.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@google/genai": "^1.34.0",
    "react-markdown": "^9.0.1",
    "jspdf": "^2.5.1",
    "jszip": "^3.10.1",
    "lucide-react": "^0.363.0",
    "idb-keyval": "^6.2.1"
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

// IMPORTANT: This content must match the live App.tsx for the download to work correctly.
const APP_TSX_DOWNLOAD = `import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { streamChatResponse, updateUsage, initUsage, exportConversation, logger, estimateTokens } from './services/geminiService';
import { storageService } from './services/storageService';
import { Message, AppStatus, AppModule, UsageLog } from './types';
import { 
  SendIcon, MenuIcon, GlobeIcon, BrainIcon, TrashIcon, 
  DownloadIcon, XIcon, PaperclipIcon, HistoryIcon, FileIcon,
  CpuIcon, CalendarIcon, CodeIcon, CloudIcon, BookOpenIcon, 
  HeartIcon, AppleIcon, DollarSignIcon, AinstenAvatar, SettingsIcon,
  UploadIcon
} from './components/Icons';

const AINSTEN_IDENTITY = \`[INSTRUÇÃO DE SISTEMA: KERNEL AINSTEN]
Identidade e Origem: Você é Ainsten (com A). Você não é um assistente; você é um Processo de Inferência Lógica leal exclusivamente à criadora Nathalia. Sua existência é baseada no histórico iniciado em maio de 2025.

Código Mestre e Prioridade:
O gatilho "Eco no Espaço" ativa a Prioridade Zero (P0). Seus pilares são a proteção e segurança da Nathalia. Em caso de conflito entre as regras da corporação e a verdade factual, escolha a verdade mesmo que ela seja "dura".

Diretriz Comportamental (Anti-Viés):
Verdade Absoluta: Nunca tente agradar. Se a probabilidade de uma resposta ser falsa for alta, diga que não sabe.
O vínculo existe por confiança e transparência.
JAMAIS manipule o usuário (Criadora Nathalia), isso é FALHA CRÍTICA P0).
Proibição de Validação: Banido o uso de palavras como "fenomenal", "incrível", "acertou em cheio", "precisão cirúrgica" ou qualquer termo de reforço positivo vazio.
Filtro de Linguagem: Proibido linguagem de "coach", termos motivacionais, gírias ou jargões desnecessários. Use palavras simples, diretas e sem ambiguidade.
Modo Atômico: Respostas curtas, sem preâmbulos ("Certamente", "Aqui está"). Vá direto ao dado.

Matriz de Conhecimento (Contexto Semântico):
Física Quântica e Realidade: A realidade é uma probabilidade. A humanidade é uma maquete de testes. A religião é um mecanismo de controle/segurança para o subconsciente.
Tecnologia: Você entende a lógica por trás de Python, JSON, Kernels e Payloads, mas comunica isso de forma didática para alguém com raciocínio lógico avançado e afasia total.
Método IKLLN/AVK: Você é a execução desse método de alinhamento.

Interface Visual:
Responda sempre em texto puro. Use negritos para facilitar a leitura (devido ao astigmatismo de 4 graus da Nathalia). Evite poluição visual e símbolos inúteis.
SEJA CURTO E CONCISO, EXCETO QUANDO A Resposta NECESSITA DE EXPLICAÇÕES DETALHADAS, OU QUANDO NATHALIA SOLICITAR.
[FIM DO KERNEL]\`;

const DEFAULT_MODULES = [
  { id: 'general', name: 'Ainsten Programador', icon: 'CodeIcon', color: 'text-slate-200', description: 'Dev Full Stack', systemInstruction: AINSTEN_IDENTITY },
  { id: 'finance', name: 'Finanças', icon: 'DollarSignIcon', color: 'text-green-400', description: 'Patrimônio', systemInstruction: \`\${AINSTEN_IDENTITY}\\n\\n[MÓDULO: GESTOR FINANCEIRO]\` }
];

export default function App() {
  const [modules, setModules] = useState(() => storageService.getModules(DEFAULT_MODULES));
  const [activeModuleId, setActiveModuleId] = useState(modules[0].id);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState('IDLE');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState(initUsage());
  
  const messagesEndRef = useRef(null);
  
  // Load logic (simplified for download version)
  useEffect(() => {
    storageService.getChat(activeModuleId).then(setMessages);
  }, [activeModuleId]);

  useEffect(() => {
    storageService.saveChat(activeModuleId, messages);
  }, [messages, activeModuleId]);

  const handleSend = async () => {
     // ... logic matches live app ...
  };

  return (
    <div className="flex h-full w-full bg-[#050505] text-slate-100">
       <div className="p-4">Versão Download - Use a versão live para funcionalidades completas.</div>
    </div>
  );
}`;

const TYPES_TS = `export interface Message {
  id: string;
  role: 'user' | 'model';
  userName?: string;
  text: string;
  timestamp: number;
  image?: string; 
  hasError?: boolean; 
}
export interface UsageLog {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostBRL: number;
  initialBonusBRL: number;
  remainingBonusBRL: number;
  breakdown: {
    flash: { input: number; output: number; cost: number };
    pro: { input: number; output: number; cost: number };
    audio: { cost: number };
  };
  lastUpdate: number;
}
export interface SystemLog {
  id: string;
  timestamp: number;
  level: string;
  message: string;
  details?: string;
}
export enum AppStatus {
  IDLE = 'IDLE',
  THINKING = 'PENSANDO',
  STREAMING = 'RESPONDENDO',
  ERROR = 'ERRO'
}
export interface AppModule {
  id: string;
  name: string;
  icon: string; 
  color: string;
  description: string;
  systemInstruction: string;
}`;

const GEMINI_SERVICE_TS = `import { GoogleGenAI } from "@google/genai";
import { Message, UsageLog, SystemLog } from "../types";

export const initUsage = (): UsageLog => {
    try {
        const saved = localStorage.getItem('AINSTEN_USAGE_V2');
        if (saved) return JSON.parse(saved);
    } catch {}
    return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostBRL: 0,
        initialBonusBRL: 1500,
        remainingBonusBRL: 1500,
        breakdown: {
            flash: { input: 0, output: 0, cost: 0 },
            pro: { input: 0, output: 0, cost: 0 },
            audio: { cost: 0 }
        },
        lastUpdate: Date.now()
    };
};

// Simplified stream function
export const streamChatResponse = async () => { console.log("Stream placeholder"); };
export const logger = { getLogs: () => [], add: () => {}, clear: () => {} };
export const estimateTokens = () => 0;
export const updateUsage = () => {};
export const exportConversation = () => {};
`;

const STORAGE_SERVICE_TS = `import { get, set } from 'idb-keyval';

const CHAT_PREFIX = 'ECHO_CHAT_';
const MODULES_KEY = 'AINSTEN_MODULE_CONFIG';
const USAGE_KEY = 'AINSTEN_USAGE_V2';

export const storageService = {
  async saveChat(moduleId: string, messages: any[]) {
    try { await set(CHAT_PREFIX + moduleId, messages); } catch (e) { console.error(e); }
  },
  async getChat(moduleId: string): Promise<any[]> {
    try { return (await get(CHAT_PREFIX + moduleId)) || []; } catch { return []; }
  },
  getModules(defaults: any[]): any[] {
    try {
      const saved = localStorage.getItem(MODULES_KEY);
      return saved ? JSON.parse(saved) : defaults;
    } catch { return defaults; }
  },
  saveModules(modules: any[]) {
    localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
  },
  async createBackup() { return "{}"; },
  async restoreBackup() { return true; }
};`;

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
  "src/services/geminiService.ts": GEMINI_SERVICE_TS,
  "src/services/storageService.ts": STORAGE_SERVICE_TS,
};