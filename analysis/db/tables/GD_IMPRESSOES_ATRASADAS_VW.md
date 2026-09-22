# GD_IMPRESSOES_ATRASADAS_VW

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
FROM
  svr_documentos d
, co_empleados c
WHERE
    d.criado_por = c.cdemplea(+)
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
```
