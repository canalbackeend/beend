'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { User, Mail, Phone, Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFaceSadTear,
  faFaceFrown,
  faFaceMeh,
  faFaceSmile,
  faFaceGrin,
} from '@fortawesome/free-solid-svg-icons';

interface Answer {
  questionId: string;
  questionText: string;
  questionType: string;
  value: string;
  comment: string | null;
}

interface Response {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignDescription: string | null;
  createdAt: string;
  answers: Answer[];
}

interface Respondent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  firstResponse: string;
  lastResponse: string;
  totalResponses: number;
  responses: Response[];
}

const getSmileIcon = (value: string) => {
  switch (value) {
    case '1':
      return faFaceSadTear;
    case '2':
      return faFaceFrown;
    case '3':
      return faFaceMeh;
    case '4':
      return faFaceSmile;
    case '5':
      return faFaceGrin;
    default:
      return faFaceMeh;
  }
};

const getSmileColor = (value: string) => {
  switch (value) {
    case '1':
      return 'text-red-600';
    case '2':
      return 'text-orange-600';
    case '3':
      return 'text-yellow-600';
    case '4':
      return 'text-lime-600';
    case '5':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

const getNPSBadgeColor = (value: string) => {
  const numValue = parseInt(value);
  if (numValue >= 9) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (numValue >= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

export default function TerminalPanelRespondents() {
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [filteredRespondents, setFilteredRespondents] = useState<Respondent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRespondents();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRespondents(respondents);
    } else {
      const filtered = respondents.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.phone?.includes(searchTerm)
      );
      setFilteredRespondents(filtered);
    }
  }, [searchTerm, respondents]);

  const fetchRespondents = async () => {
    try {
      const response = await fetch('/api/terminal-panel/respondents');
      if (response.ok) {
        const data = await response.json();
        setRespondents(data);
        setFilteredRespondents(data);
      }
    } catch (error) {
      console.error('Error fetching respondents:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAnswerValue = (answer: Answer) => {
    switch (answer.questionType) {
      case 'SMILE':
      case 'SIMPLE_SMILE':
        return (
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={getSmileIcon(answer.value)}
              className={`text-2xl ${getSmileColor(answer.value)}`}
            />
            <span className="text-sm text-muted-foreground">
              {answer.value}/5
            </span>
          </div>
        );

      case 'NPS':
        return (
          <Badge className={getNPSBadgeColor(answer.value)}>
            {answer.value}/10
          </Badge>
        );

      case 'SCALE':
        return (
          <Badge variant="outline" className="font-mono">
            {answer.value}
          </Badge>
        );

      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE':
        return (
          <Badge variant="secondary">
            {answer.value}
          </Badge>
        );

      case 'TEXT_INPUT':
        return (
          <p className="text-sm italic text-muted-foreground line-clamp-2">
            "{answer.value}"
          </p>
        );

      default:
        return <span>{answer.value}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⌛</div>
          <p className="text-muted-foreground">Carregando respondentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Respondentes
          </h1>
          <p className="text-muted-foreground mt-2">
            Cadastros e histórico de participação nas pesquisas do terminal
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{respondents.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Respondentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {respondents.filter((r) => r.email).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Com E-mail</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Phone className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {respondents.filter((r) => r.phone).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Com Telefone</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar Respondente</Label>
          <Input
            id="search"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Lista de Respondentes */}
      {filteredRespondents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">
              {searchTerm ? 'Nenhum respondente encontrado' : 'Nenhum cadastro ainda'}
            </h2>
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? 'Tente buscar com outros termos'
                : 'Os respondentes que fornecerem dados de contato aparecerão aqui'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {filteredRespondents.map((respondent) => (
            <AccordionItem
              key={respondent.id}
              value={respondent.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-6 py-4">
                <div className="flex items-start justify-between w-full pr-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{respondent.name}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        {respondent.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{respondent.email}</span>
                          </div>
                        )}
                        {respondent.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{respondent.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">
                      {respondent.totalResponses}{' '}
                      {respondent.totalResponses === 1 ? 'resposta' : 'respostas'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Última resposta:{' '}
                      {format(new Date(respondent.lastResponse), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Primeiro cadastro:{' '}
                      {format(new Date(respondent.firstResponse), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Histórico de Respostas:</h4>
                    {respondent.responses.map((response, idx) => (
                      <Card key={response.id} className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {response.campaignDescription || response.campaignTitle}
                              </CardTitle>
                              <CardDescription>
                                {format(new Date(response.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">#{idx + 1}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {response.answers.map((answer) => (
                            <div
                              key={answer.questionId}
                              className="flex flex-col gap-2 p-3 bg-background rounded-lg"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-sm font-medium flex-1">
                                  {answer.questionText}
                                </p>
                                {renderAnswerValue(answer)}
                              </div>
                              {answer.comment && (
                                <div className="flex items-start gap-2 mt-2 p-2 bg-muted rounded">
                                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <p className="text-sm text-muted-foreground italic">
                                    {answer.comment}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
