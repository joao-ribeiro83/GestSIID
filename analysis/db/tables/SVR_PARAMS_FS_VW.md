# SVR_PARAMS_FS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| AMBIENTE_ID | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| DATA_EXECUCAO | DATE | 7 |  |  | Y |  |  |
| P_CDUNIECO | NUMBER | 22 |  |  | Y |  |  |
| P_CDRAMO | NUMBER | 22 |  |  | Y |  |  |
| P_NMPROC | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT "MODELO_ID","AMBIENTE_ID","DATA_PEDIDO","DATA_EXECUCAO","P_CDUNIECO","P_CDRAMO","P_NMPROC"
FROM (
  SELECT
    d.modelo_id
  , d.ambiente_id
  , d.data_pedido
  , d.data_execucao
  , SUM (DECODE (r.nome, 'P_CDUNIECO', TO_NUMBER (REPLACE (
      CASE r.n_parametro
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
        ELSE '0'
      END, '''')), 0)) p_cdunieco
  , SUM (DECODE (r.nome, 'P_CDRAMO', TO_NUMBER (REPLACE (
      CASE r.n_parametro
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
        ELSE '0'
      END, '''')), 0)) p_cdramo
  , SUM (DECODE (r.nome, 'P_CDNMPROC', TO_NUMBER (REPLACE (
      CASE r.n_parametro
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
        ELSE '0'
      END, '''')), 'P_CDPROCESSO', TO_NUMBER (REPLACE (
        CASE r.n_parametro
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
          ELSE '0'
        END, '''')), 0)) p_nmproc
  FROM
    svr_documentos d
  , svr_parametros_report r
  WHERE
        r.nome IN ('P_CDUNIECO', 'P_CDRAMO', 'P_CDNMPROC')
    AND d.report_id = r.report_id
    AND d.modelo_id IN ('D9.F2', 'D9.F3', 'D9.F4', 'D9.F5')
  GROUP BY d.modelo_id, d.ambiente_id, d.data_execucao, d.data_pedido )
WHERE
     p_cdunieco <> 0
  OR p_cdramo <> 0
  OR p_nmproc <> 0 
```
