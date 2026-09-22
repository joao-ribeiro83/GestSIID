# GD_E10_3_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDAGENTE | VARCHAR2 | 15 |  |  | N |  |  |
| NOME | VARCHAR2 | 160 |  |  | N |  |  |
| CODIGO | NUMBER | 22 | 9 | 0 | N |  |  |
| MORADA | VARCHAR2 | 240 |  |  | Y |  |  |
| TELEFONE | VARCHAR2 | 18 |  |  | Y |  |  |
| PAIS | VARCHAR2 | 3 |  |  | Y |  |  |
| MES | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT DISTINCT
  RECIBO.CDUNIECO                          cdunieco
, RECIBOSCOMISSOES.CDAGENTE                CDAGENTE /* CORRECCAO I628 11/08/2009 */
, Destinatario.DSNOMBRE                    nome
, Destinatario.CDPERSON                    codigo
, DOMICILIO.DSDOMICI                       morada
, DOMICILIO.nmtelefo                       telefone
, DOMICILIO.CDPAIS                         pais
, TRUNC(RecibosComissoes.fechaliq,'MONTH') mes
FROM
  mdomicil DOMICILIO
, mpersona Destinatario
, treccom RecibosComissoes
, magentes Agentes
, mrecibo  RECIBO
WHERE
    1=1
AND RECIBO.nmrecibo            = RecibosComissoes.nmrecibo
AND RECIBO.cdunieco            = RecibosComissoes.cdunieco
AND RECIBO.cdestado            IN (3,7)
AND DOMICILIO.cdperson       = Agentes.cdperson
AND DOMICILIO.nmorddom       = Agentes.nmorddom
AND Destinatario.CDPERSON    = Agentes.cdperson
AND Agentes.cdagente         = RecibosComissoes.cdagente
AND RecibosComissoes.cdtipcom IN ('N','R','B')
```
