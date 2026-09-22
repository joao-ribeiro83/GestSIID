# MPERSONA

Owner: `GADOR_TESTES` &nbsp; Type: `TABLE`

Row count: **2635197**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  | Número único de Persona |
| CDTIPIDE | VARCHAR2 | 1 |  |  | N |  | Tipo de identificador de persona |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  | Codigo del  identificador de persona |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  | Nombre completo de la persona |
| CDTIPPER | VARCHAR2 | 2 |  |  | Y |  | Tipo de persona |
| OTFISJUR | VARCHAR2 | 1 |  |  | Y |  | Indicador de persona fisica/juridica |
| OTSEXO | VARCHAR2 | 1 |  |  | Y |  | Indicador del sexo de la persona |
| FENACIMI | DATE | 7 |  |  | Y |  | Data de nacimiento |
| DSNOMBR1 | VARCHAR2 | 20 |  |  | Y |  | descripcion del primer nombre |
| DSNOMBR2 | VARCHAR2 | 20 |  |  | Y |  | Descripcion del segundo nombre |
| DSAPELL1 | VARCHAR2 | 20 |  |  | Y |  | Descripcion del primer apellido |
| DSAPELL2 | VARCHAR2 | 20 |  |  | Y |  | Descripcion del segundo apellido |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  | Codigo del pais |
| FECALTA | DATE | 7 |  |  | Y |  | Data de validez |
| CDNATJUR | VARCHAR2 | 4 |  |  | Y |  | Código de Natureza Juridica |
| E_MAIL | VARCHAR2 | 70 |  |  | Y |  | Dirección de e_mail |
| PAG_WEB | VARCHAR2 | 60 |  |  | Y |  | pagina web |
| FECBAJA | DATE | 7 |  |  | Y |  | Data de fim de validez |
| CDESTACIVI | VARCHAR2 | 1 |  |  | Y |  | Codigo del estado civil |
| ID_TYP_C | VARCHAR2 | 8 |  |  | Y |  | Tipo de identificador |
| CDESTIRP | VARCHAR2 | 2 |  |  | Y |  | Estado de processo de entidade em sincronização com IRP |
| FECREAC | DATE | 7 |  |  | Y |  | Data de reactivação da Entidade |
| MOTBAJA | VARCHAR2 | 3 |  |  | Y |  | Motivo eliminação da Entidade |
| MOTREAC | VARCHAR2 | 3 |  |  | Y |  | Motivo reactivação da Entidade |
| SWESTADO | VARCHAR2 | 1 |  |  | Y |  | Campo de Estado |
| CDNAJUIRP | VARCHAR2 | 30 |  |  | Y |  | Naturaleza Juridica comunicada por IRP |
| DSNOMBRE_TEXT | VARCHAR2 | 160 |  |  | Y |  | Nombre completo de la persona (sin caracteres especiales) |
| CDGRDSB | VARCHAR2 | 4 |  |  | Y |  | Grau de sensibilidade |
| SANCECO | VARCHAR2 | 1 |  |  | Y |  | Entidade sujeita a sanção económica (S/N) |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| SYS_C0059632 | P | CDPERSON | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| MPERSONA2 | NONUNIQUE | CDTIPIDE | 1 |
| MPERSONA2 | NONUNIQUE | CDIDEPER | 2 |
| MPERSONA3 | NONUNIQUE | DSNOMBRE | 1 |
| MPERSONA4 | NONUNIQUE | OTFISJUR | 1 |
| MPERSONA5 | NONUNIQUE | CDPAIS | 1 |
| MPERSONA_NAME_IDX003 | NONUNIQUE | DSNOMBRE_TEXT | 1 |
| MPERSONA_PK | UNIQUE | CDPERSON | 1 |

