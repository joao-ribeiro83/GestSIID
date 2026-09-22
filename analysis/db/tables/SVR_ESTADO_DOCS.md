# SVR_ESTADO_DOCS

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| ESTADO_DOC | VARCHAR2 | 71 |  |  | Y |  |  |
| LAST_QUEUE | VARCHAR2 | 10 |  |  | Y |  |  |
| ESTADO_EXEC | VARCHAR2 | 60 |  |  | Y |  |  |
| ESTADO_IMPR | VARCHAR2 | 60 |  |  | Y |  |  |
| ESTADO_ENV | VARCHAR2 | 60 |  |  | Y |  |  |
| ESTADO_MAIL | VARCHAR2 | 60 |  |  | Y |  |  |
| ESTADO_VIAS | VARCHAR2 | 60 |  |  | Y |  |  |
| ESTADO_REENV | VARCHAR2 | 60 |  |  | Y |  |  |
| DT_START_EXEC | DATE | 7 |  |  | Y |  |  |
| DT_START_IMPR | DATE | 7 |  |  | Y |  |  |
| DT_START_ENV | DATE | 7 |  |  | Y |  |  |
| DT_START_MAIL | DATE | 7 |  |  | Y |  |  |
| DT_START_VIAS | DATE | 7 |  |  | Y |  |  |
| DT_START_REENV | DATE | 7 |  |  | Y |  |  |
| DT_FIM_EXEC | DATE | 7 |  |  | Y |  |  |
| DT_FIM_IMPR | DATE | 7 |  |  | Y |  |  |
| DT_FIM_ENV | DATE | 7 |  |  | Y |  |  |
| DT_FIM_MAIL | DATE | 7 |  |  | Y |  |  |
| DT_FIM_VIAS | DATE | 7 |  |  | Y |  |  |
| DT_FIM_REENV | DATE | 7 |  |  | Y |  |  |
| RES_EXEC | VARCHAR2 | 2000 |  |  | Y |  |  |
| RES_IMPR | VARCHAR2 | 2000 |  |  | Y |  |  |
| RES_ENV | VARCHAR2 | 2000 |  |  | Y |  |  |
| RES_MAIL | VARCHAR2 | 2000 |  |  | Y |  |  |
| RES_VIAS | VARCHAR2 | 2000 |  |  | Y |  |  |
| RES_REENV | VARCHAR2 | 2000 |  |  | Y |  |  |
| REPORT_ID | NUMBER | 22 |  |  | Y |  |  |
| AMBIENTE_ID | VARCHAR2 | 30 |  |  | Y |  |  |
| IMPRESSORA_ID | VARCHAR2 | 30 |  |  | Y |  |  |
| LOTE_ORDEM | NUMBER | 22 |  |  | Y |  |  |
| N_IMPRESSOES | NUMBER | 22 |  |  | Y |  |  |
| N_ANEXOS | NUMBER | 22 |  |  | Y |  |  |
| N_COPIAS | NUMBER | 22 |  |  | Y |  |  |
| N_CAPAS | NUMBER | 22 |  |  | Y |  |  |
| N_VIAS | NUMBER | 22 |  |  | Y |  |  |
| LOTE_ID | NUMBER | 22 |  |  | Y |  |  |
| N_REFERENCIA | VARCHAR2 | 60 |  |  | Y |  |  |
| ULTIMA_VIA_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| IMPRESSO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_IMPRESSAO | DATE | 7 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| TIPO_OUTPUT | VARCHAR2 | 5 |  |  | Y |  |  |
| NOME_OUTPUT | VARCHAR2 | 240 |  |  | Y |  |  |
| IDOC | VARCHAR2 | 2000 |  |  | Y |  |  |
| VERSAO | NUMBER | 22 |  |  | Y |  |  |
| DATA_ARQUIVO | DATE | 7 |  |  | Y |  |  |
| ARQUIVADO | VARCHAR2 | 1 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| EXECUTADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_EXECUCAO | DATE | 7 |  |  | Y |  |  |
| DESTINATARIO | VARCHAR2 | 240 |  |  | Y |  |  |
| MORADA | VARCHAR2 | 240 |  |  | Y |  |  |
| CODIGO_POSTAL | VARCHAR2 | 10 |  |  | Y |  |  |
| PAIS | VARCHAR2 | 60 |  |  | Y |  |  |
| ATRIBUTO1 | VARCHAR2 | 255 |  |  | Y |  |  |
| ATRIBUTO2 | VARCHAR2 | 255 |  |  | Y |  |  |
| ATRIBUTO3 | VARCHAR2 | 255 |  |  | Y |  |  |
| ATRIBUTO4 | VARCHAR2 | 255 |  |  | Y |  |  |
| ATRIBUTO5 | VARCHAR2 | 255 |  |  | Y |  |  |
| N_FOLHAS | NUMBER | 22 |  |  | Y |  |  |
| DATA_AUDITORIA | DATE | 7 |  |  | Y |  |  |
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
| ATRIBUTO6 | VARCHAR2 | 255 |  |  | Y |  |  |
| ATRIBUTO7 | VARCHAR2 | 255 |  |  | Y |  |  |
| ATRIBUTO8 | VARCHAR2 | 255 |  |  | Y |  |  |
| ATRIBUTO9 | VARCHAR2 | 255 |  |  | Y |  |  |
| BACKUP_ID | NUMBER | 22 |  |  | Y |  |  |
| DISPONIBILIDADE | VARCHAR2 | 6 |  |  | Y |  |  |
| TAMANHO_BYTES | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ USE_NL(q_exec) USE_NL(q_impr) USE_NL(q_vias) USE_NL(q_reenv)*/
  docs.id
, docs.MODELO_ID
, CASE Q_EXEC.ESTADO
    WHEN 'ESPERA' THEN 'WAIT'
    WHEN 'ENQUEUED' THEN 'EXECUCAO'
    WHEN 'EXECUCAO' THEN 'A EXECUTAR'
    WHEN 'TERMINADO' THEN CASE Q_LAST.TIPO_QUEUE_RF
                            WHEN 'REENVIAR' THEN DECODE(Q_LAST.ESTADO,
                                                       'ESPERA', 'WAIT REENV',
                                                       'ENQUEED', 'REENVIO',
                                                       'EXECUCAO', 'A REENVIAR',
                                                       'TERMINADO', 'REENVIADO',
                                                       Q_LAST.ESTADO || ' REENV')
                            WHEN '2.VIA' THEN DECODE(Q_LAST.ESTADO,
                                                       'ESPERA', 'WAIT 2.VIA',
                                                       'ENQUEED', '2.VIA',
                                                       'EXECUCAO', 'A IMPRIMIR',
                                                       'TERMINADO', 'IMPRESSO',
                                                       Q_LAST.ESTADO || ' 2.VIA')
                            WHEN 'EMAIL' THEN DECODE(Q_LAST.ESTADO,
                                                       'ESPERA', 'WAIT EMAIL',
                                                       'ENQUEED', 'EMAIL',
                                                       'EXECUCAO', 'SENDING',
                                                       'TERMINADO', 'EMAIL SENT',
                                                       Q_LAST.ESTADO || ' EMAIL')
                            WHEN 'ENVIAR' THEN DECODE(Q_LAST.ESTADO,
                                                       'ESPERA', 'WAIT ENVIO',
                                                       'ENQUEED', 'ENVIO',
                                                       'EXECUCAO', 'A ENVIAR',
                                                       'TERMINADO', 'ENVIADO',
                                                       Q_LAST.ESTADO || ' ENVIO')
                            WHEN 'COPIA' THEN DECODE(Q_LAST.ESTADO,
                                                       'ESPERA', 'WAIT COPIA',
                                                       'ENQUEED', 'COPIA',
                                                       'EXECUCAO', 'A COPIAR',
                                                       'TERMINADO', 'COPIADO',
                                                       Q_LAST.ESTADO || ' COPIA')
                            WHEN 'IMPRESSAO' THEN DECODE(Q_LAST.ESTADO,
                                                       'ESPERA', 'WAIT IMP',
                                                       'ENQUEED', 'IMPRESSAO',
                                                       'EXECUCAO', 'A IMPRIMIR',
                                                       'TERMINADO', 'IMPRESSO',
                                                       Q_LAST.ESTADO || ' IMP')
                            WHEN NULL THEN 'GERADO'        
                            ELSE Q_LAST.ESTADO||' '||Q_LAST.TIPO_QUEUE_RF
                          END
    ELSE Q_EXEC.ESTADO
  END AS ESTADO_DOC
, q_last.tipo_queue_rf                                                          LAST_QUEUE                                                     
, q_exec.estado                                                                 estado_exec
, q_impr.estado                                                                 estado_impr
, q_ENV.estado                                                                  estado_ENV
, q_MAIL.estado                                                                 estado_MAIL
, q_vias.estado                                                                 estado_vias
, q_reenv.estado                                                                estado_reenv
, NVL(q_exec.data_execucao, to_date('01011850', 'ddmmyyyy'))                    DT_START_exec
, NVL(q_impr.data_execucao, to_date('01011850', 'ddmmyyyy'))                    DT_START_impr
, NVL(q_env.data_execucao, to_date('01011850', 'ddmmyyyy'))                     DT_START_env
, NVL(q_mail.data_execucao, to_date('01011850', 'ddmmyyyy'))                    DT_START_mail
, NVL(q_vias.data_execucao, to_date('01011850', 'ddmmyyyy'))                    DT_START_vias
, NVL(q_reenv.data_execucao, to_date('01011850', 'ddmmyyyy'))                   DT_START_reenv
, NVL(q_exec.data_FINALIZACAO, to_date('01011850', 'ddmmyyyy'))                 DT_FIM_exec
, NVL(q_impr.data_FINALIZACAO, to_date('01011850', 'ddmmyyyy'))                 DT_FIM_impr
, NVL(q_env.data_FINALIZACAO, to_date('01011850', 'ddmmyyyy'))                  DT_FIM_env
, NVL(q_mail.data_FINALIZACAO, to_date('01011850', 'ddmmyyyy'))                 DT_FIM_mail
, NVL(q_vias.data_FINALIZACAO, to_date('01011850', 'ddmmyyyy'))                 DT_FIM_vias
, NVL(q_reenv.data_FINALIZACAO, to_date('01011850', 'ddmmyyyy'))                DT_FIM_reenv
, q_exec.resultado                                                              RES_exec
, q_impr.resultado                                                              RES_impr
, q_ENV.resultado                                                               RES_ENV
, q_MAIL.resultado                                                              RES_MAIL
, q_vias.resultado                                                              RES_vias
, q_reenv.resultado                                                             RES_reenv
, docs.REPORT_ID
, docs.AMBIENTE_ID
, docs.IMPRESSORA_ID
, docs.LOTE_ORDEM
, docs.N_IMPRESSOES
, docs.N_ANEXOS
, docs.N_COPIAS
, docs.N_CAPAS
, docs.N_VIAS
, docs.LOTE_ID
, docs.N_REFERENCIA
, docs.ULTIMA_VIA_POR
, docs.IMPRESSO_POR
, docs.DATA_IMPRESSAO
, docs.DATA_PEDIDO
, docs.TIPO_OUTPUT
, docs.NOME_OUTPUT
, docs.IDOC
, docs.VERSAO
, docs.DATA_ARQUIVO
, docs.ARQUIVADO
, docs.CRIADO_POR
, docs.EXECUTADO_POR
, docs.DATA_EXECUCAO
, docs.DESTINATARIO
, docs.MORADA
, docs.CODIGO_POSTAL
, docs.PAIS
, docs.ATRIBUTO1
, docs.ATRIBUTO2
, docs.ATRIBUTO3
, docs.ATRIBUTO4
, docs.ATRIBUTO5
, docs.N_FOLHAS
, docs.DATA_AUDITORIA
, docs.PARAMETRO01
, docs.PARAMETRO02
, docs.PARAMETRO03
, docs.PARAMETRO04
, docs.PARAMETRO05
, docs.PARAMETRO06
, docs.PARAMETRO07
, docs.PARAMETRO08
, docs.PARAMETRO09
, docs.PARAMETRO10
, docs.PARAMETRO11
, docs.PARAMETRO12
, docs.PARAMETRO13
, docs.PARAMETRO14
, docs.PARAMETRO15
, docs.PARAMETRO16
, docs.PARAMETRO17
, docs.PARAMETRO18
, docs.PARAMETRO19
, docs.PARAMETRO20
, docs.ATRIBUTO6
, docs.ATRIBUTO7
, docs.ATRIBUTO8
, docs.ATRIBUTO9
, docs.BACKUP_ID
, NVL(docs.DISPONIVEL_RF, 'ONLINE') DISPONIBILIDADE
, docs.TAMANHO_BYTES
FROM 
  svr_documentos docs
, svr_queue q_exec
, svr_queue q_impr
, svr_queue q_env
, svr_queue q_mail
, svr_queue q_vias
, svr_queue q_reenv
, SVR_QUEUE Q_LAST
WHERE 1=1 
AND q_last.documento_id(+) = docs.ID
AND NVL(q_last.ID, - 1) = (
					SELECT DECODE(q_last.ID, NULL, - 1, MAX(ID))
					FROM svr_queue
					WHERE documento_id = docs.ID
                    AND TIPO_QUEUE_RF != 'EXECUCAO'
                    AND tipo_queue_rf = q_last.tipo_queue_rf
					)
AND q_exec.documento_id(+) = docs.ID
AND q_exec.tipo_queue_rf(+) = 'EXECUCAO'
AND NVL(q_exec.ID, - 1) = (
					SELECT DECODE(q_exec.ID, NULL, - 1, MAX(ID))
					FROM svr_queue
					WHERE documento_id = docs.ID
						AND tipo_queue_rf = 'EXECUCAO'
					)
AND q_impr.documento_id(+) = docs.ID
AND q_impr.tipo_queue_rf(+) = 'IMPRESSAO'
				AND NVL(q_impr.ID, - 1) = (
					SELECT DECODE(q_impr.ID, NULL, - 1, MAX(ID))
					FROM svr_queue
					WHERE documento_id = docs.ID
						AND tipo_queue_rf = 'IMPRESSAO'
					)
AND q_ENV.documento_id(+) = docs.ID
AND q_ENV.tipo_queue_rf(+) = 'ENVIAR'
AND NVL(q_env.ID, - 1) = (
					SELECT DECODE(q_env.ID, NULL, - 1, MAX(ID))
					FROM svr_queue
					WHERE documento_id = docs.ID
						AND tipo_queue_rf = 'ENVIAR'
					)
AND q_mail.documento_id(+) = docs.ID
AND q_mail.tipo_queue_rf(+) = 'EMAIL'
AND NVL(q_MAIL.ID, - 1) = (
					SELECT DECODE(q_MAIL.ID, NULL, - 1, MAX(ID))
					FROM svr_queue
					WHERE documento_id = docs.ID
						AND tipo_queue_rf = 'EMAIL'
					)
AND q_vias.documento_id(+) = docs.ID
AND q_vias.tipo_queue_rf(+) = '2.VIA'
AND NVL(q_vias.ID, - 1) = (
					SELECT DECODE(q_vias.ID, NULL, - 1, MAX(ID))
					FROM svr_queue
					WHERE documento_id = docs.ID
						AND tipo_queue_rf = '2.VIA'
					)
AND q_reenv.documento_id(+) = docs.ID
AND q_reenv.tipo_queue_rf(+) = 'REENVIAR'
AND NVL(q_reenv.ID, - 1) = (
					SELECT DECODE(q_reenv.ID, NULL, - 1, MAX(ID))
					FROM svr_queue
					WHERE documento_id = docs.ID
						AND tipo_queue_rf = 'REENVIAR'
					)
order by docs.id desc
```
