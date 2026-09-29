# SVR_PARAMS_RECIBOS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| AMBIENTE_ID | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| DATA_EXECUCAO | DATE | 7 |  |  | Y |  |  |
| P_CDUNIECO | NUMBER | 22 |  |  | Y |  |  |
| P_NMRECIBO | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select "ID","MODELO_ID","AMBIENTE_ID","DATA_PEDIDO","DATA_EXECUCAO","P_CDUNIECO","P_NMRECIBO"
from (
  SELECT
    d.ID
  , d.modelo_id
  , d.ambiente_id
  , d.data_pedido
  , d.data_execucao
  , SUM (DECODE (r.nome, 'P_CDUNIECO', TO_NUMBER (REPLACE (d.parametro04, '''')), 0)) p_cdunieco
  , SUM (DECODE (r.nome, 'P_NMRECIBO', TO_NUMBER (REPLACE (d.parametro05, '''')), 0)) p_nmrecibo
  FROM
    svr_documentos d
  , svr_parametros_report r
  WHERE
        r.nome IN ('P_CDUNIECO', 'P_NMRECIBO')
    AND d.report_id = r.report_id
    AND d.modelo_id IN ('E.E8', 'E.E7', 'E.E10.1', 'E.E9.1', 'E.E1', 'E.E4')
  GROUP BY d.ID, d.modelo_id, d.ambiente_id, d.data_execucao, d.data_pedido )
WHERE
     p_cdunieco <> 0
  OR p_nmrecibo <> 0 
```
