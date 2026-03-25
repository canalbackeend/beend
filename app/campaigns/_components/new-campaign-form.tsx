'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, GripVertical, Upload } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceAngry, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrinStars, faFaceSadTear, faFaceGrin, faChartBar, faCircle, faSquareCheck, faRulerHorizontal, faPenToSquare, faUser } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

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
  text: string;
  type: 'SMILE' | 'SIMPLE_SMILE' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT_INPUT' | 'EMPLOYEE_RATING';
  isRequired: boolean;
  allowOptionalComment: boolean;
  options: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
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
                            const updated = [...questions];
                            if (updated[qIndex].options && updated[qIndex].options[oIndex]) {
                              updated[qIndex].options[oIndex].color = e.target.value;
                            }
                          }}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-muted"
                          title="Escolher cor"
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

export function NewCampaignForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lgpdText, setLgpdText] = useState('');
  const [collectName, setCollectName] = useState(false);
  const [collectPhone, setCollectPhone] = useState(false);
  const [collectEmail, setCollectEmail] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState<{qIndex: number, oIndex: number} | null>(null);

  // Configuração do dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        updated[index].text = 'Em uma escala de 0 a 10, o quanto você recomendaria nosso serviço a um amigo ou colega?';
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
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          lgpdText: lgpdText.trim() || null,
          collectName,
          collectPhone,
          collectEmail,
          questions: validQuestions.map((q) => ({
            text: q.text,
            type: q.type,
            isRequired: q.isRequired,
            allowOptionalComment: q.allowOptionalComment,
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

      if (!response.ok) {
        throw new Error('Erro ao criar campanha');
      }

      router.push('/campaigns');
      router.refresh();
    } catch (err) {
      setError('Erro ao criar campanha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Nova Campanha
        </h1>
        <p className="text-muted-foreground mt-2">Crie uma nova pesquisa de satisfação</p>
      </div>

      <form onSubmit={handleSubmit}>
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
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Campanha
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
