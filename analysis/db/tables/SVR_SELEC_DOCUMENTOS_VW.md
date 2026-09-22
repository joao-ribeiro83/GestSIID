# SVR_SELEC_DOCUMENTOS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE_ID | NUMBER | 22 |  |  | Y |  |  |
| ESTADO | VARCHAR2 | 71 |  |  | Y |  |  |
| ID | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
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
SELECT SVR_GESTAO_SIID_TMP.table_id 
,      svr_documentos_vw."ESTADO",svr_documentos_vw."ID",svr_documentos_vw."MODELO_ID",svr_documentos_vw."REPORT_ID",svr_documentos_vw."AMBIENTE_ID",svr_documentos_vw."IMPRESSORA_ID",svr_documentos_vw."LOTE_ORDEM",svr_documentos_vw."N_IMPRESSOES",svr_documentos_vw."N_ANEXOS",svr_documentos_vw."N_COPIAS",svr_documentos_vw."N_CAPAS",svr_documentos_vw."N_VIAS",svr_documentos_vw."LOTE_ID",svr_documentos_vw."N_REFERENCIA",svr_documentos_vw."ULTIMA_VIA_POR",svr_documentos_vw."IMPRESSO_POR",svr_documentos_vw."DATA_IMPRESSAO",svr_documentos_vw."DATA_PEDIDO",svr_documentos_vw."TIPO_OUTPUT",svr_documentos_vw."NOME_OUTPUT",svr_documentos_vw."IDOC",svr_documentos_vw."VERSAO",svr_documentos_vw."DATA_ARQUIVO",svr_documentos_vw."ARQUIVADO",svr_documentos_vw."CRIADO_POR",svr_documentos_vw."EXECUTADO_POR",svr_documentos_vw."DATA_EXECUCAO",svr_documentos_vw."DESTINATARIO",svr_documentos_vw."MORADA",svr_documentos_vw."CODIGO_POSTAL",svr_documentos_vw."PAIS",svr_documentos_vw."ATRIBUTO1",svr_documentos_vw."ATRIBUTO2",svr_documentos_vw."ATRIBUTO3",svr_documentos_vw."ATRIBUTO4",svr_documentos_vw."ATRIBUTO5",svr_documentos_vw."N_FOLHAS",svr_documentos_vw."DATA_AUDITORIA",svr_documentos_vw."PARAMETRO01",svr_documentos_vw."PARAMETRO02",svr_documentos_vw."PARAMETRO03",svr_documentos_vw."PARAMETRO04",svr_documentos_vw."PARAMETRO05",svr_documentos_vw."PARAMETRO06",svr_documentos_vw."PARAMETRO07",svr_documentos_vw."PARAMETRO08",svr_documentos_vw."PARAMETRO09",svr_documentos_vw."PARAMETRO10",svr_documentos_vw."PARAMETRO11",svr_documentos_vw."PARAMETRO12",svr_documentos_vw."PARAMETRO13",svr_documentos_vw."PARAMETRO14",svr_documentos_vw."PARAMETRO15",svr_documentos_vw."PARAMETRO16",svr_documentos_vw."PARAMETRO17",svr_documentos_vw."PARAMETRO18",svr_documentos_vw."PARAMETRO19",svr_documentos_vw."PARAMETRO20",svr_documentos_vw."ATRIBUTO6",svr_documentos_vw."ATRIBUTO7",svr_documentos_vw."ATRIBUTO8",svr_documentos_vw."ATRIBUTO9",svr_documentos_vw."BACKUP_ID",svr_documentos_vw."DISPONIBILIDADE",svr_documentos_vw."TAMANHO_BYTES" 
FROM   svr_documentos_vw 
,      SVR_GESTAO_SIID_TMP 
WHERE  svr_documentos_vw.id = SVR_GESTAO_SIID_TMP.tmp_id 
```
