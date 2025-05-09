import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/admin-panel/navbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Footer } from "@/components/admin-panel/footer";
import { Sidebar } from "@/components/admin-panel/sidebar";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSidebar } from "@/hooks/use-sidebar";
import Metronome from "./estrofes/metronome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

interface Step {
  name: string;
  link: string;
  timeframe: string;
  description: string;
}

interface MultiStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

const MultiStepper: React.FC<MultiStepperProps> = ({ steps, currentStep, onStepClick }) => {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex flex-col gap-4 w-full overflow-x-auto">
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between relative">
        <div className="absolute left-[30%] top-0 h-full w-px bg-gray-300 dark:bg-gray-600" />
        <div className="absolute left-[70%] top-0 h-full w-px bg-gray-300 dark:bg-gray-600" />
        
        {steps.map((step, index) => (
          <div key={step.name} className="flex flex-col items-center flex-1 min-w-[80px]">
            <div className="flex items-center w-full">
              <Link 
                href={step.link} 
                onClick={() => onStepClick && onStepClick(index)}
                className="flex items-center w-full"
              >
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm font-medium transition-colors duration-300 ${
                        index <= currentStep
                          ? "bg-primary text-white border-primary"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{step.description}</p>
                  </TooltipContent>
                </Tooltip>
              </Link>
              {index !== steps.length - 1 && (
                <div
                  className={`flex-1 h-1 ${
                    index < currentStep ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                  } mx-2`}
                ></div>
              )}
            </div>
            <span className="mt-2 text-xs text-center">{step.name}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">
              Mês 1 - Pré-Produção
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Definir base sonora, conceito e letras</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip className="-ml-6">
          <TooltipTrigger>
            <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
              Mês 2 - Produção
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Gravação, figurinos e filmagens</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900">
              Mês 3 - Pós-Produção
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Contratos, direitos autorais e lançamento</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export function ContentLayout({ title, children }: ContentLayoutProps) {
  const sidebar = useSidebar();
  const { settings, setSettings } = sidebar;

  const steps: Step[] = [
    { 
      name: "Instrumental", 
      link: "/instrumental", 
      timeframe: "Mês 1",
      description: "Criar arranjos e demos para definir a base sonora"
    },
    { 
      name: "Narratologia", 
      link: "/narratologia", 
      timeframe: "Mês 1",
      description: "Definir conceito, moodboard, roteiro e tratamento"
    },
    { 
      name: "Versificação", 
      link: "/versificacao", 
      timeframe: "Mês 1",
      description: "Finalizar letras e estrutura poética"
    },
    { 
      name: "Gravação", 
      link: "/gravacao", 
      timeframe: "Mês 2",
      description: "Agendar estúdio e gravar todas as faixas"
    },
    { 
      name: "Vestuário", 
      link: "/vestuario", 
      timeframe: "Mês 2",
      description: "Produzir e provar figurinos para vídeo e material de imprensa"
    },
    { 
      name: "Orçamento", 
      link: "/orcamento", 
      timeframe: "Mês 2",
      description: "Distribuir verba entre estúdio, equipe, figurino e reserva"
    },
    { 
      name: "Filmagens", 
      link: "/filmagem", 
      timeframe: "Mês 2",
      description: "Executar gravação de vídeo e bastidores"
    },
    { 
      name: "Contratualização", 
      link: "/contratualizacao", 
      timeframe: "Mês 3",
      description: "Fechar contratos com artistas, equipe, distribuidores e plataformas"
    },
    { 
      name: "Direitos Autorais", 
      link: "/direitosautorais", 
      timeframe: "Mês 3",
      description: "Registrar obras, liberar samples e licenciar sincronizações"
    },
    { 
      name: "Lançamento", 
      link: "/lancamento", 
      timeframe: "Mês 3",
      description: "Implementar distribuição digital, PR, marketing e monitorar resultados"
    },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <TooltipProvider>
      <div className="w-full overflow-hidden transition-all duration-300">
        <Navbar title={title} />
        
        <AdminPanelLayout>
          <div className="w-full pt-8 pb-8 px-4 mx-auto max-w-[1800px]">
            <div className="p-4 items-center w-full">
              <div className="w-full">
                <Card className="w-full mb-4">
                  <CardHeader className="items-center">
                    <div className="flex items-center gap-4 w-full">
                      <MultiStepper
                        steps={steps}
                        currentStep={currentStep}
                        onStepClick={handleStepClick}
                      />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="w-8 h-8">
                            <span className="text-sm">i</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[800px]">
                          <DialogHeader>
                            <DialogTitle>Ciclo Trimestral de Execução</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>
                              Cada trimestre funciona como um sprint de 3 meses, passando por pré‑produção, produção e pós‑produção/liberação.
                            </p>
                            
                            <div>
                              <h3 className="font-semibold mb-2">Mês 1 – Pré‑Produção</h3>
                              <ol className="list-decimal pl-6 space-y-2">
                                <li><strong>Instrumental</strong> - Criar arranjos e demos para definir a base sonora.</li>
                                <li><strong>Contextualização</strong> - Definir conceito, moodboard, roteiro e tratamento.</li>
                                <li><strong>Versificação</strong> - Finalizar letras e estrutura poética.</li>
                              </ol>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Mês 2 – Produção</h3>
                              <ol className="list-decimal pl-6 space-y-2" start={4}>
                                <li><strong>Gravação</strong> - Agendar estúdio e gravar todas as faixas.</li>
                                <li><strong>Vestuário</strong> - Produzir e provar figurinos para vídeo e material de imprensa.</li>
                                <li><strong>Orçamentalização</strong> - Distribuir verba entre estúdio, equipe, figurino e reserva.</li>
                                <li><strong>Filmagens</strong> - Executar gravação de vídeo e bastidores.</li>
                              </ol>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Mês 3 – Pós‑Produção & Lançamento</h3>
                              <ol className="list-decimal pl-6 space-y-2" start={8}>
                                <li><strong>Contratualização</strong> - Fechar contratos com artistas, equipe, distribuidores e plataformas.</li>
                                <li><strong>Direitos Autorais</strong> - Registrar obras, liberar samples e licenciar sincronizações.</li>
                                <li><strong>Lançamento</strong> - Implementar distribuição digital, PR, marketing e monitorar resultados.</li>
                              </ol>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Revisão e Ajustes</h3>
                              <ul className="list-disc pl-6 space-y-2">
                                <li>Ao final do trimestre, avaliar KPIs (streams, views, engajamento) e lições aprendidas.</li>
                                <li>Ajustar o plano do próximo trimestre com base nos resultados e feedback.</li>
                              </ul>
                              <p className="mt-2">
                                Repita este ciclo a cada três meses para manter ritmo, controle orçamentário e capacidade de adaptação rápida.
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="py-0" />
                </Card>

                <Card className="mb-6 w-full">
                  <CardContent className="pt-6">
                    <div className="flex gap-6">
                      <Tabs defaultValue="controls" className="w-full">
                        <TabsList>
                          <TabsTrigger value="controls">Controles</TabsTrigger>
                          <TabsTrigger value="settings">Configurações</TabsTrigger>
                        </TabsList>

                        <div className="pt-4 flex gap-6">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="is-hover-open"
                                  checked={settings.isHoverOpen}
                                  onCheckedChange={(x) => setSettings({ isHoverOpen: x })}
                                />
                                <Label htmlFor="is-hover-open">Abertura Sutil</Label>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ativa a exibição suave da sidebar ao passar o mouse</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="disable-sidebar"
                                  checked={settings.disabled}
                                  onCheckedChange={(x) => setSettings({ disabled: x })}
                                />
                                <Label htmlFor="disable-sidebar">Desativar Sidebar</Label>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Esconde completamente a sidebar</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </Tabs>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {children}
          </div>
        </AdminPanelLayout>
      </div>
    </TooltipProvider>
  );
}
