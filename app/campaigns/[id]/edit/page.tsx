'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, GripVertical, Upload, AlertTriangle, FileText } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceAngry, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrinStars, faFaceSadTear, faFaceGrin, faChartBar, faCircle, faSquareCheck, faRulerHorizontal, faPenToSquare, faUser } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Importações do dnd-kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuestionOption {
  text: string;
  color?: string;
  imageUrl?: string;
}

interface Question {
  id?: string;
  text: string;
  type: 'SMILE' | 'SIMPLE_SMILE' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT_INPUT' | 'EMPLOYEE_RATING';
  isRequired: boolean;
  allowOptionalComment: boolean;
  options: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  order?: number;
}

interface CampaignData {
  id: string;
  title: string;
  description: string;
  lgpdText: string | null;
  collectName: boolean;
  collectPhone: boolean;
  collectEmail: boolean;
  questions: Question[];
  _count?: {
    responses: number;
  };
}

// Componente para o item arrastável
interface SortableQuestionItemProps {
  question: Question;
  qIndex: number;
  questions: Question[];
  updateQuestion: (index: number, field: keyof Question, value: any) => void;
  removeQuestion: (index: number) => void;
  addOption: (questionIndex: number) => void;
  removeOption: (questionIndex: number, optionIndex: number) => void;
  updateOption: (questionIndex: number, optionIndex: number, text: string) => void;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  handleImageUpload: (qIndex: number, oIndex: number, file: File) => void;
  uploadingImage: {qIndex: number, oIndex: number} | null;
  smileIcons: Array<{icon: any, label: string, color: string}>;
}

function SortableQuestionItem({
  question,
  qIndex,
  questions,
  updateQuestion,
  removeQuestion,
  addOption,
  removeOption,
  updateOption,
  setQuestions,
  handleImageUpload,
  uploadingImage,
  smileIcons,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `question-${qIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border-2 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div
              {...attributes}
              {...listeners}
              className="w-5 h-5 text-muted-foreground mt-2 cursor-grab active:cursor-grabbing hover:text-foreground transition-colors"
            >
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                  {qIndex + 1}
                </span>
                <Input
                  value={question.text}
                  onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                  placeholder="Digite sua pergunta..."
                  className="flex-1"
                />
              </div>

              <div className="ml-8 space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="text-sm">Tipo de resposta:</Label>
                  <Select
                    value={question.type}
                    onValueChange={(v: 'SMILE' | 'SIMPLE_SMILE' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT_INPUT' | 'EMPLOYEE_RATING') =>
                      updateQuestion(qIndex, 'type', v)
                    }
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMILE">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faFaceSmile} className="text-green-500" />
                          Smile (5 Emojis)
                        </div>
                      </SelectItem>
                      <SelectItem value="SIMPLE_SMILE">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faFaceSmile} className="text-blue-500" />
                          Smile Simples (4 opções)
                        </div>
                      </SelectItem>
                      <SelectItem value="NPS">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faChartBar} className="text-blue-600" />
                          NPS (0 a 10)
                        </div>
                      </SelectItem>
                      <SelectItem value="SINGLE_CHOICE">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCircle} className="text-red-500" />
                          Escolha Única
                        </div>
                      </SelectItem>
                      <SelectItem value="MULTIPLE_CHOICE">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faSquareCheck} className="text-green-600" />
                          Múltipla Escolha
                        </div>
                      </SelectItem>
                      <SelectItem value="SCALE">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faRulerHorizontal} className="text-indigo-600" />
                          Escala Personalizada
                        </div>
                      </SelectItem>
                      <SelectItem value="TEXT_INPUT">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faPenToSquare} className="text-purple-600" />
                          Texto Aberto
                        </div>
                      </SelectItem>
                      <SelectItem value="EMPLOYEE_RATING">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-orange-500" />
                          Avaliação de Colaborador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`required-${qIndex}`}
                    checked={question.isRequired || question.type === 'SMILE' || question.type === 'SIMPLE_SMILE' || question.type === 'EMPLOYEE_RATING'}
                    onChange={(e) => updateQuestion(qIndex, 'isRequired', e.target.checked)}
                    disabled={question.type === 'SMILE' || question.type === 'SIMPLE_SMILE' || question.type === 'EMPLOYEE_RATING'}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Label htmlFor={`required-${qIndex}`} className={`text-sm ${question.type === 'SMILE' || question.type === 'SIMPLE_SMILE' || question.type === 'EMPLOYEE_RATING' ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}>
                    Resposta obrigatória
                    {(question.type === 'SMILE' || question.type === 'SIMPLE_SMILE' || question.type === 'EMPLOYEE_RATING') && (
                      <span className="ml-1 text-xs">(sempre obrigatório)</span>
                    )}
                  </Label>
                </div>

                {question.type !== 'TEXT_INPUT' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`comment-${qIndex}`}
                      checked={question.allowOptionalComment}
                      onChange={(e) => updateQuestion(qIndex, 'allowOptionalComment', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`comment-${qIndex}`} className="text-sm cursor-pointer">
                      Permitir comentário opcional
                    </Label>
                  </div>
                )}

                {/* Preview do tipo */}
                {question.type === 'SMILE' && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg">
                    <Label className="text-sm text-muted-foreground mb-3 block">Preview:</Label>
                    <div className="flex justify-center gap-4">
                      {[
                        { icon: faFaceAngry, label: 'Muito Insatisfeito', color: 'text-red-500' },
                        { icon: faFaceFrown, label: 'Insatisfeito', color: 'text-orange-500' },
                        { icon: faFaceMeh, label: 'Regular', color: 'text-yellow-500' },
                        { icon: faFaceSmile, label: 'Satisfeito', color: 'text-lime-500' },
                        { icon: faFaceGrinStars, label: 'Muito Satisfeito', color: 'text-green-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <FontAwesomeIcon icon={item.icon} className={`text-4xl ${item.color}`} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === 'SIMPLE_SMILE' && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg">
                    <Label className="text-sm text-muted-foreground mb-3 block">Preview:</Label>
                    <div className="flex justify-center gap-4">
                      {[
                        { icon: faFaceSadTear, label: 'Ruim', color: 'text-red-500' },
                        { icon: faFaceMeh, label: 'Regular', color: 'text-yellow-500' },
                        { icon: faFaceSmile, label: 'Bom', color: 'text-lime-500' },
                        { icon: faFaceGrin, label: 'Excelente', color: 'text-green-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <FontAwesomeIcon icon={item.icon} className={`text-4xl ${item.color}`} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === 'NPS' && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg">
                    <Label className="text-sm text-muted-foreground mb-3 block">Preview:</Label>
                    <div className="flex justify-center flex-wrap gap-1">
                      {[
                        { num: 0, color: 'bg-red-500' },
                        { num: 1, color: 'bg-red-500' },
                        { num: 2, color: 'bg-red-500' },
                        { num: 3, color: 'bg-red-500' },
                        { num: 4, color: 'bg-yellow-400' },
                        { num: 5, color: 'bg-yellow-400' },
                        { num: 6, color: 'bg-yellow-400' },
                        { num: 7, color: 'bg-green-500' },
                        { num: 8, color: 'bg-green-500' },
                        { num: 9, color: 'bg-green-500' },
                        { num: 10, color: 'bg-green-500' },
                      ].map((item) => (
                        <button
                          key={item.num}
                          disabled
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${item.color} text-white text-xs sm:text-sm font-bold flex items-center justify-center`}
                        >
                          {item.num}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400 px-1">
                      <span>0 = Não recommendaria</span>
                      <span>10 = Com certeza recommendaria</span>
                    </div>
                  </div>
                )}

                {question.type === 'TEXT_INPUT' && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg">
                    <Label className="text-sm text-muted-foreground mb-3 block">Preview:</Label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        disabled
                        placeholder="O usuário digitará a resposta aqui..."
                        className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* Campos específicos para ESCALA */}
                {question.type === 'SCALE' && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg space-y-4">
                    <Label className="text-sm text-muted-foreground">Configuração da Escala:</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-1 block">Valor Mínimo</Label>
                        <Input
                          type="number"
                          value={question.scaleMin || 1}
                          onChange={(e) => updateQuestion(qIndex, 'scaleMin', parseInt(e.target.value) || 1)}
                          min={0}
                          max={100}
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Valor Máximo</Label>
                        <Input
                          type="number"
                          value={question.scaleMax || 10}
                          onChange={(e) => updateQuestion(qIndex, 'scaleMax', parseInt(e.target.value) || 10)}
                          min={1}
                          max={100}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-1 block">Legenda Mínimo (opcional)</Label>
                        <Input
                          value={question.scaleMinLabel || ''}
                          onChange={(e) => updateQuestion(qIndex, 'scaleMinLabel', e.target.value)}
                          placeholder="Ex: Muito ruim"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Legenda Máximo (opcional)</Label>
                        <Input
                          value={question.scaleMaxLabel || ''}
                          onChange={(e) => updateQuestion(qIndex, 'scaleMaxLabel', e.target.value)}
                          placeholder="Ex: Excelente"
                        />
                      </div>
                    </div>
                    {/* Preview da escala */}
                    <div className="mt-4">
                      <Label className="text-xs text-muted-foreground mb-2 block">Preview:</Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {question.scaleMinLabel && (
                          <span className="text-sm text-muted-foreground">{question.scaleMinLabel}</span>
                        )}
                        <div className="flex gap-1">
                          {Array.from(
                            { length: (question.scaleMax || 10) - (question.scaleMin || 1) + 1 },
                            (_, i) => (question.scaleMin || 1) + i
                          ).map((num) => (
                            <div
                              key={num}
                              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium"
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                        {question.scaleMaxLabel && (
                          <span className="text-sm text-muted-foreground">{question.scaleMaxLabel}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Opções para SINGLE_CHOICE e MULTIPLE_CHOICE */}
                {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && (
                  <div className="space-y-3">
                    <Label>Opções *</Label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex gap-2 items-center">
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Opção ${oIndex + 1}`}
                          required
                          className="flex-1"
                        />
                        <input
                          type="color"
                          value={option.color || '#3b82f6'}
                          onChange={(e) => {
                            updateOption(qIndex, oIndex, option.text);
                            const updated = [...questions];
                            if (updated[qIndex].options && updated[qIndex].options[oIndex]) {
                              updated[qIndex].options[oIndex].color = e.target.value;
                              setQuestions(updated);
                            }
                          }}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-muted"
                          title={`Cor selecionada: ${option.color || '#3b82f6'}`}
                        />
                        {question.options.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(qIndex, oIndex)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  </div>
                )}

                {/* Opções para EMPLOYEE_RATING */}
                {question.type === 'EMPLOYEE_RATING' && (
                  <div className="space-y-3">
                    <Label>Colaboradores *</Label>
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        Adicione os colaboradores:
                      </p>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex gap-3 items-start bg-white dark:bg-gray-900 p-3 rounded-lg border">
                          {/* Área de upload de foto */}
                          <div className="flex-shrink-0">
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                              {option.imageUrl ? (
                                <Image
                                  src={option.imageUrl}
                                  alt={option.text}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="text-gray-400 flex flex-col items-center justify-center">
                                  <Upload className="w-5 h-5 mb-0.5" />
                                  <span className="text-[10px]">Foto</span>
                                </div>
                              )}
                              {uploadingImage?.qIndex === qIndex && uploadingImage?.oIndex === oIndex && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const tempUrl = URL.createObjectURL(file);
                                    const updated = [...questions];
                                    updated[qIndex].options[oIndex].imageUrl = tempUrl;
                                    handleImageUpload(qIndex, oIndex, file);
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Campo de nome */}
                          <div className="flex-1">
                            <Input
                              value={option.text}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Nome do colaborador ${oIndex + 1}`}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Clique no círculo para adicionar foto
                            </p>
                          </div>

                          {/* Botão remover */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(qIndex, oIndex)}
                            disabled={question.options.length <= 1}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Colaborador
                    </Button>

                    {/* Preview */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Preview:</strong> Os clientes verão os colaboradores com fotos e poderão clicar para selecionar quem os atendeu.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeQuestion(qIndex)}
              disabled={questions.length <= 1}
              className="flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lgpdText, setLgpdText] = useState('');
  const [collectName, setCollectName] = useState(false);
  const [collectPhone, setCollectPhone] = useState(false);
  const [collectEmail, setCollectEmail] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fetchingData, setFetchingData] = useState(true);
  const [uploadingImage, setUploadingImage] = useState<{qIndex: number, oIndex: number} | null>(null);

  // Warning modal states
  const [showDataWarning, setShowDataWarning] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [destructiveChanges, setDestructiveChanges] = useState<string[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);

  // Configuração do dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch campaign data on load
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;

      try {
        setFetchingData(true);
        const response = await fetch(`/api/campaigns/${campaignId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar campanha');
        }

        const data: CampaignData = await response.json();

        // Set campaign data
        setTitle(data.title || '');
        setDescription(data.description || '');
        setLgpdText(data.lgpdText || '');
        setCollectName(data.collectName || false);
        setCollectPhone(data.collectPhone || false);
        setCollectEmail(data.collectEmail || false);

        // Set questions with order
        if (data.questions && Array.isArray(data.questions)) {
          // Sort questions by order field
          const sortedQuestions = [...data.questions].sort((a, b) => (a.order || 0) - (b.order || 0));
          const mappedQuestions = sortedQuestions.map((q: any) => ({
            id: q.id,
            text: q.text || '',
            type: q.type || 'SMILE',
            isRequired: q.isRequired !== false,
            allowOptionalComment: q.allowOptionalComment || false,
            options: q.options || [],
            scaleMin: q.scaleMin,
            scaleMax: q.scaleMax,
            scaleMinLabel: q.scaleMinLabel,
            scaleMaxLabel: q.scaleMaxLabel,
            order: q.order,
          }));
          setQuestions(mappedQuestions);
          setOriginalQuestions(mappedQuestions);
        }

        // Check for existing responses (used for destructive change detection)
        const count = data._count?.responses || 0;
        setResponseCount(count);
        // Não mostrar mais o modal automático - agora só mostra quando salvar com mudanças destrutivas
      } catch (error) {
        console.error('Error fetching campaign:', error);
        toast.error('Erro ao carregar campanha');
        setError('Erro ao carregar dados da campanha');
      } finally {
        setFetchingData(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((_, i) => `question-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `question-${i}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAcknowledgeWarning = () => {
    setHasAcknowledgedWarning(true);
    setShowDataWarning(false);
  };

  const handleOpenReport = () => {
    window.open(`/dashboard/reports/${campaignId}`, '_blank');
  };

  const smileIcons = [
    { icon: faFaceAngry, label: 'Muito Insatisfeito', color: 'text-red-500' },
    { icon: faFaceFrown, label: 'Insatisfeito', color: 'text-orange-500' },
    { icon: faFaceMeh, label: 'Regular', color: 'text-yellow-500' },
    { icon: faFaceSmile, label: 'Satisfeito', color: 'text-lime-500' },
    { icon: faFaceGrinStars, label: 'Muito Satisfeito', color: 'text-green-500' },
  ];

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'SMILE',
        isRequired: true,
        allowOptionalComment: false,
        options: [],
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Ruim',
        scaleMaxLabel: 'Excelente',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    
    // Limpar opções quando mudar de tipo
    if (field === 'type') {
      if (value === 'SMILE' || value === 'SIMPLE_SMILE' || value === 'NPS' || value === 'TEXT_INPUT') {
        updated[index].options = [];
      } else if (value === 'SINGLE_CHOICE' || value === 'MULTIPLE_CHOICE' || value === 'EMPLOYEE_RATING') {
        if (updated[index].options.length === 0) {
          updated[index].options = [{ text: '' }];
        }
      }
      
      // Forçar isRequired = true para perguntas SMILE e EMPLOYEE_RATING
      if (value === 'SMILE' || value === 'SIMPLE_SMILE' || value === 'EMPLOYEE_RATING') {
        updated[index].isRequired = true;
      }
      
      // Preencher texto padrão para NPS
      if (value === 'NPS' && !updated[index].text) {
        updated[index].text = 'Em uma escala de 0 a 10, o quanto você recomendaria nossos produtos/serviços a um amigo ou familiar?';
      }
    }

    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push({ text: '', color: '#3b82f6' });
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length > 1) {
      updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
      setQuestions(updated);
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex].text = text;
    setQuestions(updated);
  };

  const handleImageUpload = async (qIndex: number, oIndex: number, file: File) => {
    if (!file) return;

    setUploadingImage({qIndex, oIndex});
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Atualizar a opção com a URL da imagem
      const updated = [...questions];
      updated[qIndex].options[oIndex].imageUrl = data.url;
      setQuestions(updated);
      
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(null);
    }
  };

  // Função para detectar mudanças destrutivas (que requerem reset)
  const detectDestructiveChanges = (originalQuestions: Question[], newQuestions: Question[]): string[] => {
    if (originalQuestions.length === 0 || newQuestions.length === 0) {
      return [];
    }

    const changes: string[] = [];
    
    // Verificar perguntas removidas (perguntas que existiam e agora não existem mais)
    originalQuestions.forEach((origQ) => {
      const stillExists = newQuestions.find(q => q.id === origQ.id);
      if (!stillExists) {
        changes.push(`Pergunta "${origQ.text.substring(0, 30)}..." foi removida`);
      }
    });
    
    // Verificar mudança de tipo (comparando por ID para manter a correspondência)
    newQuestions.forEach((newQ) => {
      if (!newQ.id) return; // Nova pergunta não tem ID ainda
      
      const originalQ = originalQuestions.find(q => q.id === newQ.id);
      if (!originalQ) return;
      
      // Verificar mudança de tipo
      if (originalQ.type !== newQ.type) {
        changes.push(`Tipo da pergunta "${newQ.text.substring(0, 30)}..." alterado de ${originalQ.type} para ${newQ.type}`);
      }

      // Verificar mudança de obrigatório
      if (originalQ.isRequired !== newQ.isRequired) {
        changes.push(`Obrigatoriedade da pergunta "${newQ.text.substring(0, 30)}..." alterada de ${originalQ.isRequired ? 'obrigatória' : 'opcional'} para ${newQ.isRequired ? 'obrigatória' : 'opcional'}`);
      }
    });
    
    return changes;
  };

  // Função para verificar se pode salvar diretamente ou precisa de confirmação
  const checkAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    const validQuestions = questions.filter((q) => q.text.trim());
    if (validQuestions.length === 0) {
      setError('Adicione pelo menos uma pergunta');
      return;
    }

    // Validar que perguntas EMPLOYEE_RATING têm pelo menos uma opção
    const invalidEmployeeQuestions = validQuestions.filter(
      (q) => q.type === 'EMPLOYEE_RATING' && q.options.filter((o) => o.text.trim()).length === 0
    );
    if (invalidEmployeeQuestions.length > 0) {
      setError('Adicione pelo menos um colaborador para cada pergunta de avaliação de colaborador');
      return;
    }

    // Se não tem respostas, salvar normalmente
    if (responseCount === 0) {
      setSaving(true);
      await performSave(false);
      return;
    }

    // Verificar mudanças destrutivas (só se temos as perguntas originais)
    const destructiveChanges = originalQuestions.length > 0 
      ? detectDestructiveChanges(originalQuestions, questions)
      : [];
    
    if (destructiveChanges.length > 0) {
      // Há mudanças destrutivas - mostrar aviso
      setDestructiveChanges(destructiveChanges);
      setShowResetWarning(true);
    } else {
      // Mudanças seguras - salvar normalmente sem deletar dados
      setSaving(true);
      await performSave(false);
    }
  };

  // Função que executa o save
  const performSave = async (shouldResetData: boolean = false) => {
    const validQuestions = questions.filter((q) => q.text.trim());
    
    try {
      // Include order field based on array index after drag-drop reordering
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          lgpdText: lgpdText.trim() || null,
          collectName,
          collectPhone,
          collectEmail,
          resetData: shouldResetData,
          questions: validQuestions.map((q, index) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            isRequired: q.isRequired,
            allowOptionalComment: q.allowOptionalComment,
            order: index,
            options: (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE' || q.type === 'EMPLOYEE_RATING') 
              ? q.options.filter((o) => o.text.trim())
              : [],
            scaleMin: q.type === 'SCALE' ? q.scaleMin : undefined,
            scaleMax: q.type === 'SCALE' ? q.scaleMax : undefined,
            scaleMinLabel: q.type === 'SCALE' ? q.scaleMinLabel : undefined,
            scaleMaxLabel: q.type === 'SCALE' ? q.scaleMaxLabel : undefined,
          })),
        }),
      });

      const errorData = await response.json().catch(() => null);

      if (!response.ok) {
        // Se a API diz que precisa de reset, mostrar modal
        if (response.status === 400 && errorData?.error?.includes('requer reset')) {
          // Adicionar ao array de mudanças destrutivas (em vez de substituir)
          const newChanges = [...destructiveChanges, errorData.error];
          setDestructiveChanges(newChanges);
          setShowResetWarning(true);
          setSaving(false);
          return;
        }
        throw new Error(errorData?.error || 'Erro ao atualizar campanha');
      }

      toast.success('Campanha atualizada com sucesso!');
      router.push('/campaigns');
      router.refresh();
    } catch (err: any) {
      console.error('Error updating campaign:', err);
      setError(err.message || 'Erro ao atualizar campanha');
      toast.error('Erro ao atualizar campanha');
    } finally {
      setSaving(false);
      setShowResetWarning(false);
    }
  };

  // Função para salvar com reset
  const handleSaveWithReset = async () => {
    setSaving(true);
    setShowResetWarning(false);

    // O API agora faz tudo: deleta respostas + recria perguntas
    await performSave(true);
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando campanha...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl py-8 px-4">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Editar Campanha
              </h1>
              <p className="text-muted-foreground mt-2">Modifique os detalhes da sua pesquisa de satisfação</p>
            </div>

            {/* Banner de aviso quando há dados existentes */}
            {responseCount > 0 && hasAcknowledgedWarning && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Atenção:</strong> Esta campanha possui {responseCount} resposta(s).
                    Alterar as perguntas pode afetar a interpretação dos dados existentes.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenReport}
                  className="flex-shrink-0"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Relatório
                </Button>
              </div>
            )}

            <form onSubmit={checkAndSave}>
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Informações da Campanha</CardTitle>
                  <CardDescription>Configure os detalhes da sua pesquisa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Campanha *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Pesquisa de Satisfação Q1 2024"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva o objetivo da pesquisa..."
                      rows={3}
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Privacidade e Coleta de Dados</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lgpdText">Texto de Privacidade (LGPD) - Opcional</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setLgpdText("Em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), Seus dados estão protegidos, Não compartilhamos suas informações sem sua autorização.")}
                          className="text-xs"
                        >
                          Usar texto padrão
                        </Button>
                      </div>
                      <Textarea
                        id="lgpdText"
                        value={lgpdText}
                        onChange={(e) => setLgpdText(e.target.value)}
                        placeholder="Em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), Seus dados estão protegidos, Não compartilhamos suas informações sem sua autorização."
                        rows={4}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Este texto será exibido no formulário de pesquisa para tranquilizar os respondentes sobre o uso de seus dados.
                      </p>
                    </div>

                    <div className="space-y-3 mt-4">
                      <p className="text-sm font-medium">Dados opcionais a coletar:</p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="collectName"
                          checked={collectName}
                          onChange={(e) => setCollectName(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <Label htmlFor="collectName" className="font-normal cursor-pointer">
                          Nome do respondente
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="collectPhone"
                          checked={collectPhone}
                          onChange={(e) => setCollectPhone(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <Label htmlFor="collectPhone" className="font-normal cursor-pointer">
                          Telefone do respondente
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="collectEmail"
                          checked={collectEmail}
                          onChange={(e) => setCollectEmail(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <Label htmlFor="collectEmail" className="font-normal cursor-pointer">
                          Email do respondente
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Os respondentes poderão fornecer esses dados opcionalmente para que você possa entrar em contato sobre feedbacks.
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Perguntas</h3>
                        <p className="text-sm text-muted-foreground">Adicione perguntas com tipos diferentes (arraste para reordenar)</p>
                      </div>
                      <Button type="button" variant="outline" onClick={addQuestion}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Pergunta
                      </Button>
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={questions.map((_, i) => `question-${i}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {questions.map((question, qIndex) => (
                            <SortableQuestionItem
                              key={`question-${qIndex}`}
                              question={question}
                              qIndex={qIndex}
                              questions={questions}
                              updateQuestion={updateQuestion}
                              removeQuestion={removeQuestion}
                              addOption={addOption}
                              removeOption={removeOption}
                              updateOption={updateOption}
                              setQuestions={setQuestions}
                              handleImageUpload={handleImageUpload}
                              uploadingImage={uploadingImage}
                              smileIcons={smileIcons}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </main>
      <Footer />

      {/* Warning Modal for Existing Data */}
      <AlertDialog open={showDataWarning} onOpenChange={setShowDataWarning}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Atenção: Dados Existentes
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Esta campanha já possui <strong>{responseCount} resposta(s)</strong> coletada(s).
              </p>
              <p>
                Editar as perguntas pode afetar a interpretação dos dados existentes, pois:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>As respostas antigas podem não corresponder às novas perguntas</li>
                <li>Os relatórios podem mostrar inconsistências</li>
                <li>A ordem das perguntas será atualizada</li>
              </ul>
              <p className="text-amber-600 dark:text-amber-400 font-medium pt-2">
                Recomendamos gerar um relatório atual antes de continuar.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => router.push('/campaigns')}>
              Cancelar Edição
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={handleOpenReport}
              className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <FileText className="w-4 h-4" />
              Gerar Relatório Atual
            </Button>
            <AlertDialogAction 
              onClick={handleAcknowledgeWarning}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Entendi, Continuar Edição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação para Mudanças que Requerem Reset */}
      <AlertDialog open={showResetWarning} onOpenChange={setShowResetWarning}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Alterações que requerem Reset
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Esta campanha possui <strong>{responseCount} resposta(s)</strong>. As seguintes alterações são consideradas <strong>destructivas</strong> e exigirão o <strong>reset de todos os dados</strong>:
              </p>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                <ul className="list-disc list-inside text-sm space-y-1">
                  {destructiveChanges.map((change, index) => (
                    <li key={index} className="text-red-700 dark:text-red-300">{change}</li>
                  ))}
                </ul>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium">
                ⚠️ Todos os dados serán excluídos permanentemente!
              </p>
              <p className="text-sm text-muted-foreground">
                edições como corrigir textos, alterar imagens ou adicionar/remover opções são <strong>permitidas sem perda de dados</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={saving}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={handleSaveWithReset}
              disabled={saving}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Sim, Resetar Dados
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
