-- Script para corrigir IDs de employees nas respostas
-- Execute este SQL no CloudBeaver para a campanha problemática

-- ID da campanha problemática: cmnj5cs9x000dox0k1ui02qog
-- ID da pergunta EMPLOYEE_RATING: cmnj65oh20038ox0kfzjbze9g

-- Primeiro, ver os employees atuais da pergunta (execute isso para ver os IDs atuais):
-- SELECT id, text FROM "QuestionOption" WHERE "questionId" = 'cmnj65oh20038ox0kfzjbze9g';

-- Depois, ver os IDs старые que estão nelle respostas (execute para ver quais não existem mais):
-- SELECT DISTINCT a."selectedOptions"[1] as old_employee_id
-- FROM "Answer" a
-- JOIN "Question" q ON a."questionId" = q.id
-- WHERE q."campaignId" = 'cmnj5cs9x000dox0k1ui02qog'
-- AND q.type = 'EMPLOYEE_RATING'
-- AND a."selectedOptions"[1] IS NOT NULL;

-- Para corrigir, você precisa saber qual employee antigo corresponde ao novo
-- Abaixo está um exemplo de como fazer o UPDATE (substitua os IDs pelos corretos):

-- Exemplo de correção (execute um para cada employee):
/*
UPDATE "Answer"
SET "selectedOptions" = ARRAY['novo_id_do_employee']
WHERE id = 'id_da_resposta_a_ser_corrigida'
AND "questionId" = 'cmnj65oh20038ox0kfzjbze9g';
*/

-- Para facilitar, vou gerar uma lista das respostas que precisam de correção:
SELECT 
    r.id as response_id,
    r."createdAt",
    a.id as answer_id,
    a."selectedOptions"[1] as old_employee_id,
    (SELECT text FROM "QuestionOption" WHERE id = a."selectedOptions"[1]) as old_employee_name
FROM "Response" r
JOIN "Answer" a ON r.id = a."responseId"
WHERE r."campaignId" = 'cmnj5cs9x000dox0k1ui02qog'
AND a."questionId" = 'cmnj65oh20038ox0kfzjbze9g'
AND a."selectedOptions"[1] IS NOT NULL;