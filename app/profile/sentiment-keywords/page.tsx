'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ThumbsUp, ThumbsDown, Plus, Trash2, ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Keyword {
  id: string;
  word: string;
  type: 'POSITIVE' | 'NEGATIVE';
}

interface KeywordsData {
  positive: Keyword[];
  negative: Keyword[];
}

export default function SentimentKeywordsPage() {
  const [keywords, setKeywords] = useState<KeywordsData>({ positive: [], negative: [] });
  const [loading, setLoading] = useState(true);
  const [newPositive, setNewPositive] = useState('');
  const [newNegative, setNewNegative] = useState('');
  const [adding, setAdding] = useState<'POSITIVE' | 'NEGATIVE' | null>(null);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const response = await fetch('/api/sentiment-keywords');
      const data = await response.json();
      setKeywords(data);
    } catch (error) {
      console.error('Error fetching keywords:', error);
      toast.error('Erro ao carregar palavras-chave');
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async (word: string, type: 'POSITIVE' | 'NEGATIVE') => {
    if (!word.trim()) {
      toast.error('Digite uma palavra');
      return;
    }

    setAdding(type);

    try {
      const response = await fetch('/api/sentiment-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim(), type }),
      });

      if (response.ok) {
        toast.success('Palavra adicionada com sucesso');
        if (type === 'POSITIVE') setNewPositive('');
        else setNewNegative('');
        fetchKeywords();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar palavra');
      }
    } catch (error) {
      console.error('Error adding keyword:', error);
      toast.error('Erro ao adicionar palavra');
    } finally {
      setAdding(null);
    }
  };

  const deleteKeyword = async (id: string) => {
    try {
      const response = await fetch(`/api/sentiment-keywords?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Palavra removida com sucesso');
        fetchKeywords();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao remover palavra');
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
      toast.error('Erro ao remover palavra');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⌛</div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Palavras-Chave de Sentimento
            </h1>
            <p className="text-muted-foreground">
              Personalize a análise de sentimento com palavras específicas do seu negócio
            </p>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Card de informações */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Como funciona?</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione palavras específicas do seu ramo de atuação para melhorar a precisão da análise de sentimento.
                  Essas palavras serão combinadas com o dicionário padrão para classificar os comentários como positivos ou negativos.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Exemplos:</strong> Se você trabalha com hospedagem, pode adicionar "aconchegante", "limpeza" como positivas
                  e "barulho", "demorado" como negativas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Palavras Positivas */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <ThumbsUp className="h-5 w-5" />
                Palavras Positivas
              </CardTitle>
              <CardDescription>
                Palavras que indicam satisfação e feedback positivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário de adição */}
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma palavra..."
                  value={newPositive}
                  onChange={(e) => setNewPositive(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addKeyword(newPositive, 'POSITIVE');
                    }
                  }}
                />
                <Button
                  onClick={() => addKeyword(newPositive, 'POSITIVE')}
                  disabled={!newPositive.trim() || adding === 'POSITIVE'}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {/* Lista de palavras */}
              <div className="space-y-2">
                {keywords.positive.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma palavra personalizada ainda.
                    <br />
                    O sistema usará apenas o dicionário padrão.
                  </p>
                ) : (
                  keywords.positive.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                    >
                      <span className="font-medium text-green-700 dark:text-green-300">
                        {keyword.word}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKeyword(keyword.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Total: {keywords.positive.length} palavra(s) personalizada(s)
              </p>
            </CardContent>
          </Card>

          {/* Palavras Negativas */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <ThumbsDown className="h-5 w-5" />
                Palavras Negativas
              </CardTitle>
              <CardDescription>
                Palavras que indicam insatisfação e feedback negativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário de adição */}
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma palavra..."
                  value={newNegative}
                  onChange={(e) => setNewNegative(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addKeyword(newNegative, 'NEGATIVE');
                    }
                  }}
                />
                <Button
                  onClick={() => addKeyword(newNegative, 'NEGATIVE')}
                  disabled={!newNegative.trim() || adding === 'NEGATIVE'}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {/* Lista de palavras */}
              <div className="space-y-2">
                {keywords.negative.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma palavra personalizada ainda.
                    <br />
                    O sistema usará apenas o dicionário padrão.
                  </p>
                ) : (
                  keywords.negative.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                    >
                      <span className="font-medium text-red-700 dark:text-red-300">
                        {keyword.word}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKeyword(keyword.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Total: {keywords.negative.length} palavra(s) personalizada(s)
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
