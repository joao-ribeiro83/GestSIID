# SVR_DOCUMENTOS_PENDENTES_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DOCUMENTO_ID | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| VALOR_PARAMETRO | VARCHAR2 | 2000 |  |  | Y |  |  |
| NOME_PARAMETRO | VARCHAR2 | 240 |  |  | Y |  |  |
| NOME_REPORT | VARCHAR2 | 240 |  |  | Y |  |  |
| DIRECTORIA | VARCHAR2 | 10 |  |  | Y |  |  |
| NOME_FICHEIRO | VARCHAR2 | 240 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| DATA_EXECUCAO | DATE | 7 |  |  | Y |  |  |
| DATA_ARQUIVO | DATE | 7 |  |  | Y |  |  |
| ARQUIVADO | VARCHAR2 | 1 |  |  | Y |  |  |
| DATA_IMPRESSAO | DATE | 7 |  |  | Y |  |  |
| IMPRESSO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| CERTIFICACAO | VARCHAR2 | 5 |  |  | Y |  |  |
| MODO_IMPRESSAO | VARCHAR2 | 5 |  |  | Y |  |  |
| MODO_EXPEDICAO | VARCHAR2 | 2 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select /*+ LEADING(A) use_nl(a,B) index(A,IDX_ESTADOTYPE_SQUE) */  
  DOC.id                                                     DOCUMENTO_ID  
, DOC.MODELO_ID                                              MODELO_ID  
, case PARAMETRO.N_PARAMETRO  
    when  1 then DOC.PARAMETRO01  
    when  2 then DOC.PARAMETRO02  
    when  3 then DOC.PARAMETRO03  
    when  4 then DOC.PARAMETRO04  
    when  5 then DOC.PARAMETRO05  
    when  6 then DOC.PARAMETRO06  
    when  7 then DOC.PARAMETRO07  
    when  8 then DOC.PARAMETRO08  
    when  9 then DOC.PARAMETRO09  
    when 10 then DOC.PARAMETRO10  
    when 11 then DOC.PARAMETRO11  
    when 12 then DOC.PARAMETRO12  
    when 13 then DOC.PARAMETRO13  
    when 14 then DOC.PARAMETRO14  
    when 15 then DOC.PARAMETRO15  
    when 16 then DOC.PARAMETRO16  
    when 17 then DOC.PARAMETRO17  
    when 18 then DOC.PARAMETRO18  
    when 19 then DOC.PARAMETRO19  
    when 20 then DOC.PARAMETRO20  
    else null  
  end VALOR_PARAMETRO  
, PARAMETRO.NOME                                                NOME_PARAMETRO  
, REP.NOME_FICHEIRO                                             NOME_REPORT  
, TO_CHAR (DOC.data_pedido, 'YYYY\MM\DD')                       DIRECTORIA
, DOC.NOME_OUTPUT                                               NOME_FICHEIRO  
, DOC.DATA_PEDIDO                         
, DOC.DATA_EXECUCAO
, DOC.DATA_ARQUIVO
, DOC.ARQUIVADO
, DOC.DATA_IMPRESSAO
, DOC.IMPRESSO_POR
, DOC.CRIADO_POR                                                CRIADO_POR  
, MODELO.MODO_CERTIFICADO_RF                                    CERTIFICACAO  
, MODELO.MODO_IMPRESSAO_RF                                      MODO_IMPRESSAO  
, MODELO.MODO_EXPEDICAO_RF                                      MODO_EXPEDICAO
from  
  SVR_REPORT_SIID         REP  
, DOC_MODELOS_DOCUMENTO   MODELO  
, SVR_PARAMETROS_REPORT   PARAMETRO
, SVR_DOCUMENTOS          DOC  
where  
    DOC.REPORT_ID                          = REP.id  
and DOC.MODELO_ID                          = MODELO.id  
and PARAMETRO.REPORT_ID = REP.ID
and case PARAMETRO.N_PARAMETRO  
      when  1 then DOC.PARAMETRO01  
      when  2 then DOC.PARAMETRO02  
      when  3 then DOC.PARAMETRO03  
      when  4 then DOC.PARAMETRO04  
      when  5 then DOC.PARAMETRO05  
      WHEN  6 THEN DOC.parametro06  
      when  7 then DOC.PARAMETRO07  
      WHEN  8 THEN DOC.parametro08  
      when  9 then DOC.PARAMETRO09  
      when 10 then DOC.PARAMETRO10  
      when 11 then DOC.PARAMETRO11  
      when 12 then DOC.PARAMETRO12  
      when 13 then DOC.PARAMETRO13  
      when 14 then DOC.PARAMETRO14  
      when 15 then DOC.PARAMETRO15  
      when 16 then DOC.PARAMETRO16  
      when 17 then DOC.PARAMETRO17  
      when 18 then DOC.PARAMETRO18  
      when 19 then DOC.PARAMETRO19  
      when 20 then DOC.PARAMETRO20  
      else null  
  end                                   is not null  
  --and DOC.DISPONIVEL_RF='EDC'
  AND DOC.DATA_ARQUIVO IS NULL
  AND DOC.DATA_EXECUCAO IS NOT NULL
  AND DOC.DATA_IMPRESSAO IS NULL
  AND MODELO.MODO_EXPEDICAO_RF = 'G'
  AND NOT EXISTS (SELECT 1 FROM CO_PROGAR X
                  WHERE 
				      X.CDUNIECO = DOC.PARAMETRO05
				  AND X.CDRAMO   = DOC.PARAMETRO06
				  AND X.NMPOLIZA = DOC.PARAMETRO04
				  AND X.NMGARANT = DOC.PARAMETRO07
				  AND X.FENOTIF IS NOT NULL)
```
