# GD_ESPACO_BD

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TABLESPACE_NAME | VARCHAR2 | 30 |  |  | N |  |  |
| MB_QUOTA | NUMBER | 22 |  |  | Y |  |  |
| MB_OCUPADO | NUMBER | 22 |  |  | Y |  |  |
| MB_LIVRES | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT  
E.TABLESPACE_NAME  
, DECODE(MAX_BYTES,-1,-1,E.BYTES/1024/1024)      MB_QUOTA  
, (SELECT SUM(S.BYTES)/1024/1024 FROM USER_SEGMENTS S WHERE S.TABLESPACE_NAME=E.TABLESPACE_NAME AND SEGMENT_TYPE IN ('INDEX','TABLE')) MB_OCUPADO  
, (SELECT SUM(F.BYTES)/1024/1024 FROM USER_FREE_SPACE F WHERE F.TABLESPACE_NAME=E.TABLESPACE_NAME) MB_LIVRES  
FROM  
USER_TS_QUOTAS E

```
