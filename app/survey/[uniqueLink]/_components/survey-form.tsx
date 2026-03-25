'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceAngry, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrinStars } from '@fortawesome/free-solid-svg-icons';

interface QuestionOption {
  id: string;
  text: string;
  color?: string;
  imageUrl?: string;
  order: number;
}

interface Question {
  id: string;
  text: string;
  order: number;
  type: 'SMILE' | 'SIMPLE_SMILE' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT_INPUT' | 'EMPLOYEE_RATING';
  allowOptionalComment: boolean;
  options: QuestionOption[];
  scaleMin?: number | null;
  scaleMax?: number | null;
  scaleMinLabel?: string | null;
  scaleMaxLabel?: string | null;
}

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  status: string;
  questions: Question[];
  terminalId?: string | null;
  terminalName?: string;
  isTerminalLink?: boolean;
  redirectUrl?: string | null;
  lgpdText?: string | null;
  collectName?: boolean;
  collectPhone?: boolean;
  collectEmail?: boolean;
  user?: {
    logoUrl: string | null;
  };
}

interface Answer {
  questionId: string;
  rating: number | null;
  selectedOptions: string[];
  comment: string;
}

interface SurveyFormProps {
  uniqueLink: string;
}

export function SurveyForm({ uniqueLink }: SurveyFormProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [respondentName, setRespondentName] = useState('');
  const [respondentPhone, setRespondentPhone] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [accessId, setAccessId] = useState<string | null>(null);

  // Função para formatar telefone brasileiro
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const truncated = numbers.slice(0, 11);

    if (truncated.length <= 2) {
      return truncated;
    } else if (truncated.length <= 6) {
      return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
    } else if (truncated.length <= 10) {
      return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 6)}-${truncated.slice(6)}`;
    } else {
      return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setRespondentPhone(formatted);
  };

  useEffect(() => {
    fetchCampaign();
  }, [uniqueLink]);

  // Atualizar answeredQuestions quando answers mudar
  useEffect(() => {
    const answered = new Set<string>();
    answers.forEach((answer) => {
      const question = campaign?.questions.find((q) => q.id === answer.questionId);
      if (!question) return;

      let isAnswered = false;

      if (
        question.type === 'SMILE' ||
        question.type === 'SIMPLE_SMILE' ||
        question.type === 'NPS' ||
        question.type === 'SCALE'
      ) {
        isAnswered = answer.rating !== null;
      } else if (question.type === 'TEXT_INPUT') {
        isAnswered = answer.comment.trim() !== '';
      } else if (question.type === 'EMPLOYEE_RATING') {
        isAnswered = answer.selectedOptions.length > 0;
      } else {
        isAnswered = answer.selectedOptions.length > 0;
      }

      if (isAnswered) {
        answered.add(answer.questionId);
      }
    });

    setAnsweredQuestions(answered);
  }, [answers, campaign]);

  // Controlar redirecionamento após submissão
  useEffect(() => {
    if (submitted && campaign?.redirectUrl) {
      // Iniciar contador de 5 segundos
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Redirecionar para a URL configurada
            window.location.href = campaign.redirectUrl!;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [submitted, campaign]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/survey/${uniqueLink}`);
      if (!response.ok) {
        setError('Pesquisa não encontrada');
        return;
      }
      const data = await response.json();
      setCampaign(data ?? null);

      if (data?.status !== 'ACTIVE') {
        setError('Esta pesquisa não está mais aceitando respostas');
      }

      const initialAnswers =
        data?.questions?.map((q: Question) => ({
          questionId: q.id,
          rating: null,
          selectedOptions: [],
          comment: '',
        })) ?? [];
      setAnswers(initialAnswers);

      // Expandir primeira questão por padrão
      if (data?.questions?.[0]?.id) {
        setExpandedQuestion(data.questions[0].id);
      }

      // Registrar acesso ao survey
      if (data?.id) {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const source = urlParams.get('qr') ? 'QR_CODE' : (data.terminalId ? 'TERMINAL' : 'WEBVIEW');
          
          const accessResponse = await fetch('/api/survey-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: data.id,
              terminalId: data.terminalId || null,
              source,
              userAgent: navigator.userAgent,
            }),
          });
          
          if (accessResponse.ok) {
            const accessData = await accessResponse.json();
            setAccessId(accessData.accessId);
          }
        } catch (accessErr) {
          console.error('Error registering access:', accessErr);
        }
      }
    } catch (err) {
      setError('Erro ao carregar pesquisa');
    } finally {
      setLoading(false);
    }
  };

  // Função reutilizável para ir para a próxima questão
  const goToNextQuestion = (questionId: string) => {
    if (!campaign?.questions) return;

    const currentIndex = campaign.questions.findIndex((q) => q.id === questionId);
    if (currentIndex === -1) return;

    const nextQuestion = campaign.questions[currentIndex + 1];
    
    // Se não há próxima questão (é a última)
    if (!nextQuestion) {
      // Fechar a pergunta atual
      setExpandedQuestion(null);
      
      // Se não há coleta de dados, enviar direto
      const hasDataCollection = campaign?.collectName || campaign?.collectPhone || campaign?.collectEmail;
      
      if (!hasDataCollection) {
        // Enviar direto sem mostrar tela de identificação
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
      // Se tem coleta de dados, apenas fecha a pergunta e mostra a tela de identificação
      return;
    }

    // Se há próxima questão, expande ela
    setExpandedQuestion(nextQuestion.id);

    // Scroll suave para a próxima questão
    setTimeout(() => {
      document.getElementById(`question-${nextQuestion.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300);
  };

  const updateAnswer = (questionId: string, field: keyof Answer, value: any) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, [field]: value } : a))
    );

    // Avançar automaticamente somente para perguntas baseadas em rating
    if (field === 'rating' && value !== null) {
      setTimeout(() => {
        goToNextQuestion(questionId);
      }, 500); // Pequeno delay para feedback visual
    }
  };

  const toggleOption = (questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers((prev) =>
      prev.map((a) => {
        if (a.questionId !== questionId) return a;
        if (isMultiple) {
          const newOptions = a.selectedOptions.includes(optionId)
            ? a.selectedOptions.filter((o) => o !== optionId)
            : [...a.selectedOptions, optionId];
          return { ...a, selectedOptions: newOptions };
        } else {
          const newAnswer = { ...a, selectedOptions: [optionId] };

          // Avançar para próxima questão automaticamente em single choice
          setTimeout(() => {
            goToNextQuestion(questionId);
          }, 500);

          return newAnswer;
        }
      })
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const unanswered = answers.filter((a) => {
      const question = campaign?.questions.find((q) => q.id === a.questionId);
      if (!question) return true;

      if (
        question.type === 'SMILE' ||
        question.type === 'SIMPLE_SMILE' ||
        question.type === 'NPS' ||
        question.type === 'SCALE'
      ) {
        return a.rating === null;
      } else if (question.type === 'TEXT_INPUT') {
        return a.comment.trim() === '';
      } else if (question.type === 'EMPLOYEE_RATING') {
        return a.selectedOptions.length === 0;
      } else {
        return a.selectedOptions.length === 0;
      }
    });

    if (unanswered.length > 0) {
      alert('Por favor, responda todas as perguntas');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign?.id,
          terminalId: campaign?.terminalId || null,
          respondentName: respondentName.trim() || null,
          respondentPhone: respondentPhone.trim() || null,
          respondentEmail: respondentEmail.trim() || null,
          answers: answers,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar resposta');
      }

      // Marcar acesso como completo
      if (accessId) {
        try {
          await fetch('/api/survey-access', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessId }),
          });
        } catch (accessErr) {
          console.error('Error marking access as completed:', accessErr);
        }
      }

      setSubmitted(true);
    } catch (err) {
      alert('Erro ao enviar resposta. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const smileIcons = [
    { icon: faFaceAngry, label: 'Muito Insatisfeito', color: 'text-red-500', bgSelected: 'bg-red-500' },
    { icon: faFaceFrown, label: 'Insatisfeito', color: 'text-orange-500', bgSelected: 'bg-orange-500' },
    { icon: faFaceMeh, label: 'Regular', color: 'text-yellow-500', bgSelected: 'bg-yellow-500' },
    { icon: faFaceSmile, label: 'Satisfeito', color: 'text-lime-500', bgSelected: 'bg-lime-500' },
    { icon: faFaceGrinStars, label: 'Muito Satisfeito', color: 'text-green-500', bgSelected: 'bg-green-500' },
  ];

  // Função para verificar se uma questão foi respondida
  const isQuestionAnswered = (questionId: string) => {
    return answeredQuestions.has(questionId);
  };

  // Contador de questões respondidas
  const answeredCount = answeredQuestions.size;
  const totalQuestions = campaign?.questions.length || 0;

  // Função para obter o texto do botão de avançar
  const getNextButtonText = (questionId: string) => {
    if (!campaign?.questions) return 'Próxima pergunta';
    
    const currentIndex = campaign.questions.findIndex((q) => q.id === questionId);
    const isLastQuestion = currentIndex === campaign.questions.length - 1;
    
    if (!isLastQuestion) {
      return 'Próxima pergunta';
    }
    
    // É a última questão
    const hasDataCollection = campaign?.collectName || campaign?.collectPhone || campaign?.collectEmail;
    
    if (hasDataCollection) {
      return 'Fechar e Continuar';
    } else {
      return 'Finalizar e Enviar';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-0 bg-transparent shadow-none">
          <CardHeader className="text-center">
            <FontAwesomeIcon icon={faFaceFrown} className="text-6xl text-orange-500 mb-4" />
            <CardTitle className="text-2xl text-gray-900">Ops!</CardTitle>
            <CardDescription className="text-base text-gray-600">
              {error || 'Pesquisa não encontrada'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <Card className="max-w-md border-0 bg-transparent shadow-none">
          <CardHeader className="text-center">
            {/* Logo do Usuário */}
            <div className="flex justify-center mb-4">
              <div className="relative w-48 h-36 md:w-64 md:h-48">
                <Image
                  src={campaign?.user?.logoUrl || '/logo-backeend.png'}
                  alt="Logo da empresa"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl mb-2 text-gray-900">Obrigado!</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Sua opinião é muito importante para nós. Agradecemos por dedicar seu tempo para responder nossa pesquisa.
            </CardDescription>

            {/* Contador de redirecionamento */}
            {campaign?.redirectUrl && countdown > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  Você será redirecionado em:
                </p>
                <div className="text-4xl font-bold text-blue-600">
                  {countdown}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  segundos...
                </p>
              </div>
            )}
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto overflow-x-hidden no-zoom">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="text-center space-y-2 px-2 pt-2">
            {/* Logo do Usuário */}
            <div className="flex justify-center mb-4">
              <div className="relative w-64 h-48 md:w-80 md:h-60">
                <Image
                  src={campaign?.user?.logoUrl || '/logo-backeend.png'}
                  alt="Logo da empresa"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {campaign.description || 'Pesquisa de Satisfação'}
            </CardTitle>

            {/* Barra de Progresso */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Progresso</span>
                <span>
                  {answeredCount}/{totalQuestions}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-2 md:px-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {campaign.questions.map((question, index) => {
                  const answer = answers.find((a) => a.questionId === question.id);
                  const currentRating = answer?.rating ?? null;
                  const isAnswered = isQuestionAnswered(question.id);
                  const isExpanded = expandedQuestion === question.id;
                  const isPreviousQuestion = expandedQuestion
                    ? campaign.questions.findIndex((q) => q.id === expandedQuestion) > index
                    : false;

                  return (
                    <motion.div
                      key={question.id}
                      id={`question-${question.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: isAnswered && !isExpanded ? 0.4 : 1,
                        y: 0,
                        scale: isExpanded ? 1 : 0.98,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-xl transition-all duration-300 ${
                        isExpanded
                          ? 'bg-white/30 border border-gray-700 p-4'
                          : 'bg-white/10 hover:bg-white/20 p-3 cursor-pointer'
                      } ${isAnswered ? 'border-green-300' : ''}`}
                      onClick={() => !isExpanded && setExpandedQuestion(question.id)}
                    >
                      {/* Cabeçalho da Questão (sempre visível) */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isAnswered ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            <span className="font-bold text-sm">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`text-base md:text-lg font-semibold ${
                                isAnswered ? 'text-green-600' : 'text-gray-900'
                              }`}
                            >
                              {question.text}
                            </h3>
                            {isAnswered && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-xs text-green-600/80 mt-1"
                              >
                                ✓ Respondida
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedQuestion(isExpanded ? null : question.id);
                          }}
                          className="ml-2 p-2 hover:bg-gray-200/30 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      </div>

                      {/* Conteúdo da Questão (expansível) */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 space-y-4"
                          >
                            {/* SMILE Rating */}
                            {question.type === 'SMILE' && (
                              <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
                                {smileIcons.map((item, rating) => {
                                  const ratingValue = rating + 1;
                                  const isSelected = currentRating === ratingValue;
                                  return (
                                    <button
                                      key={ratingValue}
                                      type="button"
                                      onClick={() => updateAnswer(question.id, 'rating', ratingValue)}
                                      className={`flex flex-col items-center p-2 md:p-3 rounded-lg transition-all ${
                                        isSelected
                                          ? `${item.bgSelected} text-white scale-105`
                                          : 'bg-gray-200/50 hover:bg-gray-200/50'
                                      }`}
                                    >
                                      <FontAwesomeIcon
                                        icon={item.icon}
                                        className={`text-3xl md:text-4xl mb-1 ${
                                          isSelected ? 'text-white' : item.color
                                        }`}
                                      />
                                      <span
                                        className={`text-xs font-medium ${
                                          isSelected ? 'text-white' : item.color
                                        }`}
                                      >
                                        {item.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* SIMPLE_SMILE Rating */}
                            {question.type === 'SIMPLE_SMILE' && (
                              <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
                                {[
                                  {
                                    icon: faFaceFrown,
                                    label: 'Ruim',
                                    value: 1,
                                    color: 'text-red-500',
                                    bgSelected: 'bg-red-500',
                                  },
                                  {
                                    icon: faFaceMeh,
                                    label: 'Regular',
                                    value: 2,
                                    color: 'text-yellow-500',
                                    bgSelected: 'bg-yellow-500',
                                  },
                                  {
                                    icon: faFaceSmile,
                                    label: 'Bom',
                                    value: 3,
                                    color: 'text-lime-500',
                                    bgSelected: 'bg-lime-500',
                                  },
                                  {
                                    icon: faFaceGrinStars,
                                    label: 'Excelente',
                                    value: 4,
                                    color: 'text-green-500',
                                    bgSelected: 'bg-green-500',
                                  },
                                ].map((item) => {
                                  const isSelected = currentRating === item.value;
                                  return (
                                    <button
                                      key={item.value}
                                      type="button"
                                      onClick={() => updateAnswer(question.id, 'rating', item.value)}
                                      className={`flex flex-col items-center p-2 md:p-3 rounded-lg transition-all ${
                                        isSelected
                                          ? `${item.bgSelected} text-white scale-105`
                                          : 'bg-gray-200/50 hover:bg-gray-200/50'
                                      }`}
                                    >
                                      <FontAwesomeIcon
                                        icon={item.icon}
                                        className={`text-3xl md:text-4xl mb-1 ${
                                          isSelected ? 'text-white' : item.color
                                        }`}
                                      />
                                      <span
                                        className={`text-xs font-medium ${
                                          isSelected ? 'text-white' : item.color
                                        }`}
                                      >
                                        {item.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* TEXT_INPUT */}
                            {question.type === 'TEXT_INPUT' && (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Digite sua resposta aqui..."
                                  value={answer?.comment || ''}
                                  onChange={(e) => updateAnswer(question.id, 'comment', e.target.value)}
                                  className="min-h-[100px] text-sm md:text-base resize-none bg-white/50 border border-gray-300 text-gray-900 placeholder:text-gray-500"
                                  rows={4}
                                />
                                <p className="text-xs text-gray-500">💡 Escreva livremente sua opinião</p>
                              </div>
                            )}

                            {/* NPS Rating */}
                            {question.type === 'NPS' && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-6 md:grid-cols-11 gap-1 md:gap-2">
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
                                    const isSelected = currentRating === rating;

                                    let bgColor = '';
                                    let textColor = '';

                                    if (rating <= 6) {
                                      bgColor = isSelected ? 'bg-red-500' : 'bg-gray-200/50';
                                      textColor = isSelected ? 'text-white' : 'text-red-400';
                                    } else if (rating <= 8) {
                                      bgColor = isSelected ? 'bg-yellow-500' : 'bg-gray-200/50';
                                      textColor = isSelected ? 'text-gray-900' : 'text-yellow-400';
                                    } else {
                                      bgColor = isSelected ? 'bg-green-500' : 'bg-gray-200/50';
                                      textColor = isSelected ? 'text-white' : 'text-green-600';
                                    }

                                    return (
                                      <button
                                        key={rating}
                                        type="button"
                                        onClick={() => updateAnswer(question.id, 'rating', rating)}
                                        className={`p-2 md:p-3 rounded-md font-bold text-sm md:text-base transition-all ${bgColor} ${textColor} ${
                                          isSelected ? 'scale-105' : 'hover:bg-gray-200/50'
                                        }`}
                                      >
                                        {rating}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 px-1">
                                  <span>Muito Improvável</span>
                                  <span>Muito Provável</span>
                                </div>
                              </div>
                            )}

                            {/* SINGLE_CHOICE */}
                            {question.type === 'SINGLE_CHOICE' && (
                              <div className="space-y-2">
                                {question.options.map((option) => {
                                  const isSelected = answer?.selectedOptions.includes(option.id);
                                  const customColor = option.color || '#3b82f6';
                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => toggleOption(question.id, option.id, false)}
                                      style={{
                                        borderColor: customColor,
                                        borderWidth: isSelected ? '3px' : '2px',
                                        backgroundColor: isSelected ? `${customColor}30` : 'rgba(255,255,255,0.5)',
                                        boxShadow: isSelected ? `0 0 0 1px ${customColor}, inset 0 0 8px ${customColor}20` : 'none'
                                      }}
                                      className={`w-full text-left p-3 rounded-lg transition-all hover:opacity-90`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          style={{
                                            borderColor: customColor,
                                            backgroundColor: isSelected ? customColor : 'transparent'
                                          }}
                                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                        >
                                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                        </div>
                                        <span className="text-sm md:text-base font-medium text-gray-900">
                                          {option.text}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* MULTIPLE_CHOICE */}
                            {question.type === 'MULTIPLE_CHOICE' && (
                              <div className="space-y-2">
                                {question.options.map((option) => {
                                  const isSelected = answer?.selectedOptions.includes(option.id);
                                  const customColor = option.color || '#3b82f6';
                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => toggleOption(question.id, option.id, true)}
                                      style={{
                                        borderColor: customColor,
                                        borderWidth: isSelected ? '3px' : '2px',
                                        backgroundColor: isSelected ? `${customColor}30` : 'rgba(255,255,255,0.5)',
                                        boxShadow: isSelected ? `0 0 0 1px ${customColor}, inset 0 0 8px ${customColor}20` : 'none'
                                      }}
                                      className={`w-full text-left p-3 rounded-lg transition-all hover:opacity-90`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          style={{
                                            borderColor: customColor,
                                            backgroundColor: isSelected ? customColor : 'transparent'
                                          }}
                                          className="w-5 h-5 rounded border-2 flex items-center justify-center"
                                        >
                                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                        </div>
                                        <span className="text-sm md:text-base font-medium text-gray-900">
                                          {option.text}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* SCALE */}
                            {question.type === 'SCALE' && (
                              <div className="space-y-2">
                                <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
                                  {Array.from(
                                    { length: (question.scaleMax || 5) - (question.scaleMin || 1) + 1 },
                                    (_, i) => (question.scaleMin || 1) + i
                                  ).map((value) => {
                                    const isSelected = currentRating === value;
                                    return (
                                      <button
                                        key={value}
                                        type="button"
                                        onClick={() => updateAnswer(question.id, 'rating', value)}
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-md font-bold transition-all ${
                                          isSelected
                                            ? 'bg-blue-500 text-white scale-105'
                                            : 'bg-gray-200/50 text-blue-600 hover:bg-gray-200/50'
                                        }`}
                                      >
                                        {value}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 px-1">
                                  <span>{question.scaleMinLabel || question.scaleMin}</span>
                                  <span>{question.scaleMaxLabel || question.scaleMax}</span>
                                </div>
                              </div>
                            )}

                            {/* EMPLOYEE_RATING - Avaliação de Colaboradores */}
                            {question.type === 'EMPLOYEE_RATING' && question.options && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                  {question.options.map((opt) => {
                                    const isSelected = answer?.selectedOptions?.includes(opt.id);
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => updateAnswer(question.id, 'selectedOptions', [opt.id])}
                                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                                          isSelected
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:border-orange-300 bg-white'
                                        }`}
                                      >
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-2 overflow-hidden">
                                          {opt.imageUrl ? (
                                            <Image
                                              src={opt.imageUrl}
                                              alt={opt.text}
                                              width={64}
                                              height={64}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 text-gray-400 flex items-center justify-center text-xl">
                                              👤
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-xs font-medium text-center">
                                          {opt.text}
                                        </span>
                                        {isSelected && (
                                          <span className="text-[10px] text-orange-600 mt-1">✓ Selecionado</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Botão para avançar manualmente em MULTIPLE_CHOICE e TEXT_INPUT */}
                            {(question.type === 'MULTIPLE_CHOICE' || question.type === 'TEXT_INPUT') && (
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={!isAnswered}
                                  onClick={(e) => {
                                    e.stopPropagation(); // evita colapsar a questão
                                    goToNextQuestion(question.id);
                                  }}
                                  className="mt-2 text-xs md:text-sm"
                                >
                                  {getNextButtonText(question.id)}
                                </Button>
                              </div>
                            )}

                            {/* Comentário (não mostrar para TEXT_INPUT pois já é um campo aberto) */}
                            {question.type !== 'TEXT_INPUT' && question.allowOptionalComment && (
                              <div className="space-y-1">
                                <Label htmlFor={`comment-${question.id}`} className="text-xs text-gray-500">
                                  Comentário (opcional)
                                </Label>
                                <Textarea
                                  id={`comment-${question.id}`}
                                  placeholder="Deixe seu feedback aqui..."
                                  value={answer?.comment ?? ''}
                                  onChange={(e) => updateAnswer(question.id, 'comment', e.target.value)}
                                  rows={2}
                                  className="resize-none bg-white/50 border border-gray-300 text-gray-900 placeholder:text-gray-500 text-sm"
                                />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Texto LGPD */}
              {campaign?.lgpdText && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                    <p className="text-xs text-gray-600 leading-relaxed">{campaign.lgpdText}</p>
                  </div>
                </div>
              )}

              {/* Dados do Respondente (opcionais baseados na configuração) */}
              {(campaign?.collectName || campaign?.collectPhone || campaign?.collectEmail) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: answeredCount === totalQuestions ? 1 : 0.5 }}
                  className="space-y-3 pt-4 border-t border-gray-700/50"
                >
                  <h3 className="text-base font-semibold text-gray-900">Seus Dados (opcional)</h3>

                  {campaign?.collectName && (
                    <div className="space-y-1">
                      <Label htmlFor="respondentName" className="text-sm text-gray-600">
                        Nome
                      </Label>
                      <Input
                        id="respondentName"
                        type="text"
                        placeholder="Seu nome completo"
                        value={respondentName}
                        onChange={(e) => setRespondentName(e.target.value)}
                        className="bg-white/50 border-gray-300 text-gray-900 placeholder:text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  {campaign?.collectPhone && (
                    <div className="space-y-1">
                      <Label htmlFor="respondentPhone" className="text-sm text-gray-600">
                        Telefone
                      </Label>
                      <Input
                        id="respondentPhone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={respondentPhone}
                        onChange={handlePhoneChange}
                        className="bg-white/50 border-gray-300 text-gray-900 placeholder:text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  {campaign?.collectEmail && (
                    <div className="space-y-1">
                      <Label htmlFor="respondentEmail" className="text-sm text-gray-600">
                        Email
                      </Label>
                      <Input
                        id="respondentEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={respondentEmail}
                        onChange={(e) => setRespondentEmail(e.target.value)}
                        className="bg-white/50 border-gray-300 text-gray-900 placeholder:text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Esses dados são opcionais e nos ajudam a entrar em contato caso necessário.
                  </p>
                </motion.div>
              )}

              {/* Botão Enviar - Só aparece quando todas questões forem respondidas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: answeredCount === totalQuestions ? 1 : 0.5,
                  y: 0,
                }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg"
                  disabled={submitting || answeredCount < totalQuestions}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : answeredCount === totalQuestions ? (
                    'Enviar Respostas'
                  ) : (
                    `Responda todas as perguntas (${answeredCount}/${totalQuestions})`
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}