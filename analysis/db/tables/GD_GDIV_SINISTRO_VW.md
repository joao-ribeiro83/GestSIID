# GD_GDIV_SINISTRO_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDTIPORA | VARCHAR2 | 1 |  |  | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| AAAPERTU | NUMBER | 22 | 4 | 0 | Y |  |  |
| STATUS | VARCHAR2 | 1 |  |  | Y |  |  |
| NMSINIES | NUMBER | 22 | 6 | 0 | Y |  |  |
| NMCOMAME | NUMBER | 22 | 10 | 0 | N |  |  |
| NMPROAME | NUMBER | 22 | 10 | 0 | N |  |  |
| TASACAMB | NUMBER | 22 | 17 | 5 | Y |  |  |
| FEASURIE | DATE | 7 |  |  | Y |  |  |
| NMLIMRES | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT CDUNIECO
	,CDTIPORA
	,CDRAMO
	,AAAPERTU
	,STATUS
	,NMSINIES
	,NMCOMAME
	,NMPROAME
	,TASACAMB
	,MAX(FEASURIE) FEASURIE
	,SUM(NMLIMRES) NMLIMRES
FROM CO_GRDEU
WHERE 1 = 1
GROUP BY CDUNIECO
	,CDTIPORA
	,CDRAMO
	,AAAPERTU
	,STATUS
	,NMSINIES
	,NMCOMAME
	,NMPROAME
	,TASACAMB
```
