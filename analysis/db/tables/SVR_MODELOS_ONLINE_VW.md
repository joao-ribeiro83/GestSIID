# SVR_MODELOS_ONLINE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MODELOS | VARCHAR2 | 253 |  |  | Y |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | N |  |  |
| PARAM01 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM02 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM03 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM04 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM05 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM06 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM07 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM08 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM09 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM10 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM11 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM12 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM13 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM14 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM15 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM16 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM17 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM18 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM19 | VARCHAR2 | 240 |  |  | Y |  |  |
| PARAM20 | VARCHAR2 | 240 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT DISTINCT
  m.id || ' - ' || m.descricao MODELOS,
  m.id MODELO_ID,
  p1.nome_consulta PARAM01,
  p2.nome_consulta PARAM02,
  p3.nome_consulta PARAM03,
  p4.nome_consulta PARAM04,
  p5.nome_consulta PARAM05,
  p6.nome_consulta PARAM06,
  p7.nome_consulta PARAM07,
  p8.nome_consulta PARAM08,
  p9.nome_consulta PARAM09,
  p10.nome_consulta PARAM10,
  p11.nome_consulta PARAM11,
  p12.nome_consulta PARAM12,
  p13.nome_consulta PARAM13,
  p14.nome_consulta PARAM14,
  p15.nome_consulta PARAM15,
  p16.nome_consulta PARAM16,
  p17.nome_consulta PARAM17,
  p18.nome_consulta PARAM18,
  p19.nome_consulta PARAM19,
  p20.nome_consulta PARAM20
FROM
  cfg_permissoes_siid per,
  doc_modelos_documento m,
  doc_parametros_omissao p1,
  doc_parametros_omissao p2,
  doc_parametros_omissao p3,
  doc_parametros_omissao p4,
  doc_parametros_omissao p5,
  doc_parametros_omissao p6,
  doc_parametros_omissao p7,
  doc_parametros_omissao p8,
  doc_parametros_omissao p9,
  doc_parametros_omissao p10,
  doc_parametros_omissao p11,
  doc_parametros_omissao p12,
  doc_parametros_omissao p13,
  doc_parametros_omissao p14,
  doc_parametros_omissao p15,
  doc_parametros_omissao p16,
  doc_parametros_omissao p17,
  doc_parametros_omissao p18,
  doc_parametros_omissao p19,
  doc_parametros_omissao p20
WHERE
    m.id = per.modelo_id
AND per.tipo_permissao_rf = 4
and PER.USERNAME = DECODE(SUBSTR(user,1,5),'COSEC','ADMINISTRADOR'
                        ,'SIID_','ADMINISTRADOR'
                        ,'GADOR','ADMINISTRADOR'
                        , USER)
AND per.data_inicio <= sysdate
AND NVL(per.data_fim, sysdate + 1) > sysdate
AND m.DATA_INICIO <= sysdate
AND NVL(m.data_fim, sysdate + 1) > sysdate
AND m.id = p1.modelo_id (+)
and p1.n_parametro (+) = 1
and p1.consulta_online (+) = 'S'
and p1.data_inicio (+) <= SYSDATE
and nvl(p1.data_fim, sysdate) >= SYSDATE
and m.id = p2.modelo_id (+)
and p2.n_parametro (+) = 2
and p2.consulta_online (+) = 'S'
and p2.data_inicio (+) <= SYSDATE
and nvl(p2.data_fim, sysdate) >= SYSDATE
and m.id = p3.modelo_id (+)
and p3.n_parametro (+) = 3
and p3.consulta_online (+) = 'S'
and p3.data_inicio (+) <= SYSDATE
and nvl(p3.data_fim, sysdate) >= SYSDATE
and m.id = p4.modelo_id (+)
and p4.n_parametro (+) = 4
and p4.consulta_online (+) = 'S'
and p4.data_inicio (+) <= SYSDATE
and nvl(p4.data_fim, sysdate) >= SYSDATE
and m.id = p5.modelo_id (+)
and p5.n_parametro (+) = 5
and p5.consulta_online (+) = 'S'
and p5.data_inicio (+) <= SYSDATE
and nvl(p5.data_fim, sysdate) >= SYSDATE
and m.id = p6.modelo_id (+)
and p6.n_parametro (+) = 6
and p6.consulta_online (+) = 'S'
and p6.data_inicio (+) <= SYSDATE
and nvl(p6.data_fim, sysdate) >= SYSDATE
and m.id = p7.modelo_id (+)
and p7.n_parametro (+) = 7
and p7.consulta_online (+) = 'S'
and p7.data_inicio (+) <= SYSDATE
and nvl(p7.data_fim, sysdate) >= SYSDATE
and m.id = p8.modelo_id (+)
and p8.n_parametro (+) = 8
and p8.consulta_online (+) = 'S'
and p8.data_inicio (+) <= SYSDATE
and nvl(p8.data_fim, sysdate) >= SYSDATE
and m.id = p9.modelo_id (+)
and p9.n_parametro (+) = 9
and p9.consulta_online (+) = 'S'
and p9.data_inicio (+) <= SYSDATE
and nvl(p9.data_fim, sysdate) >= SYSDATE
and m.id = p10.modelo_id (+)
and p10.n_parametro (+) = 10
and p10.consulta_online (+) = 'S'
and p10.data_inicio (+) <= SYSDATE
and nvl(p10.data_fim, sysdate) >= SYSDATE
and m.id = p11.modelo_id (+)
and p11.n_parametro (+) = 11
and p11.consulta_online (+) = 'S'
and p11.data_inicio (+) <= SYSDATE
and nvl(p11.data_fim, sysdate) >= SYSDATE
and m.id = p12.modelo_id (+)
and p12.n_parametro (+) = 12
and p12.consulta_online (+) = 'S'
and p12.data_inicio (+) <= SYSDATE
and nvl(p12.data_fim, sysdate) >= SYSDATE
and m.id = p13.modelo_id (+)
and p13.n_parametro (+) = 13
and p13.consulta_online (+) = 'S'
and p13.data_inicio (+) <= SYSDATE
and nvl(p13.data_fim, sysdate) >= SYSDATE
and m.id = p14.modelo_id (+)
and p14.n_parametro (+) = 14
and p14.consulta_online (+) = 'S'
and p14.data_inicio (+) <= SYSDATE
and nvl(p14.data_fim, sysdate) >= SYSDATE
and m.id = p15.modelo_id (+)
and p15.n_parametro (+) = 15
and p15.consulta_online (+) = 'S'
and p15.data_inicio (+) <= SYSDATE
and nvl(p15.data_fim, sysdate) >= SYSDATE
and m.id = p16.modelo_id (+)
and p16.n_parametro (+) = 16
and p16.consulta_online (+) = 'S'
and p16.data_inicio (+) <= SYSDATE
and nvl(p16.data_fim, sysdate) >= SYSDATE
and m.id = p17.modelo_id (+)
and p17.n_parametro (+) = 17
and p17.consulta_online (+) = 'S'
and p17.data_inicio (+) <= SYSDATE
and nvl(p17.data_fim, sysdate) >= SYSDATE
and m.id = p18.modelo_id (+)
and p18.n_parametro (+) = 18
and p18.consulta_online (+) = 'S'
and p18.data_inicio (+) <= SYSDATE
and nvl(p18.data_fim, sysdate) >= SYSDATE
and m.id = p19.modelo_id (+)
and p19.n_parametro (+) = 19
and p19.consulta_online (+) = 'S'
and p19.data_inicio (+) <= SYSDATE
and nvl(p19.data_fim, sysdate) >= SYSDATE
and m.id = p20.modelo_id (+)
and p20.n_parametro (+) = 20
and p20.consulta_online (+) = 'S'
and p20.data_inicio (+) <= SYSDATE
and nvl(p20.data_fim, sysdate) >= SYSDATE
```
