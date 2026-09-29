# SVR_DETALHES_ONLINE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| DOCUMENTO_ID | NUMBER | 22 |  |  | Y |  |  |
| DETALHE | VARCHAR2 | 10 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_EXECUCAO | DATE | 7 |  |  | Y |  |  |
| DATA_FINALIZACAO | DATE | 7 |  |  | Y |  |  |
| ESTADO | VARCHAR2 | 60 |  |  | Y |  |  |
| IMPRESSORA_ID | VARCHAR2 | 483 |  |  | Y |  |  |
| RESULTADO | VARCHAR2 | 2000 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT a.id
	,a.documento_id
	,a.tipo_queue_rf detalhe
	,a.data_pedido
	,a.criado_por
	,a.data_execucao
	,a.data_finalizacao
	,a.estado
	,decode(a.tipo_queue_rf,
			'EXECUCAO', '',
			'EMAIL', '',
			'ANULADO', '',
			'BACKUP', '',
			'REENVIAR', '',
			decode(a.impressora_id,
					NULL, d.descricao || ' - ' || d.endereco,
					c.descricao || ' - ' || c.endereco))
		impressora_id
	,a.resultado
FROM svr_impressoras d
	,svr_impressoras c
	,svr_documentos b
	,svr_queue a
WHERE a.documento_id = b.id
	AND a.impressora_id = c.id(+)
	AND b.impressora_id = d.id
```
