# SVR_UTILIZADORES_ONLINE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| USERNAME | VARCHAR2 | 73 |  |  | Y |  |  |
| USER_ID | VARCHAR2 | 30 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT
  CDIDUSR || ' - ' || DSUSUARIO USERNAME
, CDIDUSR USER_ID
FROM
  M_USUARIOS
WHERE
   CDPERFIL NOT LIKE 'W%'
   AND SWACTIVO  ='S' 
```
