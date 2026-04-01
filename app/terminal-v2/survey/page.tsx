'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LogOut, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFaceSadTear,
  faFaceFrown,
  faFaceMeh,
  faFaceSmile,
  faFaceGrin,
} from '@fortawesome/free-solid-svg-icons';

interface Question {
  id: string;
  text: string;
  type: string;
  order: number;
  isRequired: boolean;
  allowOptionalComment: boolean;
  options?: { id: string; text: string; color?: string; imageUrl?: string }[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

interface TerminalSession {
  terminalId: string;
  terminalName: string;
  campaignId: string;
  campaignTitle: string;
  campaignDescription: string | null;
  questions: Question[];
  lgpdText: string | null;
  collectName: boolean;
  collectPhone: boolean;
  collectEmail: boolean;
  userId: string;
  userEmail: string;
  userName: string;
  companyLogo: string | null;
  timestamp: number;
}

export default function TerminalV2SurveyPage() {
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [comments, setComments] = useState<{ [questionId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60);
  const [logoutClicks, setLogoutClicks] = useState(0);
  const [showRespondentDataScreen, setShowRespondentDataScreen] = useState(false);
  const [respondentName, setRespondentName] = useState('');
  const [respondentPhone, setRespondentPhone] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [savedResponseId, setSavedResponseId] = useState<string | null>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('theme');
      localStorage.removeItem('color-scheme');
    }
    
    const terminalSession = localStorage.getItem('terminalSession');
    const savedSessionV2 = localStorage.getItem('terminalSessionV2');
    const selectedCampaign = localStorage.getItem('selectedCampaign');
    
    if (savedSessionV2) {
      const parsedSession: TerminalSession = JSON.parse(savedSessionV2);
      setSession(parsedSession);
      return;
    }
    
    if (terminalSession && selectedCampaign) {
      const terminal = JSON.parse(terminalSession);
      const campaign = JSON.parse(selectedCampaign);
      
      fetch(`/api/terminals/${terminal.terminalId}/campaigns`)
        .then(res => res.json())
        .then(data => {
          const tc = data.find((c: any) => c.id === campaign.terminalCampaignId);
          if (tc) {
            const newSession: TerminalSession = {
              terminalId: terminal.terminalId,
              terminalName: terminal.terminalName,
              campaignId: tc.campaign.id,
              campaignTitle: tc.customTitle || tc.campaign.title,
              campaignDescription: tc.campaign.description,
              questions: tc.campaign.questions,
              lgpdText: tc.campaign.lgpdText,
              collectName: tc.campaign.collectName,
              collectPhone: tc.campaign.collectPhone,
              collectEmail: tc.campaign.collectEmail,
              userId: terminal.userId,
              userEmail: terminal.userEmail,
              userName: terminal.userName,
              companyLogo: terminal.companyLogo,
              timestamp: Date.now(),
            };
            setSession(newSession);
            localStorage.setItem('terminalSessionV2', JSON.stringify(newSession));
          } else {
            toast.error('Campanha não encontrada');
            router.push('/terminal-v2/select-campaign');
          }
        })
        .catch(err => {
          console.error('Error fetching campaign:', err);
          toast.error('Erro ao carregar campanha');
          router.push('/terminal-v2/login');
        });
      return;
    }
    
    toast.error('Sessão expirada. Faça login novamente.');
    router.push('/terminal-v2/login');
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          handleResetSurvey();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleScreenTouch = () => {
    setRemainingTime(60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVersionClick = () => {
    setLogoutClicks((prev) => prev + 1);
    if (logoutClicks + 1 >= 5) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('terminalSessionV2');
    toast.info('Sessão encerrada');
    router.push('/terminal-v2/login');
  };

  const handleResetSurvey = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setComments({});
    setShowRespondentDataScreen(false);
    setRespondentName('');
    setRespondentPhone('');
    setRespondentEmail('');
    setSavedResponseId(null);
    setSurveyCompleted(false);
    setRemainingTime(60);
  };

  const shouldShowAdvanceButton = (question: Question): boolean => {
    if (question.type === 'MULTIPLE_CHOICE') return true;
    if (question.allowOptionalComment) return true;
    if (question.type === 'TEXT_INPUT') return true;
    return false;
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    
    if (session) {
      const currentQuestion = session.questions[currentQuestionIndex];
      if (currentQuestion && !shouldShowAdvanceButton(currentQuestion)) {
        setTimeout(() => {
          if (currentQuestionIndex < session.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
          } else {
            saveSurveyAnswers();
          }
        }, 300);
      }
    }
  };

  const handleComment = (questionId: string, comment: string) => {
    setComments((prev) => ({ ...prev, [questionId]: comment }));
  };

  const isQuestionAnswered = (question: Question): boolean => {
    const value = answers[question.id];
    const comment = comments[question.id];
    
    if (question.type === 'SMILE' || question.type === 'SIMPLE_SMILE' || 
        question.type === 'NPS' || question.type === 'SCALE') {
      return value !== undefined && value !== null;
    } else if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE' || 
               question.type === 'EMPLOYEE_RATING') {
      return Array.isArray(value) && value.length > 0;
    } else if (question.type === 'TEXT_INPUT') {
      return typeof value === 'string' && value.trim() !== '';
    }
    
    return false;
  };

  const handleNext = async () => {
    if (!session) return;

    const currentQuestion = session.questions[currentQuestionIndex];
    
    if (currentQuestion.isRequired && !isQuestionAnswered(currentQuestion)) {
      toast.error('Por favor, responda a pergunta antes de continuar');
      return;
    }

    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      await saveSurveyAnswers();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const saveSurveyAnswers = async () => {
    if (!session) return;

    setLoading(true);
    
    try {
      const formattedAnswers = session.questions.map((q) => {
        const value = answers[q.id];
        const comment = comments[q.id];

        const answer: any = {
          questionId: q.id,
          rating: null,
          selectedOptions: [],
          comment: comment || null,
        };

        if (q.type === 'SMILE' || q.type === 'SIMPLE_SMILE' || q.type === 'NPS' || q.type === 'SCALE') {
          answer.rating = value !== undefined && value !== null ? Number(value) : null;
        } else if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE' || q.type === 'EMPLOYEE_RATING') {
          answer.selectedOptions = value || [];
        } else if (q.type === 'TEXT_INPUT') {
          answer.comment = value || '';
        }

        return answer;
      });

      console.log('Sending answers:', JSON.stringify(formattedAnswers));

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: session.campaignId,
          terminalId: session.terminalId,
          answers: formattedAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar respostas');
      }

      const data = await response.json();
      setSavedResponseId(data.id);
      setSurveyCompleted(true);

      const shouldCollectData = session.collectName || session.collectPhone || session.collectEmail;
      if (shouldCollectData) {
        setShowRespondentDataScreen(true);
      } else {
        router.push('/terminal-v2/thankyou');
      }
    } catch (error) {
      console.error('Save survey error:', error);
      toast.error('Erro ao enviar respostas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const saveContactInfo = async () => {
    if (!savedResponseId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/responses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: savedResponseId,
          respondentName: respondentName || null,
          respondentPhone: respondentPhone || null,
          respondentEmail: respondentEmail || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar dados de contato');
      }

      toast.success('Dados salvos com sucesso!');
      router.push('/terminal-v2/thankyou');
    } catch (error) {
      console.error('Save contact info error:', error);
      toast.error('Erro ao salvar dados de contato. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const skipContactInfo = () => {
    router.push('/terminal-v2/thankyou');
  };

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);
    
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 3) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 7) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 3)} ${limitedNumbers.slice(3)}`;
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 3)} ${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setRespondentPhone(formatted);
  };

  const renderRespondentDataScreen = () => {
    if (!session) return null;

    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="w-12 h-12 sm:w-14 sm:h-14 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Pesquisa Enviada com Sucesso! 🎉
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            Quer receber atualizações? (Opcional)
          </p>
          {session.lgpdText && (
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 px-4">
              {session.lgpdText}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {session.collectName && (
            <div className="space-y-2">
              <Label htmlFor="respondentName" className="text-base sm:text-lg">
                Nome
              </Label>
              <Input
                id="respondentName"
                type="text"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Digite seu nome (opcional)"
                className="h-12 sm:h-14 text-base sm:text-lg"
              />
            </div>
          )}

          {session.collectPhone && (
            <div className="space-y-2">
              <Label htmlFor="respondentPhone" className="text-base sm:text-lg">
                Telefone
              </Label>
              <Input
                id="respondentPhone"
                type="tel"
                value={respondentPhone}
                onChange={handlePhoneChange}
                placeholder="(00) 0 0000-0000"
                className="h-12 sm:h-14 text-base sm:text-lg"
              />
            </div>
          )}

          {session.collectEmail && (
            <div className="space-y-2">
              <Label htmlFor="respondentEmail" className="text-base sm:text-lg">
                E-mail
              </Label>
              <Input
                id="respondentEmail"
                type="email"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                placeholder="Digite seu e-mail (opcional)"
                className="h-12 sm:h-14 text-base sm:text-lg"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    if (!session) return null;

    const question = session.questions[currentQuestionIndex];
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'SMILE':
        const smileOptions = [
          { value: 5, icon: faFaceGrin, label: 'Muito Satisfeito', color: 'text-green-600' },
          { value: 4, icon: faFaceSmile, label: 'Satisfeito', color: 'text-lime-600' },
          { value: 3, icon: faFaceMeh, label: 'Regular', color: 'text-yellow-600' },
          { value: 2, icon: faFaceFrown, label: 'Insatisfeito', color: 'text-orange-600' },
          { value: 1, icon: faFaceSadTear, label: 'Muito Insatisfeito', color: 'text-red-600' },
        ];

        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {smileOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(question.id, option.value)}
                  className={`
                    flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 border-2 transition-all
                    hover:scale-105 active:scale-95
                    ${
                      currentAnswer === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <FontAwesomeIcon
                    icon={option.icon}
                    className={`text-4xl sm:text-5xl lg:text-7xl mb-2 sm:mb-3 ${option.color}`}
                  />
                  <span className="text-xs sm:text-sm lg:text-base font-semibold text-center leading-tight">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'SIMPLE_SMILE':
        const simpleSmileOptions = [
          { value: 4, icon: faFaceGrin, label: 'Excelente', color: 'text-green-600' },
          { value: 3, icon: faFaceSmile, label: 'Bom', color: 'text-lime-600' },
          { value: 2, icon: faFaceMeh, label: 'Regular', color: 'text-yellow-600' },
          { value: 1, icon: faFaceFrown, label: 'Ruim', color: 'text-red-600' },
        ];

        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              {simpleSmileOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(question.id, option.value)}
                  className={`
                    flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 border-2 transition-all
                    hover:scale-105 active:scale-95
                    ${
                      currentAnswer === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <FontAwesomeIcon
                    icon={option.icon}
                    className={`text-4xl sm:text-5xl lg:text-7xl mb-2 sm:mb-3 ${option.color}`}
                  />
                  <span className="text-xs sm:text-sm lg:text-base font-semibold text-center leading-tight">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'NPS':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-6 md:grid-cols-11 gap-1.5 sm:gap-2">
              {Array.from({ length: 11 }, (_, i) => i).map((num) => {
                let bgColor = 'bg-red-500';
                if (num <= 6) bgColor = 'bg-red-500';
                else if (num <= 8) bgColor = 'bg-yellow-500';
                else bgColor = 'bg-green-500';

                return (
                  <button
                    key={num}
                    onClick={() => handleAnswer(question.id, num)}
                    className={`
                      aspect-square flex items-center justify-center transition-all
                      text-base sm:text-lg md:text-xl font-bold text-white hover:scale-105 active:scale-95
                      ${
                        currentAnswer === num
                          ? 'ring-2 sm:ring-4 ring-blue-500 scale-105'
                          : ''
                      }
                      ${bgColor}
                    `}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
              <span>Nada provável</span>
              <span>Muito provável</span>
            </div>
          </div>
        );

      case 'SCALE':
        const min = question.scaleMin || 1;
        const max = question.scaleMax || 10;
        const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

        return (
          <div className="space-y-6">
            <div className="flex justify-center flex-wrap gap-2">
              {range.map((num) => (
                <button
                  key={num}
                  onClick={() => handleAnswer(question.id, num)}
                  className={`
                    aspect-square w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border-2 transition-all
                    text-xl sm:text-2xl font-bold hover:scale-105 active:scale-95
                    ${
                      currentAnswer === num
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 scale-105'
                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
            {(question.scaleMinLabel || question.scaleMaxLabel) && (
              <div className="flex justify-between text-sm text-muted-foreground dark:text-gray-400">
                <span>{question.scaleMinLabel || min}</span>
                <span>{question.scaleMaxLabel || max}</span>
              </div>
            )}
          </div>
        );

      case 'SINGLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const isSelected = currentAnswer && currentAnswer.includes(option.id);
              const customColor = option.color || '#3b82f6';
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(question.id, [option.id])}
                  style={{
                    borderColor: isSelected ? customColor : '#e5e7eb',
                    color: isSelected ? customColor : 'inherit'
                  }}
                  className="w-full p-5 border-2 transition-all text-left hover:scale-[1.01] active:scale-[0.99] bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        borderColor: customColor,
                        backgroundColor: isSelected ? customColor : 'transparent'
                      }}
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    >
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-lg font-medium">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        const selectedOptions = currentAnswer || [];
        return (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const isSelected = (selectedOptions as string[]).includes(option.id);
              const customColor = option.color || '#3b82f6';
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    const newSelection = isSelected
                      ? (selectedOptions as string[]).filter((o) => o !== option.id)
                      : [...(selectedOptions as string[]), option.id];
                    handleAnswer(question.id, newSelection);
                  }}
                  style={{
                    borderColor: isSelected ? customColor : '#e5e7eb',
                    color: isSelected ? customColor : 'inherit'
                  }}
                  className="w-full p-5 border-2 transition-all text-left hover:scale-[1.01] active:scale-[0.99] bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        borderColor: customColor,
                        backgroundColor: isSelected ? customColor : 'transparent'
                      }}
                      className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-lg font-medium">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'TEXT_INPUT':
        return (
          <div className="space-y-4">
            <Textarea
              value={currentAnswer || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              placeholder="Digite sua resposta aqui..."
              className="min-h-[200px] text-lg resize-none"
              style={{ background: '#374151', border: '2px #60a5fa solid', color: '#f3f4f6' }}
              maxLength={1000}
            />
            <div className="text-sm text-gray-400 text-right">
              {(currentAnswer || '').length} / 1000 caracteres
            </div>
          </div>
        );

      case 'EMPLOYEE_RATING':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {question.options?.map((option) => {
                const isSelected = currentAnswer && currentAnswer.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(question.id, [option.id])}
                    className={`
                      flex flex-col items-center p-4 border-2 transition-all
                      hover:scale-105 active:scale-95
                      ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950 scale-105'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-3 overflow-hidden">
                      {option.imageUrl ? (
                        <Image
                          src={option.imageUrl}
                          alt={option.text}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 text-gray-400 flex items-center justify-center text-3xl">
                          👤
                        </div>
                      )}
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-center">
                      {option.text}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-orange-600 mt-1">✓ Selecionado</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <div 
      className="min-h-screen flex flex-col bg-background"
      onClick={handleScreenTouch}
      onTouchStart={handleScreenTouch}
    >
      <header className="bg-background">
        <div className="h-4"></div>
      </header>

      <main className="flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl h-[calc(100vh-200px)] overflow-y-auto">
        <div className="bg-background mb-[6.5rem]">
          <div className="p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="space-y-6 sm:space-y-8">
              {showRespondentDataScreen ? (
                <>
                  {renderRespondentDataScreen()}
                  <div className="flex gap-2 sm:gap-4 pt-3 sm:pt-4">
                    <Button
                      variant="outline"
                      onClick={skipContactInfo}
                      className="flex-1 h-12 sm:h-14 text-base sm:text-lg"
                      disabled={loading}
                    >
                      Não, obrigado
                    </Button>
                    <Button
                      onClick={saveContactInfo}
                      className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Salvando...' : 'Enviar meus dados'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-5xl font-bold mb-6 sm:mb-8 text-center px-2">
                      {currentQuestion.text}
                      {currentQuestion.isRequired && (
                        <span className="text-red-500 ml-2">*</span>
                      )}
                    </h2>
                    {renderQuestion()}
                  </div>

                  {currentQuestion.type !== 'TEXT_INPUT' && currentQuestion.allowOptionalComment && (
                    <div className="space-y-2">
                      <Label className="text-base">Comentário (opcional)</Label>
                      <Textarea
                        value={comments[currentQuestion.id] || ''}
                        onChange={(e) => handleComment(currentQuestion.id, e.target.value)}
                        placeholder="Deixe um comentário adicional..."
                        className="resize-none"
                        style={{ background: '#374151', border: '2px #60a5fa solid', color: '#f3f4f6' }}
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                  )}

                  {shouldShowAdvanceButton(currentQuestion) && (
                    <div className="flex gap-2 sm:gap-4 pt-3 sm:pt-4">
                      {currentQuestionIndex > 0 && (
                        <Button
                          variant="outline"
                          onClick={handleBack}
                          className="flex-1 h-12 sm:h-14 text-base sm:text-lg"
                          disabled={loading}
                        >
                          Voltar
                        </Button>
                      )}
                      <Button
                        onClick={handleNext}
                        className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold"
                        disabled={loading || (currentQuestion.isRequired && !isQuestionAnswered(currentQuestion))}
                      >
                        {loading
                          ? 'Salvando...'
                          : currentQuestionIndex === session.questions.length - 1
                          ? 'Continuar'
                          : 'Avançar'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 z-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground dark:text-gray-400">
                <span>
                  Pergunta {currentQuestionIndex + 1} de {session.questions.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative w-24 sm:w-32 h-6">
                  <Image
                    src="/logo-dark.png"
                    alt="Back&end Logo"
                    fill
                    className="object-contain"
                    quality={100}
                  />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {session.terminalName}
                </span>
                <button
                  onClick={handleVersionClick}
                  className="text-xs text-gray-400 outline-none"
                  style={{ outline: 'none' }}
                >
                  v2.0
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatTime(remainingTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}