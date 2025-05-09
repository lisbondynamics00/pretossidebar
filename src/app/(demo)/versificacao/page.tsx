"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sidebar } from "@/components/admin-panel/sidebar";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, Eye, FileText, Video, Image, Info, Save } from "lucide-react";
import { Select } from "@/components/ui/select";
import { debounce } from "lodash";
import { db, auth, syncProjectToCloud, saveProjectLocally, saveProjectToFirebase } from "@/lib/firebase";
import { salvarProjeto, carregarProjeto } from '@/lib/storage';
import { setCookie, getCookie } from '@/lib/cookies';
import { Switch } from "@/components/ui/switch";
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface VerseWord {
  text: string;
  customColor?: string;
  stressed?: boolean;
}

interface Verse {
  id: string;
  words: VerseWord[];
  tag: string;
  media?: File | string;
  adlib?: string;
  voiceType?: string;
  figura?: string;
  cameraSettings?: {
    shotType: string;
    movement: string;
    resolution: string;
    stabilization: string;
    location: string;
    relatedVerses?: number[]; // Adicionando campo para versos relacionados
    iso?: string;
    shutterSpeed?: string;
    ndFilter?: string;
    intExt?: string;
    characters?: string;
    props?: string;
    style?: string;
    objective?: string;
    tags?: string;
    specialEffects?: string;
    cameraMovement?: string;
    coverage?: string;
    cast?: string;
    propsCostumes?: string;
    rhythmStyle?: string;
    sceneType?: string;
  };
  function?: string;
  technique?: string;
  metaTool?: string;
  persona?: string;
  threeAct?: string;
  musicSection?: string; // New field
}

interface Strophe {
  id: string;
  verses: Verse[];
  architecture: string;
  architectureDesc?: string;
  description: string;
}

interface SongInfo {
  title: string;
  artist: string;
  featuring: string[];
  producer: string;
}

const initialSongInfo: SongInfo = {
  title: "",
  artist: "",
  featuring: [],
  producer: "",
};

const literaryFigures: LiteraryFigure[] = [
  { name: "Metáfora", description: "Comparação implícita entre duas coisas.", example: "A vida é um sonho." },
  { name: "Símile", description: "Comparação explícita usando 'como'.", example: "Ele é forte como um touro." },
  { name: "Hipérbole", description: "Exagero para enfatizar uma ideia.", example: "Estou morrendo de fome." },
  { name: "Ironia", description: "Dizer o oposto do que se quer expressar.", example: "Que dia lindo! (num dia chuvoso)" },
  { name: "Aliteração", description: "Repetição de sons consonantais.", example: "O rato roeu a roupa do rei de Roma." },
  { name: "Prosopopeia", description: "Atribuir características humanas a seres inanimados.", example: "O sol sorriu para nós." },
  { name: "Onomatopeia", description: "Palavras que imitam sons.", example: "O relógio faz tic-tac." },
  { name: "Eufemismo", description: "Suavização de uma expressão.", example: "Ele partiu para um lugar melhor." },
  { name: "Antítese", description: "Contraposição de ideias.", example: "É um mar de rosas, mas também um deserto de espinhos." },
  { name: "Paradoxo", description: "Ideias opostas que geram reflexão.", example: "Menos é mais." },
  { name: "Quiasmo", description: "Inversão na ordem das palavras ou ideias em frases paralelas.", example: "Devo viver para comer ou comer para viver?" },
  { name: "Anáfora", description: "Repetição de uma palavra ou expressão no início de frases ou versos.", example: "Chove sobre a cidade, chove sobre os campos." },
  { name: "Assíndeto", description: "Omissão de conjunções.", example: "Vim, vi, venci." },
  { name: "Polissíndeto", description: "Uso excessivo de conjunções.", example: "E chora, e grita, e corre, e cai." },
  { name: "Metonímia", description: "Substituição por proximidade de sentido.", example: "Bebi um copo." },
  { name: "Sinestesia", description: "Mistura de sensações de sentidos diferentes.", example: "Ouvi um cheiro doce." },
  { name: "Gradação", description: "Sequência crescente ou decrescente de ideias.", example: "Chorei, lamentei, desesperei." },
  { name: "Pleonasmo", description: "Uso de palavras redundantes para reforçar a ideia.", example: "Subir para cima." },
  { name: "Elipse", description: "Omissão de um termo facilmente subentendido.", example: "Na sala, apenas dois alunos." },
  { name: "Zeugma", description: "Omissão de um termo já mencionado anteriormente.", example: "Eu gosto de café; ela, de chá." },
  { name: "Catacrese", description: "Metáfora desgastada ou comum no uso cotidiano.", example: "Pé da mesa." },
  { name: "Antonomásia", description: "Uso de uma característica ou título no lugar do nome.", example: "O Rei do Pop (Michael Jackson)." },
  { name: "Apóstrofe", description: "Chamamento enfático a uma pessoa ou coisa.", example: "Ó deuses, escutem meu clamor!" },
  { name: "Paranomásia", description: "Uso de palavras com sons parecidos, mas significados diferentes.", example: "Conhecer para crescer." },
  { name: "Hipérbato", description: "Inversão da ordem lógica das palavras na frase.", example: "De tudo, ao meu amor serei atento." },
  { name: "Perífrase", description: "Uso de várias palavras para se referir a algo ou alguém.", example: "A cidade maravilhosa (Rio de Janeiro)." }
];

const verseFunctions = [
  { name: "Afirmação", description: "Declara algo como verdadeiro. Ex: 'Eu sou o fogo que queima sem cessar.'" },
  { name: "Ato", description: "Expressa ação, movimento ou mudança. Ex: 'Levanto-me contra o silêncio.'" },
  { name: "Desejo", description: "Revela vontade ou intenção. Ex: 'Quero rasgar o céu com gritos de guerra.'" },
  { name: "Negação", description: "Recusa, rejeição, oposição. Ex: 'Não sou a sombra que vocês pensam.'" },
  { name: "Pergunta", description: "Interrogativa, direta ou retórica. Ex: 'Quem sou eu diante do abismo?'" },
  { name: "Profecia", description: "Anuncia o que virá, com peso visionário. Ex: 'O dia da queda virá ao som dos tambores.'" },
  { name: "Declaração de guerra", description: "Confronto direto, aviso. Ex: 'Rompo pactos, ergo muralhas.'" },
  { name: "Confissão", description: "Exposição íntima ou revelação. Ex: 'Carrego pecados em cada palavra.'" },
  { name: "Evocação", description: "Chama ou invoca algo/alguém. Ex: 'Venham, espíritos da noite eterna.'" },
  { name: "Desabafo", description: "Descarga emocional ou mental. Ex: 'Estou farto das máscaras e jogos.'" },
  { name: "Crítica / Ataque", description: "Julgamento ou acusação. Ex: 'Vocês se arrastam na lama e chamam isso de trono.'" },
  { name: "Manifesto / Declaração ideológica", description: "Posição política, social ou espiritual. Ex: 'A ordem será destruída pela verdade nua.'" },
  { name: "Autodefinição", description: "Construção da própria identidade. Ex: 'Sou lâmina, sou código, sou negação do caos.'" },
  { name: "Chamado / Convocação", description: "Incitação, liderança. Ex: 'Ergam-se os que ainda têm alma.'" },
  { name: "Maldição / Benção", description: "Desejo de ruína ou proteção. Ex: 'Que tua mentira te devore por dentro.'" },
  { name: "Juramento / Promessa", description: "Compromisso selado. Ex: 'Juro nunca mais me calar.'" },
  { name: "Despedida / Corte", description: "Fim de algo, separação. Ex: 'Este é o último eco do que fomos.'" },
  { name: "Instrução / Ordem", description: "Comando ou direção. Ex: 'Fechem os olhos. Escutem o sangue.'" },
  { name: "Ironia / Sarcasmo", description: "Duplo sentido, crítica disfarçada. Ex: 'Ah, que bela é a tua hipocrisia vestida de ouro.'" },
  { name: "Provocação / Desafio", description: "Convite ao confronto. Ex: 'Se és rei, então lute por tua coroa.'" }
];




const voiceOptions = [
  { value: "chest", label: "Voz do Peito" },
  { value: "baby", label: "Baby Voice" },
  { value: "psycho", label: "PSIC00" },
  { value: "intimidating", label: "Voz Grave Intimidante" },
  { value: "charismatic", label: "Carismático" },
  { value: "empresonification", label: "Impersonificação" },

];

const dramArqOptions = [

  { 
    value: "Prelúdio", 
    description: "Introdução poética que prepara o leitor para o que está por vir",
    instruction: "Use esta estrofe para criar uma atmosfera e sugerir os temas que serão desenvolvidos, como uma abertura musical que antecipa a sinfonia."
  },
  { 
    value: "Prólogo", 
    description: "Introdução que apresenta o contexto inicial da obra",
    instruction: "Nesta estrofe, estabeleça o cenário e apresente os personagens principais."
  },
  { 
    value: "Parodos (coro)", 
    description: "Entrada do coro no teatro grego",
    instruction: "Introduza o coro ou a voz coletiva que comentará a ação."
  },
  { 
    value: "Episódios", 
    description: "Partes principais da narrativa",
    instruction: "Desenvolva a ação principal e os conflitos da história.",
    subtypes: [
      { 
        value: "Ascensão do herói", 
        description: "O herói é introduzido e ganha destaque, mostrando suas qualidades e ambições iniciais.",
        instruction: "Apresente o protagonista e estabeleça seus objetivos iniciais."
      },
      { 
        value: "Erro trágico (hamartia)", 
        description: "O herói comete um erro crucial, muitas vezes por orgulho ou ignorância, que inicia a reviravolta.",
        instruction: "Mostre o momento crucial onde o herói comete um erro que altera o curso da história."
      },
      { 
        value: "Virada de fortuna (peripeteia)", 
        description: "Ocorre uma mudança drástica na sorte do herói, geralmente de boa para má, intensificando o conflito.",
        instruction: "Descreva a reviravolta que muda completamente a situação do herói."
      },
      { 
        value: "Queda (catástrofe)", 
        description: "O herói enfrenta as consequências de seus erros, levando a sofrimento e, frequentemente, à morte.",
        instruction: "Mostre as consequências dramáticas dos erros do herói."
      },
      { 
        value: "Reconhecimento (anagnórise)", 
        description: "O herói ou outros personagens ganham um entendimento crítico da situação, reconhecendo verdades antes ocultas.",
        instruction: "Descreva o momento de revelação e compreensão da verdade."
      }
    ]
  },
  { 
    value: "Êxodo", 
    description: "Conclusão da história",
    instruction: "Resolva os conflitos e encerre a narrativa de forma satisfatória."
  },
  { 
    value: "Epílogo", 
    description: "Texto final que complementa ou encerra a obra",
    instruction: "Forneça uma reflexão final ou mostre as consequências da história."
  },
];

const episodeOptions = [
  "Ascensão do herói",
  "Erro trágico (hamartia)",
  "Virada de fortuna (peripeteia)",
  "Queda (catástrofe)",
  "Reconhecimento (anagnórise)"
];

const shotTypeOptions = [
  { value: "highAngle", label: "Plano alto / Ângulo alto" },
  { value: "lowAngle", label: "Plano baixo / Ângulo baixo" },
  { value: "dutchAngle", label: "Plano holandês / Ângulo inclinado" },
  { value: "eyeLevel", label: "Ao nível dos olhos" },
];

const featuringOptions = ["Zara G", "YuriNR5", "Sippinpurp", "YUZI", "YunLilo", "Yasz Dicko", "MAFIA73", "P. William", "Chaylan"];

const literaryTechniques = [
  {
    category: "Técnicas Narrativas",
    techniques: [
      { name: "Flashback", description: "Retorno ao passado para explicar o presente." },
      { name: "Flashforward", description: "Visão do futuro para contextualizar o presente." },
      { name: "Monólogo interno", description: "Pensamentos ou sentimentos do personagem expressos em sua mente." },
      { name: "Stream of consciousness", description: "Corrente contínua de pensamento não filtrado." },
      { name: "Narrador omnisciente", description: "Conhecimento de todos os pensamentos e ações dos personagens." },
      { name: "Narrador limitado", description: "Conhecimento apenas do que o personagem principal sabe." },
      { name: "Narrador em terceira pessoa", description: "Narrativa em terceira pessoa, distanciando o leitor dos personagens." },
      { name: "Narrador em primeira pessoa", description: "Narrativa em primeira pessoa, envolvendo o leitor nos pensamentos do personagem." },
      { name: "Narrador dual", description: "Múltiplos narradores para contar a história." },
      { name: "Narrador plural", description: "Vários personagens contando a história simultaneamente." },
      { name: "Narrador ausente", description: "Ausência de um narrador explícito, deixando o leitor interpretar a história." },
      { name: "Narrador ironico", description: "Narrador que comenta a ação com sarcasmo ou ironia." },
      { name: "Narrador objetivo", description: "Narrador neutro, apenas relatando os eventos." },
      { name: "Narrador subjetivo", description: "Narrador que expressa sua opinião sobre os eventos." }
    ]
  }
];

const metaNarrativeTools = [
  { name: "Meta-comentário", description: "Quando o artista comenta a própria letra ou processo criativo." },
  { name: "Quebra da quarta parede", description: "Falar diretamente com o ouvinte, fora da narrativa." },
  { name: "Interrupção narrativa", description: "Pausa para explicar ou mudar o ponto de vista." },
  { name: "Fluxo de consciência", description: "Corrente contínua de pensamento não filtrado." },
  { name: "Parêntese lírico", description: "Comentários internos que quebram o ritmo." },
  { name: "Auto-diálogo / Conflito interno", description: "O artista fala consigo mesmo dentro do verso." },
  { name: "Auto-correção", description: "Corrigir uma linha anterior ('Espera—quis dizer...')." },
  { name: "Barras com estilo de anotação", description: "Linhas que funcionam como notas de rodapé." },
  { name: "Barras hipotéticas/condicionais", description: "'Se eu tivesse dito isto... aquilo teria acontecido.'" },
  { name: "Escrita-sobre-escrita", description: "Falar sobre o ato de escrever (metapoético)." },
  { name: "In medias res", description: "Começar a meio da história e depois desenvolver." },
  { name: "Intrusão autoral", description: "Quebra de personagem para narrar com intenção real." }
];

const personaTechniques = [
  { 
    category: "Persona", 
    techniques: [
      { name: "Não é o autor", description: "A persona é uma voz fictícia, não corresponde ao 'eu' real do autor." },
      { name: "Voz e perspetiva", description: "Define o tom, o ponto de vista e a atitude da narração." },
      { name: "Criação intencional", description: "É escolhida pelo autor com um propósito específico." },
      { name: "Presente em poesia e prosa", description: "Embora comum na poesia, também aparece em romances, contos e outros géneros." },
      { name: "Simples ou complexa", description: "Pode ser uma caracterização direta ou uma construção profunda e multifacetada." }
    ]
  }
];

const threeActStructure = [
  { 
    category: "Acto I – Início (Setup)", 
    techniques: [
      { name: "Introdução de personagens", description: "Apresenta os personagens principais e o contexto da história." },
      { name: "Conflito central", description: "Estabelece o problema ou desafio que impulsiona a narrativa." },
      { name: "Incidente incitante", description: "Momento que rompe o equilíbrio e lança a ação." }
    ]
  },
  { 
    category: "Acto II – Desenvolvimento (Confrontação)", 
    techniques: [
      { name: "Complicações", description: "Explora os desafios e eleva a tensão." },
      { name: "Ponto médio", description: "Momento que reverte ou aprofunda a situação." },
      { name: "Revés maior", description: "Testa verdadeiramente o protagonista." }
    ]
  },
  { 
    category: "Acto III – Conclusão (Resolução)", 
    techniques: [
      { name: "Clímax", description: "Conflitos atingem o auge." },
      { name: "Resolução", description: "Encerra as pontas soltas da narrativa." },
      { name: "Final fechado", description: "Conclusão positiva ou definitiva." },
      { name: "Final aberto", description: "Conclusão reflexiva ou ambígua." }
    ]
  }
];

const WordTag = ({ word, color, isRhymed, onChange, onColorChange, onRemove, rhymedColor }: {
  word: string;
  color?: string;
  isRhymed: boolean;
  onChange: (newWord: string) => void;
  onColorChange: (newColor: string) => void;
  onRemove: () => void;
  rhymedColor?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(word.toUpperCase());
  const bgColor = color || (isRhymed ? rhymedColor : undefined);

  return (
    <div className="inline-flex items-center m-1 p-1 border rounded dark:text-white" style={{ backgroundColor: bgColor }}>
      {isEditing ? (
        <input
          className="bg-transparent outline-none px-1 uppercase font-bold text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onBlur={() => {
            setIsEditing(false);
            onChange(value);
          }}
          onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
          autoFocus
        />
      ) : (
        <span 
          onClick={() => setIsEditing(true)} 
          className={`px-1 uppercase font-bold text-sm ${word.stressed ? 'font-black' : ''}`}
        >
          {value || "___"}
        </span>
      )}
      <button onClick={onRemove} className="text-red-500 text-xs ml-1" title="Remover palavra">
        &times;
      </button>
      <input
        type="color"
        value={color || "#ffffff"}
        onChange={(e) => onColorChange(e.target.value)}
        className="w-6 h-6 p-0 border-0 ml-1 cursor-pointer"
      />
    </div>
  );
};

const VerseTag = ({ tag, onChange }: { tag: string; onChange: (newTag: string) => void }) => {
  const colorMapping: { [key: string]: string } = {
    A: "border-red-500",
    B: "border-blue-500",
    C: "border-lime-500",
    D: "border-yellow-500",
  };
  const borderColor = colorMapping[tag.toUpperCase()] || "border-gray-300";
  
  return (
    <select
      value={tag}
      onChange={(e) => onChange(e.target.value)}
      className={`w-16 text-center items-center py-2 border-2 rounded-full uppercase font-bold ${borderColor} bg-white dark:bg-slate-700 text-black dark:text-white`}
    >
      <option value="A">A</option>
      <option value="B">B</option>
      <option value="C">C</option>
      <option value="D">D</option>
    </select>
  );
};

const SortableVerse = ({ verse, stropheIndex, verseIndex, onVerseChange, onRemove, onDragStart, modoNietzsche, musicStructure }: {
  verse: Verse;
  stropheIndex: number;
  verseIndex: number;
  onVerseChange: (newVerse: Verse) => void;
  onRemove: () => void;
  onDragStart: (id: string) => void;
  modoNietzsche: boolean;
  musicStructure: string[]; // Adicionando a prop musicStructure
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: verse.id });
  const bgColorMapping = { A: "#ef4444", B: "#3b82f6", C: "#84cc16", D: "#eab308" };

  // Adicionando a definição dos sensores aqui
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  const handleWordChange = (wordIndex: number, newWord: string) => {
    const newWords = [...verse.words];
    newWords[wordIndex].text = newWord;
    onVerseChange({ ...verse, words: newWords });
  };

  const handleWordColorChange = (wordIndex: number, newColor: string) => {
    const newWords = [...verse.words];
    newWords[wordIndex].customColor = newColor;
    onVerseChange({ ...verse, words: newWords });
  };

  const handleRemoveWord = (wordIndex: number) => {
    const newWords = verse.words.filter((_, i) => i !== wordIndex);
    onVerseChange({ ...verse, words: newWords });
  };

  const handleAddWord = () => {
    onVerseChange({ ...verse, words: [...verse.words, { text: "" }] });
  };

  // Função para obter a descrição de uma técnica pelo nome
  const getDescription = (name: string, category: any[]) => {
    for (const cat of category) {
      const tech = cat.techniques.find((t: any) => t.name === name);
      if (tech) return tech.description;
    }
    return "";
  };

  const [contextoCompleto, setContextoCompleto] = useState(false);

  useEffect(() => {
    // Verifica se todos os campos de contexto foram preenchidos
    const completo = verse.voiceType && verse.figura && verse.function && 
                     verse.technique && verse.metaTool && verse.persona && verse.threeAct;
    setContextoCompleto(!!completo);
  }, [verse]);

  return (
    <div ref={setNodeRef} style={style} className="p-4 mb-4 border rounded-lg relative group bg-white dark:bg-gray-800">
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-move p-1 hover:bg-gray-100 rounded"
          onMouseDown={() => onDragStart(verse.id)}
        >
          ↕
        </button>
        <button onClick={onRemove} className="text-red-500">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <VerseTag tag={verse.tag} onChange={(newTag) => onVerseChange({ ...verse, tag: newTag })} />
        
        {/* New Music Section Select */}
       
        
        <Input
          placeholder="ADLIB"
          value={verse.adlib || ""}
          onChange={(e) => onVerseChange({ ...verse, adlib: e.target.value.toUpperCase() })}
          className="w-32 text-sm border-2 border-yellow-500 bg-slate-700-500 focus:border-yellow-500 focus:bg-black"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sugestões de Adlibs</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {adlibCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-bold">{category.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.adlibs.map((adlib, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => onVerseChange({ ...verse, adlib })}
                      >
                        {adlib}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Input
              placeholder="Adicionar novo adlib"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    adlibCategories[3].adlibs.push(target.value.toUpperCase());
                    target.value = '';
                  }
                }
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Componentes de seleção sempre visíveis */}
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <select
            value={verse.voiceType}
            onChange={(e) => onVerseChange({ ...verse, voiceType: e.target.value })}
            className="p-2 border rounded text-sm flex-1 min-w-[120px]"
            style={{ width: `${verse.voiceType?.length * 8 + 100}px` }}
          >
            {voiceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={verse.figura}
            onChange={(e) => onVerseChange({ ...verse, figura: e.target.value })}
            className="p-2 border rounded text-sm flex-1 min-w-[120px]"
            style={{ width: `${verse.figura?.length * 8 + 100}px` }}
          >
            <option value="">Figura</option>
            {literaryFigures.map(fig => (
              <option key={fig.name} value={fig.name}>{fig.name}</option>
            ))}
          </select>

          <select
            value={verse.function}
            onChange={(e) => onVerseChange({ ...verse, function: e.target.value })}
            className="p-2 border rounded text-sm flex-1 min-w-[120px]"
            style={{ width: `${verse.function?.length * 8 + 100}px` }}
          >
            <option value="">Função</option>
            {verseFunctions.map(func => (
              <option key={func.name} value={func.name}>{func.name}</option>
            ))}
          </select>

          <select
            value={verse.technique}
            onChange={(e) => onVerseChange({ ...verse, technique: e.target.value })}
            className="p-2 border rounded text-sm flex-1 min-w-[120px]"
            style={{ width: `${verse.technique?.length * 8 + 100}px` }}
          >
            <option value="">Técnica</option>
            {literaryTechniques.map(cat => (
              <optgroup key={cat.category} label={cat.category}>
                {cat.techniques.map(tech => (
                  <option key={tech.name} value={tech.name}>{tech.name}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <select
            value={verse.metaTool}
            onChange={(e) => onVerseChange({ ...verse, metaTool: e.target.value })}
            className="p-2 border rounded text-sm flex-1 min-w-[120px]"
            style={{ width: `${verse.metaTool?.length * 8 + 100}px` }}
          >
            <option value="">Meta-narrativa</option>
            {metaNarrativeTools.map(tool => (
              <option key={tool.name} value={tool.name}>{tool.name}</option>
            ))}
          </select>

          <select
            value={verse.persona}
            onChange={(e) => onVerseChange({ ...verse, persona: e.target.value })}
            className="p-2 border rounded text-sm flex-1 min-w-[120px]"
            style={{ width: `${verse.persona?.length * 8 + 100}px` }}
          >
            <option value="">Persona</option>
            {personaTechniques.map(cat => (
              <optgroup key={cat.category} label={cat.category}>
                {cat.techniques.map(tech => (
                  <option key={tech.name} value={tech.name}>{tech.name}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <select
            value={verse.threeAct}
            onChange={(e) => onVerseChange({ ...verse, threeAct: e.target.value })}
            className="p-2 border rounded text-sm flex-1 min-w-[120px]"
            style={{ width: `${verse.threeAct?.length * 8 + 100}px` }}
          >
            <option value="">Estrutura em 3 Atos</option>
            {threeActStructure.map(cat => (
              <optgroup key={cat.category} label={cat.category}>
                {cat.techniques.map(tech => (
                  <option key={tech.name} value={tech.name}>{tech.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Exibição das descrições */}
      <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
        <h3 className="font-bold">CONTEXTO</h3>
        {verse.voiceType && (
          <p><strong>Voz:</strong> {voiceOptions.find(opt => opt.value === verse.voiceType)?.label}</p>
        )}
        {verse.figura && (
          <p><strong>Figura:</strong> {literaryFigures.find(fig => fig.name === verse.figura)?.description}</p>
        )}
        {verse.function && (
          <p><strong>Função:</strong> {verseFunctions.find(func => func.name === verse.function)?.description}</p>
        )}
        {verse.technique && (
          <p><strong>Técnica:</strong> {getDescription(verse.technique, literaryTechniques)}</p>
        )}
        {verse.metaTool && (
          <p><strong>Meta-narrativa:</strong> {metaNarrativeTools.find(tool => tool.name === verse.metaTool)?.description}</p>
        )}
        {verse.persona && (
          <p><strong>Persona:</strong> {getDescription(verse.persona, personaTechniques)}</p>
        )}
      
      </div>

      {/* Campo de versos condicional */}
      {(!modoNietzsche || contextoCompleto) && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (over && active.id !== over.id) {
              const oldIndex = verse.words.findIndex(w => w.text === active.id);
              const newIndex = verse.words.findIndex(w => w.text === over.id);
              const newWords = arrayMove(verse.words, oldIndex, newIndex);
              onVerseChange({ ...verse, words: newWords });
            }
          }}
        >
          <SortableContext items={verse.words.map(w => w.text)} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-2 mb-4">
              {verse.words.map((word, wordIndex) => (
                <WordTag
                  key={word.text + wordIndex}
                  word={word.text}
                  color={word.customColor}
                  isRhymed={wordIndex === verse.words.length - 1}
                  onChange={(newWord) => handleWordChange(wordIndex, newWord)}
                  onColorChange={(newColor) => handleWordColorChange(wordIndex, newColor)}
                  onRemove={() => handleRemoveWord(wordIndex)}
                  rhymedColor={bgColorMapping[verse.tag]}
                />
              ))}
              <Button onClick={handleAddWord} size="sm">+</Button>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Mensagem quando o Modo Nietzsche está ativo e o contexto não está completo */}
      {modoNietzsche && !contextoCompleto && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mt-4">
          <p className="text-sm text-yellow-800">
            Complete o contexto acima para desbloquear o campo de versos.
          </p>
        </div>
      )}
    </div>
  );
};

const PreviewModal = ({ verses }: { verses: Word[][] }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" className="gap-2">
        <Eye className="h-4 w-4" />
        Pré-visualizar
      </Button>
    </DialogTrigger>
    <DialogContent className="min-h-[90vh] max-w-[800px]">
      <DialogHeader>
        <DialogTitle className="text-center">Pré-visualização do Poema</DialogTitle>
      </DialogHeader>
      <div className="bg-white p-8 h-full dark:bg-black">
        <div className="font-helvetica uppercase text-black dark:text-white text-center space-y-6 text-lg">
          {verses.map((verse, index) => (
            <p key={index} className="break-words">
              {verse.map((word, i) => (
                <span 
                  key={i} 
                  style={{ color: word.color }}
                  className={word.stressed ? 'font-extrabold' : 'font-normal'}
                >
                  {word.text}{i < verse.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const analyzeMeter = async (text: string) => {
  try {
    const response = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lines: text.split('\n')
      })
    });

    if (!response.ok) {
      throw new Error('Erro na análise da métrica');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
};

const exportStoryboard = async (strophes: Strophe[]) => {
  const doc = new jsPDF();
  let yPosition = 20;

  const versesFlat = strophes.flatMap(strophe => strophe.verses);
  for (const [index, verse] of versesFlat.entries()) {
    if (verse.cameraSettings) {
      // Add media preview
      if (verse.media instanceof File) {
        if (verse.media.type.startsWith("image")) {
          const imgData = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(verse.media as File);
          });
          doc.addImage(imgData, 'JPEG', 15, yPosition, 50, 30);
          yPosition += 35;
        }
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(14);
      const sceneText = `CENA ${index + 1} - ${verse.words.map((w: { text: string }) => w.text).join(" ")}`;
      const sceneTextWidth = doc.getStringUnitWidth(sceneText) * doc.getFontSize() / doc.internal.scaleFactor;
      doc.text(sceneText, (pageWidth - sceneTextWidth) / 2, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      const settings = [
        `Tipo de Plano: ${shotTypeOptions.find(opt => opt.value === verse.cameraSettings?.shotType)?.label || ''}`,
        `Movimento: ${verse.cameraSettings.movement.toUpperCase()}`,
        `Resolução: ${verse.cameraSettings.resolution.toUpperCase()}`,
        `Estabilização: ${verse.cameraSettings.stabilization.toUpperCase()}`,
        `Localização: ${verse.cameraSettings.location.toUpperCase()}`
      ];
      
      settings.forEach(setting => {
        const textWidth = doc.getStringUnitWidth(setting) * doc.getFontSize() / doc.internal.scaleFactor;
        doc.text(setting, (pageWidth - textWidth) / 2, yPosition);
        yPosition += 8;
      });
      
      yPosition += 15;
      
      if(yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
    }
  }

  doc.save('storyboard.pdf');
};

// Adicione isso junto com as outras constantes no início do arquivo
const adlibCategories = [
  {
    name: "Sons de Arma",
    adlibs: ["PAH!", "BANG!", "RATATAT!", "POW!", "BLAM!"]
  },
  {
    name: "Sons de Fumaça",
    adlibs: ["PSSSSH!", "WHOOSH!", "FUMO!", "VAPOR!", "NÉVOA!"]
  },
  {
    name: "Sinais de Partida",
    adlibs: ["VAI!", "GO!", "JÁ!", "AGORA!", "PARTIU!"]
  },
  {
    name: "Expressões",
    adlibs: ["GAZ!", "FAVAS!", "DURUDU!", "SOPRO!", "PXIU!", "Uhuhuh", "BREH!", "YA!", "BAZA!", "FOMOS"]
  }
];

const musicStructureOptions = [
  {
    value: "introducao",
    label: "🎼 Introdução",
    description: "Início instrumental ou vocal, estabelece tom e atmosfera",
    example: "Guitarra em 'Smoke on the Water'"
  },
  {
    value: "verso",
    label: "📌 Verso (estrofe)",
    description: "Parte narrativa, apresenta ideias ou história",
    example: "'Once upon a time you dressed so fine…' – Bob Dylan"
  },
  {
    value: "pre-refrao",
    label: "🎶 Pré-refrão",
    description: "Ponte curta antes do refrão, eleva tensão",
    example: "'Oh, the misery…' – Imagine Dragons"
  },
  {
    value: "refrao",
    label: "🎵 Refrão (coro)",
    description: "Parte repetida e mais memorável, geralmente com a mensagem",
    example: "'We will, we will rock you…'"
  },
  {
    value: "ponte",
    label: "🌉 Ponte (bridge)",
    description: "Secção contrastante, nova progressão harmónica ou melódica",
    example: "'Middle 8' em 'Something' – The Beatles"
  },
  {
    value: "break",
    label: "⏸️ Break / Paragem",
    description: "Queda brusca de som ou ritmo, efeito dramático",
    example: "'Drop' no EDM"
  },
  {
    value: "solo",
    label: "🎸 Solo",
    description: "Secção instrumental, normalmente improvisada",
    example: "Solo de guitarra em 'Hotel California'"
  },
  {
    value: "outro",
    label: "🔚 Outro (conclusão)",
    description: "Encerramento da música",
    example: "Fade out em 'Hey Jude' – The Beatles"
  }
];

const SortableMusicStructureItem = ({ id, value }: { id: string; value: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  const option = musicStructureOptions.find(opt => opt.value === value);

  return (
    <div ref={setNodeRef} style={style} className="inline-block">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            className="rounded-full px-4 py-2 whitespace-nowrap m-1"
            {...attributes}
            {...listeners}
          >
            {option?.label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{option?.description}</p>
          <p className="text-sm text-gray-600">Exemplo: {option?.example}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

const Dashboard = () => {
  const router = useRouter();
  const { settings } = useSidebar();
  const [activeTab, setActiveTab] = useState("versos");
  const [strophes, setStrophes] = useState<Strophe[]>([{
    id: Date.now().toString(),
    architecture: "Prólogo",
    description: "Introdução que apresenta o contexto inicial da obra, preparando o cenário para a narrativa principal.",
    verses: []
  }]);
  const [songInfo, setSongInfo] = useState<SongInfo>(initialSongInfo);
  const [fullLyrics, setFullLyrics] = useState("");
  const [draggedVerseId, setDraggedVerseId] = useState<string | null>(null);
  const stropheEndRef = useRef<HTMLDivElement>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [modoNietzsche, setModoNietzsche] = useState(false);

  const [trackNames, setTrackNames] = useState<string[]>([
    "Vida Louca",
    "Noite Eterna",
    "Caminhos Cruzados",
    "Luzes da Cidade"
  ]);

  const [projectNames, setProjectNames] = useState<string[]>([
    "Projeto Fênix",
    "Operação Eclipse",
    "Missão Alfa",
    "Código Vermelho"
  ]);

  const [producerNames, setProducerNames] = useState<string[]>([
    "Xando",
    "Oxyn",
    "Bludi",
    "Ramos",
    "Diepretty",
    "Fooliedude"
  ]);

  const [artistNames, setArtistNames] = useState<string[]>([
    "Diepretty"
  ]);

  const [musicStructure, setMusicStructure] = useState<string[]>([]);

  const getDescription = (name: string, category: any[]) => {
    for (const cat of category) {
      const tech = cat.techniques.find((t: any) => t.name === name);
      if (tech) return tech.description;
    }
    return "";
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    stropheEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [strophes.length]);

  const handleAddStrophe = () => {
    const newStrophe: Strophe = {
      id: Date.now().toString(),
      architecture: "Prólogo",
      description: "Introdução que apresenta o contexto inicial da obra, preparando o cenário para a narrativa principal.",
      verses: []
    };
    setStrophes([...strophes, newStrophe]);
  };

  const handleVerseChange = (stropheIndex: number, verseIndex: number, newVerse: Verse) => {
    const newStrophes = [...strophes];
    newStrophes[stropheIndex].verses[verseIndex] = newVerse;
    setStrophes(newStrophes);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Verifica se o arrasto é para a estrutura musical
      if (musicStructure.includes(active.id as string)) {
        const oldIndex = musicStructure.indexOf(active.id as string);
        const newIndex = musicStructure.indexOf(over.id as string);
        const newStructure = arrayMove(musicStructure, oldIndex, newIndex);
        setMusicStructure(newStructure);
      } 
      // Caso contrário, é para os versos
      else {
        const oldStropheIndex = strophes.findIndex(s => s.verses.some(v => v.id === active.id));
        const newStropheIndex = strophes.findIndex(s => s.verses.some(v => v.id === over.id));
        
        const oldVerseIndex = strophes[oldStropheIndex].verses.findIndex(v => v.id === active.id);
        const newVerseIndex = strophes[newStropheIndex].verses.findIndex(v => v.id === over.id);

        const newStrophes = [...strophes];
        const movedVerse = newStrophes[oldStropheIndex].verses[oldVerseIndex];
        
        newStrophes[oldStropheIndex].verses.splice(oldVerseIndex, 1);
        newStrophes[newStropheIndex].verses.splice(newVerseIndex, 0, movedVerse);
        
        setStrophes(newStrophes);
      }
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    
    doc.setFontSize(18);
    doc.text(`${songInfo.artist.toUpperCase()} - ${songInfo.title.toUpperCase()}`, 10, y);
    y += 10;
    
    if (songInfo.featuring.length > 0) {
      doc.setFontSize(12);
      doc.text(`FEATURING: ${songInfo.featuring.join(", ")}`, 10, y);
      y += 10;
    }

    if (songInfo.producer) {
      doc.text(`PRODUCED BY: ${songInfo.producer.toUpperCase()}`, 10, y);
      y += 10;
    }

    strophes.forEach((strophe, stropheIndex) => {
      doc.setFontSize(14);
      doc.text(`Estrofe ${stropheIndex + 1} (${strophe.architecture})`, 10, y);
      y += 10;

      strophe.verses.forEach(verse => {
        let line = verse.words.map(word => {
          const text = word.stressed ? `**${word.text}**` : word.text;
          return text;
        }).join(" ");
        
        if (verse.adlib) line += ` (${verse.adlib.toUpperCase()})`;
        
        // Adiciona o texto com formatação para sílabas tônicas
        const words = line.split(' ');
        let x = 15;
        words.forEach(word => {
          if (word.startsWith('**') && word.endsWith('**')) {
            doc.setFont('helvetica', 'bold');
            doc.text(word.replace(/\*\*/g, ''), x, y);
            x += doc.getTextWidth(word.replace(/\*\*/g, '')) + 2;
          } else {
            doc.setFont('helvetica', 'normal');
            doc.text(word, x, y);
            x += doc.getTextWidth(word) + 2;
          }
        });
        y += 10;
      });
      
      // Adiciona espaço entre estrofes
      y += 10;
    });

    doc.save(`${songInfo.artist || 'artista'}_${songInfo.title || 'musica'}.pdf`);
  };

  const handleAnalyzeMeter = async () => {
    const versesText = strophes.flatMap(strophe => strophe.verses)
      .map(verse => verse.words.map(word => word.text).join(" "))
      .join("\n");
    
    try {
      const result = await analyzeMeter(versesText);
      setAnalysisResult(result);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Erro ao analisar a métrica:', error);
      alert('Erro ao analisar a métrica');
    }
  };

  const adlibCategories = [
    {
      name: "Sons de Arma",
      adlibs: ["PAH!", "BANG!", "RATATAT!", "POW!", "BLAM!"]
    },
    {
      name: "Sons de Fumaça",
      adlibs: ["PSSSSH!", "WHOOSH!", "FUMO!", "VAPOR!", "NÉVOA!"]
    },
    {
      name: "Sinais de Partida",
      adlibs: ["VAI!", "GO!", "JÁ!", "AGORA!", "PARTIU!"]
    },
    {
      name: "Expressões",
      adlibs: ["GAZ!", "FAVAS!", "DURUDU!", "SOPRO!", "PXIU!", "Uhuhuh", "BREH!", "YA!", "BAZA!", "FOMOS"]
    }
  ];

  const [state, setState] = useState({
    strophes,
    songInfo,
    analysisResult,
    showAnalysis,
    selectedVerses,
    trackNames,
    projectNames,
    producerNames,
    artistNames
  });

  const debouncedLocalSave = debounce(async (state) => {
    await saveProjectLocally(state);
  }, 2000);

  const debouncedCloudSync = debounce(async (state) => {
    const user = auth.currentUser;
    if (user) await syncProjectToCloud(user.uid, state);
  }, 30000);

  useEffect(() => {
    debouncedLocalSave(state);
    debouncedCloudSync(state);
    
    return () => {
      debouncedLocalSave.cancel();
      debouncedCloudSync.cancel();
    };
  }, [state]);

  const handleSaveProject = async () => {
    try {
      const projectId = Date.now().toString(); // Ou use um ID específico
      const projectData = {
        strophes,
        songInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const success = await saveProjectToFirebase(projectId, projectData);
      
      if (success) {
        alert("Projeto salvo com sucesso!");
      } else {
        alert("Erro ao salvar projeto.");
      }
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Erro ao salvar projeto.");
    }
  };

  // Carrega as estrofes ao iniciar o componente
  useEffect(() => {
    const projetoCarregado = carregarProjeto();
    if (projetoCarregado && projetoCarregado.strophes) {
      setStrophes(projetoCarregado.strophes);
    }
  }, []);

  // Salva as estrofes sempre que houver mudança
  useEffect(() => {
    const projetoAtual = {
      strophes: strophes,
      ultimaAtualizacao: new Date().toISOString()
    };
    salvarProjeto(projetoAtual);
  }, [strophes]);

  const handleNietzscheModeChange = (checked: boolean) => {
    setModoNietzsche(checked);
    if (checked) {
      router.push('/modonieztche'); // Redireciona para a página @modonieztche
    }
  };

  const handleAddMusicSection = (value: string) => {
    if (!musicStructure.includes(value)) {
      setMusicStructure(prev => [...prev, value]);
    }
  };

  const handleRemoveMusicSection = (value: string) => {
    setMusicStructure(prev => prev.filter(v => v !== value));
  };

  const [storyConfig, setStoryConfig] = useState({
    introduction: "",
    elements: "",
    focalization: "",
    structure: ""
  });

  return (
    <ContentLayout title="Versificação">
      <div className="w-full mx-auto max-w-[1800px] px-4">
        {/* Existing Artist/Producer Card */}
        <Card className="w-full mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="ARTISTA PRINCIPAL"
                    value={songInfo.artist || ""}
                    onChange={(e) => setSongInfo(prev => ({...prev, artist: e.target.value.toUpperCase()}))}
                    className="text-xl font-bold uppercase border border-gray-300 flex-1"
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sugestões de Artistas</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        {artistNames.map((name, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setSongInfo(prev => ({...prev, artist: name.toUpperCase()}))}
                            >
                              {name}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => setArtistNames(prev => prev.filter((_, i) => i !== index))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Input
                        placeholder="Adicionar novo artista"
                        className="mt-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            if (target.value.trim()) {
                              setArtistNames(prev => [...prev, target.value]);
                              target.value = '';
                            }
                          }
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="PRODUTOR MUSICAL"
                    value={songInfo.producer}
                    onChange={(e) => setSongInfo(prev => ({...prev, producer: e.target.value.toUpperCase()}))}
                    className="text-sm flex-1"
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sugestões de Produtores</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        {producerNames.map((name, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setSongInfo(prev => ({...prev, producer: name.toUpperCase()}))}
                            >
                              {name}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => setProducerNames(prev => prev.filter((_, i) => i !== index))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Input
                        placeholder="Adicionar novo produtor"
                        className="mt-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            if (target.value.trim()) {
                              setProducerNames(prev => [...prev, target.value]);
                              target.value = '';
                            }
                          }
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <Input 
                  placeholder="TÍTULO DA MÚSICA"
                  value={songInfo.title}
                  onChange={(e) => setSongInfo(prev => ({...prev, title: e.target.value.toUpperCase()}))}
                  className="text-xl font-bold uppercase border border-gray-300"
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sugestões de Títulos</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-bold mb-2">Nomes de Faixas</h3>
                        <div className="space-y-2">
                          {trackNames.map((name, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setSongInfo(prev => ({...prev, title: name.toUpperCase()}))}
                            >
                              {name}
                            </Button>
                          ))}
                        </div>
                        <Input
                          placeholder="Adicionar novo nome"
                          className="mt-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              if (target.value.trim()) {
                                setTrackNames(prev => [...prev, target.value]);
                                target.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">Nomes de Projetos</h3>
                        <div className="space-y-2">
                          {projectNames.map((name, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setSongInfo(prev => ({...prev, title: name.toUpperCase()}))}
                            >
                              {name}
                            </Button>
                          ))}
                        </div>
                        <Input
                          placeholder="Adicionar novo nome"
                          className="mt-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              if (target.value.trim()) {
                                setProjectNames(prev => [...prev, target.value]);
                                target.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="flex flex-wrap gap-2">
                  {featuringOptions.map(artist => (
                    <Button
                      key={artist}
                      variant={songInfo.featuring.includes(artist) ? "default" : "outline"}
                      onClick={() => setSongInfo(prev => ({
                        ...prev,
                        featuring: prev.featuring.includes(artist)
                          ? prev.featuring.filter(a => a !== artist)
                          : [...prev.featuring, artist]
                      }))}
                      size="sm"
                    >
                      {artist}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="versos">Versificação</TabsTrigger>
                    <TabsTrigger value="cinematografia">Cinematografia</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                  <Label htmlFor="modo-nietzsche">Modo Nietzsche</Label>
                  <Switch
                    id="modo-nietzsche"
                    checked={modoNietzsche}
                    onCheckedChange={handleNietzscheModeChange}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* New Story Types Configuration Card */}
        <Card className="w-[1732px] mb-6 shadow-md rounded-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {/* Introduction Section */}
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Introdução</h3>
                <div className="text-sm">
                  <select
                    className="w-full p-2 border rounded mb-2"
                    value={storyConfig.introduction}
                    onChange={(e) => setStoryConfig({ ...storyConfig, introduction: e.target.value })}
                  >
                    <option value="">Selecione o tipo de introdução</option>
                    <option value="in_medias_res">In medias res</option>
                    <option value="exposicao">Exposição gradual</option>
                    <option value="dialogo">Diálogo inicial</option>
                    <option value="descricao">Descrição do cenário</option>
                  </select>
                  {storyConfig.introduction && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <p className="text-gray-600">Selecionado: {storyConfig.introduction}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Elements Section */}
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Elementos</h3>
                <div className="text-sm">
                  <select
                    className="w-full p-2 border rounded mb-2"
                    value={storyConfig.elements}
                    onChange={(e) => setStoryConfig({ ...storyConfig, elements: e.target.value })}
                  >
                    <option value="">Selecione os elementos principais</option>
                    <option value="personagens">Personagens complexos</option>
                    <option value="ambiente">Ambiente detalhado</option>
                    <option value="objetos">Objetos simbólicos</option>
                    <option value="conflito">Conflito central</option>
                  </select>
                  {storyConfig.elements && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <p className="text-gray-600">Selecionado: {storyConfig.elements}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Focalization Section */}
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Focalização</h3>
                <div className="text-sm">
                  <select
                    className="w-full p-2 border rounded mb-2"
                    value={storyConfig.focalization}
                    onChange={(e) => setStoryConfig({ ...storyConfig, focalization: e.target.value })}
                  >
                    <option value="">Selecione a perspectiva</option>
                    <option value="primeira_pessoa">Primeira pessoa</option>
                    <option value="terceira_pessoa">Terceira pessoa</option>
                    <option value="onisciente">Onisciente</option>
                    <option value="limitada">Onisciência limitada</option>
                  </select>
                  {storyConfig.focalization && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <p className="text-gray-600">Selecionado: {storyConfig.focalization}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Structure Section */}
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Estrutura</h3>
                <div className="text-sm">
                  <select
                    className="w-full p-2 border rounded mb-2"
                    value={storyConfig.structure}
                    onChange={(e) => setStoryConfig({ ...storyConfig, structure: e.target.value })}
                  >
                    <option value="">Selecione a estrutura</option>
                    <option value="linear">Linear</option>
                    <option value="nao_linear">Não-linear</option>
                    <option value="circular">Circular</option>
                    <option value="fragmentada">Fragmentada</option>
                  </select>
                  {storyConfig.structure && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <p className="text-gray-600">Selecionado: {storyConfig.structure}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Music Structure Card */}
        <Card className="w-full mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold">Estrutura Musical</h3>
              
              {/* Selected Sections */}
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={musicStructure}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex flex-wrap gap-2 p-2 border rounded">
                    {musicStructure.map((value, index) => (
                      <SortableMusicStructureItem
                        key={value}
                        id={value}
                        value={value}
                      />
                    ))}
                    {musicStructure.length === 0 && (
                      <p className="text-gray-500">Adicione seções abaixo</p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Available Sections */}
              <div className="flex gap-2 overflow-x-auto p-2">
                {musicStructureOptions.map(option => (
                  <Tooltip key={option.value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={musicStructure.includes(option.value) ? "default" : "outline"}
                        onClick={() => {
                          if (musicStructure.includes(option.value)) {
                            handleRemoveMusicSection(option.value);
                          } else {
                            handleAddMusicSection(option.value);
                          }
                        }}
                        className="rounded-full px-4 py-2 whitespace-nowrap"
                      >
                        {option.label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{option.description}</p>
                      <p className="text-sm text-gray-600">Exemplo: {option.example}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        {activeTab === "versos" && (
          <div className="space-y-6 w-full">
            {strophes.map((strophe, stropheIndex) => (
              <Card key={strophe.id} className="p-6 w-full">
                <div className="flex justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold">{stropheIndex + 1}</h3>
                    <div className="flex gap-4">
                      {/* DramArq Select */}
                      <select
                        value={strophe.architecture}
                        onChange={(e) => {
                          const newStrophes = [...strophes];
                          newStrophes[stropheIndex].architecture = e.target.value;
                          setStrophes(newStrophes);
                        }}
                        className="p-2 border rounded"
                      >
                        {dramArqOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value}
                            <Info size={14} className="ml-2" title={opt.description} />
                          </option>
                        ))}
                      </select>

                      {/* Three Act Structure Select */}
                      <select
                        value={strophe.threeAct || ""}
                        onChange={(e) => {
                          const newStrophes = [...strophes];
                          newStrophes[stropheIndex].threeAct = e.target.value;
                          setStrophes(newStrophes);
                        }}
                        className="p-2 border rounded"
                      >
                        <option value="">Estrutura em 3 Atos</option>
                        {threeActStructure.map(act => (
                          <optgroup key={act.category} label={act.category}>
                            {act.techniques.map(tech => (
                              <option key={tech.name} value={tech.name}>
                                {tech.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {/* Music Section Select */}
                      <select
                        value={strophe.musicSection || ""} // Usando strophe.musicSection em vez de strophe.verses[0]?.musicSection
                        onChange={(e) => {
                          const newStrophes = [...strophes];
                          newStrophes[stropheIndex].musicSection = e.target.value; // Atualizando a seção musical na estrofe
                          setStrophes(newStrophes);
                        }}
                        className="p-2 border rounded"
                      >
                        <option value="">Seção Musical</option>
                        {musicStructure.map(section => (
                          <option key={section} value={section}>
                            {musicStructureOptions.find(opt => opt.value === section)?.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setStrophes(strophes.filter((_, i) => i !== stropheIndex))}
                  >
                    Remover Estrofe
                  </Button>
                </div>

                {strophe.architecture === "Episódios" && (
                  <div className="mb-4">
                    <Label>Subcategoria do Episódio</Label>
                    <select
                      value={strophe.architectureDesc || ""}
                      onChange={(e) => {
                        const newStrophes = [...strophes];
                        newStrophes[stropheIndex].architectureDesc = e.target.value;
                        setStrophes(newStrophes);
                      }}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Selecione uma subcategoria</option>
                      {dramArqOptions
                        .find(opt => opt.value === "Episódios")
                        ?.subtypes?.map(subtype => (
                          <option key={subtype.value} value={subtype.value}>
                            {subtype.value}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-sm font-semibold">
                     {
                      strophe.architecture === "Episódios" && strophe.architectureDesc
                        ? dramArqOptions
                            .find(opt => opt.value === "Episódios")
                            ?.subtypes?.find(sub => sub.value === strophe.architectureDesc)?.instruction
                        : dramArqOptions.find(opt => opt.value === strophe.architecture)?.instruction
                    }
                  </p>
                  {strophe.threeAct && (
                    <p className="text-sm font-semibold mt-2">
                      {
                        threeActStructure
                          .flatMap(act => act.techniques)
                          .find(tech => tech.name === strophe.threeAct)?.description
                      }
                    </p>
                  )}
                  {strophe.musicSection && ( // Usando strophe.musicSection em vez de strophe.verses[0]?.musicSection
                    <p className="text-sm font-semibold mt-2">
                      {
                        musicStructureOptions
                          .find(opt => opt.value === strophe.musicSection)?.description
                      }
                    </p>
                  )}
                </div>

                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  onDragStart={({ active }) => setDraggedVerseId(active.id as string)}
                >
                  <SortableContext items={strophe.verses.map(v => v.id)} strategy={verticalListSortingStrategy}>
                    {strophe.verses.map((verse, verseIndex) => (
                      <SortableVerse
                        key={verse.id}
                        verse={verse}
                        stropheIndex={stropheIndex}
                        verseIndex={verseIndex}
                        onVerseChange={(newVerse) => handleVerseChange(stropheIndex, verseIndex, newVerse)}
                        onRemove={() => {
                          const newStrophes = [...strophes];
                          newStrophes[stropheIndex].verses.splice(verseIndex, 1);
                          setStrophes(newStrophes);
                        }}
                        onDragStart={setDraggedVerseId}
                        modoNietzsche={modoNietzsche}
                        musicStructure={musicStructure} // Passando a prop musicStructure
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay dropAnimation={defaultDropAnimation}>
                    {draggedVerseId ? (
                      <div className="opacity-50 border p-4 rounded-lg bg-white dark:bg-gray-800">
                        {strophes
                          .flatMap(s => s.verses)
                          .find(v => v.id === draggedVerseId)?.words
                          .map(w => w.text).join(" ")}  
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>

                <div className="mt-4 flex gap-4">
                  <input
                    type="text"
                    placeholder="Digite o verso e pressione Enter (3x para nova estrofe)"
                    className="border p-2 rounded flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const target = e.target as HTMLInputElement;
                        const value = target.value.trim();
                        
                        // Verifica se o usuário pressionou Enter 3 vezes
                        if (value === "") {
                          const enterCount = (target.dataset.enterCount || 0) as number;
                          if (enterCount >= 2) {
                            handleAddStrophe();
                            target.dataset.enterCount = "0";
                            return;
                          }
                          target.dataset.enterCount = (enterCount + 1).toString();
                          return;
                        }

                        // Adiciona novo verso
                        const words = value.split(" ").map(text => ({ text: text.toUpperCase() }));
                        const newStrophes = [...strophes];
                        newStrophes[stropheIndex].verses.push({
                          id: Date.now().toString(),
                          words,
                          tag: "A",
                          cameraSettings: {
                            shotType: "eyeLevel",
                            movement: "pan",
                            resolution: "4k",
                            stabilization: "tripod",
                            location: "",
                          }
                        });
                        setStrophes(newStrophes);
                        target.value = "";
                        target.dataset.enterCount = "0";
                      }
                    }}
                  />
                  
                  {/* Botão para adicionar nova estrofe */}
                  <Button 
                    onClick={handleAddStrophe}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nova Estrofe
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Adicionar Letra Completa</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Inserir Letra Completa</DialogTitle>
                      </DialogHeader>
                      <textarea
                        value={fullLyrics}
                        onChange={(e) => setFullLyrics(e.target.value)}
                        className="w-full h-64 p-2 border rounded"
                        placeholder="Separe estrofes com linhas vazias"
                      />
                      <Button onClick={() => {
                        const groups = fullLyrics.split('\n\n');
                        const newStrophes = groups.map(group => ({
                          id: Date.now().toString(),
                          architecture: "Prólogo",
                          verses: group.split('\n').filter(l => l.trim()).map(line => ({
                            id: Date.now().toString(),
                            words: line.split(' ').map(text => ({ text: text.toUpperCase() })),
                            tag: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)],
                            cameraSettings: {
                              shotType: "eyeLevel",
                              movement: "pan",
                              resolution: "4k",
                              stabilization: "tripod",
                              location: "",
                            }
                          }))
                        }));
                        setStrophes([...strophes, ...newStrophes]);
                        setFullLyrics("");
                      }}>
                        Aplicar
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
                <div ref={stropheEndRef} />
              </Card>
            ))}
          </div>
        )}

        {activeTab === "cinematografia" && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-xl font-bold">Configurações Gerais do Projeto</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Rácio de Aspeto</Label>
                    <select className="w-full p-2 border rounded">
                      <option value="16:9">16:9 (Widescreen)</option>
                      <option value="1.85:1">1.85:1</option>
                      <option value="2.39:1">2.39:1</option>
                      <option value="4:3">4:3 (Fullscreen)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Espaço de Cor e LUTs</Label>
                    <select className="w-full p-2 border rounded">
                      <option value="rec709">Rec.709</option>
                      <option value="logc">Log-C</option>
                      <option value="raw">RAW</option>
                    </select>
                  </div>
                  <div>
                    <Label>Formato de Gravação e Codecs</Label>
                    <div className="flex gap-2">
                      <select className="w-1/2 p-2 border rounded">
                        <option value="prores">ProRes</option>
                        <option value="redcode">REDCODE</option>
                        <option value="braw">BRAW</option>
                      </select>
                      <Input placeholder="Bitrate" className="w-1/2" />
                    </div>
                  </div>
                  <div>
                    <Label>Frame Rate Base</Label>
                    <select className="w-full p-2 border rounded">
                      <option value="24">24 fps</option>
                      <option value="25">25 fps</option>
                      <option value="60">60 fps</option>
                    </select>
                  </div>
                  <div>
                    <Label>Gestão de Dados (DIT)</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Workflow" className="w-1/2" />
                      <Input placeholder="Backups" className="w-1/2" />
                    </div>
                  </div>
                  <div>
                    <Label>Monitorização e Calibração</Label>
                    <div className="flex gap-2">
                      <select className="w-1/2 p-2 border rounded">
                        <option value="hdr">HDR</option>
                        <option value="scopes">Scopes</option>
                      </select>
                      <Input placeholder="Visor de Câmara" className="w-1/2" />
                    </div>
                  </div>
                  <div>
                    <Label>Segurança e Logística</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Geradores" className="w-1/2" />
                      <Input placeholder="Cablagem" className="w-1/2" />
                    </div>
                  </div>
                  <div>
                    <Label>Continuidade e Referências Visuais</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Script Photos" className="w-1/2" />
                      <Input placeholder="Moodboards" className="w-1/2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {strophes.flatMap(strophe => strophe.verses).map((verse, index) => (
                <Card key={verse.id} className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Mídia de Referência</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-48 flex items-center justify-center">
                        {verse.media ? (
                          verse.media instanceof File ? (
                            verse.media.type.startsWith("video") ? (
                              <video controls className="max-h-44">
                                <source src={URL.createObjectURL(verse.media)} />
                              </video>
                            ) : (
                              <img src={URL.createObjectURL(verse.media)} className="max-h-44" />
                            )
                          ) : null
                        ) : (
                          <span className="text-gray-500">Arraste arquivo aqui</span>
                        )}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            if(e.target.files?.[0]) {
                              const newStrophes = [...strophes];
                              const verseIndex = newStrophes
                                .flatMap(s => s.verses)
                                .findIndex(v => v.id === verse.id);
                              newStrophes.flatMap(s => s.verses)[verseIndex].media = e.target.files![0];
                              setStrophes(newStrophes);
                            }
                          }}
                          className="hidden"
                          id={`media-${verse.id}`}
                        />
                        <label htmlFor={`media-${verse.id}`} className="cursor-pointer p-2 hover:bg-gray-100 rounded">
                          <Video size={24} />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Configurações Profissionais</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Tipo de Plano</Label>
                            <select
                              value={verse.cameraSettings?.shotType}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.shotType = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full p-2 border rounded"
                            >
                              <option value="plano_aberto">Plano aberto (full body) para ambientação</option>
                              <option value="plano_medio">Plano médio (torso/quadril) para ação e movimentação</option>
                              <option value="close_up">Close-up (rosto/detalhe) para expressão e emoção</option>
                            </select>
                          </div>

                          <div>
                            <Label>Movimento de Câmera</Label>
                            <select
                              value={verse.cameraSettings?.cameraMovement}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.cameraMovement = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full p-2 border rounded"
                            >
                              <option value="pan_tilt">Pan/tilt para revelar detalhes</option>
                              <option value="travelling">Travelling/dolly para seguir personagens</option>
                              <option value="steadicam">Steadicam/gimbal para movimentos fluidos</option>
                              <option value="zoom">Zoom suave ou dolly-zoom para efeito dramático</option>
                            </select>
                          </div>

                          <div>
                            <Label>Cobertura e Ambiente</Label>
                            <Input
                              placeholder="Exterior (EXT) vs Interior (INT)"
                              value={verse.cameraSettings?.coverage || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.coverage = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label>Elenco e Personagens</Label>
                            <Input
                              placeholder="Número e papel de cada personagem"
                              value={verse.cameraSettings?.cast || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.cast = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label>Adereços e Figurinos</Label>
                            <Input
                              placeholder="Lista de props e figurinos"
                              value={verse.cameraSettings?.propsCostumes || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.propsCostumes = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label>Ritmo e Estilo</Label>
                            <select
                              value={verse.cameraSettings?.rhythmStyle}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.rhythmStyle = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full p-2 border rounded"
                            >
                              <option value="slow_motion">Slow motion (60-120 fps)</option>
                              <option value="speed_ramp">Speed ramp (variação de velocidade)</option>
                              <option value="visual_poetry">Poesia visual (composições simétricas)</option>
                              <option value="force_demo">Demonstração de força (planos sequência)</option>
                            </select>
                          </div>

                          <div>
                            <Label>Tipo de Cena</Label>
                            <select
                              value={verse.cameraSettings?.sceneType}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.sceneType = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full p-2 border rounded"
                            >
                              <option value="dialogo">Diálogo (master, over-the-shoulder)</option>
                              <option value="luta">Luta/ação (planos dinâmicos)</option>
                              <option value="demonstracao">Demonstração (close-ups e ângulos dramáticos)</option>
                            </select>
                          </div>

                          <div>
                            <Label>ISO</Label>
                            <Input
                              type="number"
                              placeholder="Ex: 100"
                              value={verse.cameraSettings?.iso || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.iso = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label>Velocidade do Obturador</Label>
                            <Input
                              placeholder="Ex: 1/60"
                              value={verse.cameraSettings?.shutterSpeed || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.shutterSpeed = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label>Filtros ND</Label>
                            <select
                              value={verse.cameraSettings?.ndFilter || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.ndFilter = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full p-2 border rounded"
                            >
                              <option value="0.3">0.3 (1 stop)</option>
                              <option value="0.6">0.6 (2 stops)</option>
                              <option value="0.9">0.9 (3 stops)</option>
                              <option value="1.2">1.2 (4 stops)</option>
                            </select>
                          </div>

                          <div>
                            <Label>INT/EXT</Label>
                            <select
                              value={verse.cameraSettings?.intExt || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.intExt = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full p-2 border rounded"
                            >
                              <option value="interior">Interior</option>
                              <option value="exterior">Exterior</option>
                            </select>
                          </div>

                          <div>
                            <Label>Personagens</Label>
                            <Input
                              placeholder="Número, gênero, idades"
                              value={verse.cameraSettings?.characters || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.characters = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label>Props</Label>
                            <Input
                              placeholder="Lista de adereços"
                              value={verse.cameraSettings?.props || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.props = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label>Estilo e Ritmo</Label>
                            <select
                              value={verse.cameraSettings?.style || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.style = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full p-2 border rounded"
                            >
                              <option value="slow motion">Slow Motion</option>
                              <option value="speed run">Speed Run</option>
                              <option value="visual poetry">Visual Poetry</option>
                              <option value="demonstracao">Demonstração de Força Humana</option>
                            </select>
                          </div>

                          <div>
                            <Label>Objetivo em 3 Palavras</Label>
                            <Input
                              placeholder="Ex: Amor, Paixão, Dor"
                              value={verse.cameraSettings?.objective || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.objective = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label>Tags de Destaque</Label>
                            <Input
                              placeholder="Ex: #HighContrast #SlowMotion"
                              value={verse.cameraSettings?.tags || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.tags = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label>Efeitos Especiais</Label>
                            <select
                              value={verse.cameraSettings?.specialEffects || ''}
                              onChange={(e) => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.specialEffects = e.target.value;
                                setStrophes(newStrophes);
                              }}
                              className="w-full p-2 border rounded"
                            >
                              <option value="levitacao">Levitação</option>
                              <option value="duplicacao">Duplicação de Personagens</option>
                              <option value="reverse">Reverse Motion</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Localização</Label>
                        <Input
                          value={verse.cameraSettings?.location}
                          onChange={(e) => {
                            const newStrophes = [...strophes];
                            const verseIndex = newStrophes
                              .flatMap(s => s.verses)
                              .findIndex(v => v.id === verse.id);
                            newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.location = e.target.value;
                            setStrophes(newStrophes);
                          }}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label>Versos Relacionados</Label>
                        <div className="flex flex-wrap gap-2">
                          {strophes.flatMap(strophe => strophe.verses).map((_, vIndex) => (
                            <Button
                              key={vIndex}
                              variant={verse.cameraSettings?.relatedVerses?.includes(vIndex + 1) ? "default" : "outline"}
                              onClick={() => {
                                const newStrophes = [...strophes];
                                const verseIndex = newStrophes
                                  .flatMap(s => s.verses)
                                  .findIndex(v => v.id === verse.id);
                                
                                const relatedVerses = newStrophes
                                  .flatMap(s => s.verses)[verseIndex]
                                  .cameraSettings?.relatedVerses || [];
                                
                                newStrophes.flatMap(s => s.verses)[verseIndex].cameraSettings!.relatedVerses = 
                                  relatedVerses.includes(vIndex + 1)
                                    ? relatedVerses.filter(v => v !== vIndex + 1)
                                    : [...relatedVerses, vIndex + 1];
                                
                                setStrophes(newStrophes);
                              }}
                              size="sm"
                              className="text-xs px-2 py-1"
                            >
                              {vIndex + 1}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <p className="text-sm font-semibold">Verso {index + 1}:</p>
                    <p className="uppercase">
                      {verse.words.map(word => word.text).join(" ")}
                      {verse.adlib && <span className="text-gray-500"> ({verse.adlib})</span>}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <Card className="sticky bottom-0 mt-6">
          <CardContent className="p-4 flex justify-between">
            <div className="flex gap-4">
              <Button 
                onClick={handleAnalyzeMeter}
                variant="secondary" 
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Analisar Métrica
              </Button>

              {showAnalysis && (
                <Button
                  onClick={() => {
                    setShowAnalysis(false);
                    setAnalysisResult(null);
                  }}
                  variant="destructive"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Ocultar Métrica
                </Button>
              )}

              <PreviewModal verses={strophes.flatMap(strophe => strophe.verses).map(verse => verse.words.map(word => ({ text: word.text, color: word.customColor } as Word)))} />
              
              <Button 
                onClick={exportToPDF} 
                variant="secondary" 
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Exportar PDF
              </Button>

              <Button 
                variant="secondary" 
                className="gap-2"
                onClick={() => window.location.href = "http://localhost:3000/cinematografia"}
              >
                <Video className="h-4 w-4" />
                Planear Cinematografia
              </Button>

              {activeTab === "cinematografia" && (
                <Button onClick={() => exportStoryboard(strophes)} variant="outline">
                  <Video className="mr-2" /> Exportar Storyboard
                </Button>
              )}

              <Button 
                onClick={handleSaveProject}
                variant="primary"
                className="bg-green-500 hover:bg-green-600"
              >
                <Save className="mr-2" />
                Salvar Projeto
              </Button>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <Eye className="mr-2" /> Pré-visualizar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[90vh]">
                <div className="overflow-auto">
                  {strophes.map((strophe, index) => (
                    <div key={index} className="mb-8">
                      <h3 className="text-xl font-bold mb-4">Estrofe {index + 1} ({strophe.architecture})</h3>
                      {strophe.verses.map((verse, vIndex) => (
                        <div key={vIndex} className="mb-4">
                          <p className="font-bold uppercase">
                            {verse.words.map((word, wordIndex) => (
                              <span 
                                key={wordIndex} 
                                style={{ color: word.customColor }}
                                className={word.stressed ? "font-black" : ""}
                              >
                                {word.text}{" "}
                              </span>
                            ))}
                            {verse.adlib && <span className="text-gray-500">({verse.adlib})</span>}
                          </p>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Voz: {voiceOptions.find(v => v.value === verse.voiceType)?.label}</p>
                            <p>Figura: {verse.figura || "Nenhuma"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {showAnalysis && analysisResult && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Análise Métrica</h3>
                {analysisResult.original_lines.map((line: string, idx: number) => (
                  <div key={idx} className="p-3 border rounded">
                    <p className="text-sm font-semibold">
                      Linha {idx + 1}: {line} 
                      <span className="ml-2 text-gray-600">
                        (Total de sílabas: {analysisResult.word_details[idx].total_syllables})
                      </span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {analysisResult.word_details[idx].details.map(
                        (detail: {
                          word: string;
                          syllable_breakdown: string;
                          scansion: string;
                          syllable_count: number;
                        }, wIdx: number) => (
                          <div key={wIdx} className="text-xs p-2 border rounded bg-gray-50">
                            <div className="font-medium">{detail.word}</div>
                            <div className="font-mono text-gray-600">
                              {detail.syllable_breakdown.split('-').map((syllable, sIdx) => (
                                <span 
                                  key={sIdx}
                                  className={detail.scansion[sIdx] === '1' ? 'font-extrabold' : 'font-normal'}
                                >
                                  {syllable}{sIdx < detail.syllable_breakdown.split('-').length - 1 ? '-' : ''}
                                </span>
                              ))}
                              {' '}({detail.scansion})
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ContentLayout>
  );
};

export default Dashboard;