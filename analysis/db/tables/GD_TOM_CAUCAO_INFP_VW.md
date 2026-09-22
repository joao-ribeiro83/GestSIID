# GD_TOM_CAUCAO_INFP_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  |  |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  |  |
| SWENVIANOTIF | VARCHAR2 | 1 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select a.cdperson, b.cdideper, b.dsnombre, a.swenvianotif
from GD_TOM_caucao_inf_p a
, mpersona b
where a.cdperson = b.cdperson
group by a.cdperson, b.cdideper, b.dsnombre, a.swenvianotif
order by a.cdperson, b.cdideper, b.dsnombre, a.swenvianotif
```
