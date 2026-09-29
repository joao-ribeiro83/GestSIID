# GD_ENTIDADES_EMAILS_VALIDOS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDPERSON | NUMBER | 22 | 9 | 0 | Y |  |  |
| E_MAIL | VARCHAR2 | 70 |  |  | Y |  |  |
| FONTE | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT ent.cdperson
	,trim(ent.e_mail) e_mail
	,1 fonte
FROM mpersona ent
WHERE ent.e_mail IS NOT NULL
	AND regexp_count(ent.e_mail, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$') > 0

UNION ALL

SELECT ent.cdperson
	,trim(ent.dsemail) e_mail
	,2 fonte
FROM mdomicil ent
WHERE ent.dsemail IS NOT NULL
	AND regexp_count(ent.dsemail, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$') > 0
```
