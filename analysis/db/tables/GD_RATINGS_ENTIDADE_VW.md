# GD_RATINGS_ENTIDADE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NMORDINA | NUMBER | 22 | 18 | 0 | N |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| NMMODELO | NUMBER | 22 | 4 | 0 | Y |  |  |
| CDVALOR | VARCHAR2 | 4 |  |  | Y |  |  |
| FEPROCES | DATE | 7 |  |  | N |  |  |
| STATUS | VARCHAR2 | 1 |  |  | N |  |  |
| CDANALIS | VARCHAR2 | 30 |  |  | Y |  |  |
| FEANALIS | DATE | 7 |  |  | Y |  |  |
| CDDECISO | VARCHAR2 | 30 |  |  | Y |  |  |
| FEDECISO | DATE | 7 |  |  | Y |  |  |
| NMPEDIDO | VARCHAR2 | 10 |  |  | Y |  |  |
| NMEVENTO | NUMBER | 22 | 3 | 0 | Y |  |  |
| CDIDUSR | VARCHAR2 | 30 |  |  | Y |  |  |
| CREATED_DATE | DATE | 7 |  |  | Y |  |  |
| SWMANUAL | VARCHAR2 | 1 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT
  RATING.NMORDINA
, RATING.CDPERSON
, RATING.NMMODELO
, RATING.CDVALOR
, RATING.FEPROCES
, RATING.STATUS
, RATING.CDANALIS
, RATING.FEANALIS
, RATING.CDDECISO
, RATING.FEDECISO
, RATING.NMPEDIDO
, RATING.NMEVENTO
, RATING.CDIDUSR
, RATING.CREATED_DATE
, RATING.SWMANUAL
FROM
  MPROCMOD RATING
WHERE
  RATING.NMORDINA = (
                      SELECT
                        Max(X.NMORDINA)
                      FROM
                        MPROCMOD X
                      WHERE
                        X.CDPERSON = RATING.CDPERSON
                    )
```
