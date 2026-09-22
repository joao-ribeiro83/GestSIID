# GD_GRUPOS_ENTIDADE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GRUPO | VARCHAR2 | 4 |  |  | N |  |  |
| PAI | NUMBER | 22 |  |  | Y |  |  |
| FILHO | NUMBER | 22 | 9 | 0 | N |  |  |
| PERCREL | NUMBER | 22 | 5 | 2 | N |  |  |
| SWDOMINA | VARCHAR2 | 1 |  |  | N |  |  |
| DATAALTA | DATE | 7 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select  
CDGRUENT                         GRUPO  
, decode(cdperpai,0, cdperfil,CDPERPAI )   PAI  
, cdperfil                         FILHO  
, PERCREL  
, SWDOMINA  
, DATAALTA  
from  
co_entirel  
START WITH CDPERPAI = 0  
connect by prior cdperfil= cdperpai and prior cdgruent = cdgruent

```
