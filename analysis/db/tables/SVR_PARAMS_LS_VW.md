# SVR_PARAMS_LS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| AMBIENTE_ID | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_EXECUCAO | DATE | 7 |  |  | Y |  |  |
| P_CDUNIECO | NUMBER | 22 |  |  | Y |  |  |
| P_NMRECIBO | NUMBER | 22 |  |  | Y |  |  |
| P_DATAACTUAL | VARCHAR2 | 2000 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT "MODELO_ID","AMBIENTE_ID","DATA_EXECUCAO","P_CDUNIECO","P_NMRECIBO","P_DATAACTUAL"
FROM (
  SELECT
    d.modelo_id
  , d.ambiente_id
  , d.data_execucao
  , SUM (DECODE (r.nome, 'P_CDUNIECO', TO_NUMBER (REPLACE (d.parametro04, '''')), 0)) p_cdunieco
  , SUM (DECODE (r.nome, 'P_NMRECIBO', TO_NUMBER (REPLACE (d.parametro05, '''')), 0)) p_nmrecibo
  , MAX (DECODE (r.nome, 'P_DATAACTUAL', d.parametro03)) p_dataactual
  FROM
    svr_documentos d
  , svr_parametros_report r
  WHERE r.nome IN ('P_CDUNIECO', 'P_NMRECIBO', 'P_DATAACTUAL')
    AND d.report_id = r.report_id
    AND d.modelo_id IN ('D15.L1', 'D15.L2', 'D15.L3', 'D15.L4')
  GROUP BY d.modelo_id, d.ambiente_id, d.data_execucao )
WHERE
  p_cdunieco <> 0
  OR p_nmrecibo <> 0
  OR p_dataactual <> 0 
```
