# SVR_DOCUMENTOS_ONLINE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| DATA_PESQUISA | DATE | 7 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DISPONIBILIDADE | VARCHAR2 | 7 |  |  | Y |  |  |
| AMBIENTE_ID | VARCHAR2 | 30 |  |  | Y |  |  |
| USERID | VARCHAR2 | 128 |  |  | Y |  |  |
| DOC_DIRECTORY | VARCHAR2 | 3 |  |  | Y |  |  |
| NOME_BACKUP | VARCHAR2 | 3 |  |  | Y |  |  |
| N_GERACOES | NUMBER | 22 |  |  | Y |  |  |
| N_IMPRESSOES | NUMBER | 22 |  |  | Y |  |  |
| N_VIAS | NUMBER | 22 |  |  | Y |  |  |
| N_COPIAS | NUMBER | 22 |  |  | Y |  |  |
| DATA_EXECUCAO | DATE | 7 |  |  | Y |  |  |
| DATA_IMPRESSAO | DATE | 7 |  |  | Y |  |  |
| N_REFERENCIA | VARCHAR2 | 60 |  |  | Y |  |  |
| DESTINATARIO | VARCHAR2 | 240 |  |  | Y |  |  |
| LOTE_ID | NUMBER | 22 |  |  | Y |  |  |
| LOTE_ORDEM | NUMBER | 22 |  |  | Y |  |  |
| PARAMETRO01 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO02 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO03 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO04 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO05 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO06 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO07 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO08 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO09 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO10 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO11 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO12 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO13 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO14 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO15 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO16 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO17 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO18 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO19 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PARAMETRO20 | VARCHAR2 | 2000 |  |  | Y |  |  |
| PERMISSAO | VARCHAR2 | 128 |  |  | Y |  |  |
| MODO_PROTECAO_RF | VARCHAR2 | 5 |  |  | Y |  |  |
| TIPO_PER_1 | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PER_2 | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PER_3 | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PER_4 | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PER_5 | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PER_6 | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PER_7 | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PER_8 | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PER_9 | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PER_10 | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ ordered*/
	docs.ID
	,docs.MODELO_ID
	,docs.DATA_PEDIDO DATA_PEDIDO
	,TRUNC(docs.DATA_PEDIDO) DATA_PESQUISA
	,docs.CRIADO_POR
	,DECODE(docs.disponivel_rf, 'ONL', 'Online', 'EDC', 'Online', 'ANU', 'Anulado', 'OFF', 'Offline') Disponibilidade
	,docs.ambiente_id
	,USER userId
	,docs.disponivel_rf DOC_DIRECTORY
	,docs.disponivel_rf NOME_BACKUP
	,docs.N_GERACOES
	,docs.N_IMPRESSOES
	,docs.N_VIAS
	,docs.N_COPIAS
	,docs.DATA_EXECUCAO
	,docs.DATA_IMPRESSAO
	,docs.N_REFERENCIA
	,docs.DESTINATARIO
	,docs.LOTE_ID
	,docs.LOTE_ORDEM
	,docs.PARAMETRO01
	,docs.PARAMETRO02
	,docs.PARAMETRO03
	,docs.PARAMETRO04
	,docs.PARAMETRO05
	,docs.PARAMETRO06
	,docs.PARAMETRO07
	,docs.PARAMETRO08
	,docs.PARAMETRO09
	,docs.PARAMETRO10
	,docs.PARAMETRO11
	,docs.PARAMETRO12
	,docs.PARAMETRO13
	,docs.PARAMETRO14
	,docs.PARAMETRO15
	,docs.PARAMETRO16
	,docs.PARAMETRO17
	,docs.PARAMETRO18
	,docs.PARAMETRO19
	,docs.PARAMETRO20
	,USER permissao
	,per.MODO_PROTECAO_RF
	,per.tipo_per_1
	,per.tipo_per_2
	,per.tipo_per_3
	,per.tipo_per_4
	,per.tipo_per_5
	,per.tipo_per_6
	,per.tipo_per_7
	,per.tipo_per_8
	,per.tipo_per_9
	,per.tipo_per_10
FROM SVR_DOCUMENTOS docs
	,(
		SELECT /*+ ordered*/
			per.modelo_id
			,mod.MODO_PROTECAO_RF
			,MAX(DECODE(per.tipo_permissao_rf, 1, 1, 0)) tipo_per_1
			,MAX(DECODE(per.tipo_permissao_rf, 2, 1, 0)) tipo_per_2
			,MAX(DECODE(per.tipo_permissao_rf, 3, 1, 0)) tipo_per_3
			,MAX(DECODE(per.tipo_permissao_rf, 4, 1, 0)) tipo_per_4
			,MAX(DECODE(per.tipo_permissao_rf, 5, 1, 0)) tipo_per_5
			,MAX(DECODE(per.tipo_permissao_rf, 6, 1, 0)) tipo_per_6
			,MAX(DECODE(per.tipo_permissao_rf, 7, 1, 0)) tipo_per_7
			,MAX(DECODE(per.tipo_permissao_rf, 8, 1, 0)) tipo_per_8
			,MAX(DECODE(per.tipo_permissao_rf, 9, 1, 0)) tipo_per_9
			,MAX(DECODE(per.tipo_permissao_rf, 10, 1, 0)) tipo_per_10
		FROM CFG_PERMISSOES_SIID per
			,DOC_MODELOS_DOCUMENTO mod
		WHERE 1 = 1
			AND mod.ID = per.modelo_id
			AND PER.USERNAME = CASE 
				WHEN INSTR(USER, 'COSEC') > 0
					THEN 'ADMINISTRADOR'
				WHEN INSTR(USER, 'TESTES') > 0
					THEN 'ADMINISTRADOR'
				ELSE USER
				END
			AND per.data_inicio <= SYSDATE
			AND NVL(per.data_fim, SYSDATE + 1) > SYSDATE
		GROUP BY per.modelo_id
			,mod.MODO_PROTECAO_RF
		) per
WHERE 1 = 1
	AND (
		(
			docs.n_impressoes != 0
			AND per.tipo_per_4 = 1
			)
		OR (
			per.tipo_per_7 = 1
			AND docs.N_GERACOES != 0
			)
		)
	AND NVL(docs.atributo9, '.') != 'A'
	AND docs.modelo_id = per.modelo_id
	AND NOT EXISTS (
		SELECT 1
		FROM svr_documentos_xml_old
		WHERE id = docs.id
		)
	AND (
		docs.PARAMETRO20 IS NULL
		OR (
			docs.parametro20 IS NOT NULL
			AND docs.PARAMETRO20 IN (
				SELECT CDUNIECO
				FROM R_UNIDAUSR
				WHERE 1 = 1
					AND CDIDUSR = CASE 
						WHEN INSTR(USER, 'COSEC') > 0
							THEN 'ADMINISTRADOR'
						WHEN INSTR(USER, 'TESTES') > 0
							THEN 'ADMINISTRADOR'
						ELSE USER
						END
				)
			)
		)
ORDER BY docs.ID DESC
```
