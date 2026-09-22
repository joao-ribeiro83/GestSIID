# GD_RECGADOR_EXECUTADOS_VW

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
| NMRECIBO | VARCHAR2 | 2000 |  |  | Y |  |  |
| DATA_REFERENCIA | VARCHAR2 | 2000 |  |  | Y |  |  |


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
, d.parametro05 nmrecibo
, d.parametro03 data_referencia
FROM
  svr_documentos d
, svr_impressoras i
, co_empleados c
WHERE
    d.modelo_id IN ('E.E1', 'E.E4', 'E.E9.1', 'E.E10.1', 'E.E7', 'E.E8')
AND d.criado_por = c.cdemplea (+)
AND d.impressora_id = i.ID 
```
