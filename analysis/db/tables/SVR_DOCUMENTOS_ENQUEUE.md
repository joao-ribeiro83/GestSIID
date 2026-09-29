# SVR_DOCUMENTOS_ENQUEUE

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QUEUE_ID | NUMBER | 22 |  |  | Y |  |  |
| TIPO_PEDIDO | VARCHAR2 | 10 |  |  | Y |  |  |
| DOCUMENTO_ID | NUMBER | 22 |  |  | Y |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| LOTE_ID | NUMBER | 22 |  |  | Y |  |  |
| VALOR_PARAMETRO | VARCHAR2 | 2000 |  |  | Y |  |  |
| NOME_PARAMETRO | VARCHAR2 | 240 |  |  | Y |  |  |
| NOME_REPORT | VARCHAR2 | 240 |  |  | Y |  |  |
| NOME_FICHEIRO | VARCHAR2 | 240 |  |  | Y |  |  |
| USERID | VARCHAR2 | 512 |  |  | Y |  |  |
| SERVIDOR_IMPRESSAO | VARCHAR2 | 60 |  |  | Y |  |  |
| ENDERECO_IMPRESSORA | VARCHAR2 | 240 |  |  | Y |  |  |
| GSDEVICE | VARCHAR2 | 30 |  |  | Y |  |  |
| GSPAPERSIZE | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_DOCUMENTO | VARCHAR2 | 10 |  |  | Y |  |  |
| LOTE_ORDEM | NUMBER | 22 |  |  | Y |  |  |
| TIPO_CONTROLO | CHAR | 1 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| ATRIBUTO01 | VARCHAR2 | 512 |  |  | Y |  |  |
| CERTIFICACAO | VARCHAR2 | 5 |  |  | Y |  |  |
| MODO_IMPRESSAO | VARCHAR2 | 5 |  |  | Y |  |  |
| MODO_EXPEDICAO | VARCHAR2 | 2 |  |  | Y |  |  |
| DIRECTORIA_BACKUP | VARCHAR2 | 200 |  |  | Y |  |  |
| ESTADO_SAFT | VARCHAR2 | 255 |  |  | Y |  |  |
| STAMP | VARCHAR2 | 1 |  |  | Y |  |  |
| BARCODE_TYPE | VARCHAR2 | 20 |  |  | Y |  |  |
| BARCODE_FORMAT | VARCHAR2 | 255 |  |  | Y |  |  |
| BARCODE_WEIGHT | NUMBER | 22 | 5 | 2 | Y |  |  |
| BARCODE_HEIGHT | NUMBER | 22 | 5 | 2 | Y |  |  |
| BARCODE_X_POSITION | NUMBER | 22 | 5 | 2 | Y |  |  |
| BARCODE_Y_POSITION | NUMBER | 22 | 5 | 2 | Y |  |  |
| ARQ_ID | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT queue_id
	,tipo_pedido
	,documento_id
	,modelo_id
	,lote_id
	,valor_parametro
	,nome_parametro
	,nome_report
	,nome_ficheiro
	,userid
	,servidor_impressao
	,endereco_impressora
	,gsdevice
	,gspapersize
	,data_documento
	,lote_ordem
	,tipo_controlo
	,criado_por
	,atributo01
	,certificacao
	,MODO_IMPRESSAO
	,DECODE(MODO_EXPEDICAO, 'W', (DECODE(PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC(documento_id), 0, 'I', MODO_EXPEDICAO)), MODO_EXPEDICAO) MODO_EXPEDICAO
	,directoria_backup
	,ESTADO_SAFT
	,STAMP
	,BARCODE_TYPE
	,BARCODE_FORMAT
	,BARCODE_WEIGHT
	,BARCODE_HEIGHT
	,BARCODE_X_POSITION
	,BARCODE_Y_POSITION
	,arq_id
FROM (
	SELECT /*+ ordered USE_NL(B E) USE_NL(A B F) */
		a.ID QUEUE_ID
		,a.tipo_queue_rf TIPO_PEDIDO
		,b.ID DOCUMENTO_ID
		,b.modelo_id MODELO_ID
		,b.lote_id LOTE_ID
		,CASE c.n_parametro
			WHEN 1
				THEN b.parametro01
			WHEN 2
				THEN b.parametro02
			WHEN 3
				THEN b.parametro03
			WHEN 4
				THEN b.parametro04
			WHEN 5
				THEN b.parametro05
			WHEN 6
				THEN b.parametro06
			WHEN 7
				THEN b.parametro07
			WHEN 8
				THEN b.parametro08
			WHEN 9
				THEN b.parametro09
			WHEN 10
				THEN b.parametro10
			WHEN 11
				THEN b.parametro11
			WHEN 12
				THEN b.parametro12
			WHEN 13
				THEN b.parametro13
			WHEN 14
				THEN b.parametro14
			WHEN 15
				THEN b.parametro15
			WHEN 16
				THEN b.parametro16
			WHEN 17
				THEN b.parametro17
			WHEN 18
				THEN b.parametro18
			WHEN 19
				THEN b.parametro19
			WHEN 20
				THEN b.parametro20
			ELSE NULL
			END VALOR_PARAMETRO
		,c.nome NOME_PARAMETRO
		,d.nome_ficheiro NOME_REPORT
		,b.nome_output NOME_FICHEIRO
		,e.username || '/' || e.PASSWORD || '@' || e.connect_string USERID
		,f.servidor SERVIDOR_IMPRESSAO
		,f.endereco ENDERECO_IMPRESSORA
		,f.gsdevice_rf GSDEVICE
		,f.gspapersize_rf GSPAPERSIZE
		,TO_CHAR(b.data_pedido, 'YYYY\MM\DD') DATA_DOCUMENTO
		,b.lote_ordem LOTE_ORDEM
		,'C' TIPO_CONTROLO
		,a.criado_por CRIADO_POR
		,a.atributo01 ATRIBUTO01
		,m.modo_certificado_rf CERTIFICACAO
		,m.modo_impressao_rf MODO_IMPRESSAO
		,M.MODO_EXPEDICAO_RF MODO_EXPEDICAO
		,NULL DIRECTORIA_BACKUP
		,NVL(b.atributo9, 'N') ESTADO_SAFT
		,m.STAMP
		,m.BARCODE_TYPE
		,m.BARCODE_FORMAT
		,m.BARCODE_WEIGHT
		,m.BARCODE_HEIGHT
		,m.BARCODE_X_POSITION
		,m.BARCODE_Y_POSITION
		,NVL(b.arq_id,0) arq_id
	FROM SVR_QUEUE a
		,SVR_DOCUMENTOS b
		,SVR_PARAMETROS_REPORT c
		,SVR_REPORT_SIID d
		,DOC_MODELOS_DOCUMENTO m
		,SVR_AMBIENTES_IMPRESSAO e
		,SVR_IMPRESSORAS f
	WHERE a.estado = 'ESPERA'
		AND a.tipo_queue_rf = 'EXECUCAO'
		AND a.documento_id = b.ID
		AND b.report_id = c.report_id
		AND b.report_id = d.ID
		AND b.ambiente_id = e.ID
		AND NVL(a.impressora_id, B.IMPRESSORA_ID) = f.ID
		AND b.modelo_id = m.id
		AND CASE c.n_parametro
			WHEN 1
				THEN b.parametro01
			WHEN 2
				THEN b.parametro02
			WHEN 3
				THEN b.parametro03
			WHEN 4
				THEN b.parametro04
			WHEN 5
				THEN b.parametro05
			WHEN 6
				THEN b.parametro06
			WHEN 7
				THEN b.parametro07
			WHEN 8
				THEN b.parametro08
			WHEN 9
				THEN b.parametro09
			WHEN 10
				THEN b.parametro10
			WHEN 11
				THEN b.parametro11
			WHEN 12
				THEN b.parametro12
			WHEN 13
				THEN b.parametro13
			WHEN 14
				THEN b.parametro14
			WHEN 15
				THEN b.parametro15
			WHEN 16
				THEN b.parametro16
			WHEN 17
				THEN b.parametro17
			WHEN 18
				THEN b.parametro18
			WHEN 19
				THEN b.parametro19
			WHEN 20
				THEN b.parametro20
			ELSE NULL
			END IS NOT NULL

	UNION ALL

	SELECT /*+ ordered */
		a.ID QUEUE_ID
		,a.tipo_queue_rf TIPO_PEDIDO
		,b.ID DOCUMENTO_ID
		,b.modelo_id MODELO_ID
		,b.lote_id LOTE_ID
		,a.atributo01 VALOR_PARAMETRO
		,'address' NOME_PARAMETRO
		,d.nome_ficheiro NOME_REPORT
		,b.nome_output NOME_FICHEIRO
		,NULL USERID
		,NULL SERVIDOR_IMPRESSAO
		,NULL ENDERECO_IMPRESSORA
		,NULL GSDEVICE
		,NULL GSPAPERSIZE
		,TO_CHAR(b.data_pedido, 'YYYY\MM\DD') DATA_DOCUMENTO
		,b.lote_ordem LOTE_ORDEM
		,'C' TIPO_CONTROLO
		,a.criado_por CRIADO_POR
		,a.atributo01 ATRIBUTO01
		,m.modo_certificado_rf CERTIFICACAO
		,M.MODO_IMPRESSAO_RF MODO_IMPRESSAO
		,M.MODO_EXPEDICAO_RF MODO_EXPEDICAO
		,NULL DIRECTORIA_BACKUP
		,NVL(b.atributo9, 'N') ESTADO_SAFT
		,m.STAMP
		,m.BARCODE_TYPE
		,m.BARCODE_FORMAT
		,m.BARCODE_WEIGHT
		,m.BARCODE_HEIGHT
		,m.BARCODE_X_POSITION
		,m.BARCODE_Y_POSITION
		,NVL(b.arq_id,0) arq_id
	FROM SVR_QUEUE a
		,SVR_DOCUMENTOS b
		,SVR_REPORT_SIID d
		,SVR_AMBIENTES_IMPRESSAO e
		,DOC_MODELOS_DOCUMENTO m
	WHERE a.estado = 'ESPERA'
		AND a.tipo_queue_rf = 'EMAIL'
		AND a.documento_id = b.ID
		AND b.report_id = d.ID
		AND b.ambiente_id = e.ID
		AND b.modelo_id = m.id

	UNION ALL

	SELECT /*+ ordered USE_NL(A B F)*/
		a.ID QUEUE_ID
		,a.tipo_queue_rf TIPO_PEDIDO
		,b.ID DOCUMENTO_ID
		,b.modelo_id MODELO_ID
		,b.lote_id LOTE_ID
		,CASE C.N_PARAMETRO
			WHEN 1
				THEN b.parametro01
			WHEN 2
				THEN b.parametro02
			WHEN 3
				THEN b.parametro03
			WHEN 4
				THEN b.parametro04
			WHEN 5
				THEN b.parametro05
			WHEN 6
				THEN b.parametro06
			WHEN 7
				THEN b.parametro07
			WHEN 8
				THEN b.parametro08
			WHEN 9
				THEN b.parametro09
			WHEN 10
				THEN b.parametro10
			WHEN 11
				THEN b.parametro11
			WHEN 12
				THEN b.parametro12
			WHEN 13
				THEN b.parametro13
			WHEN 14
				THEN b.parametro14
			WHEN 15
				THEN b.parametro15
			WHEN 16
				THEN b.parametro16
			WHEN 17
				THEN B.PARAMETRO17
			WHEN 18
				THEN b.parametro18
			WHEN 19
				THEN b.parametro19
			WHEN 20
				THEN B.PARAMETRO20
			ELSE NULL
			END VALOR_PARAMETRO
		,C.NOME NOME_PARAMETRO
		,d.nome_ficheiro NOME_REPORT
		,b.nome_output NOME_FICHEIRO
		,NULL USERID
		,f.servidor SERVIDOR_IMPRESSAO
		,f.endereco ENDERECO_IMPRESSORA
		,f.gsdevice_rf GSDEVICE
		,f.gspapersize_rf GSPAPERSIZE
		,TO_CHAR(b.data_pedido, 'YYYY\MM\DD') DATA_DOCUMENTO
		,b.lote_ordem LOTE_ORDEM
		,'C' TIPO_CONTROLO
		,a.criado_por CRIADO_POR
		,a.atributo01 ATRIBUTO01
		,m.modo_certificado_rf CERTIFICACAO
		,m.modo_impressao_rf MODO_IMPRESSAO
		,M.MODO_EXPEDICAO_RF MODO_EXPEDICAO
		,(
			SELECT DESTINO
			FROM SVR_BACKUPS BCK
			WHERE bck.ID = B.BACKUP_ID
			) DIRECTORIA_BACKUP
		,NVL(B.atributo9, 'N') ESTADO_SAFT
		,m.STAMP
		,m.BARCODE_TYPE
		,m.BARCODE_FORMAT
		,m.BARCODE_WEIGHT
		,m.BARCODE_HEIGHT
		,m.BARCODE_X_POSITION
		,m.BARCODE_Y_POSITION
		,NVL(b.arq_id,0) arq_id
	FROM SVR_QUEUE a
		,SVR_DOCUMENTOS B
		,SVR_PARAMETROS_REPORT c
		,SVR_REPORT_SIID d
		,SVR_AMBIENTES_IMPRESSAO e
		,DOC_MODELOS_DOCUMENTO M
		,SVR_IMPRESSORAS f
	WHERE a.estado = 'ESPERA'
		AND a.tipo_queue_rf NOT IN (
			'EMAIL'
			,'EXECUCAO'
			)
		AND a.documento_id = b.ID
		AND B.REPORT_ID = C.REPORT_ID
		AND b.report_id = d.ID
		AND b.ambiente_id = e.ID
		AND NVL(a.impressora_id, B.IMPRESSORA_ID) = f.ID
		AND b.modelo_id = m.id
		AND CASE C.N_PARAMETRO
			WHEN 1
				THEN B.PARAMETRO01
			WHEN 2
				THEN b.parametro02
			WHEN 3
				THEN B.PARAMETRO03
			WHEN 4
				THEN b.parametro04
			WHEN 5
				THEN B.PARAMETRO05
			WHEN 6
				THEN b.parametro06
			WHEN 7
				THEN B.PARAMETRO07
			WHEN 8
				THEN b.parametro08
			WHEN 9
				THEN b.parametro09
			WHEN 10
				THEN b.parametro10
			WHEN 11
				THEN B.PARAMETRO11
			WHEN 12
				THEN b.parametro12
			WHEN 13
				THEN B.PARAMETRO13
			WHEN 14
				THEN b.parametro14
			WHEN 15
				THEN B.PARAMETRO15
			WHEN 16
				THEN b.parametro16
			WHEN 17
				THEN B.PARAMETRO17
			WHEN 18
				THEN b.parametro18
			WHEN 19
				THEN B.PARAMETRO19
			WHEN 20
				THEN B.PARAMETRO20
			ELSE NULL
			END IS NOT NULL
	)
```
