/**
 * Análise de Sentimento Baseada em Léxico (Lexicon-based Sentiment Analysis)
 * Não utiliza IA - totalmente offline e gratuito
 */

// Dicionário de palavras POSITIVAS em português (contexto de satisfação/feedback)
const POSITIVE_WORDS = [
  // Adjetivos positivos
  'ótimo', 'otimo', 'excelente', 'maravilhoso', 'perfeito', 'incrível', 'fantástico', 'fantastico',
  'bom', 'boa', 'melhor', 'legal', 'bacana', 'top', 'show', 'massa', 'demais',
  'agradável', 'agradavel', 'satisfeito', 'satisfatório', 'satisfatorio', 'feliz', 'alegre',
  'rápido', 'rapido', 'eficiente', 'competente', 'profissional', 'qualidade', 'confiável', 'confiavel',
  
  // Verbos positivos
  'adorei', 'amei', 'gostei', 'recomendo', 'aprovo', 'parabenizo', 'agradeço', 'agradeco',
  'superou', 'melhorou', 'resolveu', 'atendeu', 'facilitou', 'ajudou',
  
  // Substantivos positivos
  'qualidade', 'excelência', 'excelencia', 'atenção', 'atencao', 'carinho', 'dedicação', 'dedicacao',
  'pontualidade', 'agilidade', 'eficiência', 'eficiencia', 'solução', 'solucao',
  
  // Expressões
  'muito bom', 'muito boa', 'nota 10', 'nota dez', 'cinco estrelas', '5 estrelas',
  'parabéns', 'parabens', 'obrigado', 'obrigada', 'sucesso', 'continuem assim'
];

// Dicionário de palavras NEGATIVAS em português (contexto de satisfação/feedback)
const NEGATIVE_WORDS = [
  // Adjetivos negativos
  'ruim', 'péssimo', 'pessimo', 'horrível', 'horrivel', 'terrível', 'terrivel', 'pior',
  'mal', 'má', 'fraco', 'fraca', 'insatisfeito', 'insatisfatório', 'insatisfatorio',
  'demorado', 'lento', 'lenta', 'ineficiente', 'incompetente', 'despreparado',
  'caro', 'cara', 'sujo', 'suja', 'desorganizado', 'confuso',
  
  // Verbos negativos
  'odiei', 'detestei', 'decepciona', 'decepcionou', 'desisti', 'desistir',
  'piorou', 'falhou', 'errou', 'atrasou', 'demorou', 'negou', 'recusou',
  
  // Substantivos negativos
  'problema', 'problemas', 'erro', 'erros', 'falha', 'falhas', 'atraso', 'atrasos',
  'demora', 'defeito', 'defeitos', 'reclamação', 'reclamacao', 'insatisfação', 'insatisfacao',
  'péssima', 'descaso', 'falta', 'dificuldade',
  
  // Negações e expressões negativas
  'não gostei', 'nao gostei', 'não recomendo', 'nao recomendo', 'deixou a desejar',
  'nunca mais', 'muito ruim', 'muito mal', 'sem qualidade', 'sem educação', 'sem educacao'
];

// Palavras de NEGAÇÃO que invertem o sentimento
const NEGATION_WORDS = [
  'não', 'nao', 'nem', 'nunca', 'jamais', 'nenhum', 'nenhuma', 'sem', 'sequer'
];

// Palavras INTENSIFICADORAS que aumentam o peso do sentimento
const INTENSIFIERS = [
  'muito', 'demais', 'extremamente', 'super', 'bastante', 'totalmente',
  'completamente', 'absolutamente', 'bem', 'realmente', 'verdadeiramente'
];

/**
 * Interface para resultado da análise de sentimento
 */
export interface SentimentResult {
  score: number;           // Score de -1 (muito negativo) a +1 (muito positivo)
  classification: 'Positivo' | 'Neutro' | 'Negativo';
  positiveWords: string[];
  negativeWords: string[];
  hasNegation: boolean;
  hasIntensifier: boolean;
}

/**
 * Interface para estatísticas agregadas de sentimento
 */
export interface SentimentStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  averageScore: number;
  topPositiveWords: Array<{ word: string; count: number }>;
  topNegativeWords: Array<{ word: string; count: number }>;
  comments: Array<{
    text: string;
    sentiment: 'Positivo' | 'Neutro' | 'Negativo';
    score: number;
  }>;
}

/**
 * Normaliza texto removendo acentos e convertendo para minúsculas
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')    // Remove pontuação
    .replace(/\s+/g, ' ')            // Normaliza espaços
    .trim();
}

/**
 * Analisa o sentimento de um texto individual
 * @param text Texto a ser analisado
 * @param customPositiveWords Palavras positivas customizadas do usuário (opcional)
 * @param customNegativeWords Palavras negativas customizadas do usuário (opcional)
 */
export function analyzeSentiment(
  text: string,
  customPositiveWords: string[] = [],
  customNegativeWords: string[] = []
): SentimentResult {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      classification: 'Neutro',
      positiveWords: [],
      negativeWords: [],
      hasNegation: false,
      hasIntensifier: false
    };
  }

  const normalizedText = normalizeText(text);
  const words = normalizedText.split(' ');
  
  // Combinar palavras padrão com palavras customizadas
  const allPositiveWords = [...POSITIVE_WORDS, ...customPositiveWords.map(w => normalizeText(w))];
  const allNegativeWords = [...NEGATIVE_WORDS, ...customNegativeWords.map(w => normalizeText(w))];
  
  let positiveScore = 0;
  let negativeScore = 0;
  const foundPositiveWords: string[] = [];
  const foundNegativeWords: string[] = [];
  let hasNegation = false;
  let hasIntensifier = false;
  let intensifierMultiplier = 1.0;

  // Processa cada palavra
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : '';
    const nextWord = i < words.length - 1 ? words[i + 1] : '';
    const bigram = `${word} ${nextWord}`; // Expressões de 2 palavras

    // Detecta negação
    if (NEGATION_WORDS.includes(normalizeText(word))) {
      hasNegation = true;
    }

    // Detecta intensificadores
    if (INTENSIFIERS.includes(normalizeText(word))) {
      hasIntensifier = true;
      intensifierMultiplier = 1.5; // Aumenta o peso das próximas palavras
    }

    // Verifica se há negação antes da palavra
    const hasNegationBefore = NEGATION_WORDS.includes(normalizeText(prevWord));

    // Procura por expressões de 2 palavras primeiro
    const normalizedBigram = normalizeText(bigram);
    
    if (allPositiveWords.some(pw => normalizeText(pw) === normalizedBigram)) {
      if (hasNegationBefore) {
        // Negação inverte o sentimento
        negativeScore += 2 * intensifierMultiplier;
        foundNegativeWords.push(bigram);
      } else {
        positiveScore += 2 * intensifierMultiplier;
        foundPositiveWords.push(bigram);
      }
      i++; // Pula a próxima palavra pois já foi processada no bigram
      intensifierMultiplier = 1.0; // Reset
      continue;
    }

    if (allNegativeWords.some(nw => normalizeText(nw) === normalizedBigram)) {
      if (hasNegationBefore) {
        // Negação inverte o sentimento
        positiveScore += 2 * intensifierMultiplier;
        foundPositiveWords.push(bigram);
      } else {
        negativeScore += 2 * intensifierMultiplier;
        foundNegativeWords.push(bigram);
      }
      i++; // Pula a próxima palavra
      intensifierMultiplier = 1.0; // Reset
      continue;
    }

    // Procura por palavras individuais
    const normalizedWord = normalizeText(word);

    if (allPositiveWords.some(pw => normalizeText(pw) === normalizedWord)) {
      if (hasNegationBefore) {
        negativeScore += 1 * intensifierMultiplier;
        foundNegativeWords.push(word);
      } else {
        positiveScore += 1 * intensifierMultiplier;
        foundPositiveWords.push(word);
      }
      intensifierMultiplier = 1.0; // Reset
    }

    if (allNegativeWords.some(nw => normalizeText(nw) === normalizedWord)) {
      if (hasNegationBefore) {
        positiveScore += 1 * intensifierMultiplier;
        foundPositiveWords.push(word);
      } else {
        negativeScore += 1 * intensifierMultiplier;
        foundNegativeWords.push(word);
      }
      intensifierMultiplier = 1.0; // Reset
    }
  }

  // Calcula o score final (-1 a +1)
  const totalWords = positiveScore + negativeScore;
  let finalScore = 0;
  
  if (totalWords > 0) {
    finalScore = (positiveScore - negativeScore) / (totalWords + 5); // +5 para suavizar
  }

  // Classifica o sentimento
  let classification: 'Positivo' | 'Neutro' | 'Negativo' = 'Neutro';
  if (finalScore > 0.15) {
    classification = 'Positivo';
  } else if (finalScore < -0.15) {
    classification = 'Negativo';
  }

  return {
    score: finalScore,
    classification,
    positiveWords: [...new Set(foundPositiveWords)], // Remove duplicatas
    negativeWords: [...new Set(foundNegativeWords)],
    hasNegation,
    hasIntensifier
  };
}

/**
 * Analisa múltiplos textos e retorna estatísticas agregadas
 * @param texts Array de textos a serem analisados
 * @param customPositiveWords Palavras positivas customizadas do usuário (opcional)
 * @param customNegativeWords Palavras negativas customizadas do usuário (opcional)
 */
export function analyzeSentimentBatch(
  texts: string[],
  customPositiveWords: string[] = [],
  customNegativeWords: string[] = []
): SentimentStats {
  if (!texts || texts.length === 0) {
    return {
      total: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      positivePercentage: 0,
      neutralPercentage: 0,
      negativePercentage: 0,
      averageScore: 0,
      topPositiveWords: [],
      topNegativeWords: [],
      comments: []
    };
  }

  const results = texts.map(text => ({
    text,
    ...analyzeSentiment(text, customPositiveWords, customNegativeWords)
  }));

  // Contadores
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let totalScore = 0;

  // Mapas para contagem de palavras
  const positiveWordsMap = new Map<string, number>();
  const negativeWordsMap = new Map<string, number>();

  results.forEach(result => {
    // Contagem por classificação
    if (result.classification === 'Positivo') positive++;
    else if (result.classification === 'Neutro') neutral++;
    else negative++;

    totalScore += result.score;

    // Contagem de palavras
    result.positiveWords.forEach(word => {
      positiveWordsMap.set(word, (positiveWordsMap.get(word) || 0) + 1);
    });

    result.negativeWords.forEach(word => {
      negativeWordsMap.set(word, (negativeWordsMap.get(word) || 0) + 1);
    });
  });

  const total = texts.length;

  // Top palavras (ordenadas por frequência)
  const topPositiveWords = Array.from(positiveWordsMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topNegativeWords = Array.from(negativeWordsMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Comentários com sentimento
  const comments = results.map(r => ({
    text: r.text,
    sentiment: r.classification,
    score: r.score
  }));

  return {
    total,
    positive,
    neutral,
    negative,
    positivePercentage: total > 0 ? (positive / total) * 100 : 0,
    neutralPercentage: total > 0 ? (neutral / total) * 100 : 0,
    negativePercentage: total > 0 ? (negative / total) * 100 : 0,
    averageScore: total > 0 ? totalScore / total : 0,
    topPositiveWords,
    topNegativeWords,
    comments
  };
}
