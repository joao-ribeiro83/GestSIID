# MRECIBO

Owner: `GADOR_TESTES` &nbsp; Type: `TABLE`

Row count: **949121**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  | Código Unidad Económica |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  | Codigo del Producto  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  | Estado |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  | Numero de Poliza |
| NMSUPLEM | NUMBER | 22 | 18 | 0 | N |  | Numero del Suplemento |
| NMRECIBO | NUMBER | 22 | 10 | 0 | N |  | Numero de recibo |
| TIPORECI | NUMBER | 22 | 2 | 0 | N |  | Tipo de Recibo |
| FEINICIO | DATE | 7 |  |  | N |  | Data de inicio |
| FEFINAL | DATE | 7 |  |  | N |  | Data final |
| FEEMISIO | DATE | 7 |  |  | N |  | Data de emissão |
| CDESTADO | NUMBER | 22 | 2 | 0 | N |  | Estado del recibo |
| FEESTADO | DATE | 7 |  |  | N |  | Data Estado |
| PTIMPORT | NUMBER | 22 | 17 | 5 | N |  | Importe |
| CDMOTANU | NUMBER | 22 | 2 | 0 | Y |  | Motivo de anulacion |
| PTIMPOR2 | NUMBER | 22 | 17 | 5 | Y |  | importe de pagos a cuenta |
| FEEXPEDI | DATE | 7 |  |  | Y |  | Data expedicion del recibo |
| CDGESTOR | VARCHAR2 | 10 |  |  | Y |  | Codigo del gestor de cobro |
| CDDEVCIA | VARCHAR2 | 4 |  |  | Y |  | Motivo de devolucion de la compañia |
| NMIMPRES | NUMBER | 22 | 3 | 0 | Y |  | Numero de impresiones |
| SWFINANC | VARCHAR2 | 1 |  |  | Y |  | Participacion Financiera S/N |
| CDAGRUPA | NUMBER | 22 | 6 | 0 | N |  | Codigo agrupador situaciones |
| NMRECINUE | NUMBER | 22 | 10 | 0 | Y |  | Número de recibo nuevo |
| CDPERSON | NUMBER | 22 | 9 | 0 | Y |  | Número único de Persona |
| FEEXIGIB | DATE | 7 |  |  | Y |  | Data de exigibilidad |
| CDARCBR | VARCHAR2 | 1 |  |  | Y |  | Area de cobranza(T/S/N) |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| CO_MRECIBO6 | NONUNIQUE | CDUNIECO | 1 |
| CO_MRECIBO6 | NONUNIQUE | CDPERSON | 2 |
| MRECIBO1 | UNIQUE | CDUNIECO | 1 |
| MRECIBO1 | UNIQUE | NMRECIBO | 2 |
| MRECIBO2 | NONUNIQUE | CDUNIECO | 1 |
| MRECIBO2 | NONUNIQUE | CDRAMO | 2 |
| MRECIBO2 | NONUNIQUE | ESTADO | 3 |
| MRECIBO2 | NONUNIQUE | NMPOLIZA | 4 |
| MRECIBO2 | NONUNIQUE | NMSUPLEM | 5 |
| MRECIBO2 | NONUNIQUE | FEINICIO | 6 |
| MRECIBO3 | NONUNIQUE | CDUNIECO | 1 |
| MRECIBO3 | NONUNIQUE | CDRAMO | 2 |
| MRECIBO3 | NONUNIQUE | NMPOLIZA | 3 |
| MRECIBO3 | NONUNIQUE | NMRECIBO | 4 |
| MRECIBO4 | NONUNIQUE | CDESTADO | 1 |
| MRECIBO5 | NONUNIQUE | FEEMISIO | 1 |
| MRECIBO6 | UNIQUE | TIPORECI | 1 |
| MRECIBO6 | UNIQUE | NMRECINUE | 2 |
| MRECIBO_I_3 | NONUNIQUE | CDUNIECO | 1 |
| MRECIBO_I_3 | NONUNIQUE | CDRAMO | 2 |
| MRECIBO_I_3 | NONUNIQUE | ESTADO | 3 |
| MRECIBO_I_3 | NONUNIQUE | NMPOLIZA | 4 |
| MRECIBO_I_3 | NONUNIQUE | CDESTADO | 5 |
| MRECIBO_I_3 | NONUNIQUE | FEESTADO | 6 |

