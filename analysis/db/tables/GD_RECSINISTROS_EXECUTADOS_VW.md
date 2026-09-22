# GD_RECSINISTROS_EXECUTADOS_VW

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
| AAAPERTU | VARCHAR2 | 2000 |  |  | Y |  |  |
| NMSINIES | VARCHAR2 | 2000 |  |  | Y |  |  |
| NMORDPAG | VARCHAR2 | 2000 |  |  | Y |  |  |


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
, d.parametro04 cdunieco
, d.parametro05 cdramo
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
  END aaapertu
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
  END nmsinies
, CASE p3.n_parametro
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
  END nmordpag
FROM
  svr_documentos d
, (SELECT report_id, n_parametro
  FROM svr_parametros_report
  WHERE nome = 'P_AAAPERTU') p1
, (SELECT report_id, n_parametro
  FROM svr_parametros_report
  WHERE nome = 'P_NMSINIES') p2
, (SELECT report_id, n_parametro
  FROM svr_parametros_report
  WHERE nome = 'P_NMORDPAG') p3
, svr_impressoras i
, co_empleados c
WHERE
    d.modelo_id IN ('E.E11', 'E.E10.2', 'E.E9.2')
AND d.report_id = p1.report_id (+)
AND d.report_id = p2.report_id (+)
AND d.report_id = p3.report_id (+)
AND d.criado_por = c.cdemplea (+)
AND d.impressora_id = i.ID 
```
