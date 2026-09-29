# GD_ADMIN_DOC_EXEC_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | VARCHAR2 | 10 |  |  | N |  |  |
| DESCRICAO | VARCHAR2 | 240 |  |  | Y |  |  |
| DATA_EXECUCAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select  
modelos.id  
,      modelos.descricao  
,      doc.data_execucao  /*  
,      decode(:p_modelo, null, null, doc.data_execucao)  
,      sum(decode(data_execucao  
,null,0  
,decode(sign(trunc(data_execucao) - :data_inicio)  
,-1,0  
,decode(sign(:data_fim - trunc(data_execucao))  
,-1,0  
,1)))) execucoes*/  
from  
svr_documentos doc  
, doc_modelos_documento modelos  
where 1=1  
and  doc.modelo_id (+)= modelos.id  
and  decode (modelos.id  
,'D1.A2','S'  
,'D1.A3','S'  
,'D11.H8','S'  
,'GENERICO','S'  
,'GENERICO_A','S'  
,'GENERICO_I','S'  
,'GENERICO_P','S'  
,'FACTURA','A'  
,'E.E9','A'  
,'E.E10','A'  
,'R3.D50','S'  
,'R3.D25T','S'  
,'O2.OD72','S'  
,'D7.E1','S'  
,'D6.C11','S'  
,'D5.B7','S'  
,'D5.B4','S'  
,'D3.A24','S'  
,'D16.M2','S'  
,'D1.A4','S'  
,null) is null

```
