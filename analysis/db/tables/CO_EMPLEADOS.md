# CO_EMPLEADOS

Owner: `GADOR_TESTES` &nbsp; Type: `TABLE`

Row count: **558**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDEMPLEA | VARCHAR2 | 30 |  |  | N |  | Codigo do empleado |
| TIPEMPLEA | VARCHAR2 | 2 |  |  | N |  | Tipo de Empregado |
| SWACTIVO | VARCHAR2 | 1 |  |  | N |  | Indicador de activo S,N |
| FECALTA | DATE | 7 |  |  | N |  | Data de Alta |
| FEULTMOD | DATE | 7 |  |  | N |  | Data de Ultima Modificacion |
| SWDECISO | VARCHAR2 | 1 |  |  | Y |  | Indicador de Capacidade de deciss?o |
| SWNIF | VARCHAR2 | 1 |  |  | Y |  | Indica se o empregado tem autorizac?o para manutenc?o de entidades |
| SWDGR | VARCHAR2 | 1 |  |  | Y |  | Indicador de DGR |
| CDNIVEL | NUMBER | 22 | 2 | 0 | Y |  | Nivel de Deciss?o de empregado  |
| CDDEPARTA | VARCHAR2 | 3 |  |  | Y |  | Codigo de Departamento |
| SWDIT | VARCHAR2 | 1 |  |  | Y |  | Indicador departamento DIT |
| SWANALIS | VARCHAR2 | 1 |  |  | Y |  | Utilizadores n?o aparecam nas listas da analise de risco |
| SWPC | VARCHAR2 | 1 |  |  | Y |  | Switch validac?o ecr?s Plafond Cauc?o |
| SWGPCR | VARCHAR2 | 1 |  |  | Y |  | Switch que indica que utilizadores podem alterar o plafond de crédito na gestão do evento GP |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| SYS_C0059309 | P | CDEMPLEA | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| SYS_C0059309 | UNIQUE | CDEMPLEA | 1 |

