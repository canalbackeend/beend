'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceAngry, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrinStars } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  type: string;
  order: number;
  options?: Array<{ id: string; text: string }>;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

interface TerminalSession {
  terminal: { id: string; name: string; email: string };
  user: { name: string; companyName: string };
  campaign: {
    id: string;
    title: string;
    questions: Question[];
  };
}

export default function TerminalSurveyPage() {
  const router = useRouter();
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; comment?: string }>>({});
  const [currentAnswer, setCurrentAnswer] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [timer, setTimer] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [versionClickCount, setVersionClickCount] = useState(0);

  // Carregar sessão
  useEffect(() => {
    const sessionData = localStorage.getItem('terminalSession');
    if (!sessionData) {
      router.push('/terminal/login');
      return;
    }
    
    const parsedSession: TerminalSession = JSON.parse(sessionData);
    setSession(parsedSession);
  }, [router]);

  // Cronômetro regressivo
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Resetar timer ao tocar na tela
  const resetTimer = useCallback(() => {
    setTimer(60);
  }, []);

  useEffect(() => {
    const handleClick = () => resetTimer();
    const handleTouch = () => resetTimer();
    
    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleTouch);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [resetTimer]);

  const handleTimeout = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setComment('');
    toast.info('Pesquisa reiniciada por inatividade');
  };

  const handleVersionClick = () => {
    const newCount = versionClickCount + 1;
    setVersionClickCount(newCount);
    
    if (newCount >= 6) {
      // Easter egg: deslogar após 6 cliques
      localStorage.removeItem('terminalSession');
      toast.success('Sessão encerrada');
      router.push('/terminal/login');
    }
  };

  const currentQuestion = session?.campaign.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (session?.campaign.questions.length || 0) - 1;
  const isMultipleChoice = currentQuestion?.type === 'MULTIPLE_CHOICE';

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;

    // Para múltipla escolha, apenas marcar/desmarcar
    if (isMultipleChoice) {
      setCurrentAnswer((prev) => {
        if (prev.includes(value)) {
          return prev.filter((v) => v !== value);
        }
        return [...prev, value];
      });
      return;
    }

    // Para outros tipos, avançar automaticamente
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: {
        answer: value,
        comment: comment || undefined,
      },
    };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      submitSurvey(newAnswers);
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setCurrentAnswer([]);
        setComment('');
      }, 300);
    }
  };

  const handleConfirmMultipleChoice = () => {
    if (!currentQuestion || currentAnswer.length === 0) {
      toast.error('Selecione pelo menos uma opção');
      return;
    }

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: {
        answer: currentAnswer.join(', '),
        comment: comment || undefined,
      },
    };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      submitSurvey(newAnswers);
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setCurrentAnswer([]);
        setComment('');
      }, 300);
    }
  };

  const submitSurvey = async (finalAnswers: Record<string, { answer: string; comment?: string }>) => {
    if (!session || isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const responses = Object.entries(finalAnswers).map(([questionId, data]) => ({
        questionId,
        answerText: data.answer,
        comment: data.comment,
      }));

      const response = await fetch('/api/terminal/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terminalId: session.terminal.id,
          campaignId: session.campaign.id,
          responses,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar respostas');
      }

      router.push('/terminal/thankyou');
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Erro ao enviar respostas. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Carregando...</div>
      </div>
    );
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'SMILE':
        return (
          <div className="flex flex-row justify-center items-center gap-3 sm:gap-4 md:gap-5 px-4 flex-wrap">
            {[
              { icon: faFaceGrinStars, label: 'EXCELENTE', color: 'text-green-500', value: 'Excelente' },
              { icon: faFaceSmile, label: 'BOM', color: 'text-yellow-500', value: 'Bom' },
              { icon: faFaceFrown, label: 'RUIM', color: 'text-red-500', value: 'Ruim' },
              { icon: faFaceAngry, label: 'PÉSSIMO', color: 'text-purple-500', value: 'Péssimo' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:bg-gray-800/50 active:scale-95"
              >
                <div className={`text-6xl sm:text-7xl md:text-8xl ${option.color}`}>
                  <FontAwesomeIcon icon={option.icon} />
                </div>
                <span className="text-white text-sm sm:text-base md:text-lg font-bold tracking-wide">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        );

      case 'SIMPLE_SMILE':
        return (
          <div className="flex flex-row justify-center items-center gap-4 sm:gap-6 md:gap-8 px-4 flex-wrap">
            {[
              { emoji: '😢', label: 'RUIM', bg: 'bg-red-600', hover: 'hover:bg-red-700', value: '1' },
              { emoji: '😐', label: 'REGULAR', bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', value: '2' },
              { emoji: '🙂', label: 'BOM', bg: 'bg-lime-500', hover: 'hover:bg-lime-600', value: '3' },
              { emoji: '😄', label: 'EXCELENTE', bg: 'bg-green-600', hover: 'hover:bg-green-700', value: '4' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`flex flex-col items-center gap-3 p-5 sm:p-6 md:p-8 rounded-3xl transition-all ${option.bg} ${option.hover} active:scale-95 shadow-2xl`}
              >
                <div className="text-7xl sm:text-8xl md:text-9xl">
                  {option.emoji}
                </div>
                <span className="text-white text-sm sm:text-base md:text-xl font-black tracking-wider">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        );

      case 'TEXT_INPUT':
        return (
          <div className="flex flex-col gap-4 max-w-3xl w-full px-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Digite sua resposta aqui..."
              className="w-full min-h-[200px] p-6 rounded-xl bg-gray-800 text-white text-lg border-2 border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
              rows={6}
            />
            <p className="text-gray-400 text-sm text-center">
              💡 Escreva livremente sua opinião
            </p>
            <Button
              onClick={() => {
                if (comment.trim()) {
                  handleAnswer('texto');
                }
              }}
              disabled={!comment.trim()}
              className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 uppercase"
            >
              Confirmar Resposta
            </Button>
          </div>
        );

      case 'NPS':
        const npsButtons = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const getColorClass = (num: number) => {
          if (num <= 6) return 'bg-red-600 hover:bg-red-700';
          if (num <= 8) return 'bg-yellow-500 hover:bg-yellow-600';
          return 'bg-green-600 hover:bg-green-700';
        };
        
        return (
          <div className="flex flex-col gap-4 items-center px-6">
            {/* Primeira linha: 0-5 */}
            <div className="flex gap-2 sm:gap-3 justify-center">
              {npsButtons.slice(0, 6).map((num) => (
                <button
                  key={num}
                  onClick={() => handleAnswer(num.toString())}
                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg ${getColorClass(num)} text-white text-xl sm:text-2xl md:text-3xl font-bold transition-all active:scale-95 shadow-lg`}
                >
                  {num}
                </button>
              ))}
            </div>
            
            {/* Segunda linha: 6-10 */}
            <div className="flex gap-2 sm:gap-3 justify-center">
              {npsButtons.slice(6).map((num) => (
                <button
                  key={num}
                  onClick={() => handleAnswer(num.toString())}
                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg ${getColorClass(num)} text-white text-xl sm:text-2xl md:text-3xl font-bold transition-all active:scale-95 shadow-lg`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        );

      case 'SINGLE_CHOICE':
        return (
          <div className="flex flex-col gap-3 max-w-2xl w-full px-6">
            {currentQuestion.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.text)}
                className="p-5 rounded-xl bg-gray-800 hover:bg-blue-600 text-white text-base sm:text-lg transition-all active:scale-98 text-left border-2 border-transparent hover:border-blue-400"
              >
                {option.text}
              </button>
            ))}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        return (
          <div className="flex flex-col gap-4 max-w-2xl w-full px-6">
            <div className="flex flex-col gap-3">
              {currentQuestion.options?.map((option) => {
                const isSelected = currentAnswer.includes(option.text);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.text)}
                    className={`p-5 rounded-xl text-white text-base sm:text-lg transition-all active:scale-98 text-left border-2 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-400'
                        : 'bg-gray-800 border-transparent hover:bg-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-white border-white' : 'border-gray-400'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Botão Confirmar */}
            <Button
              onClick={handleConfirmMultipleChoice}
              disabled={currentAnswer.length === 0}
              className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 uppercase"
            >
              Confirmar Resposta{currentAnswer.length > 0 && ` (${currentAnswer.length})`}
            </Button>
          </div>
        );

      case 'SCALE':
        const min = currentQuestion.scaleMin || 1;
        const max = currentQuestion.scaleMax || 5;
        const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        
        // Função para gerar cores progressivas lineares
        const getScaleColor = (index: number, total: number) => {
          if (total === 2) {
            // Para 2 opções: vermelho e verde
            return index === 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
          }
          
          // Calcular porcentagem de 0 a 1
          const percentage = index / (total - 1);
          
          // Degradê linear: vermelho → laranja → amarelo → verde
          if (percentage <= 0.2) {
            // 0-20%: Vermelho escuro
            return 'bg-red-700 hover:bg-red-800';
          } else if (percentage <= 0.35) {
            // 20-35%: Vermelho
            return 'bg-red-600 hover:bg-red-700';
          } else if (percentage <= 0.5) {
            // 35-50%: Laranja
            return 'bg-orange-500 hover:bg-orange-600';
          } else if (percentage <= 0.65) {
            // 50-65%: Amarelo
            return 'bg-yellow-400 hover:bg-yellow-500';
          } else if (percentage <= 0.8) {
            // 65-80%: Amarelo-verde
            return 'bg-lime-400 hover:bg-lime-500';
          } else if (percentage <= 0.9) {
            // 80-90%: Verde claro
            return 'bg-green-500 hover:bg-green-600';
          } else {
            // 90-100%: Verde escuro
            return 'bg-green-600 hover:bg-green-700';
          }
        };
        
        return (
          <div className="flex flex-col gap-6 max-w-2xl w-full px-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {numbers.map((num, index) => (
                <button
                  key={num}
                  onClick={() => handleAnswer(num.toString())}
                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl text-white text-lg sm:text-xl md:text-2xl font-bold transition-all active:scale-95 shadow-lg ${getScaleColor(index, numbers.length)}`}
                >
                  {num}
                </button>
              ))}
            </div>
            {(currentQuestion.scaleMinLabel || currentQuestion.scaleMaxLabel) && (
              <div className="flex justify-between text-gray-400 text-xs sm:text-sm px-2">
                <span>{currentQuestion.scaleMinLabel || ''}</span>
                <span>{currentQuestion.scaleMaxLabel || ''}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Conteúdo Principal */}
      <div className="flex-grow flex flex-col items-center justify-start py-12 px-6 sm:px-8 mt-16">
        {/* Pergunta */}
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 max-w-4xl uppercase leading-tight">
          {currentQuestion.text}
        </h1>

        {/* Opções de Resposta */}
        {renderQuestion()}

        {/* Comentário (opcional) - removido para simplificar */}
      </div>

      {/* Rodapé Fixo */}
      <div className="bg-gray-900 border-t border-gray-800 py-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-white text-xs sm:text-sm font-mono">
          <span className="uppercase font-bold">
            {session.user.companyName.toUpperCase()}
          </span>
          <span className="uppercase">
            {session.terminal.name.toUpperCase()}
          </span>
          <span 
            className="uppercase text-gray-400 select-none touch-manipulation outline-none"
            onClick={handleVersionClick}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            VER: 1.7.8
          </span>
          <span className={`font-bold ${
            timer <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-500'
          }`}>
            TEMPO {String(Math.floor(timer / 60)).padStart(1, '0')}:{String(timer % 60).padStart(2, '0')} SEGUNDOS
          </span>
        </div>
      </div>
    </div>
  );
}
