# SVR_PARAMETROS_DOC_NOME_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOME | VARCHAR2 | 240 |  |  | Y |  |  |
| DOCUMENTO_ID | NUMBER | 22 |  |  | N |  |  |
| VALOR | VARCHAR2 | 2000 |  |  | Y |  |  |
| N_PARAMETRO | NUMBER | 22 |  |  | N |  |  |
| REPORT_ID | NUMBER | 22 |  |  | Y |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT "NOME","DOCUMENTO_ID","VALOR","N_PARAMETRO","REPORT_ID","MODELO_ID"
FROM (
  SELECT
    a.nome
  , b.id documento_id
  , CASE a.n_parametro
      WHEN  1 THEN b.parametro01
      WHEN  2 THEN b.parametro02
      WHEN  3 THEN b.parametro03
      WHEN  4 THEN b.parametro04
      WHEN  5 THEN b.parametro05
      WHEN  6 THEN b.parametro06
      WHEN  7 THEN b.parametro07
      WHEN  8 THEN b.parametro08
      WHEN  9 THEN b.parametro09
      WHEN 10 THEN b.parametro10
      WHEN 11 THEN b.parametro11
      WHEN 12 THEN b.parametro12
      WHEN 13 THEN b.parametro13
      WHEN 14 THEN b.parametro14
      WHEN 15 THEN b.parametro15
      WHEN 16 THEN b.parametro16
      WHEN 17 THEN b.parametro17
      WHEN 18 THEN b.parametro18
      WHEN 19 THEN b.parametro19
      WHEN 20 THEN b.parametro20
      ELSE ''
    END valor
  , a.n_parametro
  , b.report_id
  , b.modelo_id
  FROM
    svr_parametros_report a
  , svr_documentos b
  WHERE
    a.report_id = b.report_id )
WHERE valor IS NOT NULL 
```
