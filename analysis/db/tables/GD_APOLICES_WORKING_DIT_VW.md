# GD_APOLICES_WORKING_DIT_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| NMSUPLEM | NUMBER | 22 | 18 | 0 | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT a.cdunieco
	, a.cdramo
	, a.estado
	, a.nmpoliza
	, b.NMSUPLEM
FROM tlocksup a
	, msupleme b
WHERE a.CDUNIECO = b.CDUNIECO
	AND a.cdramo = b.cdramo
	AND a.ESTADO = b.ESTADO
	AND a.NMPOLIZA = b.NMPOLIZA
	AND a.NSUPLOGI = b.NSUPLOGI
```
