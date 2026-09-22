# GD_GARANTIAS_EXECUTADAS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEPARTAMENTO | VARCHAR2 | 3 |  |  | Y |  |  |
| UTILIZADOR | VARCHAR2 | 30 |  |  | Y |  |  |
| NUMERO_SPOOL | NUMBER | 22 |  |  | N |  |  |
| N_REFERENCIA | VARCHAR2 | 60 |  |  | Y |  |  |
| DESTINATARIO | VARCHAR2 | 240 |  |  | Y |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| DATA_IMPRESSAO | DATE | 7 |  |  | Y |  |  |
| IMPRESSORA | VARCHAR2 | 240 |  |  | Y |  |  |
| CDUNIECO | VARCHAR2 | 2000 |  |  | Y |  |  |
| CDRAMO | VARCHAR2 | 2000 |  |  | Y |  |  |
| NMPOLIZA | VARCHAR2 | 2000 |  |  | Y |  |  |
| NMGARANT | VARCHAR2 | 2000 |  |  | Y |  |  |
| CDPERSON | VARCHAR2 | 2000 |  |  | Y |  |  |
| LISTA_GARANTIAS | VARCHAR2 | 2002 |  |  | Y |  |  |


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
, d.n_referencia
, d.destinatario
, d.modelo_id
, d.data_pedido
, d.data_impressao
, i.endereco impressora
, d.parametro05 cdunieco
, d.parametro06 cdramo
, d.parametro04 nmpoliza
, CASE p1.n_parametro
    WHEN  1 THEN d.parametro01
    WHEN  2 THEN d.parametro02
    WHEN  3 THEN d.parametro03
    WHEN  4 THEN d.parametro04
    WHEN  5 THEN d.parametro05
    WHEN  6 THEN d.parametro06
    WHEN  7 THEN d.parametro07
    WHEN  8 THEN d.parametro08
    WHEN  9 THEN d.parametro09
    WHEN 10 THEN d.parametro10
    WHEN 11 THEN d.parametro11
    WHEN 12 THEN d.parametro12
    WHEN 13 THEN d.parametro13
    WHEN 14 THEN d.parametro14
    WHEN 15 THEN d.parametro15
    WHEN 16 THEN d.parametro16
    WHEN 17 THEN d.parametro17
    WHEN 18 THEN d.parametro18
    WHEN 19 THEN d.parametro19
    WHEN 20 THEN d.parametro20
    ELSE NULL
  END nmgarant
, CASE p2.n_parametro
    WHEN  1 THEN d.parametro01
    WHEN  2 THEN d.parametro02
    WHEN  3 THEN d.parametro03
    WHEN  4 THEN d.parametro04
    WHEN  5 THEN d.parametro05
    WHEN  6 THEN d.parametro06
    WHEN  7 THEN d.parametro07
    WHEN  8 THEN d.parametro08
    WHEN  9 THEN d.parametro09
    WHEN 10 THEN d.parametro10
    WHEN 11 THEN d.parametro11
    WHEN 12 THEN d.parametro12
    WHEN 13 THEN d.parametro13
    WHEN 14 THEN d.parametro14
    WHEN 15 THEN d.parametro15
    WHEN 16 THEN d.parametro16
    WHEN 17 THEN d.parametro17
    WHEN 18 THEN d.parametro18
    WHEN 19 THEN d.parametro19
    WHEN 20 THEN d.parametro20
    ELSE NULL
  END cdperson
, CASE p3.n_parametro
    WHEN  1 THEN '''' || SUBSTR(d.parametro01, INSTR(d.parametro01, '(')) || ''''
    WHEN  2 THEN '''' || SUBSTR(d.parametro02, INSTR(d.parametro02, '(')) || ''''
    WHEN  3 THEN '''' || SUBSTR(d.parametro03, INSTR(d.parametro03, '(')) || ''''
    WHEN  4 THEN '''' || SUBSTR(d.parametro04, INSTR(d.parametro04, '(')) || ''''
    WHEN  5 THEN '''' || SUBSTR(d.parametro05, INSTR(d.parametro05, '(')) || ''''
    WHEN  6 THEN '''' || SUBSTR(d.parametro06, INSTR(d.parametro06, '(')) || ''''
    WHEN  7 THEN '''' || SUBSTR(d.parametro07, INSTR(d.parametro07, '(')) || ''''
    WHEN  8 THEN '''' || SUBSTR(d.parametro08, INSTR(d.parametro08, '(')) || ''''
    WHEN  9 THEN '''' || SUBSTR(d.parametro09, INSTR(d.parametro09, '(')) || ''''
    WHEN 10 THEN '''' || SUBSTR(d.parametro10, INSTR(d.parametro10, '(')) || ''''
    WHEN 11 THEN '''' || SUBSTR(d.parametro11, INSTR(d.parametro11, '(')) || ''''
    WHEN 12 THEN '''' || SUBSTR(d.parametro12, INSTR(d.parametro12, '(')) || ''''
    WHEN 13 THEN '''' || SUBSTR(d.parametro13, INSTR(d.parametro13, '(')) || ''''
    WHEN 14 THEN '''' || SUBSTR(d.parametro14, INSTR(d.parametro14, '(')) || ''''
    WHEN 15 THEN '''' || SUBSTR(d.parametro15, INSTR(d.parametro15, '(')) || ''''
    WHEN 16 THEN '''' || SUBSTR(d.parametro16, INSTR(d.parametro16, '(')) || ''''
    WHEN 17 THEN '''' || SUBSTR(d.parametro17, INSTR(d.parametro17, '(')) || ''''
    WHEN 18 THEN '''' || SUBSTR(d.parametro18, INSTR(d.parametro18, '(')) || ''''
    WHEN 19 THEN '''' || SUBSTR(d.parametro19, INSTR(d.parametro19, '(')) || ''''
    WHEN 20 THEN '''' || SUBSTR(d.parametro20, INSTR(d.parametro20, '(')) || ''''
    ELSE NULL
  END lista_garantias
FROM
  svr_documentos d
, (SELECT report_id, n_parametro
  FROM svr_parametros_report
  WHERE nome = 'P_NMGARANT') p1
, (SELECT report_id, n_parametro
  FROM svr_parametros_report
  WHERE nome = 'P_CDPERSON') p2
, (SELECT report_id, n_parametro
  FROM svr_parametros_report
  WHERE nome = 'P_LISTA_GARANTIAS') p3
, svr_impressoras i
, co_empleados c
WHERE
    d.modelo_id IN
       ('R3.D25', 'R3.D25R', 'R3.D27', 'R3.D274', 'D1.A7', 'D1.A7R',
        'D1.A5', 'D1.A5R')
AND d.report_id = p1.report_id (+)
AND d.report_id = p2.report_id (+)
AND d.report_id = p3.report_id (+)
AND d.criado_por = c.cdemplea (+)
AND d.impressora_id = i.ID 
```
