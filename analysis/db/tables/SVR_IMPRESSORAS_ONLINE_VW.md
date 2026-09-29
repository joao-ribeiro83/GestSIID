# SVR_IMPRESSORAS_ONLINE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DESCRICAO_IMPRESSORA | VARCHAR2 | 483 |  |  | Y |  |  |
| ID_IMPRESSORA | VARCHAR2 | 30 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT ALL DESCRICAO || ' - ' || ENDERECO DESCRICAO_IMPRESSORA
	,ID ID_IMPRESSORA
FROM SVR_IMPRESSORAS
WHERE valido = 'S'
	AND ENDERECO NOT LIKE '%2PAMD%'
```
