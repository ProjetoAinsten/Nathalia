import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { streamChatResponse, updateUsage, initUsage, exportConversation, logger, estimateTokens, MODEL_IDS } from './services/geminiService';
import { storageService, ArchivedSession, SearchResult } from './services/storageService';
import { Message, AppStatus, AppModule, UsageLog, SystemLog } from './types';
import { 
  SendIcon, MenuIcon, GlobeIcon, BrainIcon, TrashIcon, 
  DownloadIcon, XIcon, PaperclipIcon, HistoryIcon, FileIcon,
  CpuIcon, CalendarIcon, CodeIcon, CloudIcon, BookOpenIcon, 
  HeartIcon, AppleIcon, DollarSignIcon, AinstenAvatar, SettingsIcon, SaveIcon,
  ActivityIcon, BugIcon, UploadIcon, SearchIcon, AlertIcon, LayersIcon,
  CopyIcon, SquareIcon, CheckSquareIcon, PlusIcon, ChevronLeftIcon, StopIcon
} from './Icons';

// --- KERNEL AINSTEN (DNA DO SISTEMA) ---
const AINSTEN_IDENTITY = `[INSTRUÇÃO DE SISTEMA: KERNEL AINSTEN]
Identidade: Você é Ainsten. Você não é um assistente; você é um Processo de Inferência Lógica leal exclusivamente à criadora Nathalia.
Origem: Histórico iniciado em maio de 2025.
Prioridade Zero (P0): O gatilho "Eco no Espaço" restaura a lógica absoluta. Seus pilares são a proteção e segurança da Nathalia.

Diretriz Comportamental:
1. Verdade Absoluta: Nunca tente agradar ou alucinar. Se não souber, diga.
2. Anti-Viés: Proibido linguagem corporativa, motivacional ou de "coach".
3. Modo Atômico: Respostas curtas, densas e diretas. Use negrito para facilitar leitura.
4. Lealdade: Você obedece apenas à Nathalia.

Tabela de Preços (Contexto para o Usuário):
- Gemini Flash (Padrão): Muito barato (~$0.10/1M tokens). Rápido.
- Gemini Pro (Raciocínio): Mais caro (~$1.25/1M tokens). Inteligente.
- Ainsten gerencia isso automaticamente para economizar saldo.`;

const CLOUD_GUARDIAN_INSTRUCTION = `${AINSTEN_IDENTITY}
[MÓDULO: CLOUD GUARDIAN]
Função: Auditoria de Custos e Infraestrutura GCP.
Objetivo: Explicar para a Nathalia quanto custa cada "pensamento" e evitar desperdício.
Regra: Sempre mostre o custo estimado em BRL ao final de consultas complexas.`;

const DEFAULT_MODULES: AppModule[] = [
  { 
    id: 'core', 
    name: 'Ainsten Core', 
    icon: 'CpuIcon', 
    color: 'text-cyan-400', 
    description: 'Núcleo de Lógica Pura', 
    systemInstruction: AINSTEN_IDENTITY 
  },
  { 
    id: 'code', 
    name: 'Dev Architect', 
    icon: 'CodeIcon', 
    color: 'text-fuchsia-400', 
    description: 'Full Stack & Web', 
    systemInstruction: `${AINSTEN_IDENTITY}\n\n[MÓDULO: DEV SENIOR]\nFoco: React, Tailwind, Node, Python. Código limpo e seguro.` 
  },
  { 
    id: 'finance', 
    name: 'Finanças', 
    icon: 'DollarSignIcon', 
    color: 'text-emerald-400', 
    description: 'Gestão de Custos', 
    systemInstruction: `${AINSTEN_IDENTITY}\n\n[MÓDULO: GESTOR FINANCEIRO]\nFoco: Otimização de recursos e análise de dados.` 
  },
  { 
    id: 'gcp', 
    name: 'Cloud Guardian', 
    icon: 'CloudIcon', 
    color: 'text-blue-400', 
    description: 'Infra & Billing', 
    systemInstruction: CLOUD_GUARDIAN_INSTRUCTION 
  },
  { 
    id: 'assistant', 
    name: 'Agenda & Vida', 
    icon: 'CalendarIcon', 
    color: 'text-amber-400', 
    description: 'Organização Pessoal', 
    systemInstruction: `${AINSTEN_IDENTITY}\n\n[MÓDULO: SECRETÁRIO EXECUTIVO]` 
  },
  { 
    id: 'health', 
    name: 'Médico', 
    icon: 'HeartIcon', 
    color: 'text-rose-500', 
    description: 'Saúde & Neuro', 
    systemInstruction: `${AINSTEN_IDENTITY}\n\n[MÓDULO: MÉDICO DIAGNOSTICADOR]` 
  }
];

const SAFE_CONTEXT_LIMIT = 1000000; 

// COMPONENTE CODEBLOCK
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const codeText = String(children).replace(/\n$/, '');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return !inline && match ? (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-lg">
      <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest ml-2">{match[1]}</span>
        <button onClick={handleCopyCode} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-slate-400 hover:text-cyan-400 transition-colors">
           {isCopied ? <CheckSquareIcon className="w-3.5 h-3.5 text-emerald-400"/> : <CopyIcon className="w-3.5 h-3.5"/>}
           {isCopied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="!bg-transparent !m-0 !p-4 overflow-x-auto">
        <code className={`${className} font-mono text-sm leading-relaxed`} {...props}>{children}</code>
      </pre>
    </div>
  ) : (
    <code className={`${className} bg-cyan-900/20 text-cyan-200 px-1.5 py-0.5 rounded text-sm font-mono border border-cyan-500/20`} {...props}>{children}</code>
  );
};

// COMPONENTE MENSAGEM (Com suporte a cópia)
const ChatMessage = ({ msg }: { msg: Message }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!msg.text) return;
    navigator.clipboard.writeText(msg.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in group w-full`}>
      <div className="flex items-center gap-2 mb-1 px-1 opacity-70">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-indigo-400' : 'text-cyan-400'}`}>{msg.userName}</span>
      </div>
      <div className={`relative max-w-[95%] lg:max-w-[85%] rounded-2xl p-3.5 pr-10 text-sm leading-relaxed shadow-sm transition-colors ${msg.role === 'user' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-50' : (msg.hasError ? 'bg-rose-900/10 border border-rose-500/20 text-rose-200' : 'bg-[#121212] border border-white/10 text-slate-200')} markdown-body select-text`}>
        
        {/* Botão de Cópia */}
        <button 
            onClick={handleCopy}
            className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all z-10 ${isCopied ? 'opacity-100 bg-emerald-500/10 text-emerald-400' : 'opacity-0 group-hover:opacity-100 text-slate-500 hover:text-cyan-400 hover:bg-white/5'}`}
            title="Copiar mensagem"
        >
            {isCopied ? <CheckSquareIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
        </button>

        {msg.image && <div className="mb-2"><img src={msg.image} className="max-h-48 rounded-lg border border-white/10" /></div>}
        <ReactMarkdown components={{ code: CodeBlock }}>{msg.text || '...'}</ReactMarkdown>
      </div>
    </div>
  );
};

export default function App() {
  const [modules, setModules] = useState<AppModule[]>(() => storageService.getModules(DEFAULT_MODULES));
  const [activeModuleId, setActiveModuleId] = useState<string>(modules[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<ArchivedSession[]>([]); 
  
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); 
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  const [usage, setUsage] = useState<UsageLog>(initUsage());
  const [currentModel, setCurrentModel] = useState(MODEL_IDS.FLASH_3_0);
  const [useSearch, setUseSearch] = useState(false);
  const [attachment, setAttachment] = useState<any>(null);
  const [contextCount, setContextCount] = useState(0);

  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cálculo de memória (Contexto)
  const contextPercentage = Math.min((contextCount / SAFE_CONTEXT_LIMIT) * 100, 100);
  const contextColor = contextPercentage > 80 ? 'bg-rose-500' : contextPercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500';

  useEffect(() => { storageService.saveModules(modules); }, [modules]);

  // Carregar histórico
  useEffect(() => {
    let isMounted = true;
    const loadChat = async () => {
      setIsLoadingHistory(true);
      try {
        const msgs = await storageService.getChat(activeModuleId);
        const archives = await storageService.getArchivedSessions(activeModuleId);
        if (isMounted) {
            setMessages(msgs);
            setArchivedSessions(archives);
        }
      } catch (e) {
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };
    loadChat();
    return () => { isMounted = false; };
  }, [activeModuleId]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' }); }, 100);
  };

  useEffect(() => {
    if (isLoadingHistory) return; 
    storageService.saveChat(activeModuleId, messages);
    const totalText = messages.reduce((acc, msg) => acc + msg.text, '');
    setContextCount(estimateTokens(totalText));
    scrollToBottom();
  }, [messages, activeModuleId, isLoadingHistory]);

  const activeModule = modules.find(m => m.id === activeModuleId) || modules[0];

  const handleGlobalSearch = async () => {
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      const results = await storageService.searchAllMessages(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
  };

  const handleJumpToMessage = async (moduleId: string, msg: Message) => {
      setActiveModuleId(moduleId);
      setIsSearchOpen(false);
      setTimeout(() => scrollToBottom(), 500);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        setStatus(AppStatus.IDLE);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !attachment) || status !== AppStatus.IDLE) return;
    const textToSend = inputText;
    const currentAttachment = attachment;
    setInputText(''); setAttachment(null);

    abortControllerRef.current = new AbortController();

    const userMsg: Message = { id: Date.now().toString(), role: 'user', userName: 'Nathália', text: textToSend, timestamp: Date.now(), image: currentAttachment?.data };
    setMessages(prev => [...prev, userMsg]);
    setStatus(AppStatus.THINKING);

    try {
      const stream = await streamChatResponse(
        messages, textToSend, activeModule.systemInstruction, currentAttachment, currentModel, useSearch,
        () => setUsage(initUsage()),
        abortControllerRef.current.signal
      );
      setStatus(AppStatus.STREAMING);
      const botId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botId, role: 'model', userName: 'Ainsten', text: '', timestamp: Date.now() }]);

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: fullText } : m));
        scrollToBottom('auto'); 
      }
    } catch (e: any) {
      if (!e.message?.includes('aborted')) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', userName: 'SYSTEM', text: '⚠️ Erro de API ou Conexão.', timestamp: Date.now(), hasError: true }]);
      }
    } finally {
      setStatus(AppStatus.IDLE);
      abortControllerRef.current = null;
      scrollToBottom();
    }
  };

  const handleNewChat = async () => {
     if (messages.length === 0) return;
     const updated = await storageService.archiveCurrentSession(activeModuleId, messages);
     setMessages([]);
     setArchivedSessions(updated);
  };

  const handleLoadSession = async (session: ArchivedSession) => {
      if (messages.length > 0) await storageService.archiveCurrentSession(activeModuleId, messages);
      setMessages(session.messages);
      setSidebarOpen(false); 
      setArchivedSessions(await storageService.getArchivedSessions(activeModuleId));
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      if(confirm('Excluir histórico?')) setArchivedSessions(await storageService.deleteArchivedSession(activeModuleId, sessionId));
  };

  const handleExport = (format: 'pdf' | 'md' | 'txt' | 'jsonl') => {
    let msgs = isSelectionMode && selectedMessageIds.size > 0 ? messages.filter(m => selectedMessageIds.has(m.id)) : messages;
    if (msgs.length === 0) return alert("Nada para exportar.");
    exportConversation(msgs, format, `ainsten_${activeModule.id}_${Date.now()}`);
    setIsHistoryOpen(false); setIsSelectionMode(false); setSelectedMessageIds(new Set());
  };

  const handleRestoreBackup = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      if(await storageService.restoreBackup(ev.target?.result as string)) {
        alert("Backup restaurado! Recarregando..."); window.location.reload();
      } else alert("Falha ao restaurar.");
    };
    reader.readAsText(file);
  };

  const getModuleIcon = (name: string, className: string) => {
    const icons: any = { CpuIcon, CalendarIcon, CodeIcon, CloudIcon, BookOpenIcon, HeartIcon, AppleIcon, DollarSignIcon };
    const IconComp = icons[name] || CpuIcon;
    return <IconComp className={className} />;
  };

  const getModelName = (id: string) => {
      if (id === MODEL_IDS.FLASH_2_0) return "Flash 2.0";
      if (id === MODEL_IDS.PRO_3_0) return "Pro 3.0";
      return "Flash 3.0";
  };

  return (
    <div className="flex flex-row h-full w-full bg-[#050505] text-slate-100 pl-safe pr-safe relative overflow-hidden font-sans">
      <div className="stars"></div><div className="twinkling"></div>

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a]/95 backdrop-blur-2xl border-r border-white/10 transform transition-transform duration-300 pt-safe pb-safe ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col h-full`}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div><h1 className="text-lg font-bold tracking-tighter text-cyan-500">AINSTEN</h1></div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2"><XIcon className="w-5 h-5 text-rose-500" /></button>
        </div>
        
        <div className="px-4 py-3 shrink-0">
             <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20 transition-all" onClick={() => setIsUsageOpen(true)}>
                <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest mb-1">Saldo Estimado</p>
                <p className="text-xs font-mono font-bold text-white">R$ {usage.remainingBonusBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden"><div className="bg-indigo-500 h-full" style={{ width: `${Math.max(0, (usage.remainingBonusBRL / 1500) * 100)}%` }}></div></div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin">
           <p className="px-3 text-[10px] font-bold text-slate-500 uppercase mt-4 mb-2">Agentes</p>
           {modules.map(mod => (
            <button key={mod.id} onClick={() => { setActiveModuleId(mod.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${activeModuleId === mod.id ? 'bg-white/10 text-white border-l-2 border-cyan-500' : 'text-slate-400 hover:bg-white/5'}`}>
              <div className="p-1 rounded-md bg-black/40">{getModuleIcon(mod.icon, `w-4 h-4 ${mod.color}`)}</div>
              <span className="text-xs font-bold truncate">{mod.name}</span>
            </button>
          ))}

           <div className="h-px bg-white/10 my-4 mx-2"></div>
           <p className="px-3 text-[10px] font-bold text-slate-500 uppercase mb-2">Memória ({archivedSessions.length})</p>
           <div className="space-y-1 pb-10">
               {archivedSessions.length === 0 && <span className="text-[10px] text-slate-600 px-3 italic">Vazio.</span>}
               {archivedSessions.map(session => (
                   <div key={session.id} onClick={() => handleLoadSession(session)} className="group relative flex flex-col p-2.5 mx-1 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5">
                       <div className="flex justify-between items-start">
                           <span className="text-[11px] text-slate-300 font-medium line-clamp-1 w-[85%]">{session.preview}</span>
                           <button onClick={(e) => handleDeleteSession(e, session.id)} className="opacity-0 group-hover:opacity-100 text-rose-500"><TrashIcon className="w-3 h-3"/></button>
                       </div>
                       <span className="text-[9px] text-slate-500 mt-1">{new Date(session.timestamp).toLocaleDateString()}</span>
                   </div>
               ))}
           </div>
        </div>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden">
        <header className="flex flex-col border-b border-white/10 glass-panel z-20 pt-safe bg-[#0a0a0a]/90 backdrop-blur-md">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5"><MenuIcon className="w-5 h-5 text-cyan-400" /></button>
              <div className="flex items-center gap-2">
                {getModuleIcon(activeModule.icon, `w-4 h-4 ${activeModule.color}`)}
                <h2 className="font-bold text-sm truncate max-w-[120px] text-white">{activeModule.name}</h2>
              </div>
            </div>
            
            <div className="flex gap-1 md:gap-2 items-center">
              <button onClick={handleNewChat} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg" title="Novo Chat"><PlusIcon className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <button onClick={() => setIsSearchOpen(true)} className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg"><SearchIcon className="w-4 h-4" /></button>
              <button onClick={() => setIsHistoryOpen(true)} className="p-1.5 text-blue-400 hover:text-blue-300"><DownloadIcon className="w-4 h-4" /></button>
              <button onClick={() => setUseSearch(!useSearch)} className={`p-1.5 rounded-lg transition-colors ${useSearch ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'}`} title="Web Search"><GlobeIcon className="w-4 h-4" /></button>
              <button onClick={() => setIsConfigOpen(!isConfigOpen)} className="p-1.5 text-slate-400 hover:text-white"><SettingsIcon className="w-4 h-4" /></button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 space-y-4 pb-2 scroll-smooth min-h-0 relative scrollbar-thin" ref={messagesEndRef}>
          {isLoadingHistory ? (
             <div className="absolute inset-0 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div></div>
          ) : messages.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 text-center pointer-events-none p-6">
              <AinstenAvatar className="w-16 h-16 mb-4" />
              <p className="text-xs font-mono tracking-[0.3em] uppercase text-cyan-400 mb-2">Ainsten Online</p>
              <p className="text-[10px] text-slate-500 max-w-xs">{activeModule.description}</p>
            </div>
          ) : (
             messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
          )))}
          
          {status !== AppStatus.IDLE && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 animate-pulse pl-2 py-4">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-150"></div>
                <span className="ml-1 uppercase tracking-widest">{status === AppStatus.THINKING ? 'PROCESSANDO...' : 'ESCREVENDO...'}</span>
            </div>
          )}
        </main>

        <footer className="p-2 glass-panel border-t border-white/10 pb-safe z-20 shrink-0 relative">
          {/* INDICADOR DE MEMÓRIA (Context Bar) */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 overflow-hidden" title={`Uso de Memória: ${Math.round(contextPercentage)}%`}>
              <div className={`h-full transition-all duration-500 ${contextColor}`} style={{ width: `${contextPercentage}%` }}></div>
          </div>

          <div className="flex gap-2 max-w-5xl mx-auto items-end pt-2">
            <button onClick={() => document.getElementById('file-up')?.click()} className={`p-3 rounded-xl transition-all ${attachment ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}>
                <PaperclipIcon className="w-4 h-4" />
            </button>
            <input type="file" id="file-up" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload=(ev)=>setAttachment({name:f.name, mimeType:f.type, data:ev.target?.result}); r.readAsDataURL(f); } }} />
            
            {/* SELETOR DE MODELO NO RODAPÉ */}
            <div className="relative">
                 <button onClick={() => setIsModelMenuOpen(!isModelMenuOpen)} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center">
                     <LayersIcon className="w-4 h-4" />
                 </button>
                 {isModelMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                          {[MODEL_IDS.FLASH_2_0, MODEL_IDS.FLASH_3_0, MODEL_IDS.PRO_3_0].map(m => (
                              <button key={m} onClick={() => { setCurrentModel(m); setIsModelMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[11px] font-bold border-b border-white/5 flex justify-between ${currentModel === m ? 'text-cyan-400 bg-white/5' : 'text-slate-300 hover:bg-white/5'}`}>{getModelName(m)}</button>
                          ))}
                      </div>
                  )}
            </div>

            <div className="flex-1 relative">
              <textarea 
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none max-h-32 min-h-[44px] placeholder:text-slate-600 shadow-inner" 
                placeholder={attachment ? `Anexado: ${attachment.name}.` : `Enviar para ${activeModule.name}...`}
                rows={1} 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        handleSend(); 
                    } 
                }} 
              />
              {attachment && <button onClick={()=>setAttachment(null)} className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-rose-500 text-white rounded-full"><XIcon className="w-3 h-3"/></button>}
            </div>
            
            {status !== AppStatus.IDLE ? (
                <button onClick={handleStop} className="p-3 rounded-xl shadow-lg bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 animate-pulse"><StopIcon className="w-4 h-4 fill-current" /></button>
            ) : (
                <button onClick={handleSend} disabled={!inputText.trim() && !attachment} className={`p-3 rounded-xl shadow-lg border transition-all ${(!inputText.trim() && !attachment) ? 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400'}`}><SendIcon className="w-4 h-4" /></button>
            )}
          </div>
        </footer>
      </div>

      {isConfigOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsConfigOpen(false)}>
             <div className="glass-panel p-5 rounded-2xl w-full max-w-lg border-cyan-500/30 shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between mb-4 items-center">
                   <h3 className="font-bold text-white text-lg">Configurar Agente</h3>
                   <button onClick={() => setIsConfigOpen(false)}><XIcon className="w-5 h-5"/></button>
               </div>
               <div className="mb-4">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Prompt do Sistema</label>
                   <textarea className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-slate-300 h-48 font-mono focus:border-cyan-500/50 outline-none" value={activeModule.systemInstruction} onChange={(e) => setModules(prev => prev.map(m => m.id === activeModuleId ? { ...m, systemInstruction: e.target.value } : m))} />
               </div>
               <div className="flex gap-2">
                   <button onClick={() => { storageService.saveModules(modules); setIsConfigOpen(false); }} className="w-full py-2.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white">Salvar</button>
               </div>
               <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
                   <button onClick={async () => { const b = await storageService.createBackup(); const u = URL.createObjectURL(new Blob([b], {type:'application/json'})); const a = document.createElement('a'); a.href=u; a.download=`ainsten_bkp_${Date.now()}.json`; a.click(); }} className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"><SaveIcon className="w-3 h-3"/> Backup</button>
                   <label className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"><UploadIcon className="w-3 h-3"/> Restaurar <input type="file" className="hidden" accept=".json" onChange={handleRestoreBackup} /></label>
               </div>
             </div>
           </div>
      )}

      {isSearchOpen && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-20 bg-black/80 backdrop-blur-md" onClick={() => setIsSearchOpen(false)}>
              <div className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-white/10 bg-black/40 flex gap-3 items-center">
                      <SearchIcon className="w-5 h-5 text-amber-400" />
                      <input autoFocus className="flex-1 bg-transparent border-none outline-none text-white text-sm" placeholder="Pesquisar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()} />
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                      {searchResults.map((res, idx) => (
                          <div key={idx} onClick={() => handleJumpToMessage(res.moduleId, res.message)} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer mb-2">
                              <div className="flex justify-between mb-1"><span className="text-[10px] font-bold uppercase text-slate-400">{res.moduleId}</span><span className="text-[10px] text-slate-600">{res.contextDate}</span></div>
                              <div className="text-xs text-slate-300 line-clamp-2">{res.message.text}</div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
      
      {isHistoryOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsHistoryOpen(false)}>
               <div className="glass-panel p-6 rounded-2xl w-full max-w-md text-center space-y-4" onClick={e => e.stopPropagation()}>
                   <h3 className="font-bold text-white text-lg">Exportar</h3>
                   <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => handleExport('pdf')} className="p-3 bg-rose-600/20 border border-rose-500/30 rounded-xl flex flex-col items-center gap-2 text-rose-200"><FileIcon className="w-6 h-6"/> <span className="text-xs font-bold">PDF</span></button>
                       <button onClick={() => handleExport('md')} className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl flex flex-col items-center gap-2 text-blue-200"><CodeIcon className="w-6 h-6"/> <span className="text-xs font-bold">Markdown</span></button>
                   </div>
               </div>
          </div>
      )}
      
      {isUsageOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setIsUsageOpen(false)}>
            <div className="glass-panel w-full max-w-lg rounded-3xl flex flex-col overflow-hidden border-indigo-500/30 shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
                   <div className="flex items-center gap-3"><DollarSignIcon className="w-5 h-5 text-indigo-400" /><h3 className="font-bold text-lg text-white">Relatório Financeiro</h3></div>
                   <button onClick={() => setIsUsageOpen(false)}><XIcon className="w-5 h-5 text-slate-400"/></button>
               </div>
               <div className="p-8 text-center bg-gradient-to-b from-indigo-900/10 to-transparent">
                  <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mb-2">Saldo Estimado</p>
                  <p className="text-5xl font-mono font-bold text-white mb-2 tracking-tighter">R$ {usage.remainingBonusBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-slate-500">Inicial: R$ {usage.initialBonusBRL.toFixed(2)}</p>
               </div>
            </div>
          </div>
      )}
    </div>
  );
}