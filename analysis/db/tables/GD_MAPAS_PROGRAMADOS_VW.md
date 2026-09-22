# GD_MAPAS_PROGRAMADOS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 | 10 | 0 | N |  |  |
| NOME | VARCHAR2 | 100 |  |  | N |  |  |
| MAPA | VARCHAR2 | 240 |  |  | N |  |  |
| DESCRIÇÃO | VARCHAR2 | 240 |  |  | Y |  |  |
| DATA_PREVISTA | DATE | 7 |  |  | Y |  |  |
| DATA_INICIO | DATE | 7 |  |  | Y |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| TEMPO_DECORRIDO | NUMBER | 22 |  |  | Y |  |  |
| SEG_DECORRIDOS | NUMBER | 22 |  |  | Y |  |  |
| MIN_DECORRIDOS | NUMBER | 22 |  |  | Y |  |  |
| HOR_DECORRIDOS | NUMBER | 22 |  |  | Y |  |  |
| DIA_DECORRIDOS | NUMBER | 22 |  |  | Y |  |  |
| NOME_PARAMETRO | VARCHAR2 | 100 |  |  | N |  |  |
| VALOR_PARAMETRO | VARCHAR2 | 250 |  |  | N |  |  |
| VALOR2_PARAMETRO | VARCHAR2 | 250 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT DISTINCT    
w.br_id 							ID    
, w.br_name 							NOME    
, w.br_workbook_name 						MAPA    
, w.br_description 						DESCRIÇÃO    
, w.br_next_run_date 						DATA_PREVISTA    
, r.brr_run_date 						DATA_INICIO    
, r.brr_run_date + r.brr_act_elap_time/(3600*24) 		DATA_FIM    
, r.brr_act_elap_time 						TEMPO_DECORRIDO    
, MOD(r.brr_act_elap_time, 60) 					SEG_DECORRIDOS    
, TRUNC(MOD(r.brr_act_elap_time/60,60)) 			MIN_DECORRIDOS    
, TRUNC(MOD(r.brr_act_elap_time/3600,24)) 			HOR_DECORRIDOS    
, TRUNC(r.brr_act_elap_time/(3600*24)) 				DIA_DECORRIDOS    
, p.bp_name 							NOME_PARAMETRO    
, p.bp_value1 							VALOR_PARAMETRO    
, p.bp_value2 							VALOR2_PARAMETRO    
from    
eul4_batch_reports w    
, eul4_batch_params p    
, eul4_batch_sheets s    
, eul4_br_runs r    
where    
w.br_id = r.brr_br_id    
and w.br_id = s.bs_br_id    
and s.bs_id = p.bp_bs_id
```
