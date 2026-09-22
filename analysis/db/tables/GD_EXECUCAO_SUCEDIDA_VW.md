# GD_EXECUCAO_SUCEDIDA_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEPARTAMENTO | VARCHAR2 | 3 |  |  | Y |  |  |
| UTILIZADOR | VARCHAR2 | 30 |  |  | Y |  |  |
| NUMERO_SPOOL | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| DATA_EXECUCAO | DATE | 7 |  |  | Y |  |  |
| DATA_IMPRESSAO | DATE | 7 |  |  | Y |  |  |
| N_REFERENCIA | VARCHAR2 | 60 |  |  | Y |  |  |
| DESTINATARIO | VARCHAR2 | 240 |  |  | Y |  |  |
| LOTE_ID | NUMBER | 22 |  |  | Y |  |  |
| IMPRESSORA | VARCHAR2 | 240 |  |  | Y |  |  |
| NOME_PARAMETRO | VARCHAR2 | 240 |  |  | Y |  |  |
| VALOR | VARCHAR2 | 2000 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT
  c.cddeparta departamento
, d.criado_por utilizador
, d.ID numero_spool
, d.modelo_id
, d.data_pedido
, d.data_execucao
, d.data_impressao
, d.n_referencia
, d.destinatario
, d.lote_id
, i.endereco impressora
, tVal.nome nome_parametro
, tVal.valor
FROM
  svr_documentos d
, (SELECT
    documento_id
  , nome
  , valor
  FROM (SELECT
          a.id documento_id
        , b.n_parametro
        , b.nome
        , CASE b.n_parametro
            WHEN  1 THEN a.parametro01
            WHEN  2 THEN a.parametro02
            WHEN  3 THEN a.parametro03
            WHEN  4 THEN a.parametro04
            WHEN  5 THEN a.parametro05
            WHEN  6 THEN a.parametro06
            WHEN  7 THEN a.parametro07
            WHEN  8 THEN a.parametro08
            WHEN  9 THEN a.parametro09
            WHEN 10 THEN a.parametro10
            WHEN 11 THEN a.parametro11
            WHEN 12 THEN a.parametro12
            WHEN 13 THEN a.parametro13
            WHEN 14 THEN a.parametro14
            WHEN 15 THEN a.parametro15
            WHEN 16 THEN a.parametro16
            WHEN 17 THEN a.parametro17
            WHEN 18 THEN a.parametro18
            WHEN 19 THEN a.parametro19
            WHEN 20 THEN a.parametro20
            ELSE NULL
          END valor
        FROM
          svr_documentos a
        , svr_parametros_report b
        WHERE
          a.report_id = b.report_id)
  WHERE valor IS NOT NULL
  ORDER BY documento_id, n_parametro) tVal
, svr_impressoras i
, co_empleados c
WHERE
    d.ID = tVal.documento_id(+)
AND d.criado_por = c.cdemplea(+)
AND d.impressora_id = i.ID
AND 1 =(SELECT
          COUNT (*)
        FROM
          svr_queue a
        WHERE
            a.documento_id = d.ID
        AND a.tipo_queue_rf = 'EXECUCAO'
        AND a.estado = 'TERMINADO'
        AND a.ID = (SELECT
                      MAX (b.ID)
                    FROM
                      svr_queue b
                    WHERE
                        b.documento_id = d.ID
                    AND b.tipo_queue_rf = 'EXECUCAO'))
AND 1 =(SELECT
          COUNT (*)
        FROM
          svr_queue a
        WHERE
            a.documento_id = d.ID
        AND a.tipo_queue_rf = 'IMPRESSAO'
        AND a.estado = 'ERRO'
        AND a.ID = (SELECT
                      MAX (b.ID)
                    FROM
                      svr_queue b
                    WHERE
                        b.documento_id = d.ID
                    AND b.tipo_queue_rf = 'IMPRESSAO')) 
```
