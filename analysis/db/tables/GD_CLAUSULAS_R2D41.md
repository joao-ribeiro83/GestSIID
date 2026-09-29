# GD_CLAUSULAS_R2D41

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1101**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EBOND_DOC_ID | NUMBER | 22 | 10 | 0 | N |  | Número Interno do sistema EBOND para o documento de cláusulas da apólice |
| N_ORDEM | NUMBER | 22 |  |  | N |  | Ordem de apresentação da Cláusula dentro das clausulas do documento de cláusulas. |
| UE | NUMBER | 22 | 3 | 0 | N |  | Código da unidade económica |
| RAMO | NUMBER | 22 | 3 | 0 | N |  | Código do ramo da apólice |
| APOLICE | NUMBER | 22 | 10 | 0 | Y |  | Número da apólice |
| TIPO_DECLARACAO | VARCHAR2 | 30 |  |  | N |  | Tipo de declaração associado a apólices (número de 3 dígitos) |
| TIPO_VIGENCIA | VARCHAR2 | 30 |  |  | N |  | Tipo de vigência associado a apólices (Temporária ou Renovável) |
| ALINEA | NUMBER | 22 |  |  | Y |  | Ordem de apresentação da Cláusula para o template do documento R2D41 (Cláusula Permanente) |
| TITULO | VARCHAR2 | 60 |  |  | Y |  | Usado como código da alinea da cláusula. |
| TEXTO | VARCHAR2 | 2000 |  |  | Y |  | Texto da Cláusula |
| TIPO_ALTERACAO_RF | CHAR | 1 |  |  | N | 'P'  | Indicador se a cláusula é para actualizar a tabela das secções do modelo R2D41 ([P]rovisório/[D]efinitivo)  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | N |  | Utilizador que criou o registro |
| DATA_CRIACAO | DATE | 7 |  |  | N |  | Data de criação do registro |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GCR2D41 | P | EBOND_DOC_ID | 1 |
| PK_CHAVE_GCR2D41 | P | N_ORDEM | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_APOLICE_GCR2D41 | NONUNIQUE | UE | 1 |
| IDX_APOLICE_GCR2D41 | NONUNIQUE | RAMO | 2 |
| IDX_APOLICE_GCR2D41 | NONUNIQUE | APOLICE | 3 |
| IDX_INTEGRIDADE_GCR2D41 | NONUNIQUE | UE | 1 |
| IDX_INTEGRIDADE_GCR2D41 | NONUNIQUE | RAMO | 2 |
| IDX_INTEGRIDADE_GCR2D41 | NONUNIQUE | TIPO_DECLARACAO | 3 |
| IDX_INTEGRIDADE_GCR2D41 | NONUNIQUE | TIPO_VIGENCIA | 4 |
| IDX_INTEGRIDADE_GCR2D41 | NONUNIQUE | EBOND_DOC_ID | 5 |
| IDX_INTEGRIDADE_GCR2D41 | NONUNIQUE | ALINEA | 6 |
| PK_CHAVE_GCR2D41 | UNIQUE | EBOND_DOC_ID | 1 |
| PK_CHAVE_GCR2D41 | UNIQUE | N_ORDEM | 2 |

