# CFG_UTILIZADORES_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| USERNAME | VARCHAR2 | 30 |  |  | Y |  |  |
| NOME | VARCHAR2 | 40 |  |  | Y |  |  |
| AMBIENTE_ID | VARCHAR2 | 9 |  |  | Y |  |  |
| UNIDADE_NEGOCIO_RF | VARCHAR2 | 3 |  |  | Y |  |  |
| TIPO_UTILIZADOR_RF | VARCHAR2 | 4 |  |  | Y |  |  |
| DATA_INICIO | DATE | 7 |  |  | Y |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| NIVEL_ACESSO_RF | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT
  E.CDEMPLEA        USERNAME
, U.DSUSUARIO       NOME
, DECODE(SUBSTR(CDEMPLEA,LENGTH(CDEMPLEA)),'T','COSECSEMA','COSEC') AMBIENTE_ID
, E.CDDEPARTA       UNIDADE_NEGOCIO_RF
, 'APPL'            TIPO_UTILIZADOR_RF
, E.FECALTA         DATA_INICIO
, NULL              DATA_FIM
, E.CDNIVEL         NIVEL_ACESSO_RF
FROM
  CO_EMPLEADOS E
, M_USUARIOS U
WHERE
    E.CDEMPLEA = U.CDIDUSR
AND E.SWACTIVO='S'
UNION
SELECT
  CDIDUSR         USERNAME
, DSUSUARIO       NOME
, 'COSECFOR'      AMBIENTE_ID
, 'NET'           UNIDADE_NEGOCIO_RF
, 'NET'           TIPO_UTILIZADOR_RF
, FEACTDES        DATA_INICIO
, FEACTHAS        DATA_FIM
, 0               NIVEL_ACESSO_RF
FROM
  M_USUARIOS
WHERE
    CDPERFIL LIKE 'W%'
AND SWACTIVO='S'
--UNION
--SELECT
--  USERNAME
--, NOME
--, AMBIENTE_ID
--, UNIDADE_NEGOCIO_RF
--, TIPO_UTILIZADOR_RF
--, DATA_INICIO
--, DATA_FIM
--, NIVEL_ACESSO_RF
--FROM
--  CFG_UTILIZADORES; 
```
